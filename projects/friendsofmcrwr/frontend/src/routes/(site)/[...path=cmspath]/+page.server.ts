import { error, redirect } from '@sveltejs/kit';
import { loadPage } from '$lib/server/cms/site';
import type { PageServerLoad } from './$types';

// Every public CMS URL other than `/`. Static app routes always win over this catch-all, and the
// cmspath matcher keeps it off /api, /uploads, /_app and file-like paths.
export const load: PageServerLoad = async (event) => {
  const result = await loadPage(event, `/${event.params.path}`);
  if (result.kind === 'redirect') redirect(307, result.to);
  if (result.kind === 'notFound') error(404, 'Page not found');
  if (result.kind === 'unavailable') error(503, 'The site is temporarily unavailable');
  return { view: result.view, componentData: result.componentData };
};
