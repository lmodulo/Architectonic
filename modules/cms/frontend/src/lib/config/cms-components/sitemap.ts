// Built-in registry entry (see $lib/cms/components.ts): a sitemap of the published site.
import SitemapComponent from '$lib/components/cms/site/SitemapComponent.svelte';
import type { CmsComponentEntry } from '$lib/cms/types';

export default {
  key: 'sitemap',
  label: 'Sitemap',
  description: 'Every published page, as a nested list.',
  modes: ['page', 'block'],
  component: SitemapComponent,
  props: [
    { name: 'includeHidden', label: 'Include pages hidden from the menu', type: 'boolean', default: false },
  ],
  load: async ({ fetch }) => {
    const res = await fetch('/api/cms/site/tree');
    return res.ok ? res.json() : { unavailable: true };
  },
} satisfies CmsComponentEntry;
