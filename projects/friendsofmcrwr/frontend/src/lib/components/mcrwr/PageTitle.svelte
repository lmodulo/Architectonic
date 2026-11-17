<script lang="ts">
  // Top of every interior (CMS) page: a big-sky banner with the title, and breadcrumbs once a page is nested
  // (second level and deeper). The banner photo is the page's share image (Content → page → SEO image) when an
  // editor has set one, else a dusk sky. A page that opens with its own hero keeps the hero as its title, so
  // only the breadcrumbs show above it. A component page's subpath (a shop's category or product) has its own
  // title, and its breadcrumbs already include it.
  import Breadcrumbs from './Breadcrumbs.svelte';
  import SkyImage from './SkyImage.svelte';
  import type { PageTitleProps } from '$lib/config/site-design';

  let { view, heroFirst }: PageTitleProps = $props();

  const crumbs = $derived(view.breadcrumbs.length > 1 ? view.breadcrumbs : null);
  const photo = $derived.by(() => {
    const image = view.page?.seo?.image;
    return image ? view.media[image.vaultId]?.url ?? '' : '';
  });
</script>

{#if heroFirst}
  {#if crumbs}
    <!-- lined up with the hero's own column (max-w-5xl in the cms HeroBlock) -->
    <div class="border-b border-base-300 bg-base-200/60">
      <div class="max-w-5xl mx-auto px-4 py-3">
        <Breadcrumbs {crumbs} />
      </div>
    </div>
  {/if}
{:else}
  <section class="relative isolate overflow-hidden text-white">
    <SkyImage fill sky="dusk" src={photo} alt="" decorative eager />
    <div class="mw-banner__scrim absolute inset-0" aria-hidden="true"></div>
    <!-- The page's column (max-w-3xl, as CmsPage uses for text and component pages alike), so the title lines up -->
    <div class="relative max-w-3xl mx-auto px-4 min-h-[13rem] md:min-h-[19rem] pt-14 pb-10 md:pt-20 md:pb-14 flex flex-col justify-end gap-4">
      {#if crumbs}<Breadcrumbs {crumbs} tone="light" />{/if}
      <h1 class="mw-h1 break-words [text-shadow:0_2px_24px_rgb(0_0_0/0.25)]">{view.subpage?.title ?? view.node.title}</h1>
    </div>
  </section>
  <div class="h-10 md:h-14" aria-hidden="true"></div>
{/if}
