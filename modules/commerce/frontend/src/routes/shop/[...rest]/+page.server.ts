// Commerce's own storefront at /shop: the same storefront as the Shop page Commerce adds to Content
// (loadShop in $lib/utils/storefront.ts, shown by ShopComponent), mounted here for projects without Content.
// /shop lists every product; /shop/<category>, /shop/<category>/<product> and /shop/<product> are the rest.
import { error } from '@sveltejs/kit';
import { loadShop, shopSubpage, type ShopData } from '$lib/utils/storefront';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url, params }) => {
  const rest = params.rest || null;
  let shop: ShopData;
  try {
    shop = await loadShop({ fetch, url, rest, base: '/shop', props: {} });
  } catch {
    // The storefront API couldn't be read: the page says the shop is unavailable
    shop = { unavailable: true };
  }
  if ('notFound' in shop) error(404, 'Not found');
  // What a category or product page is called, and its breadcrumbs after "Shop" (null for /shop itself)
  return { shop, subpage: rest ? shopSubpage(shop) : null };
};
