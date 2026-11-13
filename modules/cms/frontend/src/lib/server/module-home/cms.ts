import type { ServerLoadEvent } from '@sveltejs/kit';
import { loadMenu, loadPage } from '$lib/server/cms/site';

// Takes over `/` (see the scaffold's $lib/server/module-home.ts) when a published CMS page is set
// as the home page. Returns null otherwise, so the scaffold marketing page stays the fallback.
export default async function cmsHome(event: ServerLoadEvent) {
  const page = await loadPage(event, '/');
  if (page.kind !== 'page') return null;
  return { menu: await loadMenu(), view: page.view, componentData: page.componentData };
}
