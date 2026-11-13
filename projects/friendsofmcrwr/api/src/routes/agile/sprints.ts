import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { storage } from '../../lib/storage.js';

const COL = 'agile_sprints';

const VALID_STATUS = ['Planning', 'Active', 'Review', 'Completed', 'Cancelled'] as const;

function mapDoc(d: Record<string, unknown>) {
  return { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

// Rollup pipeline: attaches completionPct, velocity, committedEffort
function rollupPipeline(matchStage: Record<string, unknown>) {
  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'agile_jobs', localField: '_id', foreignField: 'sprintId', as: 'jobs'
      }
    },
    {
      $lookup: {
        from: 'agile_tasks',
        let: { jobIds: '$jobs._id' },
        pipeline: [{ $match: { $expr: { $in: ['$jobId', '$$jobIds'] } } }],
        as: 'tasks'
      }
    },
    {
      $addFields: {
        committedEffort: { $sum: '$tasks.estimateHours' },
        velocity: {
          $sum: {
            $map: {
              input: '$tasks',
              as: 't',
              in: { $cond: [{ $eq: ['$$t.status', 'Done'] }, '$$t.estimateHours', 0] }
            }
          }
        },
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
        jobCount:  { $size: '$jobs'  },
        taskCount: { $size: '$tasks' },
      }
    },
    { $project: { jobs: 0, tasks: 0 } }
  ];
}

