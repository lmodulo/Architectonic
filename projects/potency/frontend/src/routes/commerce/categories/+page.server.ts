import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!hasPermission(locals.user, 'commerce_categories', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  try {
    const res = await fetch(`${API_URL}/commerce/categories`, { headers });
    const categories = res.ok ? await res.json() : [];
    return { categories, error: null };
  } catch {
    return { categories: [], error: 'Cannot reach the API server' };
  }
};
