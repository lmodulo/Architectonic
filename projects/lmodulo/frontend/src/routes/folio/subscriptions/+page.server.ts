import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const status = url.searchParams.get('status') ?? '';
  const qs     = status ? `?status=${status}` : '';

  const [subsRes, customersRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/subscriptions${qs}`, { headers }),
    fetch(`${API_URL}/finance/customers`, { headers }),
  ]);

  const subscriptions = subsRes.status === 'fulfilled' && subsRes.value.ok
    ? (await subsRes.value.json()).subscriptions ?? [] : [];
  const customers = customersRes.status === 'fulfilled' && customersRes.value.ok
    ? (await customersRes.value.json()).customers ?? [] : [];

  return { user: locals.user, subscriptions, customers, filters: { status } };
};
