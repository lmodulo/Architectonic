export type CalendarEvent = {
  id: string;
  title: string;
  content: string;
  eventType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  startTime: string | null; // HH:MM (UTC) — null for all-day or unset
  endTime: string | null;
  singleDay: boolean;
  allDay: boolean;
  location: string;
  tags: string[];
  status?: string;
  visibility?: string;
  ownerId?: string;            // user who owns/organised this meeting
  ownerName?: string | null;   // resolved display name of owner
  sharedWith?: string[];       // user IDs this event is explicitly shared with
  createdBy?: string;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// Date string normalised to YYYY-MM-DD
export function toDateStr(val: unknown): string {
  if (!val) return '';
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// Time string from ISO datetime, in UTC — returns null for midnight (= unset)
export function toTimeStr(val: unknown): string | null {
  if (!val) return null;
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return null;
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  if (h === 0 && m === 0) return null;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function fmtHhmm(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour   = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function fmtTimeRange(start: string, end: string | null | undefined): string {
  if (!end || end === start) return fmtHhmm(start);
  return `${fmtHhmm(start)} – ${fmtHhmm(end)}`;
}

type DateRangeEv = { startDate: string; endDate: string; singleDay: boolean; allDay?: boolean; startTime?: string | null; endTime?: string | null };

export function fmtDateRange(ev: DateRangeEv): string {
  const start = new Date(ev.startDate + 'T00:00:00');
  let dateStr: string;
  if (ev.singleDay) {
    dateStr = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } else {
    const end = new Date(ev.endDate + 'T00:00:00');
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      dateStr = `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    } else {
      dateStr = `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
  }
  if (!ev.allDay && ev.startTime) return `${dateStr} · ${fmtTimeRange(ev.startTime, ev.endTime)}`;
  return dateStr;
}

export function fmtShortRange(ev: DateRangeEv): string {
  const start = new Date(ev.startDate + 'T00:00:00');
  let dateStr: string;
  if (ev.singleDay) {
    dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    const end = new Date(ev.endDate + 'T00:00:00');
    dateStr = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (!ev.allDay && ev.startTime) return `${dateStr} · ${fmtTimeRange(ev.startTime, ev.endTime)}`;
  return dateStr;
}

export function eventsForDay(events: CalendarEvent[], year: number, month: number, day: number): CalendarEvent[] {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return events.filter(e => e.startDate <= dateStr && dateStr <= e.endDate);
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

const TYPE_PRESETS: Record<string, string> = {
  upcoming_event: 'badge-primary badge-soft',
  announcement:   'badge-warning badge-soft',
  deadline:       'badge-error badge-soft',
  project_scope:  'badge-secondary badge-soft',
};

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

export function normalizeEvent(e: Record<string, unknown>): CalendarEvent {
  const allDay = Boolean(e.allDay);
  return {
    id:           String(e.id ?? ''),
    title:        String(e.title ?? ''),
    content:      String(e.content ?? ''),
    eventType:    String(e.eventType ?? 'upcoming_event'),
    startDate:    toDateStr(e.startDate),
    endDate:      toDateStr(e.endDate),
    startTime:    allDay ? null : toTimeStr(e.startDate),
    endTime:      allDay ? null : toTimeStr(e.endDate),
    singleDay:    Boolean(e.singleDay),
    allDay,
    location:     String(e.location ?? ''),
    tags:         Array.isArray(e.tags) ? e.tags.map(String) : [],
    status:       e.status     ? String(e.status)     : undefined,
    visibility:   e.visibility ? String(e.visibility) : undefined,
    ownerId:      e.ownerId    ? String(e.ownerId)    : undefined,
    ownerName:    e.ownerName  != null ? String(e.ownerName)  : null,
    sharedWith:   Array.isArray(e.sharedWith) ? e.sharedWith.map(String) : [],
    createdBy:    e.createdBy  ? String(e.createdBy)  : undefined,
    createdByName: e.createdByName != null ? String(e.createdByName) : null,
    createdAt:    e.createdAt ? String(e.createdAt) : undefined,
    updatedAt:    e.updatedAt ? String(e.updatedAt) : undefined,
  };
}
