import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [msRes, sprintsRes] = await Promise.all([
    fetch(`${API_URL}/agile/milestones/${params.id}`, { headers }),
    fetch(`${API_URL}/agile/sprints?milestoneId=${params.id}&limit=50`, { headers }),
  ]);

  if (!msRes.ok) {
    const d = await msRes.json().catch(() => ({}));
    throw error(msRes.status, (d as { message?: string }).message ?? 'Not found');
  }

  const milestone = await msRes.json();
  const sprints   = sprintsRes.ok ? (await sprintsRes.json()).sprints ?? [] : [];

  return { user: locals.user, milestone, sprints };
};
