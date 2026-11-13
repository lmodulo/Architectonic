import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const status  = url.searchParams.get('status')  ?? '';
  const skip    = url.searchParams.get('skip')    ?? '0';
  const sort    = url.searchParams.get('sort')    ?? 'createdAt';
  const sortDir = url.searchParams.get('sortDir') ?? 'desc';

  const qs = new URLSearchParams({ limit: '25', skip, sort, sortDir });
  if (status) qs.set('status', status);

  const [estimatesRes, customersRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/estimates?${qs}`, { headers }),
    fetch(`${API_URL}/finance/customers`, { headers }),
  ]);

  let estimates: unknown[] = [];
  let total = 0;
  let customers: unknown[] = [];

  if (estimatesRes.status === 'fulfilled' && estimatesRes.value.ok) {
    const d = await estimatesRes.value.json();
    estimates = d.estimates ?? [];
    total     = d.total    ?? 0;
  }
  if (customersRes.status === 'fulfilled' && customersRes.value.ok) {
    customers = (await customersRes.value.json()).customers ?? [];
  }

  return { user: locals.user, estimates, total, customers, filters: { status, skip: Number(skip), sort, sortDir } };
};
