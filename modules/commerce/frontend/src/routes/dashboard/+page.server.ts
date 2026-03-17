import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/analytics`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });

  const analytics = res.ok ? await res.json() : null;

  return { user: locals.user, analytics };
};
