import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const now     = new Date();
  const defaultFrom = `${now.getFullYear()}-01-01`;
  const defaultTo   = now.toISOString().slice(0, 10);

  const from    = url.searchParams.get('from')    ?? defaultFrom;
  const to      = url.searchParams.get('to')      ?? defaultTo;
  const groupBy = url.searchParams.get('groupBy') ?? 'month';

  const qs = new URLSearchParams({ from, to, groupBy });
  const res = await fetch(`${API_URL}/finance/reports?${qs}`, { headers });

  const report = res.ok ? await res.json() : {
    summary: { revenue: 0, expenses: 0, netProfit: 0, profitMargin: 0, taxCollected: 0, outstanding: 0 },
    periods: [],
    expensesByCategory: [],
  };

  return {
    user: locals.user,
    report,
    filters: { from, to, groupBy },
  };
};
