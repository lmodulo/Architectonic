import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  let users: { id: string; firstName: string; lastName: string; username: string }[] = [];
  try {
    const res = await fetch(`${API_URL}/users`, { headers });
    if (res.ok) { const d = await res.json(); users = d.users ?? d; }
  } catch { /* non-fatal */ }
  return { user: locals.user, users };
};
