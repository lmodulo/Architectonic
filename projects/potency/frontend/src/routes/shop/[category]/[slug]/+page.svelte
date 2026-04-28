<script lang="ts">
  import type { PageData } from './$types';
  import { activeDiscount, applyDiscount, formatPrice } from '$lib/utils/price';
  import { page } from '$app/state';
  import { cart } from '$lib/stores/cart.svelte.ts';

  let { data }: { data: PageData } = $props();

  const product = $derived(data.product);

  let activeImage = $state<string | null>(null);
  $effect(() => {
    activeImage = product.images?.[0] ?? null;
  });

  let selections = $state<Record<string, string>>({});

  const sale = $derived(activeDiscount(product.discounts ?? []));
  const salePrice = $derived(sale ? applyDiscount(product.basePrice, sale) : null);

  const totalStock = $derived(
    (product.variants ?? []).reduce((sum: number, v: { stock: number }) => sum + v.stock, 0)
  );

  function selectVariant(optionName: string, value: string) {
    selections = { ...selections, [optionName]: value };
  }

  const selectionsMet = $derived(
    !product.variantOptions?.length ||
    product.variantOptions.every((opt: { name: string }) => selections[opt.name])
  );

  function handleAddToCart() {
    cart.addToCart({
      productId: product._id,
      slug: product.slug,
      categorySlug: page.params.category,
      name: product.name,
      image: product.images?.[0] ?? null,
      basePrice: product.basePrice,
      salePrice,
      selections,
    });
    cart.openCart();
  }
</script>

<svelte:head>
  <title>{product.name} — Shop</title>
</svelte:head>

