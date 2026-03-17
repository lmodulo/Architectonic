<script lang="ts">
  import { activeDiscount, applyDiscount, discountLabel, formatPrice } from '$lib/utils/price';
  import type { Discount } from '$lib/utils/price';

  type Product = {
    id: string;
    name: string;
    slug: string;
    category: string;
    basePrice: number;
    images: string[];
    discounts: Discount[];
  };

  let { product, categorySlug }: { product: Product; categorySlug: string } = $props();

  const sale = $derived(activeDiscount(product.discounts ?? []));
  const badge = $derived(sale ? discountLabel(sale) : null);
  const salePrice = $derived(sale ? applyDiscount(product.basePrice, sale) : null);
</script>

<a href="/shop/{categorySlug}/{product.slug}" class="product-card group">
  <div class="card-image">
    {#if product.images?.[0]}
      <img src={product.images[0]} alt={product.name} class="card-img" loading="lazy" />
    {:else}
      <div class="card-placeholder"></div>
    {/if}

    {#if badge}
      <span class="sale-badge">{badge}</span>
    {/if}
  </div>

  <div class="card-info">
    <p class="card-name">{product.name}</p>
    <p class="card-price">
      {#if salePrice !== null}
        <span class="price-original">{formatPrice(product.basePrice)}</span>
        <span class="price-sale">{formatPrice(salePrice)}</span>
      {:else}
        {formatPrice(product.basePrice)}
      {/if}
    </p>
  </div>
</a>

<style>
  .product-card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: transparent;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  .card-image {
    position: relative;
    overflow: hidden;
    aspect-ratio: 3 / 4;
    background: color-mix(in oklch, var(--color-surface-950) 5%, transparent);
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .product-card:hover .card-img {
    transform: scale(1.04);
  }

  .card-placeholder {
    width: 100%;
    height: 100%;
    background: color-mix(in oklch, var(--color-surface-950) 6%, transparent);
  }

  .sale-badge {
    position: absolute;
    top: calc(var(--spacing) * 3);
    right: calc(var(--spacing) * 3);
    padding: calc(var(--spacing) * 1) calc(var(--spacing) * 2);
    font-size: 0.6875rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    background: var(--color-error-500);
    color: white;
    pointer-events: none;
  }

  .card-info {
    padding: calc(var(--spacing) * 4) calc(var(--spacing) * 1) calc(var(--spacing) * 5);
  }

  .card-name {
    font-size: 0.875rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-surface-950);
    margin: 0 0 calc(var(--spacing) * 1);
  }

  .card-price {
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-surface-300);
    margin: 0;
    display: flex;
    gap: calc(var(--spacing) * 2);
    align-items: center;
  }

  .price-original {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .price-sale {
    color: var(--color-error-600);
  }


  :global(.dark) .card-image {
    background: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  :global(.dark) .card-placeholder {
    background: color-mix(in oklch, var(--color-surface-50) 8%, transparent);
  }

  :global(.dark) .card-name {
    color: var(--color-surface-50);
  }

  :global(.dark) .price-sale {
    color: var(--color-error-400);
  }
</style>
