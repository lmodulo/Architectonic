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

  // Fetch all jobs in same sprint for dependency graph
  let sprintJobs: unknown[] = [];
  if (job.sprintId) {
    const sjRes = await fetch(`${API_URL}/agile/jobs?sprintId=${job.sprintId}&limit=100`, { headers });
    sprintJobs = sjRes.ok ? (await sjRes.json()).jobs ?? [] : [];
  }

  // Fetch users for assignee display
  const usersRes = await fetch(`${API_URL}/users`, { headers }).catch(() => null);
  const users    = usersRes?.ok ? await usersRes.json() : [];

  return { user: locals.user, job, tasks, deps, sprintJobs, users };
};
