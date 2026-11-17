// Upcoming public events for the public website: data for the `events` page type and block this module adds to
// Content (registry entry $lib/config/cms-components/events.ts). Read through the public proxy
// (/api/calendar-events/public, which sends no cookie), so it shows what any visitor may see.
// This must never import Content's code: the entry matches Content's shape structurally, so this module still
// builds without Content. Without Content nothing reads these files.
//
// Calendar event dates are date-only (the Calendar's form uses <input type="date">), stored as UTC
// midnight. Dates are therefore formatted in UTC, which shows the date the editor picked and renders
// the same on the server and in the browser (no hydration mismatch). An event that isn't all day can
// also have wall-clock times ("HH:MM", no time zone): the start time on its first day and an optional
// end time on its last. They're shown as entered, never converted.
import { fmtTime, normalizeMedia, type EventMedia } from './calendarEvents';

export interface SiteEvent {
  id: string;
  title: string;
  /** plain text: the event's HTML description with tags removed (nothing is rendered as HTML) */
  summary: string;
  eventType: string;
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD */
  end: string;
  /** "HH:MM" (24-hour) on the start date, or '' (all day, or no time set) */
  startTime: string;
  /** "HH:MM" on the end date, or '' */
  endTime: string;
  location: string;
  /** photos and MP4 videos, shown as a gallery */
  media: EventMedia[];
}

export type EventsData = { events: SiteEvent[]; total: number } | { unavailable: true };

/** Event types the Calendar module ships with, for the block's filter. Other types still show. */
export const EVENT_TYPES = [
  { value: 'upcoming_event', label: 'Events' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'deadline', label: 'Deadlines' },
  { value: 'project_scope', label: 'Projects' },
];

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Plain text from a fragment of HTML: tags removed, common entities decoded, spaces collapsed. */
export function htmlToText(html: unknown): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** YYYY-MM-DD in UTC, or '' for a bad date. */
export function utcDay(v: unknown): string {
  if (typeof v !== 'string' && !(v instanceof Date)) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

const day = (s: string) => new Date(`${s}T00:00:00Z`);
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => day(s).toLocaleDateString('en-US', { ...o, timeZone: 'UTC' });

/**
 * "Friday, November 27, 2026" for one day; "December 14 – 16, 2026", "November 30 – December 2, 2026"
 * or "December 30, 2026 – January 2, 2027" for several.
 */
export function eventDates(e: Pick<SiteEvent, 'start' | 'end'>): string {
  if (!e.end || e.end <= e.start) return fmt(e.start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const [sy, sm] = e.start.split('-'), [ey, em] = e.end.split('-');
  const monthDay = (s: string) => fmt(s, { month: 'long', day: 'numeric' });
  if (sy === ey && sm === em) return `${monthDay(e.start)} – ${dayOf(e.end)}, ${ey}`;
  if (sy === ey) return `${monthDay(e.start)} – ${monthDay(e.end)}, ${ey}`;
  return `${monthDay(e.start)}, ${sy} – ${monthDay(e.end)}, ${ey}`;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const clock = (v: unknown): string => (typeof v === 'string' && TIME.test(v) ? v : '');

/**
 * The event's times, or '' when it has none: "10:00 AM – 2:00 PM" or "7:00 PM" on one day;
 * "Starts 10:00 AM, ends 3:00 PM" over several (the start time is on the first day, the end time on the last).
 */
export function eventTimes(e: Pick<SiteEvent, 'start' | 'end' | 'startTime' | 'endTime'>): string {
  const start = fmtTime(e.startTime);
  if (!start) return '';
  const end = fmtTime(e.endTime);
  if (!e.end || e.end <= e.start) return end ? `${start} – ${end}` : start;
  return end ? `Starts ${start}, ends ${end}` : `Starts ${start}`;
}

/** The value for a <time datetime>: the day, with the start time when there is one */
export const eventDatetime = (e: Pick<SiteEvent, 'start' | 'startTime'>) => (e.startTime ? `${e.start}T${e.startTime}` : e.start);

/** The short month and day number for an event's date badge. */
export const monthOf = (s: string) => fmt(s, { month: 'short' });
export const dayOf = (s: string) => String(day(s).getUTCDate());
/** "November 2026", for grouping a page of events by month. */
export const monthHeading = (s: string) => fmt(s, { month: 'long', year: 'numeric' });

/** The type as visitors see it ("Event", not the admin's "Upcoming Event" from calendarEvents.ts typeLabel) */
export function typeLabel(t: string): string {
  const known: Record<string, string> = { upcoming_event: 'Event', announcement: 'Announcement', deadline: 'Deadline', project_scope: 'Project' };
  return known[t] ?? t.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

export function eventLimit(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_LIMIT) : DEFAULT_LIMIT;
}

/** The registry `load`: fetch, keep the public fields as plain text, sort by start date, limit. */
export async function loadEvents(fetchFn: typeof fetch, props: Record<string, unknown>): Promise<EventsData> {
  const type = typeof props.eventType === 'string' && /^[a-z0-9_]{1,40}$/.test(props.eventType) ? props.eventType : '';
  const res = await fetchFn(`/api/calendar-events/public${type ? `?type=${encodeURIComponent(type)}` : ''}`);
  if (!res.ok) return { unavailable: true };
  const body: unknown = await res.json().catch(() => null);
  if (!Array.isArray(body)) return { unavailable: true };
  const events: SiteEvent[] = body
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map(e => {
      const start = utcDay(e.startDate);
      const end = utcDay(e.endDate);
      const startTime = e.allDay === true ? '' : clock(e.startTime);
      return {
        id: String(e.id ?? ''),
        title: String(e.title ?? '').slice(0, 200),
        summary: htmlToText(e.content).slice(0, 600),
        eventType: String(e.eventType ?? ''),
        start,
        end: end > start ? end : start,
        startTime,
        endTime: startTime ? clock(e.endTime) : '',
        location: typeof e.location === 'string' ? e.location.slice(0, 200) : '',
        media: normalizeMedia(e.media),
      };
    })
    .filter(e => e.title && e.start)
    .sort((a, b) => a.start.localeCompare(b.start) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title));
  return { events: events.slice(0, eventLimit(props.limit)), total: events.length };
}
