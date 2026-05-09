import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'agile_comments';

function mapDoc(d: Record<string, unknown>) {
  const mapped = { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
  if (mapped.createdBy instanceof ObjectId) mapped.createdBy = (mapped.createdBy as ObjectId).toString();
  if (mapped.updatedBy instanceof ObjectId) mapped.updatedBy = (mapped.updatedBy as ObjectId).toString();
  if (mapped.jobId    instanceof ObjectId) mapped.jobId    = (mapped.jobId    as ObjectId).toString();
  if (mapped.taskId   instanceof ObjectId) mapped.taskId   = (mapped.taskId   as ObjectId).toString();
  return mapped;
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

export default async function commentsRoutes(app: FastifyInstance) {

  // GET /agile/comments?jobId=...&taskId=...
  app.get('/', { preHandler: app.requirePermission('agile_comments', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { jobId, taskId, limit = '100', skip = '0' } = req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (jobId)  { try { match.jobId  = new ObjectId(jobId);  } catch { /* ignore */ } }
    if (taskId) { try { match.taskId = new ObjectId(taskId); } catch { /* ignore */ } }

    const [docs, total] = await Promise.all([
      db.collection(COL).find(match).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { comments: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /agile/comments — requires exactly one of jobId or taskId
  app.post('/', { preHandler: app.requirePermission('agile_comments', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const { jobId, taskId, text } = req.body as Record<string, unknown>;

    if (!jobId && !taskId) throw app.httpErrors.badRequest('jobId or taskId is required');
    if (jobId  && taskId)  throw app.httpErrors.badRequest('provide only one of jobId or taskId');
    if (!text || !(text as string).trim()) throw app.httpErrors.badRequest('text is required');

    const commenterOid = new ObjectId(req.session.userId!);

    if (jobId) {
      const jobOid = parseOid(jobId as string, app);
      const job = await db.collection('agile_jobs').findOne({ _id: jobOid });
      if (!job) throw app.httpErrors.notFound('Job not found');

      const doc = {
        jobId:     jobOid,
        text:      (text as string).trim(),
        createdBy: commenterOid,
        updatedBy: null as ObjectId | null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection(COL).insertOne(doc);

      logAudit(db, {
        userId: req.session.userId!, username: req.session.username!,
        action: 'agile_comment.create', resourceId: result.insertedId.toString(),
        meta: { jobId: jobOid.toString() }, ip: req.ip,
      });

      const taskAssignees = (await db.collection('agile_tasks')
        .distinct('assignedTo', { jobId: jobOid, assignedTo: { $ne: null } })) as ObjectId[];
      const recipientMap = new Map<string, ObjectId>();
      if (!job.createdBy.equals(commenterOid)) recipientMap.set(job.createdBy.toString(), job.createdBy);
      for (const assigneeOid of taskAssignees) {
        if (!assigneeOid.equals(commenterOid)) recipientMap.set(assigneeOid.toString(), assigneeOid);
      }
      if (recipientMap.size > 0) {
        await app.notify({
          userId: [...recipientMap.values()],
          type: 'agile_job.comment',
          title: 'New comment on job',
          body: job.title,
          link: `/agile/jobs/${jobOid.toString()}`,
          source: { collection: COL, documentId: result.insertedId },
          groupKey: `job-comment-${jobOid.toString()}`,
        });
      }

      reply.status(201);
      return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
    }

    // taskId branch
    const taskOid = parseOid(taskId as string, app);
    const task = await db.collection('agile_tasks').findOne({ _id: taskOid });
    if (!task) throw app.httpErrors.notFound('Task not found');

    const doc = {
      taskId:    taskOid,
      text:      (text as string).trim(),
      createdBy: commenterOid,
      updatedBy: null as ObjectId | null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_comment.create', resourceId: result.insertedId.toString(),
      meta: { taskId: taskOid.toString() }, ip: req.ip,
    });

    const recipientMap = new Map<string, ObjectId>();
    if (task.createdBy && !task.createdBy.equals(commenterOid))
      recipientMap.set(task.createdBy.toString(), task.createdBy);
    if (task.assignedTo && !task.assignedTo.equals(commenterOid))
      recipientMap.set(task.assignedTo.toString(), task.assignedTo);

    if (recipientMap.size > 0) {
      await app.notify({
        userId: [...recipientMap.values()],
        type: 'agile_task.comment',
        title: 'New comment on task',
        body: task.title,
        link: `/agile/tasks/${taskOid.toString()}`,
        source: { collection: COL, documentId: result.insertedId },
        groupKey: `task-comment-${taskOid.toString()}`,
      });
    }

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // PATCH /agile/comments/:id — authors can edit their own; admin/owner/lead can edit any
  app.patch('/:id', { preHandler: app.requirePermission('agile_comments', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { text } = req.body as Record<string, unknown>;

    if (!text || !(text as string).trim()) throw app.httpErrors.badRequest('text is required');

    const comment = await db.collection(COL).findOne({ _id: oid });
    if (!comment) throw app.httpErrors.notFound('Comment not found');

    const sessionUser = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId!) });
    const isOwnerRole = ['owner', 'admin', 'lead'].includes(sessionUser?.role ?? '');
    if (!isOwnerRole && comment.createdBy.toString() !== req.session.userId) {
      throw app.httpErrors.forbidden('You can only edit your own comments');
    }

    await db.collection(COL).updateOne({ _id: oid }, {
      $set: { text: (text as string).trim(), updatedBy: new ObjectId(req.session.userId!), updatedAt: new Date() },
    });

    return { updated: true };
  });

  // DELETE /agile/comments/:id — authors or admin/owner/lead
  app.delete('/:id', { preHandler: app.requirePermission('agile_comments', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const comment = await db.collection(COL).findOne({ _id: oid });
    if (!comment) throw app.httpErrors.notFound('Comment not found');

    const sessionUser = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId!) });
    const isOwnerRole = ['owner', 'admin', 'lead'].includes(sessionUser?.role ?? '');
    if (!isOwnerRole && comment.createdBy.toString() !== req.session.userId) {
      throw app.httpErrors.forbidden('You can only delete your own comments');
    }

    await db.collection(COL).deleteOne({ _id: oid });

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'agile_comment.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });
}
