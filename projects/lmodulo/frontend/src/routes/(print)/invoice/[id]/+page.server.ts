import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const res = await fetch(`${API_URL}/finance/invoices/${params.id}`, { headers });
  if (res.status === 404) error(404, 'Invoice not found');
  if (!res.ok) error(403, 'Access denied');

  const invoice = await res.json();

  if (locals.user.role === 'customer' && invoice.customerId !== locals.user.id) {
    error(403, 'Access denied');
  }

  return { invoice };
};
