import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [tasksRes, milestonesRes, usersRes, jobsRes] = await Promise.all([
    fetch(`${API_URL}/agile/tasks?limit=500`, { headers }),
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/jobs?limit=500`, { headers }),
  ]);

  const rawTasks   = tasksRes.ok      ? (await tasksRes.json()).tasks          ?? [] : [];
  const milestones = milestonesRes.ok ? (await milestonesRes.json()).milestones ?? [] : [];
  const users      = usersRes?.ok     ? await usersRes.json()                       : [];
  const jobs       = jobsRes.ok       ? (await jobsRes.json()).jobs             ?? [] : [];

  const jobMap = new Map(jobs.map((j: any) => [j.id, j.jobNumber as number]));
  const tasks  = rawTasks.map((t: any) => ({ ...t, jobNumber: jobMap.get(t.jobId) }));

  return { user: locals.user, tasks, milestones, users };
};
