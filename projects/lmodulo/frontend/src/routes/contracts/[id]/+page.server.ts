import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, params }) => {
  if (!locals.user) redirect(303, '/login');

  const res = await fetch(`/api/contracts/${params.id}`);
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw error(res.status, (d as any).message ?? 'Contract not found');
  }

  const contract = await res.json();
  return { contract };
};
