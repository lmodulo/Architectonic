import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { storage } from '../../lib/storage.js';

const COL = 'agile_milestones';

const VALID_STATUS   = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const;
const VALID_PRIORITY = ['Low', 'Medium', 'High', 'Critical'] as const;

function mapDoc(d: Record<string, unknown>) {
  return { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

// Aggregation pipeline that computes rollup stats from tasks via jobs and sprints
function rollupPipeline(matchStage: Record<string, unknown>) {
  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'agile_sprints', localField: '_id', foreignField: 'milestoneId', as: 'sprints'
      }
    },
    {
      $lookup: {
        from: 'agile_jobs',
        let: { sprintIds: '$sprints._id' },
        pipeline: [{ $match: { $expr: { $in: ['$sprintId', '$$sprintIds'] } } }],
        as: 'jobs'
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
        totalEstimatedHours: { $sum: '$tasks.estimateHours' },
        totalActualHours:    { $sum: '$tasks.actualHours'   },
        completionPct: {
          $cond: [
            { $gt: [{ $sum: '$tasks.estimateHours' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $sum: { $cond: [{ $eq: ['$tasks.status', 'Done'] }, '$tasks.estimateHours', 0] } },
                    { $sum: '$tasks.estimateHours' }
                  ]
                },
                100
              ]
            },
            0
          ]
        },
        sprintCount: { $size: '$sprints' },
        jobCount:    { $size: '$jobs'    },
        taskCount:   { $size: '$tasks'   },
      }
    },
    { $project: { sprints: 0, jobs: 0, tasks: 0 } }
  ];
}

