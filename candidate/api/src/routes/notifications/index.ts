import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import type { WebSocket } from 'ws';

const COLL  = 'notifications';
const PREFS = 'notification_preferences';

const DEFAULT_PREFS = {
  channels: { websocket: true, email: false },
  muted:    [] as string[],
  quiet:    { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
};

async function getOrCreatePrefs(db: ReturnType<FastifyInstance['mongo']['db']>, userId: ObjectId) {
  let prefs = await db!.collection(PREFS).findOne({ userId });
  if (!prefs) {
    const doc = { ...DEFAULT_PREFS, userId, createdAt: new Date() };
    await db!.collection(PREFS).insertOne(doc);
    prefs = doc;
  }
  return prefs;
}

export default async function notificationsRoutes(app: FastifyInstance) {

  // ── WebSocket /notifications/ws ───────────────────────────────────────────
  app.get('/ws', { websocket: true }, (socket: WebSocket, request) => {
    const userId = request.session?.userId;
    if (!userId) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    const db = app.mongo.db!;
    const userObjectId = new ObjectId(userId);

    // Register connection
    let connections = app.wsConnections.get(userId);
    if (!connections) {
      connections = new Set();
      app.wsConnections.set(userId, connections);
    }
    connections.add(socket);

    // Send unread count on connect
    db.collection(COLL).countDocuments({ userId: userObjectId, read: false }).then(unreadCount => {
      socket.send(JSON.stringify({ type: 'init', unreadCount }));
    });

    socket.on('message', (raw) => {
      let msg: { type: string; notificationId?: string; since?: string };
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === 'mark-read' && msg.notificationId) {
        let id: ObjectId;
        try { id = new ObjectId(msg.notificationId); } catch { return; }

        db.collection(COLL).updateOne(
          { _id: id, userId: userObjectId },
          { $set: { read: true, readAt: new Date() } }
        ).then(() =>
          db.collection(COLL).countDocuments({ userId: userObjectId, read: false })
        ).then(count => {
          socket.send(JSON.stringify({ type: 'read-confirmed', notificationId: msg.notificationId }));
          socket.send(JSON.stringify({ type: 'count-update', unreadCount: count }));
        });

      } else if (msg.type === 'mark-all-read') {
        db.collection(COLL).updateMany(
          { userId: userObjectId, read: false },
          { $set: { read: true, readAt: new Date() } }
        ).then(() => {
          socket.send(JSON.stringify({ type: 'count-update', unreadCount: 0 }));
        });

      } else if (msg.type === 'sync' && msg.since) {
        const since = new Date(msg.since);
        db.collection(COLL)
          .find({ userId: userObjectId, createdAt: { $gt: since } })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()
          .then(async notifications => {
            const count = await db.collection(COLL).countDocuments({ userId: userObjectId, read: false });
            socket.send(JSON.stringify({
              type: 'sync-response',
              notifications: notifications.map(n => ({
                _id:       n._id.toString(),
                type:      n.type,
                title:     n.title,
                body:      n.body,
                link:      n.link,
                read:      n.read,
                createdAt: n.createdAt,
              })),
              unreadCount: count,
            }));
          });
      }
    });

    socket.on('close', () => {
      const conns = app.wsConnections.get(userId);
      if (conns) {
        conns.delete(socket);
        if (conns.size === 0) app.wsConnections.delete(userId);
      }
    });
  });

  // ── GET /notifications — paginated list ──────────────────────────────────
  app.get<{ Querystring: { page?: string; filter?: string } }>('/', {
    preHandler: app.requireAuth,
    schema: { summary: 'List notifications for the authenticated user' },
  }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const page   = Math.max(1, parseInt(req.query.page ?? '1'));
    const filter = req.query.filter === 'unread' ? 'unread' : 'all';
    const limit  = 20;
    const skip   = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (filter === 'unread') query.read = false;

    const [items, total] = await Promise.all([
      db.collection(COLL).find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection(COLL).countDocuments(query),
    ]);

    return {
      items: items.map(n => ({
        _id:       n._id.toString(),
        type:      n.type,
        title:     n.title,
        body:      n.body,
        link:      n.link,
        read:      n.read,
        readAt:    n.readAt,
        createdAt: n.createdAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  });

  // ── GET /notifications/unread-count ──────────────────────────────────────
  app.get('/unread-count', {
    preHandler: app.requireAuth,
    schema: { summary: 'Count of unread notifications for the authenticated user' },
  }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const count  = await db.collection(COLL).countDocuments({ userId, read: false });
    return { count };
  });

  // ── GET /notifications/recent — last 10 for bell dropdown ────────────────
  app.get('/recent', {
    preHandler: app.requireAuth,
    schema: { summary: 'Most recent 10 notifications for the bell dropdown' },
  }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const items  = await db.collection(COLL)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    return items.map(n => ({
      _id:       n._id.toString(),
      type:      n.type,
      title:     n.title,
      body:      n.body,
      link:      n.link,
      read:      n.read,
      createdAt: n.createdAt,
    }));
  });

  // ── PUT /notifications/:id/read — mark one read ───────────────────────────
  app.put<{ Params: { id: string } }>('/:id/read', {
    preHandler: app.requireAuth,
    schema: { summary: 'Mark a single notification as read' },
  }, async (req, reply) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    let id: ObjectId;
    try { id = new ObjectId(req.params.id); } catch { return reply.badRequest('Invalid id'); }

    await db.collection(COLL).updateOne(
      { _id: id, userId },
      { $set: { read: true, readAt: new Date() } }
    );

    const unreadCount = await db.collection(COLL).countDocuments({ userId, read: false });

    const sockets = app.wsConnections.get(userId.toString());
    if (sockets?.size) {
      const msg = JSON.stringify({ type: 'count-update', unreadCount });
      for (const s of sockets) { try { s.send(msg); } catch { } }
    }

    return { updated: true, unreadCount };
  });

  // ── PUT /notifications/read-all — mark all read ───────────────────────────
  app.put('/read-all', {
    preHandler: app.requireAuth,
    schema: { summary: 'Mark all notifications as read' },
  }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    await db.collection(COLL).updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    const sockets = app.wsConnections.get(userId.toString());
    if (sockets?.size) {
      const msg = JSON.stringify({ type: 'count-update', unreadCount: 0 });
      for (const s of sockets) { try { s.send(msg); } catch { } }
    }

    return { updated: true };
  });

  // ── GET /notifications/preferences ───────────────────────────────────────
  app.get('/preferences', {
    preHandler: app.requireAuth,
    schema: { summary: 'Get notification preferences for the authenticated user' },
  }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const prefs  = await getOrCreatePrefs(db, userId);
    return {
      channels: prefs.channels ?? DEFAULT_PREFS.channels,
      muted:    prefs.muted    ?? [],
      quiet:    prefs.quiet    ?? DEFAULT_PREFS.quiet,
    };
  });

  // ── PUT /notifications/preferences ───────────────────────────────────────
  app.put<{
    Body: {
      channels?: { websocket?: boolean; email?: boolean };
      muted?: string[];
      quiet?: { enabled?: boolean; start?: string; end?: string; timezone?: string };
    }
  }>('/preferences', {
    preHandler: app.requireAuth,
    schema: {
      summary: 'Update notification preferences',
      body: {
        type: 'object',
        properties: {
          channels: {
            type: 'object',
            properties: {
              websocket: { type: 'boolean' },
              email:     { type: 'boolean' },
            }
          },
          muted: { type: 'array', items: { type: 'string' } },
          quiet: {
            type: 'object',
            properties: {
              enabled:  { type: 'boolean' },
              start:    { type: 'string' },
              end:      { type: 'string' },
              timezone: { type: 'string' },
            }
          }
        }
      }
    }
  }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const set: Record<string, unknown> = { updatedAt: new Date() };

    if (req.body.channels !== undefined) {
      if (req.body.channels.email     !== undefined) set['channels.email']     = req.body.channels.email;
      if (req.body.channels.websocket !== undefined) set['channels.websocket'] = req.body.channels.websocket;
    }
    if (req.body.muted !== undefined) set.muted = req.body.muted;
    if (req.body.quiet !== undefined) {
      if (req.body.quiet.enabled   !== undefined) set['quiet.enabled']   = req.body.quiet.enabled;
      if (req.body.quiet.start     !== undefined) set['quiet.start']     = req.body.quiet.start;
      if (req.body.quiet.end       !== undefined) set['quiet.end']       = req.body.quiet.end;
      if (req.body.quiet.timezone  !== undefined) set['quiet.timezone']  = req.body.quiet.timezone;
    }

    await db.collection(PREFS).updateOne(
      { userId },
      { $set: set, $setOnInsert: { createdAt: new Date(), ...DEFAULT_PREFS, userId } },
      { upsert: true }
    );

    return { updated: true };
  });
}
