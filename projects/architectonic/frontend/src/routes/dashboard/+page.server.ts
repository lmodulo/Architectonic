import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  // Belt-and-suspenders guard — hooks.server.ts already handles this
  if (!locals.user) redirect(303, '/login');
  return { user: locals.user };
};
