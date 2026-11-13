import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, params }) => {
  if (!locals.user) redirect(303, '/login');

  const [contractRes, companiesRes] = await Promise.allSettled([
    fetch(`/api/contracts/${params.id}`),
    fetch('/api/crm/companies'),
  ]);

  if (contractRes.status === 'rejected' || !contractRes.value.ok) {
    const d = contractRes.status === 'fulfilled'
      ? await contractRes.value.json().catch(() => ({}))
      : {};
    throw error(
      contractRes.status === 'fulfilled' ? contractRes.value.status : 500,
      (d as any).message ?? 'Contract not found',
    );
  }

  const contract  = await contractRes.value.json();
  const companies = companiesRes.status === 'fulfilled' && companiesRes.value.ok
    ? await companiesRes.value.json()
    : [];

  return { contract, companies: (companies as any).companies ?? companies };
};
