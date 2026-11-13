import type { FastifyInstance } from 'fastify';
import { notifyEventReminder, type CalendarEventDoc } from '../../lib/calendarNotify.js';
import { ObjectId } from '@fastify/mongodb';

const COL  = 'calendar_events';
const SUBS = 'event_subscriptions';

export function startRemindersScheduler(app: FastifyInstance): void {
  const intervalMs = Number(process.env.CALENDAR_REMINDER_INTERVAL_MS ?? 1_800_000);

  const timer = setInterval(
    () => runReminders(app, intervalMs).catch(
      err => app.log.error({ err }, '[calendar-scheduler] reminder tick failed'),
    ),
    intervalMs,
  );

  // Allow process to exit cleanly without waiting for this timer
  timer.unref();
  app.log.info(`[calendar-scheduler] started — interval ${intervalMs}ms`);
}

async function runReminders(app: FastifyInstance, intervalMs: number): Promise<void> {
  const db   = app.mongo.db!;
  const now  = new Date();

  const activeSubs = await db.collection(SUBS)
    .find({ 'notifyOn.reminder': true })
    .project({ userId: 1, notifyOn: 1, eventTypes: 1 })
    .toArray();

  if (activeSubs.length === 0) return;

  const dayValues = [...new Set(activeSubs.map((s: Record<string, unknown>) => {
    const n = s.notifyOn as { reminderDays?: number };
    return Math.max(0, Number(n?.reminderDays ?? 1));
  }))];

  const halfInterval = Math.floor(intervalMs / 2);

  for (const days of dayValues) {
    const target      = new Date(now.getTime() + days * 86_400_000);
    const windowStart = new Date(target.getTime() - halfInterval);
    const windowEnd   = new Date(target.getTime() + halfInterval);

    const events = await db.collection(COL).find({
      status:    'active',
      startDate: { $gte: windowStart, $lte: windowEnd },
    }).toArray();

    for (const event of events) {
      const matching = activeSubs.filter((s: Record<string, unknown>) => {
        const no    = s.notifyOn as { reminderDays?: number };
        const types = (s.eventTypes as string[]) ?? [];
        return (
          Math.max(0, Number(no?.reminderDays ?? 1)) === days &&
          (types.length === 0 || types.includes(event.eventType as string))
        );
      });

      if (matching.length === 0) continue;

      const recipientIds = matching.map((s: Record<string, unknown>) => s.userId as ObjectId);
      await notifyEventReminder(app, event as unknown as CalendarEventDoc, recipientIds, days);
    }
  }
}
