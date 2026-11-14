<script lang="ts">
  // One public page (or a draft preview): the page title, then its blocks, or for a component node
  // the registry component in page mode. Shared by the catch-all route, the home page and previews.
  import { page } from '$app/state';
  import BlockRenderer from './BlockRenderer.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import type { PageView } from '$lib/cms/types';

  let { view, componentData = {} }: { view: PageView; componentData?: Record<string, unknown> } = $props();

  const blocks = $derived(view.page?.blocks ?? []);
  // A leading hero carries the page's main heading; otherwise the node title is the h1
  const heroFirst = $derived(blocks[0]?.type === 'hero');
  const brand = $derived((page.data.brandName as string | null) || (page.data.appName as string | null) || '');
  const title = $derived([view.page?.seo.title || view.node.title, brand].filter(Boolean).join(' · '));
</script>

<svelte:head><title>{title}</title></svelte:head>

{#if !heroFirst}
  <div class="w-full max-w-3xl mx-auto px-4 pt-12 pb-8">
    <h1 class="text-4xl font-bold tracking-tight leading-tight text-balance">{view.node.title}</h1>
  </div>
{/if}

{#if view.node.type === 'component'}
  <div class="w-full max-w-5xl mx-auto px-4 pb-16">
    <ComponentBlock componentKey={view.node.component?.key} props={view.node.component?.props} data={componentData.page} mode="page" rest={view.rest ?? null} />
  </div>
{:else}
  <BlockRenderer {blocks} links={view.links} media={view.media} {componentData} firstHeroIsTitle={heroFirst} />
{/if}
