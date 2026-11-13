import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [msRes, sprintsRes] = await Promise.all([
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }),
    fetch(`${API_URL}/agile/sprints?limit=200`, { headers }),
  ]);

  const milestones = msRes.ok      ? (await msRes.json()).milestones      ?? [] : [];
  const sprints    = sprintsRes.ok ? (await sprintsRes.json()).sprints ?? [] : [];

  return { user: locals.user, milestones, sprints };
};
