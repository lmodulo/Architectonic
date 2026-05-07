import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { normalizeEvent, type CalendarEvent } from '$lib/utils/calendarEvents';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const userId  = locals.user.id;

  const [evRes, tasksRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/calendar-events?limit=200`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?assignedTo=${userId}&limit=500`, { headers }).catch(() => null),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
  ]);

  let events: CalendarEvent[] = [];
  if (evRes?.ok) {
    const raw = (await evRes.json()) as { events?: Record<string, unknown>[] };
    events = (raw.events ?? []).map(normalizeEvent);
  }

  const tasks = tasksRes?.ok ? ((await tasksRes.json()).tasks ?? []) : [];

  let users: { id: string; username: string; firstName: string; lastName: string }[] = [];
  if (usersRes?.ok) {
    const raw = await usersRes.json().catch(() => []);
    users = (Array.isArray(raw) ? raw : []).map((u: Record<string, unknown>) => ({
      id:        String(u.id ?? u._id ?? ''),
      username:  String(u.username ?? ''),
      firstName: String(u.firstName ?? ''),
      lastName:  String(u.lastName ?? ''),
    }));
  }

  return { user: locals.user, events, tasks, users };
};
