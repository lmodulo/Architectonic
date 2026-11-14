<script lang="ts">
  // One public page (or a draft preview): the page title, then its blocks, or for a component node
  // the registry component in page mode. Shared by the catch-all route, the home page and previews.
  // The head carries the search and sharing tags ($lib/cms/seo.ts).
  import { page } from '$app/state';
  import BlockRenderer from './BlockRenderer.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import { pageMeta } from '$lib/cms/seo';
  import type { PageView } from '$lib/cms/types';

  let { view, componentData = {} }: { view: PageView; componentData?: Record<string, unknown> } = $props();

  const blocks = $derived(view.page?.blocks ?? []);
  // A leading hero carries the page's main heading; otherwise the node title is the h1
  const heroFirst = $derived(blocks[0]?.type === 'hero');
  const brand = $derived((page.data.brandName as string | null) || (page.data.appName as string | null) || '');
  const meta = $derived(pageMeta(view, page.url.origin, brand));
</script>

<svelte:head>
  <title>{meta.title}</title>
  {#if meta.description}<meta name="description" content={meta.description} />{/if}
  {#if meta.noindex}<meta name="robots" content="noindex" />{/if}
  {#if meta.canonical}<link rel="canonical" href={meta.canonical} />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={meta.title} />
  {#if meta.siteName}<meta property="og:site_name" content={meta.siteName} />{/if}
  {#if meta.description}<meta property="og:description" content={meta.description} />{/if}
  {#if meta.canonical}<meta property="og:url" content={meta.canonical} />{/if}
  {#if meta.image}
    <meta property="og:image" content={meta.image.url} />
    {#if meta.image.alt}<meta property="og:image:alt" content={meta.image.alt} />{/if}
    {#if meta.image.w && meta.image.h}
      <meta property="og:image:width" content={String(meta.image.w)} />
      <meta property="og:image:height" content={String(meta.image.h)} />
    {/if}
  {/if}
  <meta name="twitter:card" content={meta.image ? 'summary_large_image' : 'summary'} />
</svelte:head>

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