export default async function milestonesRoutes(app: FastifyInstance) {

  // GET /agile/milestones — list with rollup stats
  app.get('/', { preHandler: app.requirePermission('agile_milestones', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { status, priority, search, limit = '50', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (status)   match.status   = status;
    if (priority) match.priority = priority;
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

    return { milestones: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /agile/milestones — create
  app.post('/', { preHandler: app.requirePermission('agile_milestones', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      title, description = '', strategicGoal = '',
      priority = 'Medium', status = 'Planning',
      startDate, endDate,
    } = req.body as Record<string, unknown>;

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);
    if (!VALID_PRIORITY.includes(priority as typeof VALID_PRIORITY[number]))
      throw app.httpErrors.badRequest(`Invalid priority. Valid: ${VALID_PRIORITY.join(', ')}`);

    const start = startDate ? new Date(startDate as string) : null;
    const end   = endDate   ? new Date(endDate as string)   : null;
    if (start && end && end < start) throw app.httpErrors.badRequest('endDate must be >= startDate');

    const doc = {
      title:           (title as string).trim(),
      description:     String(description),
      strategicGoal:   String(strategicGoal),
      priority:        String(priority),
      status:          String(status),
      startDate:       start,
      endDate:         end,
      calendarEventIds: [] as ObjectId[],
      createdBy:       new ObjectId(req.session.userId!),
      updatedBy:       null as ObjectId | null,
      createdAt:       now,
      updatedAt:       now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_milestone.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, status: doc.status, priority: doc.priority }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /agile/milestones/:id — single with full rollup
  app.get('/:id', { preHandler: app.requirePermission('agile_milestones', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const [doc] = await db.collection(COL).aggregate(rollupPipeline({ _id: oid })).toArray();
    if (!doc) return reply.notFound('Milestone not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /agile/milestones/:id — partial update
  app.patch('/:id', { preHandler: app.requirePermission('agile_milestones', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      title, description, strategicGoal, priority, status, startDate, endDate,
    } = req.body as Record<string, unknown>;

    if (status !== undefined && !VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);
    if (priority !== undefined && !VALID_PRIORITY.includes(priority as typeof VALID_PRIORITY[number]))
      throw app.httpErrors.badRequest(`Invalid priority. Valid: ${VALID_PRIORITY.join(', ')}`);

    // Enforce: cannot mark Done unless all children Done
    if (status === 'Completed') {
      const sprints = await db.collection('agile_sprints').find({ milestoneId: oid, status: { $ne: 'Completed' } }).limit(1).toArray();
      if (sprints.length > 0) {
        throw app.httpErrors.conflict('All sprints must be Completed before marking milestone Completed');
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
    if (strategicGoal !== undefined) $set.strategicGoal = String(strategicGoal);
    if (priority      !== undefined) $set.priority      = String(priority);
    if (status        !== undefined) $set.status        = String(status);
    if (startDate     !== undefined) $set.startDate     = new Date(startDate as string);
    if (endDate       !== undefined) $set.endDate       = new Date(endDate as string);

    // Validate date range after collecting both
    const finalStart = ($set.startDate as Date) ?? (await db.collection(COL).findOne({ _id: oid }))?.startDate;
    const finalEnd   = ($set.endDate   as Date) ?? (await db.collection(COL).findOne({ _id: oid }))?.endDate;
    if (finalStart && finalEnd && finalEnd < finalStart)
      throw app.httpErrors.badRequest('endDate must be >= startDate');

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Milestone not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_milestone.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /agile/milestones/:id
  app.delete('/:id', { preHandler: app.requirePermission('agile_milestones', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    // Cascade check: block if sprints exist
    const sprintCount = await db.collection('agile_sprints').countDocuments({ milestoneId: oid });
    if (sprintCount > 0) throw app.httpErrors.conflict('Cannot delete milestone with existing sprints');

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Milestone not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_milestone.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });

  // POST /agile/milestones/:id/calendar-events — attach a calendar event
  app.post('/:id/calendar-events', { preHandler: app.requirePermission('agile_milestones', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { calendarEventId } = req.body as { calendarEventId?: string };

    if (!calendarEventId) throw app.httpErrors.badRequest('calendarEventId is required');
    const ceOid = parseOid(calendarEventId, app);

    const milestone = await db.collection(COL).findOne({ _id: oid });
    if (!milestone) throw app.httpErrors.notFound('Milestone not found');

    const calEvent = await db.collection('calendar_events').findOne({ _id: ceOid });
    if (!calEvent) throw app.httpErrors.notFound('Calendar event not found');

    // Validate event dates fall within milestone range
    if (milestone.startDate && calEvent.startDate && calEvent.startDate < milestone.startDate)
      throw app.httpErrors.badRequest('Calendar event start is before milestone start');
    if (milestone.endDate && calEvent.endDate && calEvent.endDate > milestone.endDate)
      throw app.httpErrors.badRequest('Calendar event end is after milestone end');

    await db.collection(COL).updateOne(
      { _id: oid },
      { $addToSet: { calendarEventIds: ceOid }, $set: { updatedAt: new Date() } }
    );

    reply.status(201);
    return { attached: true };
  });

  // DELETE /agile/milestones/:id/calendar-events/:eventId — detach
  app.delete('/:id/calendar-events/:eventId', { preHandler: app.requirePermission('agile_milestones', 'update') }, async (req, reply) => {
    const db      = app.mongo.db!;
    const oid     = parseOid((req.params as { id: string; eventId: string }).id, app);
    const eventId = parseOid((req.params as { id: string; eventId: string }).eventId, app);

    const result = await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { calendarEventIds: eventId } as any, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) throw app.httpErrors.notFound('Milestone not found');

    reply.status(204);
  });

  // POST /agile/milestones/:id/attachments — upload (replaces if same name)
  app.post('/:id/attachments', { preHandler: app.requirePermission('agile_milestones', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Milestone not found');

    const file = await req.file();
    if (!file) throw app.httpErrors.badRequest('No file uploaded');

    const buf  = await file.toBuffer();
    const safe = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

    const existing = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === safe);
    if (existing?.url) await storage.remove(existing.url);

    const url = await storage.save(safe, buf, file.mimetype, `agile/milestones/${oid.toString()}`);

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
      action: 'agile_milestone.attachment_upload', resourceId: oid.toString(),
      meta: { filename: safe }, ip: req.ip,
    });

    reply.status(201);
    return { attachments: updated.map((a: any) => ({ ...a, uploadedBy: a.uploadedBy?.toString() })) };
  });

  // DELETE /agile/milestones/:id/attachments/:filename
  app.delete('/:id/attachments/:filename', { preHandler: app.requirePermission('agile_milestones', 'update') }, async (req, reply) => {
    const db       = app.mongo.db!;
    const oid      = parseOid((req.params as { id: string; filename: string }).id, app);
    const filename = (req.params as { id: string; filename: string }).filename;

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Milestone not found');

    const attachment = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === filename);
    if (!attachment) throw app.httpErrors.notFound('Attachment not found');

    await storage.remove(attachment.url);
    await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { attachments: { name: filename } } as any, $set: { updatedAt: new Date() } }
    );

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_milestone.attachment_delete', resourceId: oid.toString(),
      meta: { filename }, ip: req.ip,
    });

    reply.status(204);
  });
}
