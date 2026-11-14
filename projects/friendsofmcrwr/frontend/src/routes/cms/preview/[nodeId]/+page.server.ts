import { error, redirect } from '@sveltejs/kit';
import { hasPermission } from '$lib/permissions';
import { loadMenu, loadPreview } from '$lib/server/cms/site';
import type { PageServerLoad } from './$types';

// Staff preview of a draft, rendered like the public site. The page resets to the root layout
// (+page@.svelte), so the Content admin layout's permission check doesn't run: check here.
export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) redirect(303, '/login');
  if (!hasPermission(event.locals.user, 'cms_pages', 'read')) redirect(303, '/403');
  const [result, menu] = await Promise.all([loadPreview(event, event.params.nodeId), loadMenu()]);
  if (result.kind === 'notFound') error(404, 'Page not found');
  if (result.kind !== 'page') error(503, 'The preview could not be loaded. Try again in a moment.');
  return { view: result.view, componentData: result.componentData, menu };
};
