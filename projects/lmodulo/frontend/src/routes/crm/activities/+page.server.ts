import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  let activities: unknown[] = [];
  let total = 0;
  try {
    const res = await fetch(`${API_URL}/crm/activities?limit=100`, { headers });
    if (res.ok) { const d = await res.json(); activities = d.activities ?? []; total = d.total ?? 0; }
  } catch { /* non-fatal */ }

  return { user: locals.user, activities, total };
};
