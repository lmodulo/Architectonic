import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [jobRes, tasksRes, sprintJobsRes] = await Promise.all([
    fetch(`${API_URL}/agile/jobs/${params.id}`, { headers }),
    fetch(`${API_URL}/agile/tasks?jobId=${params.id}&limit=200`, { headers }),
    fetch(`${API_URL}/agile/jobs/${params.id}/dependencies`, { headers }),
  ]);

  if (!jobRes.ok) {
    const d = await jobRes.json().catch(() => ({}));
    throw error(jobRes.status, (d as { message?: string }).message ?? 'Not found');
  }

  const job   = await jobRes.json();
  const tasks = tasksRes.ok    ? (await tasksRes.json()).tasks    ?? [] : [];
  const deps  = sprintJobsRes.ok ? await sprintJobsRes.json()           : [];

  // Fetch sprint jobs + users in parallel
  const [sameSprintRes, usersRes] = await Promise.all([
    job.sprintId
      ? fetch(`${API_URL}/agile/jobs?sprintId=${job.sprintId}&limit=100`, { headers })
      : Promise.resolve(null),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
  ]);
  const sprintJobs = sameSprintRes?.ok ? (await sameSprintRes.json()).jobs ?? [] : [];
  const users      = usersRes?.ok ? await usersRes.json() : [];

  // Fetch parent sprint then milestone for breadcrumb
  const sprint = job.sprintId
    ? await fetch(`${API_URL}/agile/sprints/${job.sprintId}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null)
    : null;
  const milestone = sprint?.milestoneId
    ? await fetch(`${API_URL}/agile/milestones/${sprint.milestoneId}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null)
    : null;

  return { user: locals.user, job, tasks, deps, sprintJobs, users, sprint, milestone };
};
