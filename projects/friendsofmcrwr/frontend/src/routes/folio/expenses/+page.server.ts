import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const status   = url.searchParams.get('status')   ?? '';
  const category = url.searchParams.get('category') ?? '';
  const skip     = url.searchParams.get('skip')     ?? '0';
  const sort     = url.searchParams.get('sort')     ?? 'expenseDate';
  const sortDir  = url.searchParams.get('sortDir')  ?? 'desc';

  const qs = new URLSearchParams({ limit: '25', skip, sort, sortDir });
  if (status)   qs.set('status',   status);
  if (category) qs.set('category', category);

  const [expensesRes, companiesRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/expenses?${qs}`, { headers }),
    fetch(`${API_URL}/crm/companies?limit=200`, { headers }),
  ]);

  const expensesData = expensesRes.status === 'fulfilled' && expensesRes.value.ok
    ? await expensesRes.value.json() : { expenses: [], total: 0 };
  const companies = companiesRes.status === 'fulfilled' && companiesRes.value.ok
    ? (await companiesRes.value.json()).companies ?? [] : [];

  return {
    user:      locals.user,
    expenses:  expensesData.expenses ?? [],
    total:     expensesData.total    ?? 0,
    companies,
    filters: { status, category, skip: Number(skip), sort, sortDir },
  };
};
