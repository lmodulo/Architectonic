import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { storage } from '../../lib/storage.js';

const MSGS   = 'messages';
const STATES = 'message_state';

// ── Private helpers ───────────────────────────────────────────────────────────

type RawMsg = Record<string, any>;

/** Deduplicates messages by threadId, keeping the first (latest) per thread. */
function latestPerThread(msgs: RawMsg[]): Map<string, RawMsg> {
  const map = new Map<string, RawMsg>();
  for (const m of msgs) {
    const tid = m.threadId.toString();
    if (!map.has(tid)) map.set(tid, m);
  }
  return map;
}

/** Builds message_state insert rows for a new message: one for sender (read) + one per recipient (unread). */
function buildStateRows(msgId: ObjectId, recipientIds: ObjectId[], senderId: ObjectId, now: Date) {
  return [
    { messageId: msgId, userId: senderId, read: true,  readAt: now,  archived: false, deleted: false },
    ...recipientIds.map(uid => ({
      messageId: msgId, userId: uid,      read: false, readAt: null, archived: false, deleted: false,
    })),
  ];
}

// ── Shape returned for thread list items ─────────────────────────────────────

interface ThreadSummary {
  threadId:    string;
  subject:     string;
  latestFrom:  string;
  latestAt:    Date;
  unreadCount: number;
  totalCount:  number;
}

