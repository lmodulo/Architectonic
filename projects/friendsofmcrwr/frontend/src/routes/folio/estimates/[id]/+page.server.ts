import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [estimateRes, customersRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/estimates/${params.id}`, { headers }),
    fetch(`${API_URL}/finance/customers`, { headers }),
  ]);

  if (estimateRes.status === 'rejected' || !estimateRes.value.ok) {
    redirect(303, '/folio/estimates');
  }

  const estimate  = await (estimateRes as PromiseFulfilledResult<Response>).value.json();
  const customers = customersRes.status === 'fulfilled' && customersRes.value.ok
    ? (await customersRes.value.json()).customers ?? []
    : [];

  return { user: locals.user, estimate, customers };
};
