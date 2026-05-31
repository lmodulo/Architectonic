import { describe, it, expect } from 'vitest';
import {
  toDateStr, toTimeStr,
  fmtDateRange, fmtShortRange,
  eventsForDay, groupByMonth,
  typePreset, typePillClass, typeLabel,
  normalizeEvent,
  ds, fmtShort, visIcon,
  type CalendarEvent,
} from '../../src/lib/utils/calendarEvents.js';

// ── Shared fixture helpers ────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id:        'e1',
    title:     'Test Event',
    content:   '',
    eventType: 'upcoming_event',
    startDate: '2025-06-15',
    endDate:   '2025-06-15',
    startTime: null,
    endTime:   null,
    singleDay: true,
    allDay:    true,
    location:  '',
    tags:      [],
    ...overrides,
  };
}

// ── toDateStr ─────────────────────────────────────────────────────────────────

describe('toDateStr', () => {
  it('returns YYYY-MM-DD from an ISO datetime', () => {
    expect(toDateStr('2025-06-15T14:30:00Z')).toBe('2025-06-15');
  });

  it('returns YYYY-MM-DD from a plain date string', () => {
    expect(toDateStr('2025-01-01')).toBe('2025-01-01');
  });

  it('returns empty string for null', () => {
    expect(toDateStr(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toDateStr(undefined)).toBe('');
  });

  it('returns empty string for an empty string', () => {
    expect(toDateStr('')).toBe('');
  });

  it('returns empty string for an invalid date string', () => {
    expect(toDateStr('not-a-date')).toBe('');
  });
});

// ── toTimeStr ─────────────────────────────────────────────────────────────────

describe('toTimeStr', () => {
  it('returns null for a UTC midnight timestamp (treated as unset)', () => {
    expect(toTimeStr('2025-06-15T00:00:00Z')).toBeNull();
  });

  it('returns HH:MM for a morning time', () => {
    expect(toTimeStr('2025-06-15T09:30:00Z')).toBe('09:30');
  });

  it('returns HH:MM for an afternoon time', () => {
    expect(toTimeStr('2025-06-15T14:00:00Z')).toBe('14:00');
  });

  it('returns HH:MM for late evening', () => {
    expect(toTimeStr('2025-06-15T23:59:00Z')).toBe('23:59');
  });

  it('returns null for null input', () => {
    expect(toTimeStr(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toTimeStr('')).toBeNull();
  });

  it('returns null for an invalid date string', () => {
    expect(toTimeStr('bad')).toBeNull();
  });
});

// ── fmtDateRange ──────────────────────────────────────────────────────────────

describe('fmtDateRange', () => {
  it('formats a single-day all-day event with weekday and full date', () => {
    const result = fmtDateRange({ startDate: '2025-06-15', endDate: '2025-06-15', singleDay: true, allDay: true });
    expect(result).toContain('June');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('includes time when startTime is set on a single-day event', () => {
    const result = fmtDateRange({
      startDate: '2025-06-15', endDate: '2025-06-15',
      singleDay: true, allDay: false,
      startTime: '09:00', endTime: '10:00',
    });
    expect(result).toContain('9 AM');
    expect(result).toContain('10 AM');
    expect(result).toContain('·');
  });

  it('includes only start time when end time equals start time', () => {
    const result = fmtDateRange({
      startDate: '2025-06-15', endDate: '2025-06-15',
      singleDay: true, allDay: false,
      startTime: '14:00', endTime: '14:00',
    });
    expect(result).toContain('2 PM');
  });

  it('formats minutes when they are non-zero', () => {
    const result = fmtDateRange({
      startDate: '2025-06-15', endDate: '2025-06-15',
      singleDay: true, allDay: false,
      startTime: '09:30', endTime: null,
    });
    expect(result).toContain('9:30 AM');
  });

  it('formats a multi-day event in the same month', () => {
    const result = fmtDateRange({ startDate: '2025-06-15', endDate: '2025-06-20', singleDay: false, allDay: true });
    expect(result).toContain('June');
    expect(result).toContain('15');
    expect(result).toContain('20');
    expect(result).toContain('2025');
  });

  it('formats a multi-day event spanning two months', () => {
    const result = fmtDateRange({ startDate: '2025-06-28', endDate: '2025-07-05', singleDay: false, allDay: true });
    expect(result).toContain('June');
    expect(result).toContain('July');
  });

  it('does not include time for an all-day multi-day event even when times are present', () => {
    const result = fmtDateRange({
      startDate: '2025-06-15', endDate: '2025-06-16',
      singleDay: false, allDay: true,
      startTime: '09:00', endTime: '10:00',
    });
    expect(result).not.toContain('AM');
    expect(result).not.toContain('PM');
  });
});

// ── fmtShortRange ─────────────────────────────────────────────────────────────

describe('fmtShortRange', () => {
  it('formats a single-day event as short month + day + year', () => {
    const result = fmtShortRange({ startDate: '2025-06-15', endDate: '2025-06-15', singleDay: true, allDay: true });
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('formats a multi-day range with short month on both ends', () => {
    const result = fmtShortRange({ startDate: '2025-06-15', endDate: '2025-06-20', singleDay: false, allDay: true });
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('20');
  });

  it('appends time when startTime is set', () => {
    const result = fmtShortRange({
      startDate: '2025-06-15', endDate: '2025-06-15',
      singleDay: true, allDay: false,
      startTime: '14:30', endTime: null,
    });
    expect(result).toContain('2:30 PM');
    expect(result).toContain('·');
  });
});

// ── eventsForDay ──────────────────────────────────────────────────────────────

describe('eventsForDay', () => {
  const events = [
    makeEvent({ id: '1', startDate: '2025-06-15', endDate: '2025-06-15' }),
    makeEvent({ id: '2', startDate: '2025-06-10', endDate: '2025-06-20' }), // spans the day
    makeEvent({ id: '3', startDate: '2025-06-01', endDate: '2025-06-14' }), // ends before
    makeEvent({ id: '4', startDate: '2025-06-16', endDate: '2025-06-16' }), // starts after
  ];

  it('returns events whose range includes the requested day', () => {
    const result = eventsForDay(events, 2025, 5, 15); // month is 0-indexed: 5 = June
    expect(result.map(e => e.id)).toEqual(['1', '2']);
  });

  it('excludes events ending before the day', () => {
    const result = eventsForDay(events, 2025, 5, 15);
    expect(result.find(e => e.id === '3')).toBeUndefined();
  });

  it('excludes events starting after the day', () => {
    const result = eventsForDay(events, 2025, 5, 15);
    expect(result.find(e => e.id === '4')).toBeUndefined();
  });

  it('returns an empty array when no events match', () => {
    // Day 21: e1=[15,15], e2=[10,20], e3=[01,14], e4=[16,16] — none cover the 21st
    expect(eventsForDay(events, 2025, 5, 21)).toEqual([]);
  });

  it('returns an empty array for empty event list', () => {
    expect(eventsForDay([], 2025, 5, 15)).toEqual([]);
  });
});

// ── groupByMonth ──────────────────────────────────────────────────────────────

describe('groupByMonth', () => {
  it('returns an empty array for empty input', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('groups events in the same month into one group', () => {
    const events = [
      makeEvent({ id: '1', startDate: '2025-06-15' }),
      makeEvent({ id: '2', startDate: '2025-06-20' }),
    ];
    const groups = groupByMonth(events);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(2);
  });

  it('creates a separate group for each distinct month', () => {
    const events = [
      makeEvent({ id: '1', startDate: '2025-06-15' }),
      makeEvent({ id: '2', startDate: '2025-07-15' }),
      makeEvent({ id: '3', startDate: '2025-08-15' }),
    ];
    const groups = groupByMonth(events);
    expect(groups).toHaveLength(3);
  });

  it('preserves the order events are encountered', () => {
    const events = [
      makeEvent({ id: '1', startDate: '2025-06-15' }),
      makeEvent({ id: '2', startDate: '2025-07-15' }),
    ];
    const groups = groupByMonth(events);
    expect(groups[0].month).toContain('June');
    expect(groups[1].month).toContain('July');
  });

  it('places all same-month events under the same group key', () => {
    const events = [
      makeEvent({ id: '1', startDate: '2025-06-10' }),
      makeEvent({ id: '2', startDate: '2025-07-15' }),
      makeEvent({ id: '3', startDate: '2025-06-25' }),
    ];
    const groups = groupByMonth(events);
    // June group should hold both June events
    const june = groups.find(g => g.month.includes('June'));
    expect(june?.items.map(e => e.id)).toContain('1');
    expect(june?.items.map(e => e.id)).toContain('3');
  });
});

// ── typePreset ────────────────────────────────────────────────────────────────

describe('typePreset', () => {
  it('returns the correct badge class for known types', () => {
    expect(typePreset('upcoming_event')).toBe('badge-primary badge-outline');
    expect(typePreset('announcement')).toBe('badge-warning badge-outline');
    expect(typePreset('deadline')).toBe('badge-error badge-outline');
    expect(typePreset('project_scope')).toBe('badge-secondary badge-outline');
  });

  it('returns badge-ghost for unknown types', () => {
    expect(typePreset('custom_type')).toBe('badge-ghost');
    expect(typePreset('')).toBe('badge-ghost');
  });
});

// ── typePillClass ─────────────────────────────────────────────────────────────

describe('typePillClass', () => {
  it('returns the correct pill class for known types', () => {
    expect(typePillClass('upcoming_event')).toBe('bg-primary hover:bg-primary/80');
    expect(typePillClass('announcement')).toBe('bg-warning hover:bg-warning/80');
    expect(typePillClass('deadline')).toBe('bg-error hover:bg-error/80');
    expect(typePillClass('project_scope')).toBe('bg-secondary hover:bg-secondary/80');
  });

  it('returns the neutral fallback for unknown types', () => {
    expect(typePillClass('custom')).toBe('bg-neutral hover:bg-neutral/80');
    expect(typePillClass('')).toBe('bg-neutral hover:bg-neutral/80');
  });
});

// ── typeLabel ─────────────────────────────────────────────────────────────────

describe('typeLabel', () => {
  it('converts underscores to spaces and title-cases each word', () => {
    expect(typeLabel('upcoming_event')).toBe('Upcoming Event');
    expect(typeLabel('project_scope')).toBe('Project Scope');
    expect(typeLabel('announcement')).toBe('Announcement');
    expect(typeLabel('deadline')).toBe('Deadline');
  });

  it('handles a single word without underscores', () => {
    expect(typeLabel('webinar')).toBe('Webinar');
  });

  it('handles an empty string without throwing', () => {
    expect(typeLabel('')).toBe('');
  });
});

// ── normalizeEvent ────────────────────────────────────────────────────────────

describe('normalizeEvent', () => {
  it('maps id, title, content, eventType', () => {
    const ev = normalizeEvent({ id: 'abc', title: 'Launch', content: 'Details', eventType: 'deadline' });
    expect(ev.id).toBe('abc');
    expect(ev.title).toBe('Launch');
    expect(ev.content).toBe('Details');
    expect(ev.eventType).toBe('deadline');
  });

  it('defaults eventType to "upcoming_event" when absent', () => {
    expect(normalizeEvent({}).eventType).toBe('upcoming_event');
  });

  it('extracts startDate and endDate as YYYY-MM-DD strings', () => {
    const ev = normalizeEvent({
      startDate: '2025-06-15T09:00:00Z',
      endDate:   '2025-06-15T10:00:00Z',
    });
    expect(ev.startDate).toBe('2025-06-15');
    expect(ev.endDate).toBe('2025-06-15');
  });

  it('sets startTime/endTime to null when allDay is true', () => {
    const ev = normalizeEvent({
      allDay:    true,
      startDate: '2025-06-15T09:00:00Z',
      endDate:   '2025-06-15T10:00:00Z',
    });
    expect(ev.startTime).toBeNull();
    expect(ev.endTime).toBeNull();
  });

  it('extracts startTime/endTime from the ISO timestamp when allDay is false', () => {
    const ev = normalizeEvent({
      allDay:    false,
      startDate: '2025-06-15T09:30:00Z',
      endDate:   '2025-06-15T10:00:00Z',
    });
    expect(ev.startTime).toBe('09:30');
    expect(ev.endTime).toBe('10:00');
  });

  it('defaults tags to [] when not an array', () => {
    expect(normalizeEvent({ tags: null }).tags).toEqual([]);
    expect(normalizeEvent({}).tags).toEqual([]);
  });

  it('converts tags array to strings', () => {
    expect(normalizeEvent({ tags: ['a', 'b'] }).tags).toEqual(['a', 'b']);
  });

  it('defaults sharedWith to [] when not an array', () => {
    expect(normalizeEvent({}).sharedWith).toEqual([]);
  });

  it('leaves optional fields as undefined when absent', () => {
    const ev = normalizeEvent({});
    expect(ev.status).toBeUndefined();
    expect(ev.visibility).toBeUndefined();
    expect(ev.ownerId).toBeUndefined();
    expect(ev.createdBy).toBeUndefined();
  });

  it('resolves ownerName to null when explicitly null', () => {
    expect(normalizeEvent({ ownerName: null }).ownerName).toBeNull();
  });

  it('converts singleDay and allDay to booleans', () => {
    const ev = normalizeEvent({ singleDay: 1, allDay: 0 });
    expect(ev.singleDay).toBe(true);
    expect(ev.allDay).toBe(false);
  });
});

// ── ds ────────────────────────────────────────────────────────────────────────

describe('ds', () => {
  it('pads single-digit month and day', () => {
    expect(ds(2025, 0, 1)).toBe('2025-01-01');
    expect(ds(2025, 0, 9)).toBe('2025-01-09');
  });

  it('converts 0-indexed month correctly', () => {
    expect(ds(2025, 5, 15)).toBe('2025-06-15');   // June
    expect(ds(2025, 11, 31)).toBe('2025-12-31');  // December
  });

  it('does not pad two-digit day or month', () => {
    expect(ds(2025, 9, 20)).toBe('2025-10-20');
  });
});

// ── fmtShort ──────────────────────────────────────────────────────────────────

describe('fmtShort', () => {
  it('formats a mid-month date as short month + day (no year)', () => {
    const result = fmtShort('2025-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).not.toContain('2025');
  });

  it('formats January correctly', () => {
    const result = fmtShort('2025-01-07');
    expect(result).toContain('Jan');
    expect(result).toContain('7');
  });

  it('formats December correctly', () => {
    const result = fmtShort('2025-12-25');
    expect(result).toContain('Dec');
    expect(result).toContain('25');
  });
});

// ── visIcon ───────────────────────────────────────────────────────────────────

describe('visIcon', () => {
  it('returns globe for public', () => {
    expect(visIcon('public')).toBe('🌐');
  });

  it('returns people for shared', () => {
    expect(visIcon('shared')).toBe('👥');
  });

  it('returns lock for private', () => {
    expect(visIcon('private')).toBe('🔒');
  });

  it('returns lock for undefined', () => {
    expect(visIcon(undefined)).toBe('🔒');
  });

  it('returns lock for any other string', () => {
    expect(visIcon('restricted')).toBe('🔒');
    expect(visIcon('')).toBe('🔒');
  });
});
