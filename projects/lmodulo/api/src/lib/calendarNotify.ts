import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { dispatch } from './notifications/dispatch.js';
import { sendCalendarNewEventEmail, sendCalendarReminderEmail } from './email.js';

export interface CalendarEventDoc {
  _id: ObjectId;
  title: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  singleDay: boolean;
  visibility: string;
  ownerId: ObjectId;
  sharedWith: ObjectId[];
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export async function notifyNewEvent(
  app: FastifyInstance,
  event: CalendarEventDoc,
  recipientIds: ObjectId[],
): Promise<void> {
  if (recipientIds.length === 0) return;

  const db      = app.mongo.db!;
  const dateStr = fmtDate(event.startDate);
  const label   = event.eventType.replace(/_/g, ' ');

  await dispatch(app, {
    userId: recipientIds,
    type:   'calendar_event.new',
    title:  `New event: ${event.title}`,
    body:   `${label} on ${dateStr}`,
    link:   '/calendar-events',
    source: { collection: 'calendar_events', documentId: event._id },
    groupKey: `calendar_event.new:${event._id.toString()}`,
  });

  // Email: per-subscription opt-in only
  const subsWithEmail = await db.collection('event_subscriptions')
    .find({ userId: { $in: recipientIds }, 'channels.email': true })
    .toArray();

  for (const sub of subsWithEmail) {
    const prefs = await db.collection('notification_preferences').findOne({ userId: sub.userId });
    if (prefs?.muted?.includes('calendar_event.new')) continue;
    const user = await db.collection('users').findOne({ _id: sub.userId });
    if (!user?.email) continue;
    const appUrl = process.env.APP_URL ?? '';
    sendCalendarNewEventEmail(user.email, { title: event.title, label, dateStr, url: `${appUrl}/calendar-events` }).catch(
      err => app.log.error({ err }, '[calendar] new-event email failed'),
    );
  }
}

export async function notifyEventReminder(
  app: FastifyInstance,
  event: CalendarEventDoc,
  recipientIds: ObjectId[],
  reminderDays: number,
): Promise<void> {
  if (recipientIds.length === 0) return;

  const db      = app.mongo.db!;
  const dateStr = fmtDate(event.startDate);
  const when    = reminderDays === 0 ? 'is today' : `in ${reminderDays} day${reminderDays !== 1 ? 's' : ''}`;

  for (const userId of recipientIds) {
    await dispatch(app, {
      userId,
      type:  'calendar_event.reminder',
      title: `Reminder: ${event.title} ${when}`,
      body:  dateStr,
      link:  '/calendar-events',
      source: { collection: 'calendar_events', documentId: event._id },
      groupKey: `calendar_event.reminder:${event._id.toString()}:${userId.toString()}`,
    });

    const sub = await db.collection('event_subscriptions').findOne({ userId, 'channels.email': true });
    if (!sub) continue;
    const prefs = await db.collection('notification_preferences').findOne({ userId });
    if (prefs?.muted?.includes('calendar_event.reminder')) continue;
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user?.email) continue;
    const appUrl = process.env.APP_URL ?? '';
    sendCalendarReminderEmail(user.email, { title: event.title, dateStr, when, url: `${appUrl}/calendar-events` }).catch(
      err => app.log.error({ err }, '[calendar] reminder email failed'),
    );
  }
}

