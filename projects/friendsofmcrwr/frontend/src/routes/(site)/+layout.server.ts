import { loadMenu } from '$lib/server/cms/site';
import type { LayoutServerLoad } from './$types';

// The site menu for every public CMS page. loadMenu never throws, so a broken API still renders
// the page (or its 404) inside the site shell, with an empty menu.
export const load: LayoutServerLoad = async () => ({ menu: await loadMenu() });
