import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  // Fetch all calendar events (from calendar_events collection)
  const evRes = await fetch(`${API_URL}/calendar-events?limit=200`, { headers }).catch(() => null);
  const calEvents = evRes?.ok ? (await evRes.json()).events ?? [] : [];

  return { user: locals.user, calEvents };
};
