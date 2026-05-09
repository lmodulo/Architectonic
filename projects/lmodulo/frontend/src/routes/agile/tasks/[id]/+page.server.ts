import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const taskRes = await fetch(`${API_URL}/agile/tasks/${params.id}`, { headers });
  if (!taskRes.ok) {
    const d = await taskRes.json().catch(() => ({}));
    throw error(taskRes.status, (d as { message?: string }).message ?? 'Task not found');
  }
  const task = await taskRes.json();

  const [jobRes, usersRes] = await Promise.all([
    task.jobId ? fetch(`${API_URL}/agile/jobs/${task.jobId}`, { headers }) : Promise.resolve(null),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
  ]);

  const job   = jobRes?.ok   ? await jobRes.json()               : null;
  const users = usersRes?.ok ? await usersRes.json()             : [];

  return { user: locals.user, task, job, users };
};
