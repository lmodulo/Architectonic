import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!hasPermission(locals.user, 'commerce_orders', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  try {
    const res = await fetch(`${API_URL}/commerce/orders?limit=50`, { headers });
    const { orders = [], total = 0 } = res.ok ? await res.json() : {};
    return { orders, total, error: null };
  } catch {
    return { orders: [], total: 0, error: 'Cannot reach the API server' };
  }
};
