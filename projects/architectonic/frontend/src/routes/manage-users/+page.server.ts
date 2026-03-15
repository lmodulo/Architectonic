import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!hasPermission(locals.user, 'users', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');

  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) {
      return { users: await res.json(), error: null };
    }
    return { users: [], error: `API returned ${res.status}` };
  } catch {
    return { users: [], error: 'Cannot reach the API server' };
  }
};
