import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const userId = locals.user.id;

  const tasksRes = await fetch(`${API_URL}/agile/tasks?assignedTo=${userId}&limit=200`, { headers }).catch(() => null);
  const tasks: any[] = tasksRes?.ok ? (await tasksRes.json()).tasks ?? [] : [];

  // Batch-load unique jobs
  const jobIds = [...new Set(tasks.map((t: any) => t.jobId).filter(Boolean))] as string[];
  const jobResults = await Promise.all(
    jobIds.map(jid => fetch(`${API_URL}/agile/jobs/${jid}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null))
  );
  const jobMap: Record<string, any> = {};
  for (const j of jobResults) if (j?.id) jobMap[j.id] = j;

  // Batch-load unique sprints from jobs
  const sprintIds = [...new Set(Object.values(jobMap).map((j: any) => j.sprintId).filter(Boolean))] as string[];
  const sprintResults = await Promise.all(
    sprintIds.map(sid => fetch(`${API_URL}/agile/sprints/${sid}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null))
  );
  const sprintMap: Record<string, any> = {};
  for (const s of sprintResults) if (s?.id) sprintMap[s.id] = s;

  return { user: locals.user, tasks, jobMap, sprintMap };
};
