<script lang="ts">
  // Commerce's standalone storefront shell: StorefrontNav above the page, without the app shell
  // (module-routes/commerce.ts makes /shop public and bare). Each page shows its own heading and breadcrumbs.
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import StorefrontNav from '$lib/components/StorefrontNav.svelte';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<StorefrontNav meta={data.meta} />

<div class="shop-shell">
  <main>
    {@render children()}
  </main>
</div>

<style>
  .shop-shell {
    padding-top: 3.5rem;
    min-height: 100vh;
    background: var(--color-base-100);
  }
</style>
