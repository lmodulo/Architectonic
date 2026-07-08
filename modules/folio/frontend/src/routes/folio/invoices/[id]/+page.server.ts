import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [invRes, customersRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/invoices/${params.id}`, { headers }),
    fetch(`${API_URL}/finance/customers`, { headers }),
  ]);

  if (invRes.status === 'rejected' || !invRes.value.ok) {
    throw error(invRes.status === 'fulfilled' ? invRes.value.status : 500, 'Failed to load invoice');
  }

  const invoice   = await invRes.value.json();
  const customers = customersRes.status === 'fulfilled' && customersRes.value.ok
    ? (await customersRes.value.json()).customers ?? [] : [];

  return { user: locals.user, invoice, customers };
};
