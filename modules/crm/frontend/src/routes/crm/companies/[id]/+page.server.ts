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

  const [contactsRes, dealsRes, activitiesRes, milestonesRes] = await Promise.allSettled([
    fetch(`${API_URL}/crm/contacts?companyId=${params.id}&limit=50`, { headers }),
    fetch(`${API_URL}/crm/deals?companyId=${params.id}&limit=50`, { headers }),
    fetch(`${API_URL}/crm/activities?entityType=company&entityId=${params.id}&limit=50`, { headers }),
    fetch(`${API_URL}/crm/companies/${params.id}/milestones`, { headers }),
  ]);

  const contacts   = contactsRes.status   === 'fulfilled' && contactsRes.value.ok
    ? (await contactsRes.value.json()).contacts ?? [] : [];
  const deals      = dealsRes.status      === 'fulfilled' && dealsRes.value.ok
    ? (await dealsRes.value.json()).deals ?? [] : [];
  const activities = activitiesRes.status === 'fulfilled' && activitiesRes.value.ok
    ? (await activitiesRes.value.json()).activities ?? [] : [];

  let milestones: unknown[]             = [];
  let clientTotalEstimatedHours         = 0;
  let clientTotalActualHours            = 0;
  let clientBillableMinutes             = 0;
  if (milestonesRes.status === 'fulfilled' && milestonesRes.value.ok) {
    const md = await milestonesRes.value.json();
    milestones                = md.milestones              ?? [];
    clientTotalEstimatedHours = md.totalEstimatedHours     ?? 0;
    clientTotalActualHours    = md.totalActualHours        ?? 0;
    clientBillableMinutes     = md.billableMinutes         ?? 0;
  }

  return { user: locals.user, company, contacts, deals, activities, milestones, clientTotalEstimatedHours, clientTotalActualHours, clientBillableMinutes };
};
