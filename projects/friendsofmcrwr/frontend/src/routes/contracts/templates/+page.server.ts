import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user) redirect(303, '/login');

  const res = await fetch('/api/contracts/templates');
  const templates = res.ok ? await res.json() : [];

  return { templates };
};
