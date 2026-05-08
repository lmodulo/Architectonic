import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { storage } from '../../lib/storage.js';

const COL = 'agile_tasks';

const VALID_STATUS   = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Review', 'Done'] as const;
const VALID_PRIORITY = ['Low', 'Medium', 'High', 'Critical'] as const;

function mapDoc(d: Record<string, unknown>) {
  const mapped = { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
  if (mapped.assignedTo instanceof ObjectId) mapped.assignedTo = (mapped.assignedTo as ObjectId).toString();
  if (mapped.jobId instanceof ObjectId) mapped.jobId = (mapped.jobId as ObjectId).toString();
  return mapped;
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

export default async function tasksRoutes(app: FastifyInstance) {

  // GET /agile/tasks?jobId=...&assignedTo=...&status=...
  app.get('/', { preHandler: app.requirePermission('agile_tasks', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { jobId, assignedTo, status, priority, limit = '100', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (jobId)      { try { match.jobId      = new ObjectId(jobId);      } catch { /* ignore */ } }
    if (assignedTo) { try { match.assignedTo = new ObjectId(assignedTo); } catch { /* ignore */ } }
    if (status)     match.status   = status;
    if (priority)   match.priority = priority;

    const [docs, total] = await Promise.all([
      db.collection(COL).find(match).sort({ priority: -1, createdAt: 1 }).skip(Number(skip)).limit(Number(limit)).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { tasks: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /agile/tasks
  app.post('/', { preHandler: app.requirePermission('agile_tasks', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      jobId, title, description = '',
      assignedTo, estimateHours, actualHours = 0,
      priority = 'Medium', status = 'Backlog',
      blockedReason = '', dueDate,
    } = req.body as Record<string, unknown>;

    if (!jobId)  throw app.httpErrors.badRequest('jobId is required');
    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (estimateHours === undefined || estimateHours === null)
      throw app.httpErrors.badRequest('estimateHours is required');
    if (Number(estimateHours) <= 0)
      throw app.httpErrors.badRequest('estimateHours must be > 0');
    if (!VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);
    if (!VALID_PRIORITY.includes(priority as typeof VALID_PRIORITY[number]))
      throw app.httpErrors.badRequest(`Invalid priority. Valid: ${VALID_PRIORITY.join(', ')}`);
    if (status === 'In Progress' && !assignedTo)
      throw app.httpErrors.badRequest('assignedTo is required before moving to In Progress');
    if (status === 'Blocked' && !(blockedReason as string)?.trim())
      throw app.httpErrors.badRequest('blockedReason is required when status is Blocked');

    const jobOid = parseOid(jobId as string, app);
    const job = await db.collection('agile_jobs').findOne({ _id: jobOid });
    if (!job) throw app.httpErrors.notFound('Job not found');

    const est  = Number(estimateHours);
    const act  = Number(actualHours);

    const doc = {
      jobId:            jobOid,
      title:            (title as string).trim(),
      description:      String(description),
      assignedTo:       assignedTo ? parseOid(assignedTo as string, app) : null,
      estimateHours:    est,
      actualHours:      act,
      remainingHours:   Math.max(0, est - act),
      priority:         String(priority),
      status:           String(status),
      blockedReason:    String(blockedReason),
      dueDate:          dueDate ? new Date(dueDate as string) : null,
      calendarEventIds: [] as ObjectId[],
      createdBy:        new ObjectId(req.session.userId!),
      updatedBy:        null as ObjectId | null,
      createdAt:        now,
      updatedAt:        now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_task.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, jobId: jobOid.toString(), estimateHours: est, status: doc.status }, ip: req.ip,
    });

    if (doc.assignedTo && !doc.assignedTo.equals(new ObjectId(req.session.userId!))) {
      await app.notify({
        userId: doc.assignedTo,
        type: 'agile_task.assigned',
        title: 'Task assigned to you',
        body: doc.title,
        link: `/agile/jobs/${jobOid.toString()}`,
        source: { collection: COL, documentId: result.insertedId },
      });
    }

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /agile/tasks/:id
  app.get('/:id', { preHandler: app.requirePermission('agile_tasks', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Task not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /agile/tasks/:id — contributors can only update tasks assigned to them
  app.patch('/:id', { preHandler: app.requirePermission('agile_tasks', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const preTask = await db.collection(COL).findOne({ _id: oid });
    if (!preTask) return reply.notFound('Task not found');

    // Contributor restriction: can only update own tasks
    const sessionUser = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId!) });
    if (sessionUser?.role === 'contributor') {
      if (!preTask.assignedTo || preTask.assignedTo.toString() !== req.session.userId) {
        throw app.httpErrors.forbidden('Contributors can only update tasks assigned to them');
      }
    }

    const {
      title, description, assignedTo, estimateHours, actualHours,
      remainingHours, priority, status, blockedReason, dueDate,
    } = req.body as Record<string, unknown>;

    if (status !== undefined && !VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);
    if (priority !== undefined && !VALID_PRIORITY.includes(priority as typeof VALID_PRIORITY[number]))
      throw app.httpErrors.badRequest(`Invalid priority. Valid: ${VALID_PRIORITY.join(', ')}`);
    if (status === 'In Progress' && !assignedTo && !preTask.assignedTo)
      throw app.httpErrors.badRequest('assignedTo required for In Progress');
    if (status === 'Blocked' && !(blockedReason as string)?.trim())
      throw app.httpErrors.badRequest('blockedReason is required when status is Blocked');

    const $set: Record<string, unknown> = {
      updatedBy: new ObjectId(req.session.userId!),
      updatedAt: new Date(),
    };

    if (title         !== undefined) {
      if (!(title as string).trim()) throw app.httpErrors.badRequest('Title cannot be empty');
      $set.title = (title as string).trim();
    }
    if (description   !== undefined) $set.description   = String(description);
    if (assignedTo    !== undefined) $set.assignedTo    = assignedTo ? parseOid(assignedTo as string, app) : null;
    if (priority      !== undefined) $set.priority      = String(priority);
    if (status        !== undefined) $set.status        = String(status);
    if (blockedReason !== undefined) $set.blockedReason = String(blockedReason);
    if (dueDate       !== undefined) $set.dueDate       = dueDate ? new Date(dueDate as string) : null;

    if (estimateHours !== undefined) {
      if (Number(estimateHours) <= 0) throw app.httpErrors.badRequest('estimateHours must be > 0');
      $set.estimateHours = Number(estimateHours);
    }
    if (actualHours !== undefined) {
      $set.actualHours = Number(actualHours);
    }
    if (remainingHours !== undefined) {
      $set.remainingHours = Number(remainingHours);
    } else if (estimateHours !== undefined || actualHours !== undefined) {
      const est = (($set.estimateHours as number) ?? preTask.estimateHours ?? 0);
      const act = (($set.actualHours  as number) ?? preTask.actualHours  ?? 0);
      $set.remainingHours = Math.max(0, est - act);
    }

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Task not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_task.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    const updaterOid = new ObjectId(req.session.userId!);

    if (assignedTo !== undefined) {
      const newAssignee = assignedTo ? parseOid(assignedTo as string, app) : null;
      const oldAssignee = preTask.assignedTo as ObjectId | null;
      if (newAssignee && !newAssignee.equals(updaterOid) && (!oldAssignee || !newAssignee.equals(oldAssignee))) {
        await app.notify({
          userId: newAssignee,
          type: 'agile_task.assigned',
          title: 'Task assigned to you',
          body: (($set.title as string) ?? preTask.title),
          link: `/agile/jobs/${(preTask.jobId as ObjectId).toString()}`,
          source: { collection: COL, documentId: oid },
        });
      }
    }

    if (status !== undefined && status !== preTask.status) {
      const recipients: ObjectId[] = [];
      if (!(preTask.createdBy as ObjectId).equals(updaterOid)) recipients.push(preTask.createdBy as ObjectId);
      const assignedOid = preTask.assignedTo as ObjectId | null;
      if (assignedOid && !assignedOid.equals(updaterOid) && !recipients.some(r => r.equals(assignedOid))) {
        recipients.push(assignedOid);
      }
      if (recipients.length > 0) {
        await app.notify({
          userId: recipients,
          type: 'agile_task.status_changed',
          title: 'Task status updated',
          body: `${preTask.title}: ${preTask.status} → ${status}`,
          link: `/agile/jobs/${(preTask.jobId as ObjectId).toString()}`,
          source: { collection: COL, documentId: oid },
          groupKey: `task-status-${oid.toString()}`,
        });
      }
    }

    return { updated: true };
  });

  // DELETE /agile/tasks/:id
  app.delete('/:id', { preHandler: app.requirePermission('agile_tasks', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Task not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_task.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });

  // POST /agile/tasks/:id/calendar-events
  app.post('/:id/calendar-events', { preHandler: app.requirePermission('agile_tasks', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { calendarEventId } = req.body as { calendarEventId?: string };
    if (!calendarEventId) throw app.httpErrors.badRequest('calendarEventId is required');
    const ceOid = parseOid(calendarEventId, app);

    const task = await db.collection(COL).findOne({ _id: oid });
    if (!task) throw app.httpErrors.notFound('Task not found');
    const calEvent = await db.collection('calendar_events').findOne({ _id: ceOid });
    if (!calEvent) throw app.httpErrors.notFound('Calendar event not found');

    await db.collection(COL).updateOne(
      { _id: oid },
      { $addToSet: { calendarEventIds: ceOid }, $set: { updatedAt: new Date() } }
    );
    reply.status(201);
    return { attached: true };
  });

  // DELETE /agile/tasks/:id/calendar-events/:eventId
  app.delete('/:id/calendar-events/:eventId', { preHandler: app.requirePermission('agile_tasks', 'update') }, async (req, reply) => {
    const db      = app.mongo.db!;
    const oid     = parseOid((req.params as { id: string; eventId: string }).id, app);
    const eventId = parseOid((req.params as { id: string; eventId: string }).eventId, app);
    const result  = await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { calendarEventIds: eventId } as any, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) throw app.httpErrors.notFound('Task not found');
    reply.status(204);
  });

  // POST /agile/tasks/:id/attachments — upload (replaces if same name)
  app.post('/:id/attachments', { preHandler: app.requirePermission('agile_tasks', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Task not found');

    const file = await req.file();
    if (!file) throw app.httpErrors.badRequest('No file uploaded');

    const buf  = await file.toBuffer();
    const safe = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

    const existing = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === safe);
    if (existing?.url) await storage.remove(existing.url);

    const url = await storage.save(safe, buf, file.mimetype, `agile/tasks/${oid.toString()}`);

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
      action: 'agile_task.attachment_upload', resourceId: oid.toString(),
      meta: { filename: safe }, ip: req.ip,
    });

    reply.status(201);
    return { attachments: updated.map((a: any) => ({ ...a, uploadedBy: a.uploadedBy?.toString() })) };
  });

  // DELETE /agile/tasks/:id/attachments/:filename
  app.delete('/:id/attachments/:filename', { preHandler: app.requirePermission('agile_tasks', 'update') }, async (req, reply) => {
    const db       = app.mongo.db!;
    const oid      = parseOid((req.params as { id: string; filename: string }).id, app);
    const filename = (req.params as { id: string; filename: string }).filename;

    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Task not found');

    const attachment = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === filename);
    if (!attachment) throw app.httpErrors.notFound('Attachment not found');

    await storage.remove(attachment.url);
    await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { attachments: { name: filename } } as any, $set: { updatedAt: new Date() } }
    );

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_task.attachment_delete', resourceId: oid.toString(),
      meta: { filename }, ip: req.ip,
    });

    reply.status(204);
  });

  // GET /agile/tasks/:id/effort-log — audit entries for this task
  app.get('/:id/effort-log', { preHandler: app.requirePermission('agile_tasks', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const { id } = req.params as { id: string };
    parseOid(id, app); // validate format

    const logs = await db.collection('audit_logs')
      .find({ action: { $regex: /^agile_task\./ }, resourceId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return logs.map(l => ({ ...l, id: (l._id as ObjectId).toString(), _id: undefined }));
  });
}
