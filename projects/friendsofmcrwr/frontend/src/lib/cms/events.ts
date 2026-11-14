// Data for the `events` registry component: upcoming public events from the calendar-events module,
// read through that module's public proxy (/api/calendar-events/public, which sends no cookie).
// cms never imports calendar-events code; if the module isn't installed the proxy route doesn't exist,
// the fetch gets a 404, and the component says events are unavailable.
//
// Calendar events are date-only (the Calendar's form uses <input type="date">), stored as UTC
// midnight. Dates are therefore formatted in UTC, which shows the date the editor picked and renders
// the same on the server and in the browser (no hydration mismatch).

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
  location: string;
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

/** The short month and day number for an event's date badge. */
export const monthOf = (s: string) => fmt(s, { month: 'short' });
export const dayOf = (s: string) => String(day(s).getUTCDate());
/** "November 2026", for grouping a page of events by month. */
export const monthHeading = (s: string) => fmt(s, { month: 'long', year: 'numeric' });

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
      return {
        id: String(e.id ?? ''),
        title: String(e.title ?? '').slice(0, 200),
        summary: htmlToText(e.content).slice(0, 600),
        eventType: String(e.eventType ?? ''),
        start,
        end: end > start ? end : start,
        location: typeof e.location === 'string' ? e.location.slice(0, 200) : '',
      };
    })
    .filter(e => e.title && e.start)
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  return { events: events.slice(0, eventLimit(props.limit)), total: events.length };
}
