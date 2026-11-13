import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (url.pathname.startsWith('/contracts/sign/')) {
    return { user: locals.user ?? null };
  }
  if (!locals.user) redirect(303, '/login');
  return { user: locals.user };
};
