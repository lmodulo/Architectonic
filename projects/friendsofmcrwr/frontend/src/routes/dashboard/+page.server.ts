import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { normalizeEvent, type CalendarEvent } from '$lib/utils/calendarEvents';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers: Record<string, string> = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  // This project has the calendar-events module, so the dashboard calendar shows (and its New Event modal writes)
  // the module's events, the same ones /calendar-events/admin manages, rather than the scaffold's own /events.
  // Same limit as the admin page. Without calendar_events:read the API answers 403 and the calendar is just empty.
  let events: CalendarEvent[] = [];
  try {
    const res = await fetch(`${API_URL}/calendar-events?limit=200`, { headers });
    if (res.ok) {
      const body = (await res.json()) as { events?: Record<string, unknown>[] };
      events = (body.events ?? []).map(normalizeEvent);
    }
  } catch { /* ignore — calendar still works without events */ }

  return { user: locals.user, events };
};
