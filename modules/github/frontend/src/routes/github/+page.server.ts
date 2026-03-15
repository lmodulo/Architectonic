import { redirect } from '@sveltejs/kit';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, '/login');
  if (!hasPermission(user, 'github', 'read')) redirect(302, '/dashboard');

  const res = await fetch('/api/github');
  const data = res.ok ? await res.json() : { items: [] };
  return { items: data.items ?? [] };
};