export default async function sprintsRoutes(app: FastifyInstance) {

  // GET /agile/sprints?milestoneId=... — list sprints for a milestone
  app.get('/', { preHandler: app.requirePermission('agile_sprints', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { milestoneId, status, limit = '50', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (milestoneId) {
      try { match.milestoneId = new ObjectId(milestoneId); } catch { /* ignore */ }
    }
    if (status) match.status = status;

    const pipeline = rollupPipeline(match);
    const [docs, total] = await Promise.all([
      db.collection(COL).aggregate([
        ...pipeline,
        { $sort: { sprintNumber: 1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
      ]).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { sprints: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /agile/sprints — create
  app.post('/', { preHandler: app.requirePermission('agile_sprints', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      milestoneId, title, description = '', capacity = 0,
      status = 'Planning', startDate, endDate,
    } = req.body as Record<string, unknown>;

    if (!milestoneId) throw app.httpErrors.badRequest('milestoneId is required');
    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);

    const milOid = parseOid(milestoneId as string, app);
    const milestone = await db.collection('agile_milestones').findOne({ _id: milOid });
    if (!milestone) throw app.httpErrors.notFound('Milestone not found');

    const start = startDate ? new Date(startDate as string) : null;
    const end   = endDate   ? new Date(endDate   as string) : null;
    if (start && end && end < start) throw app.httpErrors.badRequest('endDate must be >= startDate');

    // Child date range must fall within parent
    if (milestone.startDate && start && start < milestone.startDate)
      throw app.httpErrors.badRequest('Sprint start is before milestone start');
    if (milestone.endDate && end && end > milestone.endDate)
      throw app.httpErrors.badRequest('Sprint end is after milestone end');

    // Auto-assign sprintNumber
    const lastSprint = await db.collection(COL)
      .find({ milestoneId: milOid })
      .sort({ sprintNumber: -1 })
      .limit(1)
      .toArray();
    const sprintNumber = lastSprint.length > 0 ? (lastSprint[0].sprintNumber as number) + 1 : 1;

    const doc = {
      milestoneId:      milOid,
      title:            (title as string).trim(),
      description:      String(description),
      sprintNumber,
      capacity:         Number(capacity),
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
      action: 'agile_sprint.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, milestoneId: milOid.toString(), sprintNumber }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /agile/sprints/:id — single with rollup
  app.get('/:id', { preHandler: app.requirePermission('agile_sprints', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const [doc] = await db.collection(COL).aggregate(rollupPipeline({ _id: oid })).toArray();
    if (!doc) return reply.notFound('Sprint not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /agile/sprints/:id
  app.patch('/:id', { preHandler: app.requirePermission('agile_sprints', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      title, description, capacity, status, startDate, endDate, teamId,
      retroWentWell, retroToImprove, retroActionItems,
    } = req.body as Record<string, unknown>;

    if (status !== undefined && !VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);

    let preSprint: any = null;
    if (status !== undefined) {
      preSprint = await db.collection(COL).findOne({ _id: oid });
      if (!preSprint) return reply.notFound('Sprint not found');

      if (status === 'Completed') {
        const jobs = await db.collection('agile_jobs').find({ sprintId: oid, status: { $nin: ['Done', 'Cancelled'] } }).limit(1).toArray();
        if (jobs.length > 0) throw app.httpErrors.conflict('All jobs must be Done before marking sprint Completed');
      }
    }

    const $set: Record<string, unknown> = {
      updatedBy: new ObjectId(req.session.userId!),
      updatedAt: new Date(),
    };

    if (title       !== undefined) {
      if (!(title as string).trim()) throw app.httpErrors.badRequest('Title cannot be empty');
      $set.title = (title as string).trim();
    }
    if (description !== undefined) $set.description = String(description);
    if (capacity    !== undefined) $set.capacity    = Number(capacity);
    if (status      !== undefined) $set.status      = String(status);
    if (startDate   !== undefined) $set.startDate   = new Date(startDate as string);
    if (endDate     !== undefined) $set.endDate     = new Date(endDate as string);
    if (teamId           !== undefined) $set.teamId           = teamId ? parseOid(teamId as string, app) : null;
    if (retroWentWell    !== undefined) $set.retroWentWell    = String(retroWentWell);
    if (retroToImprove   !== undefined) $set.retroToImprove   = String(retroToImprove);
    if (retroActionItems !== undefined) $set.retroActionItems = String(retroActionItems);

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Sprint not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_sprint.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    if (preSprint && status !== undefined && status !== preSprint.status && preSprint.teamId) {
      const team = await db.collection('teams').findOne({ _id: preSprint.teamId }, { projection: { members: 1 } });
      const updaterOid = new ObjectId(req.session.userId!);
      const recipients = ((team?.members ?? []) as ObjectId[]).filter(m => !m.equals(updaterOid));
      if (recipients.length > 0) {
        await app.notify({
          userId: recipients,
          type: 'agile_sprint.status_changed',
          title: 'Sprint status updated',
          body: `${preSprint.title}: ${preSprint.status} → ${status}`,
          link: `/agile/sprints/${oid.toString()}`,
          source: { collection: COL, documentId: oid },
          groupKey: `sprint-status-${oid.toString()}`,
        });
      }
    }

    return { updated: true };
  });

  // DELETE /agile/sprints/:id
  app.delete('/:id', { preHandler: app.requirePermission('agile_sprints', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const jobCount = await db.collection('agile_jobs').countDocuments({ sprintId: oid });
    if (jobCount > 0) throw app.httpErrors.conflict('Cannot delete sprint with existing jobs');

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Sprint not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_sprint.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });

  // POST /agile/sprints/:id/calendar-events
  app.post('/:id/calendar-events', { preHandler: app.requirePermission('agile_sprints', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { calendarEventId } = req.body as { calendarEventId?: string };
    if (!calendarEventId) throw app.httpErrors.badRequest('calendarEventId is required');
    const ceOid = parseOid(calendarEventId, app);

    const sprint = await db.collection(COL).findOne({ _id: oid });
    if (!sprint) throw app.httpErrors.notFound('Sprint not found');
    const calEvent = await db.collection('calendar_events').findOne({ _id: ceOid });
    if (!calEvent) throw app.httpErrors.notFound('Calendar event not found');

    if (sprint.startDate && calEvent.startDate && calEvent.startDate < sprint.startDate)
      throw app.httpErrors.badRequest('Calendar event start is before sprint start');
    if (sprint.endDate && calEvent.endDate && calEvent.endDate > sprint.endDate)
      throw app.httpErrors.badRequest('Calendar event end is after sprint end');

    await db.collection(COL).updateOne(
      { _id: oid },
      { $addToSet: { calendarEventIds: ceOid }, $set: { updatedAt: new Date() } }
    );
    reply.status(201);
    return { attached: true };
  });

  // DELETE /agile/sprints/:id/calendar-events/:eventId
  app.delete('/:id/calendar-events/:eventId', { preHandler: app.requirePermission('agile_sprints', 'update') }, async (req, reply) => {
    const db      = app.mongo.db!;
    const oid     = parseOid((req.params as { id: string; eventId: string }).id, app);
    const eventId = parseOid((req.params as { id: string; eventId: string }).eventId, app);
    const result  = await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { calendarEventIds: eventId } as any, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) throw app.httpErrors.notFound('Sprint not found');
    reply.status(204);
  });

  // POST /agile/sprints/:id/attachments — upload (replaces if same name)
  app.post('/:id/attachments', { preHandler: app.requirePermission('agile_sprints', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Sprint not found');

    const file = await req.file();
    if (!file) throw app.httpErrors.badRequest('No file uploaded');

    const buf  = await file.toBuffer();
    const safe = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

    const existing = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === safe);
    if (existing?.url) await storage.remove(existing.url);

    const url = await storage.save(safe, buf, file.mimetype, `agile/sprints/${oid.toString()}`);

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
      action: 'agile_sprint.attachment_upload', resourceId: oid.toString(),
      meta: { filename: safe }, ip: req.ip,
    });

    reply.status(201);
    return { attachments: updated.map((a: any) => ({ ...a, uploadedBy: a.uploadedBy?.toString() })) };
  });

  // DELETE /agile/sprints/:id/attachments/:filename
  app.delete('/:id/attachments/:filename', { preHandler: app.requirePermission('agile_sprints', 'update') }, async (req, reply) => {
    const db       = app.mongo.db!;
    const oid      = parseOid((req.params as { id: string; filename: string }).id, app);
    const filename = (req.params as { id: string; filename: string }).filename;

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Sprint not found');

    const attachment = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === filename);
    if (!attachment) throw app.httpErrors.notFound('Attachment not found');

    await storage.remove(attachment.url);
    await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { attachments: { name: filename } } as any, $set: { updatedAt: new Date() } }
    );

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_sprint.attachment_delete', resourceId: oid.toString(),
      meta: { filename }, ip: req.ip,
    });

    reply.status(204);
  });
}
