import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const milestoneId = url.searchParams.get('milestoneId') ?? '';
  const sprintId    = url.searchParams.get('sprintId')    ?? '';

  const milestonesRes = await fetch(`${API_URL}/agile/milestones?limit=50`, { headers }).catch(() => null);
  const milestones    = milestonesRes?.ok ? (await milestonesRes.json()).milestones ?? [] : [];

  let sprints: unknown[] = [];
  let jobs:    unknown[] = [];

  if (milestoneId) {
    const [sprintsRes, jobsRes] = await Promise.all([
      fetch(`${API_URL}/agile/sprints?milestoneId=${milestoneId}&limit=50`, { headers }).catch(() => null),
      // Load all jobs for all sprints in this milestone via a broad query;
      // we filter client-side — jobs API supports sprintId param, so we batch after getting sprints
      null,
    ]);

    sprints = sprintsRes?.ok ? (await sprintsRes.json()).sprints ?? [] : [];

    // Fetch jobs for all sprints in this milestone in parallel
    if (sprints.length > 0) {
      const jobBatches = await Promise.all(
        (sprints as any[]).map(s =>
          fetch(`${API_URL}/agile/jobs?sprintId=${s.id}&limit=200`, { headers })
            .then(r => r.ok ? r.json().then(d => d.jobs ?? []) : [])
            .catch(() => [])
        )
      );
      jobs = jobBatches.flat();
    }
  }

  return { user: locals.user, milestones, sprints, jobs, milestoneId, sprintId };
};
