// Demo data — Calendar events (announcements, deadlines, upcoming events, project scopes).
// Loaded only when SEED_DEMO_DATA=true (see lib/demo.ts); inserts only into an empty collection.
import type { DemoContext } from '../lib/demo.js';

export default async function seed({ db, now, users }: DemoContext): Promise<void> {
  const events = db.collection('calendar_events');
  if (await events.countDocuments()) return;

  // Day offset from now at a given hour
  const at = (days: number, hour = 9): Date => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + days);
    dt.setHours(hour, 0, 0, 0);
    return dt;
  };
  const by = users.owner ?? users.admin ?? null;

  const event = (
    title: string, eventType: string, startDays: number, endDays: number, opts: {
      content?: string; hour?: number; endHour?: number; allDay?: boolean; location?: string;
      tags?: string[]; status?: string; visibility?: string;
    } = {},
  ) => ({
    title,
    content:    opts.content ?? '',
    eventType,
    startDate:  at(startDays, opts.hour ?? 9),
    endDate:    at(endDays, opts.endHour ?? (opts.hour ?? 9) + 1),
    singleDay:  startDays === endDays,
    allDay:     opts.allDay ?? false,
    location:   opts.location ?? '',
    tags:       opts.tags ?? [],
    status:     opts.status ?? 'active',
    visibility: opts.visibility ?? 'public',
    createdBy:  by,
    updatedBy:  null,
    createdAt:  at(Math.min(startDays, 0) - 7),
    updatedAt:  at(Math.min(startDays, 0) - 7),
  });

  await events.insertMany([
    event('Quarterly All-Hands', 'upcoming_event', 12, 12, {
      hour: 10, endHour: 12, location: 'Main Hall + Zoom', tags: ['company', 'quarterly'],
      content: '<p>Roadmap review, team wins, and open Q&amp;A with leadership.</p>',
    }),
    event('Customer Advisory Board', 'upcoming_event', 26, 26, {
      hour: 13, endHour: 16, location: 'Boardroom', tags: ['customers'], visibility: 'authenticated',
      content: '<p>Half-day session with our top accounts to review the next release.</p>',
    }),
    event('Office closed — public holiday', 'announcement', 18, 18, {
      allDay: true, tags: ['holiday'],
      content: '<p>The office and support desk are closed. Emergency on-call only.</p>',
    }),
    event('New expense policy in effect', 'announcement', -3, -3, {
      allDay: true, tags: ['policy', 'finance'], visibility: 'authenticated',
      content: '<p>Receipts are now required for all expenses over $25. See the Vault for details.</p>',
    }),
    event('Q3 tax filing deadline', 'deadline', 9, 9, {
      allDay: true, tags: ['finance'], visibility: 'private',
    }),
    event('Benefits enrollment closes', 'deadline', 21, 21, {
      hour: 17, endHour: 17, tags: ['hr'], visibility: 'authenticated',
    }),
    event('Website redesign — discovery phase', 'project_scope', -10, 20, {
      allDay: true, tags: ['marketing', 'web'], visibility: 'authenticated',
      content: '<p>Stakeholder interviews, analytics review, and content audit.</p>',
    }),
    event('Warehouse inventory count', 'project_scope', 30, 32, {
      allDay: true, location: 'Warehouse B', tags: ['operations'],
    }),
    event('Team offsite (postponed)', 'upcoming_event', 40, 41, {
      allDay: true, location: 'Lakeside Lodge', tags: ['team'], status: 'cancelled',
    }),
    event('Product launch webinar', 'upcoming_event', 45, 45, {
      hour: 11, endHour: 12, location: 'Online', tags: ['launch', 'marketing'], status: 'draft',
    }),
  ]);
}
