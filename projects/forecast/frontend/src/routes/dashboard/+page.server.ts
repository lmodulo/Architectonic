import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  let events: unknown[] = [];
  try {
    const res = await fetch(`${API_URL}/events`, { headers });
    if (res.ok) events = await res.json();
  } catch { /* ignore — calendar still works without events */ }

  return { user: locals.user, events };
};
