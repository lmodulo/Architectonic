import { redirect } from '@sveltejs/kit';
import { hasPermission } from '$lib/permissions';
import type { LayoutServerLoad } from './$types';

// Every Content admin page needs cms_nodes.read (the nav item's permission). The draft preview
// (preview/[nodeId]/+page@.svelte) resets to the root layout and checks cms_pages.read itself.
export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/login');
  if (!hasPermission(locals.user, 'cms_nodes', 'read')) redirect(303, '/403');
  return {};
};
