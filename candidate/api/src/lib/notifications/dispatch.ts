import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { insertNew, upsertGrouped } from './grouping.js';

export interface NotificationPayload {
  userId: ObjectId | ObjectId[];
  type: string;
  title: string;
  body?: string;
  link?: string;
  source?: { collection: string; documentId: ObjectId };
  groupKey?: string;
}

export async function dispatch(app: FastifyInstance, payload: NotificationPayload): Promise<void> {
  const db = app.mongo.db!;
  const recipients = Array.isArray(payload.userId) ? payload.userId : [payload.userId];
  const now = new Date();

  for (const userId of recipients) {
    // Check preferences — skip muted types
    const prefs = await db.collection('notification_preferences').findOne({ userId });
    if (prefs?.muted?.includes(payload.type)) continue;

    // Quiet hours check
    if (prefs?.quiet?.enabled) {
      const tz = prefs.quiet.timezone ?? 'UTC';
      const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const hhmm = nowInTz.getHours() * 60 + nowInTz.getMinutes();
      const [startH, startM] = (prefs.quiet.start as string).split(':').map(Number);
      const [endH, endM]     = (prefs.quiet.end   as string).split(':').map(Number);
      const start = startH * 60 + startM;
      const end   = endH   * 60 + endM;
      const inQuiet = start <= end ? hhmm >= start && hhmm < end : hhmm >= start || hhmm < end;
      if (inQuiet) continue;
    }

    // Insert or upsert grouped
    const notificationId = payload.groupKey
      ? await upsertGrouped(db, userId, payload, now)
      : await insertNew(db, userId, payload, now);

    // Push via WebSocket if user has active connections
    const sockets = app.wsConnections.get(userId.toString());
    if (sockets?.size) {
      const notifMsg = JSON.stringify({
        type: 'notification',
        payload: {
          _id:       notificationId.toString(),
          type:      payload.type,
          title:     payload.title,
          body:      payload.body  ?? null,
          link:      payload.link  ?? null,
          createdAt: now.toISOString(),
          read:      false,
        },
      });

      for (const socket of sockets) {
        try { socket.send(notifMsg); } catch { /* ignore closed */ }
      }

      await db.collection('notifications').updateOne(
        { _id: notificationId },
        { $set: { 'delivered.websocket': true } }
      );

      const unreadCount = await db.collection('notifications').countDocuments({ userId, read: false });
      const countMsg = JSON.stringify({ type: 'count-update', unreadCount });
      for (const socket of sockets) {
        try { socket.send(countMsg); } catch { }
      }
    }
  }
}
