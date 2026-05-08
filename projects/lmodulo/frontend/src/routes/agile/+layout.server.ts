import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  let teams: { id: string; name: string }[] = [];
  try {
    const res = await fetch(`${API_URL}/teams`, { headers });
    if (res.ok) teams = await res.json();
  } catch { /* non-fatal */ }
  return { user: locals.user, teams };
};
