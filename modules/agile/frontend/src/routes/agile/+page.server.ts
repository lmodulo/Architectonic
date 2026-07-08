import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [milestonesRes, tasksRes] = await Promise.all([
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?limit=200`, { headers }).catch(() => null),
  ]);

  const milestones = milestonesRes?.ok ? (await milestonesRes.json()).milestones ?? [] : [];
  const tasks      = tasksRes?.ok      ? (await tasksRes.json()).tasks         ?? [] : [];

  return { user: locals.user, milestones, tasks };
};
