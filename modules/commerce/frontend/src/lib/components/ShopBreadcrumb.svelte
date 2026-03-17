<script lang="ts">
  import { page } from '$app/stores';

  type Category = { id: string; slug: string; name: string };
  let { categories }: { categories: Category[] } = $props();

  function slugToTitle(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const categoryName = $derived(
    $page.params.category
      ? (categories.find(c => c.slug === $page.params.category)?.name ?? slugToTitle($page.params.category))
      : null
  );

  const productName = $derived(
    $page.params.slug ? slugToTitle($page.params.slug) : null
  );
</script>

<nav class="breadcrumb-bar" aria-label="Breadcrumb">
  <div class="breadcrumb-inner">
    <a href="/shop" class="crumb-link">Shop</a>

    {#if categoryName}
      <span class="crumb-sep" aria-hidden="true">/</span>
      {#if productName}
        <a href="/shop/{$page.params.category}" class="crumb-link">{categoryName}</a>
      {:else}
        <span class="crumb-current">{categoryName}</span>
      {/if}
    {/if}

    {#if productName}
      <span class="crumb-sep" aria-hidden="true">/</span>
      <span class="crumb-current">{productName}</span>
    {/if}
  </div>
</nav>

<style>
  .breadcrumb-bar {
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-300) 25%, transparent);
    background: var(--body-background-color);
  }

  .breadcrumb-inner {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
    max-width: 80rem;
    margin: 0 auto;
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 8);
    font-size: 0.75rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  .crumb-link {
    color: var(--color-surface-300);
    text-decoration: none;
    transition: color 120ms;
  }

  .crumb-link:hover {
    color: var(--color-surface-950);
    text-decoration: var(--anchor-text-decoration-hover);
  }

  .crumb-sep {
    color: var(--color-surface-200);
    user-select: none;
  }

  .crumb-current {
    color: var(--color-surface-950);
  }

  :global(.dark) .breadcrumb-bar {
    background: var(--body-background-color-dark);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .crumb-link {
    color: var(--color-surface-100);
  }

  :global(.dark) .crumb-link:hover {
    color: var(--color-surface-50);
  }

  :global(.dark) .crumb-sep {
    color: var(--color-surface-200);
  }

  :global(.dark) .crumb-current {
    color: var(--color-surface-50);
  }
</style>
