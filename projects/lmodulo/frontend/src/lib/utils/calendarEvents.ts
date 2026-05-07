export type CalendarEvent = {
  id: string;
  title: string;
  content: string;
  eventType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
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

export function fmtDateRange(ev: { startDate: string; endDate: string; singleDay: boolean }): string {
  const start = new Date(ev.startDate + 'T00:00:00');
  if (ev.singleDay) {
    return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  const end = new Date(ev.endDate + 'T00:00:00');
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
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
  return {
    id:           String(e.id ?? ''),
    title:        String(e.title ?? ''),
    content:      String(e.content ?? ''),
    eventType:    String(e.eventType ?? 'upcoming_event'),
    startDate:    toDateStr(e.startDate),
    endDate:      toDateStr(e.endDate),
    singleDay:    Boolean(e.singleDay),
    allDay:       Boolean(e.allDay),
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
