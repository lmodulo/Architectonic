import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const status     = url.searchParams.get('status')     ?? '';
  const customerId = url.searchParams.get('customerId') ?? '';
  const skip       = url.searchParams.get('skip')       ?? '0';
  const sort       = url.searchParams.get('sort')       ?? 'createdAt';
  const sortDir    = url.searchParams.get('sortDir')    ?? 'desc';

  const qs = new URLSearchParams({ limit: '25', skip, sort, sortDir });
  if (status) qs.set('status', status);

  const [invoicesRes, customersRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/invoices?${qs}`, { headers }),
    fetch(`${API_URL}/finance/customers`, { headers }),
  ]);

  let invoices: unknown[] = [];
  let total = 0;
  let customers: unknown[] = [];

  if (invoicesRes.status === 'fulfilled' && invoicesRes.value.ok) {
    const d = await invoicesRes.value.json();
    invoices = d.invoices ?? [];
    total    = d.total    ?? 0;
  }
  if (customersRes.status === 'fulfilled' && customersRes.value.ok) {
    customers = (await customersRes.value.json()).customers ?? [];
  }

  // Client-side filter by customerId if present (API doesn't support it yet)
  if (customerId) {
    invoices = (invoices as Array<{ customerId?: string }>).filter(i => i.customerId === customerId);
  }

  return { user: locals.user, invoices, total, customers, filters: { status, customerId, skip: Number(skip), sort, sortDir } };
};
