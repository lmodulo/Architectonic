// Commerce's page type for the Content module: a shop page of the active products, with category and product
// pages under the page's own URL ($lib/utils/storefront.ts). Content's registry ($lib/cms/components.ts) picks
// this file up when Content is installed; without Content nothing reads it.
// It matches Content's CmsComponentEntry structurally and must never import Content's code or types, so that
// Commerce still builds on its own (see "Custom Components" in the Content documentation).
import ShopComponent from '$lib/components/commerce/ShopComponent.svelte';
import { DEFAULT_PER_PAGE, MAX_PER_PAGE, loadShop, shopSubpage } from '$lib/utils/storefront';

export default {
  key: 'shop',
  label: 'Shop',
  description: 'Products from Commerce, with a page for each category and product.',
  modes: ['page'] as ('page' | 'block')[],
  component: ShopComponent,
  // The admin warns when the signed-in user's permissions don't list this resource
  requires: { resource: 'commerce_products', module: 'Commerce' },
  props: [
    { name: 'perPage', label: 'Products per page', type: 'number' as const, default: DEFAULT_PER_PAGE, help: `1 to ${MAX_PER_PAGE}.` },
  ],
  subpaths: true,
  subpage: shopSubpage,
  load: loadShop,
};
