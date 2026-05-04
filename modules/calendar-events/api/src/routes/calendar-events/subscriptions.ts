import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

const SUBS = 'event_subscriptions';

const DEFAULT_SUB = {
  subscribed:  false,
  eventTypes:  [] as string[],
  notifyOn:    { newEvent: true, reminder: false, reminderDays: 1 },
  channels:    { inApp: true, email: false },
};

export default async function subscriptionsRoutes(app: FastifyInstance) {

  // GET /calendar-events/subscriptions/me
  app.get('/me', { preHandler: app.requireAuth }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const sub    = await db.collection(SUBS).findOne({ userId });
    if (!sub) return DEFAULT_SUB;
    const { _id, userId: _u, ...rest } = sub;
    return { subscribed: true, id: _id.toString(), ...rest };
  });

  // PUT /calendar-events/subscriptions/me — upsert full subscription
  app.put('/me', { preHandler: app.requireAuth }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    const { eventTypes = [], notifyOn = {}, channels = {} } =
      req.body as {
        eventTypes?: string[];
        notifyOn?: { newEvent?: boolean; reminder?: boolean; reminderDays?: number };
        channels?: { inApp?: boolean; email?: boolean };
      };

    const now = new Date();
    await db.collection(SUBS).updateOne(
      { userId },
      {
        $set: {
          eventTypes:              Array.isArray(eventTypes) ? eventTypes.map(String) : [],
          'notifyOn.newEvent':     Boolean(notifyOn.newEvent ?? true),
          'notifyOn.reminder':     Boolean(notifyOn.reminder ?? false),
          'notifyOn.reminderDays': Math.max(0, Number(notifyOn.reminderDays ?? 1)),
          'channels.inApp':        true,
          'channels.email':        Boolean(channels.email ?? false),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return { ok: true };
  });

  // DELETE /calendar-events/subscriptions/me — unsubscribe
  app.delete('/me', { preHandler: app.requireAuth }, async (req, reply) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);
    await db.collection(SUBS).deleteOne({ userId });
    reply.status(204);
  });
}
