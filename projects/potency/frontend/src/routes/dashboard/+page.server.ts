import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [analyticsRes, eventsRes] = await Promise.all([
    fetch(`${API_URL}/analytics`, { headers }),
    fetch(`${API_URL}/events`, { headers }).catch(() => null),
  ]);

  const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
  const events    = eventsRes?.ok   ? await eventsRes.json()    : [];

  return { user: locals.user, analytics, events };
};
