import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [sprintRes, jobsRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/agile/sprints/${params.id}`, { headers }),
    fetch(`${API_URL}/agile/jobs?sprintId=${params.id}&limit=100`, { headers }),
    fetch(`${API_URL}/users`, { headers }),
  ]);

  if (!sprintRes.ok) {
    const d = await sprintRes.json().catch(() => ({}));
    throw error(sprintRes.status, (d as { message?: string }).message ?? 'Not found');
  }

  const sprint = await sprintRes.json();
  const jobs   = jobsRes.ok ? (await jobsRes.json()).jobs ?? [] : [];
  const users  = usersRes.ok ? (await usersRes.json()).users ?? [] : [];

  // Fetch tasks for all jobs
  let tasks: unknown[] = [];
  if (jobs.length > 0) {
    const tRes = await fetch(`${API_URL}/agile/tasks?limit=500`, { headers });
    const tData = tRes.ok ? await tRes.json() : {};
    tasks = (tData.tasks ?? []).filter((t: any) => jobs.some((j: any) => j.id === t.jobId));
  }

  // Fetch parent milestone for breadcrumb
  const milestone = sprint.milestoneId
    ? await fetch(`${API_URL}/agile/milestones/${sprint.milestoneId}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null)
    : null;

  return { user: locals.user, sprint, jobs, tasks, users, milestone };
};
