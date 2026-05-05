import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [evRes, msRes, sprintsRes, tasksRes] = await Promise.all([
    fetch(`${API_URL}/calendar-events?limit=200`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/sprints?limit=200`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?limit=500`, { headers }).catch(() => null),
  ]);

  const calEvents  = evRes?.ok      ? (await evRes.json()).events          ?? [] : [];
  const milestones = msRes?.ok      ? (await msRes.json()).milestones       ?? [] : [];
  const sprints    = sprintsRes?.ok ? (await sprintsRes.json()).sprints     ?? [] : [];
  const tasks      = tasksRes?.ok   ? (await tasksRes.json()).tasks         ?? [] : [];

  return { user: locals.user, calEvents, milestones, sprints, tasks };
};
