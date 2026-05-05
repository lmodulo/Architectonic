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
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  let events: CalendarEvent[] = [];
  let users: { id: string; username: string; firstName: string; lastName: string }[] = [];

  const [evRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/calendar-events?limit=200&all=1`, { headers }).catch(() => null),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
  ]);

  if (evRes?.ok) {
    const data = (await evRes.json()) as { events: Record<string, unknown>[] };
    events = (data.events ?? []).map(normalizeEvent);
  }

  if (usersRes?.ok) {
    const raw = await usersRes.json().catch(() => []);
    users = (Array.isArray(raw) ? raw : []).map((u: Record<string, unknown>) => ({
      id:        String(u.id ?? u._id ?? ''),
      username:  String(u.username ?? ''),
      firstName: String(u.firstName ?? ''),
      lastName:  String(u.lastName ?? ''),
    }));
  }

  return { events, users };
};
