import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, '/login');
  if (!hasPermission(user, 'notifications', 'read')) redirect(302, '/dashboard');

  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/notifications`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });

  const notifications = res.ok ? await res.json() : [];
  return { notifications };
};
