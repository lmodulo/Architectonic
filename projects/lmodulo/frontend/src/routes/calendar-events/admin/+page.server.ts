import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';
import { normalizeEvent, type CalendarEvent } from '$lib/utils/calendarEvents';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const { user } = await parent();

  if (!user) redirect(303, '/login');
  if (!hasPermission(user, 'calendar_events', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  let events: CalendarEvent[] = [];

  try {
    const res = await fetch(`${API_URL}/calendar-events?limit=200`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {},
    });
    if (res.ok) {
      const data = (await res.json()) as { events: Record<string, unknown>[] };
      events = (data.events ?? []).map(normalizeEvent);
    }
  } catch { /* degrade gracefully */ }

  return { events };
};
