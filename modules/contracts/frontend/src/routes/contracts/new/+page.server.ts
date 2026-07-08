import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
  if (!locals.user) redirect(303, '/login');

  const [templatesRes, companiesRes] = await Promise.allSettled([
    fetch('/api/contracts/templates'),
    fetch('/api/crm/companies'),
  ]);

  const templates = templatesRes.status === 'fulfilled' && templatesRes.value.ok
    ? await templatesRes.value.json()
    : [];
  const companies = companiesRes.status === 'fulfilled' && companiesRes.value.ok
    ? await companiesRes.value.json()
    : [];

  const dealId = url.searchParams.get('dealId') ?? null;

  return { templates, companies: companies.companies ?? companies, dealId };
};
