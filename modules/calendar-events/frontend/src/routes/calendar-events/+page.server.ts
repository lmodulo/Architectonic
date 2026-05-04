import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { normalizeEvent, type CalendarEvent } from '$lib/utils/calendarEvents';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ url }) => {
  const type = url.searchParams.get('type') ?? '';
  const qs   = type ? `?type=${encodeURIComponent(type)}` : '';

  let events: CalendarEvent[] = [];
  let eventTypes: string[]    = [];

  try {
    const res = await fetch(`${API_URL}/calendar-events/public${qs}`);
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>[];
      events     = data.map(normalizeEvent);
      // Collect distinct types from all events (not just filtered) for tab display
      // Fetch all types without filter for the tab bar
      if (type) {
        const allRes = await fetch(`${API_URL}/calendar-events/public`);
        if (allRes.ok) {
          const all = (await allRes.json()) as Record<string, unknown>[];
          eventTypes = [...new Set(all.map(e => String(e.eventType ?? 'upcoming_event')))].sort();
        }
      } else {
        eventTypes = [...new Set(events.map(e => e.eventType))].sort();
      }
    }
  } catch { /* degrade gracefully */ }

  return { events, eventTypes, activeType: type };
};
