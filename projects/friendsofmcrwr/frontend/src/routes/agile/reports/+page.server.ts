import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const milestoneId = url.searchParams.get('milestoneId') ?? '';

  const milestonesRes = await fetch(`${API_URL}/agile/milestones?limit=50`, { headers }).catch(() => null);
  const milestones    = milestonesRes?.ok ? (await milestonesRes.json()).milestones ?? [] : [];

  let sprints: unknown[] = [];

  if (milestoneId) {
    const sprintsRes = await fetch(`${API_URL}/agile/sprints?milestoneId=${milestoneId}&limit=50`, { headers }).catch(() => null);
    sprints = sprintsRes?.ok ? (await sprintsRes.json()).sprints ?? [] : [];
    // Sort by sprint number ascending for chronological charts
    (sprints as any[]).sort((a, b) => (a.sprintNumber ?? 0) - (b.sprintNumber ?? 0));
  }

  return { user: locals.user, milestones, sprints, milestoneId };
};
