import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { dispatch } from './notifications/dispatch.js';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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

let _transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (_transporter) return _transporter;
  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const test = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: test.user, pass: test.pass },
    });
  }
  return _transporter;
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
    sendNewEventEmail(user.email, event, dateStr, label).catch(
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
    sendReminderEmail(user.email, event, dateStr, when).catch(
      err => app.log.error({ err }, '[calendar] reminder email failed'),
    );
  }
}

async function sendNewEventEmail(to: string, event: CalendarEventDoc, dateStr: string, label: string): Promise<void> {
  const t    = await getTransporter();
  const from = process.env.SMTP_FROM ?? 'noreply@example.com';
  await t.sendMail({
    from, to,
    subject: `New event: ${event.title}`,
    text:    `A new ${label} has been scheduled: "${event.title}" on ${dateStr}`,
    html:    `<p>A new event has been scheduled:</p><h2>${event.title}</h2><p>${dateStr}</p><p><a href="/calendar-events">View all events</a></p>`,
  });
}

async function sendReminderEmail(to: string, event: CalendarEventDoc, dateStr: string, when: string): Promise<void> {
  const t    = await getTransporter();
  const from = process.env.SMTP_FROM ?? 'noreply@example.com';
  await t.sendMail({
    from, to,
    subject: `Reminder: ${event.title} ${when}`,
    text:    `This is a reminder that "${event.title}" ${when}. Date: ${dateStr}`,
    html:    `<p>Reminder: <strong>${event.title}</strong> ${when}.</p><p>${dateStr}</p><p><a href="/calendar-events">View all events</a></p>`,
  });
}
