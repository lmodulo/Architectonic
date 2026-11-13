<script lang="ts">
  import type { PageData } from './$types';
  import ProductCard from '$lib/components/ProductCard.svelte';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.category.name} — Shop</title>
</svelte:head>

<div class="category-page">
  <!-- Header -->
  <header class="cat-header">
    <h1 class="cat-title">{data.category.name}</h1>
    {#if data.category.description}
      <p class="cat-desc">{data.category.description}</p>
    {/if}
    <p class="cat-count">{data.total} {data.total === 1 ? 'product' : 'products'}</p>
  </header>

  <!-- Active filters -->
  {#if data.activeTag || data.activeVariant}
    <div class="active-filters">
      {#if data.activeTag}
        <a href="/shop/{data.category.slug}" class="filter-pill">
          {data.activeTag} ✕
        </a>
      {/if}
      {#if data.activeVariant}
        <a href="/shop/{data.category.slug}" class="filter-pill">
          {data.activeVariant} ✕
        </a>
      {/if}
    </div>
  {/if}

  <!-- Product grid -->
  {#if data.products.length > 0}
    <div class="product-grid">
      {#each data.products as product (product.id)}
        <ProductCard {product} categorySlug={data.category.slug} />
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>No products found in this category.</p>
      <a href="/shop" class="btn btn-ghost btn-sm mt-4">Back to Shop</a>
    </div>
  {/if}
</div>

<style>
  .category-page {
    max-width: 80rem;
    margin: 0 auto;
    padding: 3rem 2rem 6rem;
  }

  .cat-header {
    margin-bottom: 3rem;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    margin-bottom: 1.5rem;
  }

  .breadcrumb a {
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    text-decoration: none;
    transition: color 120ms;
  }

  .breadcrumb a:hover {
    color: color-mix(in oklch, var(--color-base-content) 80%, transparent);
  }

  .cat-title {
    font-size: clamp(1.75rem, 4vw, 3rem);
    font-weight: 200;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-base-content);
    margin: 0 0 0.75rem;
  }

  .cat-desc {
    font-size: 0.9375rem;
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    margin: 0 0 0.75rem;
    max-width: 48ch;
  }

  .cat-count {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    margin: 0;
  }

  .active-filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .filter-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    border: var(--border) solid var(--color-base-300);
    color: color-mix(in oklch, var(--color-base-content) 80%, transparent);
    text-decoration: none;
    transition: border-color 120ms, color 120ms;
  }

  .filter-pill:hover {
    border-color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    color: var(--color-base-content);
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: transparent;
  }

  @media (min-width: 768px) {
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .empty-state {
    text-align: center;
    padding: 6rem 0;
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    font-size: 0.9375rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
