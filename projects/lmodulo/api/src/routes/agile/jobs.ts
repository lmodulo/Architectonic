import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { storage } from '../../lib/storage.js';

const COL = 'agile_jobs';

const VALID_STATUS   = ['Backlog', 'In Progress', 'Blocked', 'Review', 'Done', 'Cancelled'] as const;
const VALID_CATEGORY = ['Feature', 'Bug', 'Tech Debt', 'Research'] as const;

function mapDoc(d: Record<string, unknown>) {
  return { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function rollupPipeline(matchStage: Record<string, unknown>) {
  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'agile_tasks', localField: '_id', foreignField: 'jobId', as: 'tasks'
      }
    },
    {
      $addFields: {
        estimatedHours: { $sum: '$tasks.estimateHours' },
        actualHours:    { $sum: '$tasks.actualHours' },
        completionPct: {
          $cond: [
            { $gt: [{ $sum: '$tasks.estimateHours' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $sum: {
                        $map: {
                          input: '$tasks',
                          as: 't',
                          in: { $cond: [{ $eq: ['$$t.status', 'Done'] }, '$$t.estimateHours', 0] }
                        }
                      }
                    },
                    { $sum: '$tasks.estimateHours' }
                  ]
                },
                100
              ]
            },
            0
          ]
        },
        taskCount: { $size: '$tasks' },
      }
    },
    { $project: { tasks: 0 } }
  ];
}

