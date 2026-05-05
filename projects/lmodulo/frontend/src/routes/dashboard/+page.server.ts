import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [eventsRes, agileMs, sprintsRes, agileTasks] = await Promise.all([
    fetch(`${API_URL}/events`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/sprints?limit=200`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?limit=500`, { headers }).catch(() => null),
  ]);

  let events: unknown[] = [];
  if (eventsRes?.ok) events = await eventsRes.json().catch(() => []);

  const milestones  = agileMs?.ok     ? (await agileMs.json().catch(() => ({}))).milestones   ?? [] : [];
  const sprints     = sprintsRes?.ok  ? (await sprintsRes.json().catch(() => ({}))).sprints    ?? [] : [];
  const agileTskRaw = agileTasks?.ok  ? (await agileTasks.json().catch(() => ({}))).tasks      ?? [] : [];

  return { user: locals.user, events, milestones, sprints, agileTasks: agileTskRaw };
};
