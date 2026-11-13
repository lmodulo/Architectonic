import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

const COL = 'time_entries';

function snap15(minutes: number): number {
  return Math.max(15, Math.round(minutes / 15) * 15);
}

function mapDoc(d: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
  for (const k of ['userId', 'taskId', 'jobId', 'sprintId', 'milestoneId']) {
    if (out[k] instanceof ObjectId) out[k] = (out[k] as ObjectId).toString();
  }
  return out;
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

export default async function timeEntriesRoutes(app: FastifyInstance) {

  // GET /agile/time-entries
  app.get('/', { preHandler: app.requirePermission('agile_time_entries', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { userId, taskId, sprintId, milestoneId, dateFrom, dateTo, limit = '500', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (userId)      { try { match.userId      = new ObjectId(userId);      } catch { /* */ } }
    if (taskId)      { try { match.taskId      = new ObjectId(taskId);      } catch { /* */ } }
    if (sprintId)    { try { match.sprintId    = new ObjectId(sprintId);    } catch { /* */ } }
    if (milestoneId) { try { match.milestoneId = new ObjectId(milestoneId); } catch { /* */ } }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, string> = {};
      if (dateFrom) dateFilter.$gte = dateFrom;
      if (dateTo)   dateFilter.$lte = dateTo;
      match.date = dateFilter;
    }

    const [docs, total] = await Promise.all([
      db.collection(COL).find(match).sort({ date: -1, createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { entries: docs.map(d => mapDoc(d as Record<string, unknown>)), total };
  });

  // GET /agile/time-entries/active-timer
  app.get('/active-timer', { preHandler: app.requirePermission('agile_time_entries', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const entry = await db.collection(COL).findOne({ userId, timerRunning: true });
    if (!entry) return { entry: null, task: null };
    const task = await db.collection('agile_tasks').findOne({ _id: entry.taskId as ObjectId });
    return {
      entry: mapDoc(entry as Record<string, unknown>),
      task: task ? mapDoc(task as Record<string, unknown>) : null,
    };
  });

  // GET /agile/time-entries/summary
  app.get('/summary', { preHandler: app.requirePermission('agile_time_entries', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { userId, sprintId, milestoneId, dateFrom, dateTo } = req.query as Record<string, string>;

    const match: Record<string, unknown> = { timerRunning: false };
    if (userId)      { try { match.userId      = new ObjectId(userId);      } catch { /* */ } }
    if (sprintId)    { try { match.sprintId    = new ObjectId(sprintId);    } catch { /* */ } }
    if (milestoneId) { try { match.milestoneId = new ObjectId(milestoneId); } catch { /* */ } }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, string> = {};
      if (dateFrom) dateFilter.$gte = dateFrom;
      if (dateTo)   dateFilter.$lte = dateTo;
      match.date = dateFilter;
    }

    const byTask = await db.collection(COL).aggregate([
      { $match: match },
      { $group: {
        _id: '$taskId',
        jobId:           { $first: '$jobId' },
        sprintId:        { $first: '$sprintId' },
        milestoneId:     { $first: '$milestoneId' },
        totalMinutes:    { $sum: '$durationMinutes' },
        billableMinutes: { $sum: { $cond: ['$billable', '$durationMinutes', 0] } },
        entryCount:      { $sum: 1 },
      }},
      { $sort: { totalMinutes: -1 } },
    ]).toArray();

    return {
      byTask: byTask.map(d => ({
        taskId:          (d._id as ObjectId).toString(),
        jobId:           d.jobId       ? (d.jobId as ObjectId).toString()       : null,
        sprintId:        d.sprintId    ? (d.sprintId as ObjectId).toString()    : null,
        milestoneId:     d.milestoneId ? (d.milestoneId as ObjectId).toString() : null,
        totalMinutes:    d.totalMinutes,
        billableMinutes: d.billableMinutes,
        entryCount:      d.entryCount,
      })),
    };
  });

  // POST /agile/time-entries  (manual entry)
  app.post('/', { preHandler: app.requirePermission('agile_time_entries', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const { taskId, date, durationMinutes, note = '', billable = true } = req.body as Record<string, unknown>;

    if (!taskId || !date || durationMinutes === undefined)
      throw app.httpErrors.badRequest('taskId, date, and durationMinutes are required');

    const tid  = parseOid(taskId as string, app);
    const task = await db.collection('agile_tasks').findOne({ _id: tid });
    if (!task) throw app.httpErrors.notFound('Task not found');

    const job    = task.jobId    ? await db.collection('agile_jobs').findOne({ _id: task.jobId as ObjectId })       : null;
    const sprint = job?.sprintId ? await db.collection('agile_sprints').findOne({ _id: job.sprintId as ObjectId })  : null;

    const entry = {
      userId:         new ObjectId(req.session.userId!),
      taskId:         tid,
      jobId:          task.jobId          ?? null,
      sprintId:       job?.sprintId       ?? null,
      milestoneId:    sprint?.milestoneId ?? null,
      date:           date as string,
      durationMinutes: snap15(Number(durationMinutes)),
      note:           (note as string).trim(),
      billable:       Boolean(billable),
      timerRunning:   false,
      timerStartedAt: null,
      createdAt:      now,
      updatedAt:      now,
    };

    const result = await db.collection(COL).insertOne(entry);
    reply.status(201);
    return mapDoc({ ...entry, _id: result.insertedId } as Record<string, unknown>);
  });

  // POST /agile/time-entries/timer/start
  app.post('/timer/start', { preHandler: app.requirePermission('agile_time_entries', 'create') }, async (req, reply) => {
    const db     = app.mongo.db!;
    const now    = new Date();
    const userId = new ObjectId(req.session.userId!);
    const { taskId } = req.body as Record<string, unknown>;

    if (!taskId) throw app.httpErrors.badRequest('taskId is required');
    const tid  = parseOid(taskId as string, app);
    const task = await db.collection('agile_tasks').findOne({ _id: tid });
    if (!task) throw app.httpErrors.notFound('Task not found');

    const job    = task.jobId    ? await db.collection('agile_jobs').findOne({ _id: task.jobId as ObjectId })       : null;
    const sprint = job?.sprintId ? await db.collection('agile_sprints').findOne({ _id: job.sprintId as ObjectId })  : null;

    // Stop any running timer first (auto-split)
    const active = await db.collection(COL).findOne({ userId, timerRunning: true });
    if (active) {
      const elapsed = snap15((now.getTime() - (active.timerStartedAt as Date).getTime()) / 60000);
      await db.collection(COL).updateOne({ _id: active._id }, {
        $set: { timerRunning: false, timerStartedAt: null, durationMinutes: elapsed, updatedAt: now },
      });
    }

    const entry = {
      userId,
      taskId:         tid,
      jobId:          task.jobId          ?? null,
      sprintId:       job?.sprintId       ?? null,
      milestoneId:    sprint?.milestoneId ?? null,
      date:           now.toISOString().slice(0, 10),
      durationMinutes: 0,
      note:           '',
      billable:       true,
      timerRunning:   true,
      timerStartedAt: now,
      createdAt:      now,
      updatedAt:      now,
    };

    const result = await db.collection(COL).insertOne(entry);
    reply.status(201);
    return mapDoc({ ...entry, _id: result.insertedId } as Record<string, unknown>);
  });

  // POST /agile/time-entries/timer/stop
  app.post('/timer/stop', { preHandler: app.requirePermission('agile_time_entries', 'update') }, async (req) => {
    const db     = app.mongo.db!;
    const now    = new Date();
    const userId = new ObjectId(req.session.userId!);

    const active = await db.collection(COL).findOne({ userId, timerRunning: true });
    if (!active) throw app.httpErrors.notFound('No active timer');

    const elapsed = snap15((now.getTime() - (active.timerStartedAt as Date).getTime()) / 60000);
    await db.collection(COL).updateOne({ _id: active._id }, {
      $set: { timerRunning: false, timerStartedAt: null, durationMinutes: elapsed, updatedAt: now },
    });

    return mapDoc({
      ...active,
      timerRunning: false, timerStartedAt: null, durationMinutes: elapsed, updatedAt: now,
    } as Record<string, unknown>);
  });

  // PATCH /agile/time-entries/:id
  app.patch('/:id', { preHandler: app.requirePermission('agile_time_entries', 'update') }, async (req) => {
    const db     = app.mongo.db!;
    const now    = new Date();
    const userId = new ObjectId(req.session.userId!);
    const eid    = parseOid((req.params as { id: string }).id, app);

    const existing = await db.collection(COL).findOne({ _id: eid, userId });
    if (!existing) throw app.httpErrors.notFound('Entry not found');

    const { durationMinutes, note, billable, date } = req.body as Record<string, unknown>;
    const set: Record<string, unknown> = { updatedAt: now };
    if (durationMinutes !== undefined) set.durationMinutes = snap15(Number(durationMinutes));
    if (note            !== undefined) set.note             = (note as string).trim();
    if (billable        !== undefined) set.billable          = Boolean(billable);
    if (date            !== undefined) set.date              = date;

    await db.collection(COL).updateOne({ _id: eid }, { $set: set });
    const updated = await db.collection(COL).findOne({ _id: eid });
    return mapDoc(updated as Record<string, unknown>);
  });

  // DELETE /agile/time-entries/:id
  app.delete('/:id', { preHandler: app.requirePermission('agile_time_entries', 'delete') }, async (req, reply) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const eid    = parseOid((req.params as { id: string }).id, app);

    const existing = await db.collection(COL).findOne({ _id: eid, userId });
    if (!existing) throw app.httpErrors.notFound('Entry not found');

    await db.collection(COL).deleteOne({ _id: eid });
    reply.status(204);
    return;
  });
}
