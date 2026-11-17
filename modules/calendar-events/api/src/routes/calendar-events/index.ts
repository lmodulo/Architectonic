import type { FastifyInstance } from 'fastify';
import eventsRoutes       from './events.js';
import subscriptionsRoutes from './subscriptions.js';
import mediaRoutes        from './media.js';
import { startRemindersScheduler } from './scheduler.js';

export default async function calendarEventsPlugin(app: FastifyInstance) {
  // Indexes + scheduler on startup
  app.addHook('onReady', async () => {
    const db = app.mongo.db!;

    await db.collection('calendar_events').createIndex({ startDate: 1 });
    await db.collection('calendar_events').createIndex({ endDate: 1 });
    await db.collection('calendar_events').createIndex({ eventType: 1, startDate: 1 });
    await db.collection('calendar_events').createIndex({ status: 1, visibility: 1, startDate: 1 });
    await db.collection('calendar_events').createIndex({ createdBy: 1, createdAt: -1 });
    await db.collection('calendar_events').createIndex(
      { title: 'text', content: 'text', tags: 'text' },
      { weights: { title: 10, tags: 5, content: 1 } },
    );

    await db.collection('calendar_event_media').createIndex({ eventId: 1 });
    await db.collection('calendar_event_media').createIndex({ createdAt: 1 });

    await db.collection('event_subscriptions').createIndex({ userId: 1 }, { unique: true });
    await db.collection('event_subscriptions').createIndex({
      'notifyOn.reminder': 1, 'notifyOn.reminderDays': 1,
    });

    startRemindersScheduler(app);
  });

  // subscriptions and media must be registered before /:id to avoid routing collision
  app.register(subscriptionsRoutes, { prefix: '/subscriptions' });
  app.register(mediaRoutes, { prefix: '/media' });
  app.register(eventsRoutes);
}