export default async function jobsRoutes(app: FastifyInstance) {

  // GET /agile/jobs?sprintId=...
  app.get('/', { preHandler: app.requirePermission('agile_jobs', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { sprintId, status, category, blocked, search, limit = '100', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (sprintId) {
      try { match.sprintId = new ObjectId(sprintId); } catch { /* ignore */ }
    }
    if (status)   match.status   = status;
    if (category) match.category = category;
    if (blocked !== undefined) match.blocked = blocked === 'true';
    if (search?.trim()) match.$text = { $search: search.trim() };

    const pipeline = rollupPipeline(match);
    const [docs, total] = await Promise.all([
      db.collection(COL).aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
      ]).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { jobs: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /agile/jobs
  app.post('/', { preHandler: app.requirePermission('agile_jobs', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      sprintId, title, description = '', category = 'Feature',
      blocked = false, dependencyIds = [],
      status = 'Backlog', startDate, endDate,
    } = req.body as Record<string, unknown>;

    if (!sprintId) throw app.httpErrors.badRequest('sprintId is required');
    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);
    if (!VALID_CATEGORY.includes(category as typeof VALID_CATEGORY[number]))
      throw app.httpErrors.badRequest(`Invalid category. Valid: ${VALID_CATEGORY.join(', ')}`);

    const sprintOid = parseOid(sprintId as string, app);
    const sprint = await db.collection('agile_sprints').findOne({ _id: sprintOid });
    if (!sprint) throw app.httpErrors.notFound('Sprint not found');

    const start = startDate ? new Date(startDate as string) : null;
    const end   = endDate   ? new Date(endDate   as string) : null;
    if (start && end && end < start) throw app.httpErrors.badRequest('endDate must be >= startDate');

    if (sprint.startDate && start && start < sprint.startDate)
      throw app.httpErrors.badRequest('Job start is before sprint start');
    if (sprint.endDate && end && end > sprint.endDate)
      throw app.httpErrors.badRequest('Job end is after sprint end');

    const depOids = (dependencyIds as string[]).map(id => parseOid(id, app));

    const doc = {
      sprintId:         sprintOid,
      title:            (title as string).trim(),
      description:      String(description),
      category:         String(category),
      blocked:          Boolean(blocked),
      dependencyIds:    depOids,
      status:           String(status),
      startDate:        start,
      endDate:          end,
      calendarEventIds: [] as ObjectId[],
      createdBy:        new ObjectId(req.session.userId!),
      updatedBy:        null as ObjectId | null,
      createdAt:        now,
      updatedAt:        now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_job.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, sprintId: sprintOid.toString(), category: doc.category }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /agile/jobs/:id
  app.get('/:id', { preHandler: app.requirePermission('agile_jobs', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const [doc] = await db.collection(COL).aggregate(rollupPipeline({ _id: oid })).toArray();
    if (!doc) return reply.notFound('Job not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // GET /agile/jobs/:id/dependencies — resolved dependency objects
  app.get('/:id/dependencies', { preHandler: app.requirePermission('agile_jobs', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const job = await db.collection(COL).findOne({ _id: oid });
    if (!job) return reply.notFound('Job not found');

    const deps = job.dependencyIds?.length > 0
      ? await db.collection(COL).find({ _id: { $in: job.dependencyIds } }).toArray()
      : [];

    return deps.map(d => mapDoc(d as Record<string, unknown>));
  });

  // PATCH /agile/jobs/:id
  app.patch('/:id', { preHandler: app.requirePermission('agile_jobs', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      title, description, category, blocked, dependencyIds,
      status, startDate, endDate, teamId,
    } = req.body as Record<string, unknown>;

    if (status !== undefined && !VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);
    if (category !== undefined && !VALID_CATEGORY.includes(category as typeof VALID_CATEGORY[number]))
      throw app.httpErrors.badRequest(`Invalid category. Valid: ${VALID_CATEGORY.join(', ')}`);

    let preJob: any = null;
    if (status !== undefined) {
      preJob = await db.collection(COL).findOne({ _id: oid });
      if (!preJob) return reply.notFound('Job not found');

      if (status === 'Done') {
        if (preJob.dependencyIds?.length > 0) {
          const incomplete = await db.collection(COL)
            .find({ _id: { $in: preJob.dependencyIds }, status: { $nin: ['Done', 'Cancelled'] } })
            .limit(1).toArray();
          if (incomplete.length > 0)
            throw app.httpErrors.conflict('Cannot mark job Done while dependencies are incomplete');
        }
        const openTasks = await db.collection('agile_tasks')
          .find({ jobId: oid, status: { $nin: ['Done', 'Cancelled'] } })
          .limit(1).toArray();
        if (openTasks.length > 0)
          throw app.httpErrors.conflict('All tasks must be Done before marking job Done');
      }
    }

    const $set: Record<string, unknown> = {
      updatedBy: new ObjectId(req.session.userId!),
      updatedAt: new Date(),
    };

    if (title         !== undefined) {
      if (!(title as string).trim()) throw app.httpErrors.badRequest('Title cannot be empty');
      $set.title = (title as string).trim();
    }
    if (description   !== undefined) $set.description   = String(description);
    if (category      !== undefined) $set.category      = String(category);
    if (blocked       !== undefined) $set.blocked       = Boolean(blocked);
    if (status        !== undefined) $set.status        = String(status);
    if (startDate     !== undefined) $set.startDate     = new Date(startDate as string);
    if (endDate       !== undefined) $set.endDate       = new Date(endDate as string);
    if (dependencyIds !== undefined) {
      $set.dependencyIds = (dependencyIds as string[]).map(id => parseOid(id, app));
    }
    if (teamId !== undefined) $set.teamId = teamId ? parseOid(teamId as string, app) : null;

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Job not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_job.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    if (preJob && status !== undefined && status !== preJob.status && preJob.teamId) {
      const team = await db.collection('teams').findOne({ _id: preJob.teamId }, { projection: { members: 1 } });
      const updaterOid = new ObjectId(req.session.userId!);
      const recipients = ((team?.members ?? []) as ObjectId[]).filter(m => !m.equals(updaterOid));
      if (recipients.length > 0) {
        await app.notify({
          userId: recipients,
          type: 'agile_job.status_changed',
          title: 'Job status updated',
          body: `${preJob.title}: ${preJob.status} → ${status}`,
          link: `/agile/jobs/${oid.toString()}`,
          source: { collection: COL, documentId: oid },
          groupKey: `job-status-${oid.toString()}`,
        });
      }
    }

    return { updated: true };
  });

  // DELETE /agile/jobs/:id
  app.delete('/:id', { preHandler: app.requirePermission('agile_jobs', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const taskCount = await db.collection('agile_tasks').countDocuments({ jobId: oid });
    if (taskCount > 0) throw app.httpErrors.conflict('Cannot delete job with existing tasks');

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Job not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_job.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });

  // POST /agile/jobs/:id/calendar-events
  app.post('/:id/calendar-events', { preHandler: app.requirePermission('agile_jobs', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { calendarEventId } = req.body as { calendarEventId?: string };
    if (!calendarEventId) throw app.httpErrors.badRequest('calendarEventId is required');
    const ceOid = parseOid(calendarEventId, app);

    const job      = await db.collection(COL).findOne({ _id: oid });
    if (!job) throw app.httpErrors.notFound('Job not found');
    const calEvent = await db.collection('calendar_events').findOne({ _id: ceOid });
    if (!calEvent) throw app.httpErrors.notFound('Calendar event not found');

    await db.collection(COL).updateOne(
      { _id: oid },
      { $addToSet: { calendarEventIds: ceOid }, $set: { updatedAt: new Date() } }
    );
    reply.status(201);
    return { attached: true };
  });

  // DELETE /agile/jobs/:id/calendar-events/:eventId
  app.delete('/:id/calendar-events/:eventId', { preHandler: app.requirePermission('agile_jobs', 'update') }, async (req, reply) => {
    const db      = app.mongo.db!;
    const oid     = parseOid((req.params as { id: string; eventId: string }).id, app);
    const eventId = parseOid((req.params as { id: string; eventId: string }).eventId, app);
    const result  = await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { calendarEventIds: eventId } as any, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) throw app.httpErrors.notFound('Job not found');
    reply.status(204);
  });

  // POST /agile/jobs/:id/attachments — upload (replaces if same name)
  app.post('/:id/attachments', { preHandler: app.requirePermission('agile_jobs', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Job not found');

    const file = await req.file();
    if (!file) throw app.httpErrors.badRequest('No file uploaded');

    const buf  = await file.toBuffer();
    const safe = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

    const existing = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === safe);
    if (existing?.url) await storage.remove(existing.url);

    const url = await storage.save(safe, buf, file.mimetype, `agile/jobs/${oid.toString()}`);

    const attachment = {
      name:       safe,
      url,
      mimetype:   file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: new ObjectId(req.session.userId!),
    };

    const updated = [
      ...((doc.attachments ?? []) as any[]).filter((a: any) => a.name !== safe),
      attachment,
    ];

    await db.collection(COL).updateOne({ _id: oid }, { $set: { attachments: updated, updatedAt: new Date() } });

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_job.attachment_upload', resourceId: oid.toString(),
      meta: { filename: safe }, ip: req.ip,
    });

    reply.status(201);
    return { attachments: updated.map((a: any) => ({ ...a, uploadedBy: a.uploadedBy?.toString() })) };
  });

  // DELETE /agile/jobs/:id/attachments/:filename
  app.delete('/:id/attachments/:filename', { preHandler: app.requirePermission('agile_jobs', 'update') }, async (req, reply) => {
    const db       = app.mongo.db!;
    const oid      = parseOid((req.params as { id: string; filename: string }).id, app);
    const filename = (req.params as { id: string; filename: string }).filename;

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Job not found');

    const attachment = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === filename);
    if (!attachment) throw app.httpErrors.notFound('Attachment not found');

    await storage.remove(attachment.url);
    await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { attachments: { name: filename } } as any, $set: { updatedAt: new Date() } }
    );

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_job.attachment_delete', resourceId: oid.toString(),
      meta: { filename }, ip: req.ip,
    });

    reply.status(204);
  });
}
