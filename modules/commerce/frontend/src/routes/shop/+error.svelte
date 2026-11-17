<script lang="ts">
  // Errors under /shop (an unknown category or product is a 404) keep the visitor in the shop, under StorefrontNav
  import { page } from '$app/state';

  const missing = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{missing ? 'Not found' : 'Error'} — Shop</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
  <h1 class="shop-error-title">{missing ? "This page isn't in the shop" : 'Something went wrong'}</h1>
  <p class="opacity-70">
    {missing ? 'The product or category may have been renamed or taken down.' : 'Please try again in a moment.'}
  </p>
  <a href="/shop" class="btn btn-ghost bg-base-200 hover:bg-base-300">Back to the shop</a>
</div>

<style>
  .shop-error-title { font-size: 1.75rem; font-weight: 600; line-height: 1.2; }
</style>
