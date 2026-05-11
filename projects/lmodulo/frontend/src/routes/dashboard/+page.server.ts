import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [eventsRes, agileMs, sprintsRes, agileTasks, crmDealsRes, crmContactsRes, crmCompaniesRes, crmActivitiesRes] = await Promise.all([
    fetch(`${API_URL}/events`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/milestones?limit=50`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/sprints?limit=200`, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?limit=500`, { headers }).catch(() => null),
    fetch(`${API_URL}/crm/deals?limit=100`, { headers }).catch(() => null),
    fetch(`${API_URL}/crm/contacts?limit=1`, { headers }).catch(() => null),
    fetch(`${API_URL}/crm/companies?limit=1`, { headers }).catch(() => null),
    fetch(`${API_URL}/crm/activities?limit=5`, { headers }).catch(() => null),
  ]);

  let events: unknown[] = [];
  if (eventsRes?.ok) events = await eventsRes.json().catch(() => []);

  const milestones  = agileMs?.ok     ? (await agileMs.json().catch(() => ({}))).milestones   ?? [] : [];
  const sprints     = sprintsRes?.ok  ? (await sprintsRes.json().catch(() => ({}))).sprints    ?? [] : [];
  const agileTskRaw = agileTasks?.ok  ? (await agileTasks.json().catch(() => ({}))).tasks      ?? [] : [];

  const crmDealsRaw  = crmDealsRes?.ok      ? (await crmDealsRes.json().catch(() => ({}))).deals      ?? [] : [];
  const crmContactsTotal   = crmContactsRes?.ok   ? ((await crmContactsRes.json().catch(() => ({}))).total   ?? 0) : 0;
  const crmCompaniesTotal  = crmCompaniesRes?.ok  ? ((await crmCompaniesRes.json().catch(() => ({}))).total  ?? 0) : 0;
  const crmActivitiesRaw   = crmActivitiesRes?.ok ? (await crmActivitiesRes.json().catch(() => ({}))).activities ?? [] : [];

  return { user: locals.user, events, milestones, sprints, agileTasks: agileTskRaw, crmDeals: crmDealsRaw, crmContactsTotal, crmCompaniesTotal, crmActivities: crmActivitiesRaw };
};
