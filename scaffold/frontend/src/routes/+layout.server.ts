import type { LayoutServerLoad } from './$types';

// Exposes locals.user to all pages via data.user
export const load: LayoutServerLoad = ({ locals }) => {
  return { user: locals.user };
};
