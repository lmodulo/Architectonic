import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const res = await fetch(`${API_URL}/crm/companies/${params.id}`, { headers });
  if (res.status === 404) throw error(404, 'Company not found');
  if (!res.ok) throw error(res.status, 'Failed to load company');
  const company = await res.json();

  const [contactsRes, dealsRes, activitiesRes] = await Promise.allSettled([
    fetch(`${API_URL}/crm/contacts?companyId=${params.id}&limit=50`, { headers }),
    fetch(`${API_URL}/crm/deals?companyId=${params.id}&limit=50`, { headers }),
    fetch(`${API_URL}/crm/activities?entityType=company&entityId=${params.id}&limit=50`, { headers }),
  ]);

  const contacts   = contactsRes.status   === 'fulfilled' && contactsRes.value.ok
    ? (await contactsRes.value.json()).contacts ?? [] : [];
  const deals      = dealsRes.status      === 'fulfilled' && dealsRes.value.ok
    ? (await dealsRes.value.json()).deals ?? [] : [];
  const activities = activitiesRes.status === 'fulfilled' && activitiesRes.value.ok
    ? (await activitiesRes.value.json()).activities ?? [] : [];

  return { user: locals.user, company, contacts, deals, activities };
};
