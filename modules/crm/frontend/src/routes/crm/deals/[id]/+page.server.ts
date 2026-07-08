import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const res = await fetch(`${API_URL}/crm/deals/${params.id}`, { headers });
  if (res.status === 404) throw error(404, 'Deal not found');
  if (!res.ok) throw error(res.status, 'Failed to load deal');
  const deal = await res.json();

  const [activitiesRes, customersRes] = await Promise.all([
    fetch(`${API_URL}/crm/activities?entityType=deal&entityId=${params.id}&limit=50`, { headers }),
    fetch(`${API_URL}/finance/customers`, { headers }),
  ]);
  const activities = activitiesRes.ok ? (await activitiesRes.json()).activities ?? [] : [];
  const customers  = customersRes.ok  ? (await customersRes.json()).customers  ?? [] : [];

  return { user: locals.user, deal, activities, customers };
};
