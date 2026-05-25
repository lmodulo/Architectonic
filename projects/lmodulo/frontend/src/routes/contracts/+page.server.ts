import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
  if (!locals.user) redirect(303, '/login');

  const status = url.searchParams.get('status') ?? '';
  const qs     = status ? `?status=${status}` : '';

  const res = await fetch(`/api/contracts${qs}`);
  const contracts = res.ok ? await res.json() : [];

  return { contracts, filter: status };
};