export default async function messagesRoutes(app: FastifyInstance) {

  // ── GET /messages — inbox ────────────────────────────────────────────────
  app.get<{ Querystring: { limit?: string; before?: string } }>('/', { preHandler: app.requireAuth, schema: { summary: 'Inbox — undeleted threads where user is a recipient', querystring: { type: 'object', properties: { limit: { type: 'string' }, before: { type: 'string' } } } } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    // All non-deleted state rows for this user
    const states = await db.collection(STATES)
      .find({ userId, deleted: false })
      .toArray();

    const messageIds = states.map(s => s.messageId);
    if (!messageIds.length) return { threads: [], hasMore: false };

    // Messages where user is to/cc (inbox — not sent)
    const msgs = await db.collection(MSGS)
      .find({
        _id:  { $in: messageIds },
        from: { $ne: userId },
        $or:  [{ to: userId }, { cc: userId }]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Group by threadId, keep only latest per thread
    const threadMap = latestPerThread(msgs);

    // Count unread per thread
    const stateMap = new Map(states.map(s => [s.messageId.toString(), s]));

    const threads: ThreadSummary[] = [];
    for (const [threadId, latest] of threadMap) {
      const threadMsgs = msgs.filter(m => m.threadId.toString() === threadId);
      const unread = threadMsgs.filter(m => {
        const s = stateMap.get(m._id.toString());
        return s && !s.read;
      }).length;

      threads.push({
        threadId,
        subject:     latest.subject,
        latestFrom:  latest.from.toString(),
        latestAt:    latest.createdAt,
        unreadCount: unread,
        totalCount:  threadMsgs.length,
      });
    }

    const limit  = Math.min(parseInt(req.query.limit ?? '25', 10) || 25, 100);
    const before = req.query.before ? new Date(req.query.before) : null;
    let   sorted = threads.sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
    if (before) sorted = sorted.filter(t => t.latestAt < before);
    const hasMore = sorted.length > limit;
    return { threads: sorted.slice(0, limit), hasMore };
  });

  // ── GET /messages/unread-count ───────────────────────────────────────────
  app.get('/unread-count', { preHandler: app.requireAuth, schema: { summary: 'Count of unread messages for the authenticated user' } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const count = await db.collection(STATES).countDocuments({
      userId,
      read:    false,
      deleted: false,
    });

    return { count };
  });

  // ── GET /messages/sent ───────────────────────────────────────────────────
  app.get<{ Querystring: { limit?: string; before?: string } }>('/sent', { preHandler: app.requireAuth, schema: { summary: 'Sent threads — threads where user is the sender', querystring: { type: 'object', properties: { limit: { type: 'string' }, before: { type: 'string' } } } } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const msgs = await db.collection(MSGS)
      .find({ from: userId })
      .sort({ createdAt: -1 })
      .toArray();

    const threadMap = latestPerThread(msgs);

    const limit  = Math.min(parseInt(req.query.limit ?? '25', 10) || 25, 100);
    const before = req.query.before ? new Date(req.query.before) : null;
    let   sorted = [...threadMap.values()].map(m => ({
      threadId:    m.threadId.toString(),
      subject:     m.subject,
      latestFrom:  m.from.toString(),
      latestAt:    m.createdAt,
      totalCount:  msgs.filter(x => x.threadId.toString() === m.threadId.toString()).length,
      unreadCount: 0,
    })).sort((a: ThreadSummary, b: ThreadSummary) => b.latestAt.getTime() - a.latestAt.getTime());
    if (before) sorted = sorted.filter(t => t.latestAt < before);
    const hasMore = sorted.length > limit;
    return { threads: sorted.slice(0, limit), hasMore };
  });

  // ── GET /messages/archived ───────────────────────────────────────────────
  app.get<{ Querystring: { limit?: string; before?: string } }>('/archived', { preHandler: app.requireAuth, schema: { summary: 'Archived threads for the authenticated user', querystring: { type: 'object', properties: { limit: { type: 'string' }, before: { type: 'string' } } } } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const states = await db.collection(STATES)
      .find({ userId, archived: true, deleted: false })
      .toArray();

    if (!states.length) return { threads: [], hasMore: false };

    const messageIds = states.map(s => s.messageId);
    const msgs = await db.collection(MSGS)
      .find({ _id: { $in: messageIds } })
      .sort({ createdAt: -1 })
      .toArray();

    const threadMap = latestPerThread(msgs);

    const limit  = Math.min(parseInt(req.query.limit ?? '25', 10) || 25, 100);
    const before = req.query.before ? new Date(req.query.before) : null;
    let   sorted = [...threadMap.values()].map(m => ({
      threadId:    m.threadId.toString(),
      subject:     m.subject,
      latestFrom:  m.from.toString(),
      latestAt:    m.createdAt,
      unreadCount: 0,
      totalCount:  msgs.filter(x => x.threadId.toString() === m.threadId.toString()).length,
    })).sort((a: ThreadSummary, b: ThreadSummary) => b.latestAt.getTime() - a.latestAt.getTime());
    if (before) sorted = sorted.filter(t => t.latestAt < before);
    const hasMore = sorted.length > limit;
    return { threads: sorted.slice(0, limit), hasMore };
  });

  // ── GET /messages/:threadId — full thread ────────────────────────────────
  app.get<{ Params: { threadId: string } }>('/:threadId', { preHandler: app.requireAuth, schema: { summary: 'Get full thread; marks all messages as read' } }, async (req, reply) => {
    const db       = app.mongo.db!;
    const userId   = new ObjectId(req.session.userId!);
    let   threadId: ObjectId;

    try { threadId = new ObjectId(req.params.threadId); }
    catch { return reply.badRequest('Invalid threadId'); }

    const msgs = await db.collection(MSGS)
      .find({ threadId })
      .sort({ createdAt: 1 })
      .toArray();

    if (!msgs.length) return reply.notFound('Thread not found');

    // Verify user is a participant
    const isParticipant = msgs.some(m =>
      m.from.equals(userId) ||
      (m.to  as ObjectId[]).some((id: ObjectId) => id.equals(userId)) ||
      (m.cc  as ObjectId[]).some((id: ObjectId) => id.equals(userId))
    );
    if (!isParticipant) return reply.forbidden('Access denied');

    // Mark all unread messages in thread as read for this user
    const msgIds = msgs.map(m => m._id);
    await db.collection(STATES).updateMany(
      { messageId: { $in: msgIds }, userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    // Resolve sender display names
    const senderIds = [...new Set(msgs.map(m => m.from))];
    const users = await db.collection('users')
      .find({ _id: { $in: senderIds } }, { projection: { username: 1, firstName: 1, lastName: 1 } })
      .toArray();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    return msgs.map(m => {
      const sender = userMap.get(m.from.toString());
      return {
        id:       m._id.toString(),
        threadId: m.threadId.toString(),
        parentId: m.parentId?.toString() ?? null,
        from: {
          id:       m.from.toString(),
          username: sender?.username ?? 'unknown',
          name:     sender ? [sender.firstName, sender.lastName].filter(Boolean).join(' ') || sender.username : 'Unknown',
        },
        to:          (m.to  as ObjectId[]).map((id: ObjectId) => id.toString()),
        cc:          (m.cc  as ObjectId[]).map((id: ObjectId) => id.toString()),
        subject:     m.subject,
        body:        m.body,
        attachments: m.attachments ?? [],
        createdAt:   m.createdAt,
      };
    });
  });

  // ── POST /messages — compose new thread ──────────────────────────────────
  app.post<{ Body: { to: string[]; cc?: string[]; subject: string; body: string } }>('/', {
    preHandler: app.requireAuth,
    schema: {
      summary: 'Compose a new message thread',
      body: {
        type: 'object',
        required: ['to', 'subject', 'body'],
        properties: {
          to:      { type: 'array', items: { type: 'string' }, minItems: 1 },
          cc:      { type: 'array', items: { type: 'string' } },
          subject: { type: 'string', minLength: 1, maxLength: 200 },
          body:    { type: 'string', minLength: 1 },
        }
      }
    }
  }, async (req, reply) => {
    const db     = app.mongo.db!;
    const from   = new ObjectId(req.session.userId!);
    const { to, cc = [], subject, body } = req.body;

    const toIds = to.map(id => new ObjectId(id));
    const ccIds = cc.map(id => new ObjectId(id));

    const now      = new Date();
    const msgId    = new ObjectId();
    const threadId = msgId; // thread starter: _id === threadId

    await db.collection(MSGS).insertOne({
      _id: msgId, threadId, parentId: null,
      from, to: toIds, cc: ccIds,
      subject, body, attachments: [],
      createdAt: now, updatedAt: now,
    });

    // Create state rows for all recipients + sender
    const allRecipients = [...new Set([...toIds.map(String), ...ccIds.map(String)])].map(id => new ObjectId(id));
    await db.collection(STATES).insertMany(buildStateRows(msgId, allRecipients, from, now));

    logAudit(app.mongo.db!, { userId: from.toString(), username: req.session.username!, action: 'message.send', resourceId: threadId.toString(), meta: { subject }, ip: req.ip });

    reply.code(201);
    return { threadId: threadId.toString(), messageId: msgId.toString() };
  });

  // ── POST /messages/:threadId/reply ───────────────────────────────────────
  app.post<{ Params: { threadId: string }; Body: { body: string } }>('/:threadId/reply', {
    preHandler: app.requireAuth,
    schema: {
      summary: 'Reply to a thread',
      body: {
        type: 'object',
        required: ['body'],
        properties: { body: { type: 'string', minLength: 1 } }
      }
    }
  }, async (req, reply) => {
    const db     = app.mongo.db!;
    const from   = new ObjectId(req.session.userId!);
    let   threadId: ObjectId;

    try { threadId = new ObjectId(req.params.threadId); }
    catch { return reply.badRequest('Invalid threadId'); }

    // Load thread starter to inherit subject + recipients
    const starter = await db.collection(MSGS).findOne({ _id: threadId });
    if (!starter) return reply.notFound('Thread not found');

    const now   = new Date();
    const msgId = new ObjectId();

    // Collect all unique participants from the thread
    const threadMsgs = await db.collection(MSGS).find({ threadId }).toArray();
    const participantSet = new Set<string>();
    for (const m of threadMsgs) {
      participantSet.add(m.from.toString());
      (m.to as ObjectId[]).forEach((id: ObjectId) => participantSet.add(id.toString()));
    }
    participantSet.delete(from.toString()); // exclude sender

    const toIds = [...participantSet].map(id => new ObjectId(id));

    await db.collection(MSGS).insertOne({
      _id: msgId, threadId, parentId: threadMsgs[threadMsgs.length - 1]._id,
      from, to: toIds, cc: [],
      subject: starter.subject, body: req.body.body, attachments: [],
      createdAt: now, updatedAt: now,
    });

    await db.collection(STATES).insertMany(buildStateRows(msgId, toIds, from, now));

    logAudit(app.mongo.db!, { userId: from.toString(), username: req.session.username!, action: 'message.reply', resourceId: threadId.toString(), ip: req.ip });

    reply.code(201);
    return { threadId: threadId.toString(), messageId: msgId.toString() };
  });

  // ── POST /messages/:messageId/attachments ───────────────────────────────
  app.post<{ Params: { messageId: string } }>('/:messageId/attachments', { preHandler: app.requireAuth }, async (req, reply) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    let msgId: ObjectId;
    try { msgId = new ObjectId((req.params as { messageId: string }).messageId); }
    catch { return reply.badRequest('Invalid messageId'); }

    const msg = await db.collection(MSGS).findOne({ _id: msgId });
    if (!msg) return reply.notFound('Message not found');

    const isParticipant =
      msg.from.equals(uid) ||
      (msg.to as ObjectId[]).some((id: ObjectId) => id.equals(uid)) ||
      (msg.cc as ObjectId[]).some((id: ObjectId) => id.equals(uid));
    if (!isParticipant) return reply.forbidden('Access denied');

    const file = await req.file();
    if (!file) return reply.badRequest('No file uploaded');

    const buf  = await file.toBuffer();
    const safe = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

    const existing = ((msg.attachments ?? []) as any[]).find((a: any) => a.name === safe);
    if (existing?.url) await storage.remove(existing.url);

    const url = await storage.save(safe, buf, file.mimetype, `messages/${msgId.toString()}`);

    const attachment = {
      name: safe, url, mimetype: file.mimetype,
      uploadedAt: new Date(), uploadedBy: uid,
    };

    const updated = [
      ...((msg.attachments ?? []) as any[]).filter((a: any) => a.name !== safe),
      attachment,
    ];

    await db.collection(MSGS).updateOne({ _id: msgId }, { $set: { attachments: updated, updatedAt: new Date() } });

    reply.status(201);
    return { attachments: updated.map((a: any) => ({ ...a, uploadedBy: a.uploadedBy?.toString() })) };
  });

  // ── DELETE /messages/:messageId/attachments/:filename ────────────────────
  app.delete<{ Params: { messageId: string; filename: string } }>('/:messageId/attachments/:filename', { preHandler: app.requireAuth }, async (req, reply) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    let msgId: ObjectId;
    try { msgId = new ObjectId((req.params as { messageId: string; filename: string }).messageId); }
    catch { return reply.badRequest('Invalid messageId'); }

    const filename = (req.params as { messageId: string; filename: string }).filename;
    const msg = await db.collection(MSGS).findOne({ _id: msgId });
    if (!msg) return reply.notFound('Message not found');

    if (!msg.from.equals(uid)) return reply.forbidden('Only the sender can remove attachments');

    const att = ((msg.attachments ?? []) as any[]).find((a: any) => a.name === filename);
    if (!att) return reply.notFound('Attachment not found');

    await storage.remove(att.url);
    await db.collection(MSGS).updateOne(
      { _id: msgId },
      { $pull: { attachments: { name: filename } } as any, $set: { updatedAt: new Date() } }
    );

    reply.status(204);
  });

  // ── PATCH /messages/:threadId/state ─────────────────────────────────────
  app.patch<{
    Params: { threadId: string };
    Body: { read?: boolean; archived?: boolean; deleted?: boolean }
  }>('/:threadId/state', {
    preHandler: app.requireAuth,
    schema: {
      summary: 'Update read/archived/deleted state for a thread',
      body: {
        type: 'object',
        properties: {
          read:     { type: 'boolean' },
          archived: { type: 'boolean' },
          deleted:  { type: 'boolean' },
        }
      }
    }
  }, async (req, reply) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    let   threadId: ObjectId;

    try { threadId = new ObjectId(req.params.threadId); }
    catch { return reply.badRequest('Invalid threadId'); }

    const threadMsgIds = (await db.collection(MSGS)
      .find({ threadId }, { projection: { _id: 1 } })
      .toArray()).map(m => m._id);

    if (!threadMsgIds.length) return reply.notFound('Thread not found');

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.read     !== undefined) { set.read = req.body.read; if (req.body.read) set.readAt = new Date(); }
    if (req.body.archived !== undefined) set.archived = req.body.archived;
    if (req.body.deleted  !== undefined) set.deleted  = req.body.deleted;

    await db.collection(STATES).updateMany(
      { messageId: { $in: threadMsgIds }, userId },
      { $set: set }
    );

    return { updated: true };
  });
}
