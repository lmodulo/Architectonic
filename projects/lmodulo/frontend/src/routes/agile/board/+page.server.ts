import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [tasksRes, milestonesRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/agile/tasks?limit=500`, { headers }),
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
  ]);

  const tasks      = tasksRes.ok      ? (await tasksRes.json()).tasks         ?? [] : [];
  const milestones = milestonesRes.ok ? (await milestonesRes.json()).milestones ?? [] : [];
  const users      = usersRes?.ok     ? await usersRes.json()                      : [];

  return { user: locals.user, tasks, milestones, users };
};
