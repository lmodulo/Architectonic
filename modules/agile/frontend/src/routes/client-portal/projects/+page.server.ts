import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  let milestones: unknown[] = [];
  try {
    const res = await fetch(`${API_URL}/agile/milestones?limit=50`, { headers });
    if (res.ok) {
      const d = await res.json();
      milestones = d.milestones ?? [];
    }
  } catch { /* non-fatal */ }

  return { user: locals.user, milestones };
};
