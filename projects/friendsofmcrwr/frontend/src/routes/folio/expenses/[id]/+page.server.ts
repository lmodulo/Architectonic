import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [expRes, companiesRes] = await Promise.allSettled([
    fetch(`${API_URL}/finance/expenses/${params.id}`, { headers }),
    fetch(`${API_URL}/crm/companies?limit=200`, { headers }),
  ]);

  if (expRes.status === 'rejected' || !expRes.value.ok) {
    throw error(expRes.status === 'fulfilled' ? expRes.value.status : 500, 'Failed to load expense');
  }

  const expense   = await expRes.value.json();
  const companies = companiesRes.status === 'fulfilled' && companiesRes.value.ok
    ? (await companiesRes.value.json()).companies ?? [] : [];

  return { user: locals.user, expense, companies };
};