<div class="product-page">
  <div class="product-split">
    <!-- LEFT: Image gallery -->
    <div class="gallery-col">
      <div class="gallery-primary">
        {#if activeImage}
          <img src={activeImage} alt={product.name} class="primary-img" />
        {:else}
          <div class="primary-placeholder"></div>
        {/if}

        {#if sale}
          <span class="sale-badge-lg">
            {sale.type === 'percentage' ? `-${sale.value}%` : 'SALE'}
          </span>
        {/if}
      </div>

      {#if product.images?.length > 1}
        <div class="gallery-thumbs">
          {#each product.images as img, i (i)}
            <button
              type="button"
              class="thumb-btn"
              class:thumb-active={activeImage === img}
              onclick={() => (activeImage = img)}
              aria-label="View image {i + 1}"
            >
              <img src={img} alt="{product.name} view {i + 1}" class="thumb-img" />
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- RIGHT: Product details -->
    <div class="details-col">
      <h1 class="product-name">{product.name}</h1>

      <div class="price-block">
        {#if salePrice !== null}
          <span class="price-original">{formatPrice(product.basePrice)}</span>
          <span class="price-sale">{formatPrice(salePrice)}</span>
        {:else}
          <span class="price-base">{formatPrice(product.basePrice)}</span>
        {/if}
      </div>

      {#if product.description}
        <p class="product-desc">{product.description}</p>
      {/if}

      {#if product.variantOptions?.length > 0}
        <div class="variants-block">
          {#each product.variantOptions as opt (opt.name)}
            <div class="variant-group">
              <p class="variant-label">
                {opt.name}
                {#if selections[opt.name]}
                  <span class="variant-selected">— {selections[opt.name]}</span>
                {/if}
              </p>
              <div class="variant-options">
                {#each opt.values as val (val)}
                  <button
                    type="button"
                    class="variant-btn"
                    class:variant-btn-active={selections[opt.name] === val}
                    onclick={() => selectVariant(opt.name, val)}
                  >
                    {val}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <button
        type="button"
        class="btn preset-filled-primary-500 add-to-cart"
        disabled={!selectionsMet || totalStock === 0}
        onclick={handleAddToCart}
      >
        Add to Cart
      </button>
      {#if !selectionsMet && product.variantOptions?.length > 0}
        <p class="cart-note">Select all options to add to cart</p>
      {/if}

      <div class="product-meta">
        {#if totalStock > 0}
          <p class="stock-info">In stock</p>
        {:else}
          <p class="stock-info stock-out">Out of stock</p>
        {/if}

        {#if product.tags?.length > 0}
          <div class="tags-row">
            {#each product.tags as tag (tag)}
              <a href="/shop?tag={encodeURIComponent(tag)}" class="tag-pill">{tag}</a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .product-page {
    max-width: 80rem;
    margin: 0 auto;
    padding: calc(var(--spacing) * 10) calc(var(--spacing) * 8) calc(var(--spacing) * 24);
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  .product-split {
    display: grid;
    grid-template-columns: 1fr;
    gap: calc(var(--spacing) * 12);
  }

  @media (min-width: 1024px) {
    .product-split {
      grid-template-columns: 1fr 1fr;
      gap: calc(var(--spacing) * 20);
      align-items: start;
    }
  }

  .gallery-col {
    position: sticky;
    top: calc(3.5rem + var(--spacing) * 4);
  }

  .gallery-primary {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    background: color-mix(in oklch, var(--color-surface-950) 5%, transparent);
    margin-bottom: calc(var(--spacing) * 3);
  }

  .primary-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .primary-placeholder {
    width: 100%;
    height: 100%;
    background: color-mix(in oklch, var(--color-surface-950) 6%, transparent);
  }

  .sale-badge-lg {
    position: absolute;
    top: calc(var(--spacing) * 4);
    right: calc(var(--spacing) * 4);
    padding: calc(var(--spacing) * 1) calc(var(--spacing) * 3);
    font-size: 0.75rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    background: var(--color-error-500);
    color: white;
  }

  .gallery-thumbs {
    display: flex;
    gap: calc(var(--spacing) * 2);
    flex-wrap: wrap;
  }

  .thumb-btn {
    width: calc(var(--spacing) * 18);
    height: calc(var(--spacing) * 18);
    padding: 0;
    border: var(--default-border-width) solid transparent;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 120ms;
    background: none;
    flex-shrink: 0;
  }

  .thumb-btn.thumb-active {
    border-color: var(--color-surface-950);
  }

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .details-col {
    padding-top: calc(var(--spacing) * 2);
  }

  .product-name {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0 0 calc(var(--spacing) * 5);
  }

  .price-block {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 3);
    margin-bottom: calc(var(--spacing) * 6);
  }

  .price-base {
    font-size: 1.25rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-surface-700);
  }

  .price-original {
    font-size: 1.125rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    text-decoration: line-through;
    opacity: 0.5;
    color: var(--color-surface-500);
  }

  .price-sale {
    font-size: 1.25rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-error-600);
  }

  .product-desc {
    font-size: 0.9375rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    line-height: 1.7;
    color: var(--color-surface-400);
    margin: 0 0 calc(var(--spacing) * 8);
    white-space: pre-wrap;
  }

  .variants-block {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 6);
    margin-bottom: calc(var(--spacing) * 8);
  }

  .variant-label {
    font-size: 0.75rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-surface-400);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .variant-selected {
    color: var(--color-surface-300);
  }

  .variant-options {
    display: flex;
    gap: calc(var(--spacing) * 2);
    flex-wrap: wrap;
  }

  .variant-btn {
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 4);
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 20%, transparent);
    background: transparent;
    color: var(--color-surface-500);
    cursor: pointer;
    transition: border-color 120ms, color 120ms, background 120ms;
  }

  .variant-btn:hover {
    border-color: color-mix(in oklch, var(--color-surface-950) 50%, transparent);
    color: var(--color-surface-950);
  }

  .variant-btn.variant-btn-active {
    border-color: var(--color-surface-950);
    background: var(--color-surface-950);
    color: white;
  }

  .add-to-cart {
    width: 100%;
    padding: calc(var(--spacing) * 4);
    font-size: 0.875rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    margin-bottom: calc(var(--spacing) * 2);
  }

  .cart-note {
    font-size: 0.75rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-200);
    text-align: center;
    margin: 0 0 calc(var(--spacing) * 8);
  }

  .product-meta {
    border-top: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 12%, transparent);
    padding-top: calc(var(--spacing) * 6);
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 4);
  }

  .stock-info {
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-success-700);
    margin: 0;
  }

  .stock-out {
    color: var(--color-error-500);
  }

  .tags-row {
    display: flex;
    gap: calc(var(--spacing) * 2);
    flex-wrap: wrap;
  }

  .tag-pill {
    padding: calc(var(--spacing) * 1) calc(var(--spacing) * 3);
    font-size: 0.6875rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 20%, transparent);
    color: var(--color-surface-400);
    text-decoration: none;
    transition: border-color 120ms, color 120ms;
  }

  .tag-pill:hover {
    border-color: color-mix(in oklch, var(--color-surface-950) 50%, transparent);
    color: var(--color-surface-700);
  }

  :global(.dark) .product-name {
    color: var(--color-surface-50);
  }

  :global(.dark) .price-base {
    color: var(--color-surface-100);
  }

  :global(.dark) .price-sale {
    color: var(--color-error-400);
  }

  :global(.dark) .product-desc {
    color: var(--color-surface-200);
  }

  :global(.dark) .gallery-primary,
  :global(.dark) .primary-placeholder {
    background: color-mix(in oklch, var(--color-surface-50) 8%, transparent);
  }

  :global(.dark) .thumb-btn.thumb-active {
    border-color: var(--color-surface-50);
  }

  :global(.dark) .variant-btn {
    border-color: color-mix(in oklch, var(--color-surface-50) 20%, transparent);
    color: var(--color-surface-200);
  }

  :global(.dark) .variant-btn:hover {
    border-color: color-mix(in oklch, var(--color-surface-50) 50%, transparent);
    color: var(--color-surface-50);
  }

  :global(.dark) .variant-btn.variant-btn-active {
    border-color: var(--color-surface-50);
    background: var(--color-surface-50);
    color: var(--color-surface-950);
  }

  :global(.dark) .product-meta {
    border-top-color: color-mix(in oklch, var(--color-surface-50) 12%, transparent);
  }

  :global(.dark) .tag-pill {
    border-color: color-mix(in oklch, var(--color-surface-50) 20%, transparent);
    color: var(--color-surface-300);
  }

  :global(.dark) .tag-pill:hover {
    border-color: color-mix(in oklch, var(--color-surface-50) 50%, transparent);
    color: var(--color-surface-100);
  }
</style>
