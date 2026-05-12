import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [customersRes, invoicesRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/customers`, { headers }),
    fetch(`${API_URL}/finance/invoices?limit=200`, { headers }),
  ]);

  const customers = customersRes.status === 'fulfilled' && customersRes.value.ok
    ? (await customersRes.value.json()).customers ?? [] : [];
  const invoices  = invoicesRes.status  === 'fulfilled' && invoicesRes.value.ok
    ? (await invoicesRes.value.json()).invoices  ?? [] : [];

  return { user: locals.user, customers, invoices };
};
