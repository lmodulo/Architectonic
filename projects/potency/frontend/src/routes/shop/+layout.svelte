<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import StorefrontNav from '$lib/components/StorefrontNav.svelte';
  import ShopBreadcrumb from '$lib/components/ShopBreadcrumb.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<StorefrontNav meta={data.meta} />

<div class="shop-shell">
  <ShopBreadcrumb categories={data.meta.categories} />
  <main class="shop-main">
    {@render children()}
  </main>
  <PublicFooter />
</div>

<style>
  .shop-shell {
    padding-top: 3.5rem;
    min-height: 100vh;
    background: var(--body-background-color);
  }

  :global(.dark) .shop-shell {
    background: var(--body-background-color-dark);
  }
</style>
