<script lang="ts">
  import type { LayoutData } from './$types';

  let { data }: { data: LayoutData } = $props();

  const categories = $derived(data.meta?.categories ?? []);
</script>

<svelte:head>
  <title>Shop</title>
</svelte:head>

<div class="shop-landing">
  <header class="landing-header">
    <h1 class="landing-title">Shop</h1>
    <p class="landing-sub">Explore our collections</p>
  </header>

  {#if categories.length > 0}
    <div class="category-grid">
      {#each categories as cat (cat.id)}
        <a href="/shop/{cat.slug}" class="category-card group">
          <div class="cat-image">
            {#if cat.image}
              <img src={cat.image} alt={cat.name} class="cat-img" loading="lazy" />
            {:else}
              <div class="cat-placeholder"></div>
            {/if}
          </div>
          <div class="cat-info">
            <p class="cat-name">{cat.name}</p>
            {#if cat.description}
              <p class="cat-desc">{cat.description}</p>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>No categories available yet.</p>
    </div>
  {/if}
</div>

<style>
  .shop-landing {
    max-width: 80rem;
    margin: 0 auto;
    padding: 4rem 2rem 6rem;
  }

  .landing-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .landing-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 200;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-surface-900);
    margin: 0 0 0.5rem;
  }

  .landing-sub {
    font-size: 0.9375rem;
    color: var(--color-surface-400);
    margin: 0;
    letter-spacing: 0.04em;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--color-surface-200);
  }

  @media (min-width: 768px) {
    .category-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .category-card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: var(--color-surface-50);
  }

  .cat-image {
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background: var(--color-surface-100);
  }

  .cat-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .category-card:hover .cat-img {
    transform: scale(1.03);
  }

  .cat-placeholder {
    width: 100%;
    height: 100%;
    background: var(--color-surface-200);
    transition: transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .category-card:hover .cat-placeholder {
    transform: scale(1.03);
  }

  .cat-info {
    padding: 1.25rem 0.25rem 1.75rem;
  }

  .cat-name {
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--color-surface-900);
    margin: 0 0 0.25rem;
    text-transform: uppercase;
    font-size: 0.8125rem;
  }

  .cat-desc {
    font-size: 0.8125rem;
    color: var(--color-surface-500);
    margin: 0;
  }

  .empty-state {
    text-align: center;
    padding: 6rem 0;
    color: var(--color-surface-400);
    font-size: 0.9375rem;
  }

  :global(.dark) .landing-title {
    color: var(--color-surface-100);
  }

  :global(.dark) .category-card {
    background: var(--color-surface-900);
  }

  :global(.dark) .cat-image {
    background: var(--color-surface-800);
  }

  :global(.dark) .cat-placeholder {
    background: var(--color-surface-800);
  }

  :global(.dark) .cat-name {
    color: var(--color-surface-100);
  }

  :global(.dark) .category-grid {
    background: var(--color-surface-800);
  }
</style>
