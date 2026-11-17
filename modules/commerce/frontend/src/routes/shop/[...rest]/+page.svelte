<script lang="ts">
  // The page around ShopComponent at /shop: the heading and breadcrumbs, which a Content page supplies for the
  // Shop page type. StorefrontNav comes from the layout.
  import ShopComponent from '$lib/components/commerce/ShopComponent.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const crumbs = $derived(data.subpage ? [{ id: 'shop', title: 'Shop', path: '/shop' as string | null }, ...data.subpage.crumbs] : []);
  const description = $derived(data.subpage?.description?.slice(0, 300) ?? '');
</script>

<svelte:head>
  <title>{data.subpage ? `${data.subpage.title} — Shop` : 'Shop'}</title>
  {#if description}<meta name="description" content={description} />{/if}
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 pb-24 sm:px-8 md:gap-8 md:pt-10">
  <header class="flex flex-col gap-2">
    {#if crumbs.length}
      <nav aria-label="Breadcrumb" class="breadcrumbs py-0 text-sm">
        <ul>
          {#each crumbs as c, i (c.id)}
            <li>
              {#if i < crumbs.length - 1 && c.path}
                <a href={c.path} class="opacity-70 hover:opacity-100">{c.title}</a>
              {:else}
                <span aria-current="page">{c.title}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
    <h1 class="shop-title break-words">{data.subpage?.title ?? 'Shop'}</h1>
  </header>

  <ShopComponent data={data.shop} />
</div>

<style>
  /* app.css sizes h1–h6 outside any CSS layer, so a Tailwind size class can't set this heading's size */
  .shop-title { font-size: clamp(1.75rem, 2.5vw + 1rem, 2.5rem); font-weight: 600; line-height: 1.15; letter-spacing: -0.01em; }
</style>
