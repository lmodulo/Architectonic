import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../lib/audit.js';

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
  app.get('/', { preHandler: app.requireAuth, schema: { summary: 'Inbox — undeleted threads where user is a recipient' } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    // All non-deleted state rows for this user
    const states = await db.collection(STATES)
      .find({ userId, deleted: false })
      .toArray();

    const messageIds = states.map(s => s.messageId);
    if (!messageIds.length) return [];

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

    return threads.sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
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
  app.get('/sent', { preHandler: app.requireAuth, schema: { summary: 'Sent threads — threads where user is the sender' } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const msgs = await db.collection(MSGS)
      .find({ from: userId })
      .sort({ createdAt: -1 })
      .toArray();

    const threadMap = latestPerThread(msgs);

    return [...threadMap.values()].map(m => ({
      threadId:   m.threadId.toString(),
      subject:    m.subject,
      latestFrom: m.from.toString(),
      latestAt:   m.createdAt,
      totalCount: msgs.filter(x => x.threadId.toString() === m.threadId.toString()).length,
      unreadCount: 0,
    })).sort((a: ThreadSummary, b: ThreadSummary) => b.latestAt.getTime() - a.latestAt.getTime());
  });

  // ── GET /messages/archived ───────────────────────────────────────────────
  app.get('/archived', { preHandler: app.requireAuth, schema: { summary: 'Archived threads for the authenticated user' } }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const states = await db.collection(STATES)
      .find({ userId, archived: true, deleted: false })
      .toArray();

    if (!states.length) return [];

    const messageIds = states.map(s => s.messageId);
    const msgs = await db.collection(MSGS)
      .find({ _id: { $in: messageIds } })
      .sort({ createdAt: -1 })
      .toArray();

    const threadMap = latestPerThread(msgs);

    return [...threadMap.values()].map(m => ({
      threadId:    m.threadId.toString(),
      subject:     m.subject,
      latestFrom:  m.from.toString(),
      latestAt:    m.createdAt,
      unreadCount: 0,
      totalCount:  msgs.filter(x => x.threadId.toString() === m.threadId.toString()).length,
    })).sort((a: ThreadSummary, b: ThreadSummary) => b.latestAt.getTime() - a.latestAt.getTime());
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
