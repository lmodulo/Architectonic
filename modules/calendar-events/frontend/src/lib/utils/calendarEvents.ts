/** A photo or MP4 video on an event (uploaded in the event form; see the API's routes/calendar-events/media.ts) */
export type EventMedia = {
  id: string;
  kind: 'image' | 'video';
  /** /uploads/… (or the storage bucket's https URL) */
  url: string;
  /** the uploader's file name; admin views only (the public list leaves it out) */
  name?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  content: string;
  eventType: string;
  startDate: string; // ISO string or YYYY-MM-DD
  endDate: string;
  singleDay: boolean;
  allDay: boolean;
  /** "HH:MM" (24-hour) on the start date, or '' (all day, or no time set). Wall-clock at the event, no time zone. */
  startTime: string;
  /** "HH:MM" on the end date, or '' (optional: an event can just have a start time) */
  endTime: string;
  location: string;
  tags: string[];
  /** photos and videos, in the editor's order */
  media: EventMedia[];
  status?: string;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Date string normalised to YYYY-MM-DD
export function toDateStr(val: unknown): string {
  if (!val) return '';
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function fmtDateRange(ev: { startDate: string; endDate: string; singleDay: boolean }): string {
  const start = new Date(ev.startDate + 'T00:00:00');
  if (ev.singleDay) {
    return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  const end = new Date(ev.endDate + 'T00:00:00');
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    // "Wednesday, November 11 – 15, 2026". Intl can't format a day and year without the month (it gave
    // "2026 (day: 15)"), so the end is put together by hand.
    return `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

export function fmtShortRange(ev: { startDate: string; endDate: string; singleDay: boolean }): string {
  const start = new Date(ev.startDate + 'T00:00:00');
  if (ev.singleDay) {
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const end = new Date(ev.endDate + 'T00:00:00');
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "9:30 AM" from "09:30" */
export function fmtTime(t: string): string {
  if (!TIME.test(t)) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * The event's times, or '' when it's all day or has none: "10:00 AM – 2:00 PM" or "7:00 PM" for one day;
 * "Starts 10:00 AM, ends 3:00 PM" over several (the start time is on the first day, the end time on the last).
 */
export function fmtTimes(ev: Pick<CalendarEvent, 'allDay' | 'startTime' | 'endTime' | 'startDate' | 'endDate' | 'singleDay'>): string {
  const start = ev.allDay ? '' : fmtTime(ev.startTime);
  if (!start) return '';
  const end = fmtTime(ev.endTime);
  if (ev.singleDay || ev.endDate <= ev.startDate) return end ? `${start} – ${end}` : start;
  return end ? `Starts ${start}, ends ${end}` : `Starts ${start}`;
}

/** Sort key within a day: all-day and untimed events first, then by start time */
const timeKey = (e: CalendarEvent) => (e.allDay ? '' : e.startTime);

export function eventsForDay(events: CalendarEvent[], year: number, month: number, day: number): CalendarEvent[] {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return events
    .filter(e => e.startDate <= dateStr && dateStr <= e.endDate)
    .sort((a, b) => timeKey(a).localeCompare(timeKey(b)));
}

/** A calendar pill's tooltip: the title, and the times when there are any */
export function eventTooltip(ev: CalendarEvent): string {
  const times = fmtTimes(ev);
  return times ? `${ev.title} · ${times}` : ev.title;
}

type MonthGroup = { month: string; items: CalendarEvent[] };

export function groupByMonth(events: CalendarEvent[]): MonthGroup[] {
  return events.reduce<MonthGroup[]>((acc, ev) => {
    const month = new Date(ev.startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const existing = acc.find(g => g.month === month);
    if (existing) existing.items.push(ev);
    else acc.push({ month, items: [ev] });
    return acc;
  }, []);
}

// Known event types → DaisyUI badge classes
const TYPE_PRESETS: Record<string, string> = {
  upcoming_event: 'badge-primary badge-outline',
  announcement:   'badge-warning badge-outline',
  deadline:       'badge-error badge-outline',
  project_scope:  'badge-secondary badge-outline',
};

// Pill background for calendar grid
const TYPE_PILL_CLASSES: Record<string, string> = {
  upcoming_event: 'bg-primary hover:bg-primary/80',
  announcement:   'bg-warning hover:bg-warning/80',
  deadline:       'bg-error hover:bg-error/80',
  project_scope:  'bg-secondary hover:bg-secondary/80',
};

export function typePreset(eventType: string): string {
  return TYPE_PRESETS[eventType] ?? 'badge-ghost';
}

export function typePillClass(eventType: string): string {
  return TYPE_PILL_CLASSES[eventType] ?? 'bg-neutral hover:bg-neutral/80';
}

export function typeLabel(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** An event's photos and videos from the API, keeping only well-formed entries with a URL we serve */
export function normalizeMedia(v: unknown): EventMedia[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((m): EventMedia[] => {
    if (typeof m !== 'object' || m === null) return [];
    const { id, kind, url, name } = m as Record<string, unknown>;
    if (typeof id !== 'string' || (kind !== 'image' && kind !== 'video')) return [];
    if (typeof url !== 'string' || !/^(\/uploads\/|https:\/\/)/.test(url)) return [];
    return [{ id, kind, url, ...(typeof name === 'string' ? { name } : {}) }];
  });
}

/** "3 photos · 1 video", or '' */
export function mediaCount(media: EventMedia[]): string {
  const photos = media.filter(m => m.kind === 'image').length;
  const videos = media.length - photos;
  return [
    photos ? `${photos} photo${photos === 1 ? '' : 's'}` : '',
    videos ? `${videos} video${videos === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(' · ');
}

export function normalizeEvent(e: Record<string, unknown>): CalendarEvent {
  return {
    id:         String(e.id ?? ''),
    title:      String(e.title ?? ''),
    content:    String(e.content ?? ''),
    eventType:  String(e.eventType ?? 'upcoming_event'),
    startDate:  toDateStr(e.startDate),
    endDate:    toDateStr(e.endDate),
    singleDay:  Boolean(e.singleDay),
    allDay:     Boolean(e.allDay),
    startTime:  !e.allDay && typeof e.startTime === 'string' && TIME.test(e.startTime) ? e.startTime : '',
    endTime:    !e.allDay && typeof e.startTime === 'string' && typeof e.endTime === 'string' && TIME.test(e.endTime) ? e.endTime : '',
    location:   String(e.location ?? ''),
    tags:       Array.isArray(e.tags) ? e.tags.map(String) : [],
    media:      normalizeMedia(e.media),
    status:     e.status ? String(e.status) : undefined,
    visibility: e.visibility ? String(e.visibility) : undefined,
    createdAt:  e.createdAt ? String(e.createdAt) : undefined,
    updatedAt:  e.updatedAt ? String(e.updatedAt) : undefined,
  };
}
