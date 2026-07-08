import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

function weekMondayISO(refISO?: string): string {
  const ref = refISO ? new Date(refISO + 'T00:00:00Z') : new Date();
  const day  = ref.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  ref.setUTCDate(ref.getUTCDate() + diff);
  return ref.toISOString().slice(0, 10);
}

function weekDatesFrom(mondayISO: string): string[] {
  const start = new Date(mondayISO + 'T00:00:00Z');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers       = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const userId        = locals.user.id;

  const weekStart = weekMondayISO(url.searchParams.get('week') ?? undefined);
  const weekDates = weekDatesFrom(weekStart);
  const [dateFrom, dateTo] = [weekDates[0], weekDates[6]];

  const [entriesRes, tasksRes, timerRes] = await Promise.all([
    fetch(`${API_URL}/agile/time-entries?userId=${userId}&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=500`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?assignedTo=${userId}&limit=500`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/time-entries/active-timer`, { headers }).catch(() => null),
  ]);

  const entries: any[]  = entriesRes?.ok ? (await entriesRes.json()).entries ?? [] : [];
  const rawTasks: any[] = tasksRes?.ok   ? (await tasksRes.json()).tasks    ?? [] : [];
  const timerData       = timerRes?.ok   ? await timerRes.json()            : { entry: null, task: null };

  // Enrich tasks with job + sprint context for breadcrumbs
  const jobIds = [...new Set(rawTasks.map((t: any) => t.jobId).filter(Boolean))] as string[];
  const jobResults = await Promise.all(
    jobIds.map(jid =>
      fetch(`${API_URL}/agile/jobs/${jid}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null)
    )
  );
  const jobMap: Record<string, any> = {};
  for (const j of jobResults) if (j?.id) jobMap[j.id] = j;

  const sprintIds = [...new Set(Object.values(jobMap).map((j: any) => j.sprintId).filter(Boolean))] as string[];
  const sprintResults = await Promise.all(
    sprintIds.map(sid =>
      fetch(`${API_URL}/agile/sprints/${sid}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null)
    )
  );
  const sprintMap: Record<string, any> = {};
  for (const s of sprintResults) if (s?.id) sprintMap[s.id] = s;

  const tasks = rawTasks.map((t: any) => {
    const job    = jobMap[t.jobId]              ?? null;
    const sprint = job ? sprintMap[job.sprintId] : null;
    return {
      ...t,
      jobTitle:    job?.title    ?? null,
      sprintTitle: sprint?.title ?? null,
    };
  });

  const taskMap: Record<string, any> = {};
  for (const t of tasks) taskMap[t.id] = t;

  // Fetch tasks referenced by entries but missing from taskMap (e.g. not assigned to this user)
  const missingIds = [...new Set(
    entries.map((e: any) => e.taskId).filter((id: string) => id && !taskMap[id])
  )] as string[];
  if (missingIds.length) {
    const missingTasks = await Promise.all(
      missingIds.map((id: string) =>
        fetch(`${API_URL}/agile/tasks/${id}`, { headers })
          .then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );
    for (const t of missingTasks) if (t?.id) taskMap[t.id] = t;
  }

  return {
    weekStart,
    weekDates,
    entries,
    tasks,
    taskMap,
    activeTimer: timerData.entry ? timerData : null,
  };
};
