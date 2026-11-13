import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [dealsRes, activitiesRes] = await Promise.allSettled([
    fetch(`${API_URL}/crm/deals?limit=500`, { headers }),
    fetch(`${API_URL}/crm/activities?limit=500`, { headers }),
  ]);

  const deals      = dealsRes.status      === 'fulfilled' && dealsRes.value.ok
    ? (await dealsRes.value.json()).deals ?? [] : [];
  const activities = activitiesRes.status === 'fulfilled' && activitiesRes.value.ok
    ? (await activitiesRes.value.json()).activities ?? [] : [];

  return { user: locals.user, deals, activities };
};
