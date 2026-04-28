<script lang="ts">
  import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-svelte';
  import { cart } from '$lib/stores/cart.svelte.ts';
  import { formatPrice } from '$lib/utils/price';
  import { page } from '$app/state';

  function selectionsLabel(selections: Record<string, string>): string {
    return Object.entries(selections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }
</script>

<!-- Backdrop -->
{#if cart.open}
  <div class="cart-backdrop" onclick={() => cart.closeCart()} role="presentation" aria-hidden="true"></div>
{/if}

<!-- Aside panel -->
<aside class="cart-aside" class:cart-aside-open={cart.open} aria-label="Shopping cart" aria-hidden={!cart.open}>

  <!-- Header -->
  <div class="cart-header">
    <h2 class="cart-title">Your Cart ({cart.count})</h2>
    <button type="button" class="cart-close" onclick={() => cart.closeCart()} aria-label="Close cart">
      <X class="size-5" />
    </button>
  </div>

  <!-- Body -->
  <div class="cart-body">

    <!-- Login / guest card -->
    {#if !page.data.user}
      <div class="cart-login card">
        <p class="login-text">Have an account? Sign in for faster checkout.</p>
        <div class="login-actions">
          <a href="/signin" class="btn preset-filled-surface-950 btn-sm">Sign In</a>
          <button type="button" class="btn btn-sm guest-btn">Continue as Guest</button>
        </div>
      </div>
    {/if}

    <!-- Empty state -->
    {#if cart.items.length === 0}
      <div class="cart-empty">
        <ShoppingCart class="size-10 empty-icon" />
        <p>Your cart is empty.</p>
      </div>
    {/if}

    <!-- Item cards -->
    {#each cart.items as item (item.productId + JSON.stringify(item.selections))}
      <div class="cart-item card">
        <div class="item-image-wrap">
          {#if item.image}
            <img src={item.image} alt={item.name} class="item-image" />
          {:else}
            <div class="item-image-placeholder"></div>
          {/if}
        </div>

        <div class="item-details">
          <p class="item-name">{item.name}</p>
          {#if Object.keys(item.selections).length > 0}
            <p class="item-selections">{selectionsLabel(item.selections)}</p>
          {/if}
          <p class="item-price">
            {#if item.salePrice !== null}
              <span class="item-price-original">{formatPrice(item.basePrice)}</span>
              <span class="item-price-sale">{formatPrice(item.salePrice)}</span>
            {:else}
              {formatPrice(item.basePrice)}
            {/if}
          </p>
        </div>

        <div class="item-controls">
          <div class="qty-row">
            <button
              type="button"
              class="qty-btn"
              onclick={() => cart.updateQty(item.productId, item.selections, -1)}
              aria-label="Decrease quantity"
            >
              <Minus class="size-3" />
            </button>
            <span class="qty-val">{item.quantity}</span>
            <button
              type="button"
              class="qty-btn"
              onclick={() => cart.updateQty(item.productId, item.selections, 1)}
              aria-label="Increase quantity"
            >
              <Plus class="size-3" />
            </button>
          </div>
          <button
            type="button"
            class="remove-btn"
            onclick={() => cart.removeFromCart(item.productId, item.selections)}
            aria-label="Remove {item.name}"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
      </div>
    {/each}

    <!-- Gift options -->
    <button type="button" class="gift-btn" tabindex="-1" aria-disabled="true">
      🎁 Gift Options
    </button>

    <hr class="cart-divider" />

    <!-- Order Summary -->
    <h3 class="summary-heading">Order Summary</h3>
    <div class="summary-card card">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>{formatPrice(cart.subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Estimated tax</span>
        <span class="summary-tbd">—</span>
      </div>
      <hr class="summary-divider" />
      <div class="summary-row summary-total">
        <span>Estimated total</span>
        <span>{formatPrice(cart.subtotal)}</span>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="cart-footer">
    <button type="button" class="btn preset-filled-primary-500 checkout-btn" disabled>
      Proceed to Checkout
    </button>
    <button type="button" class="btn pickup-btn" disabled>
      Pick up instead
    </button>

    <hr class="cart-divider" />

    <p class="secure-label">🔒 Secure Payment</p>
    <div class="card-icons">
      <svg class="card-icon" viewBox="0 0 48 30" role="img" aria-label="Visa">
        <rect width="48" height="30" rx="4" fill="#1a1f71"/>
        <text x="24" y="20" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="sans-serif">VISA</text>
      </svg>
      <svg class="card-icon" viewBox="0 0 48 30" role="img" aria-label="Mastercard">
        <rect width="48" height="30" rx="4" fill="#252525"/>
        <circle cx="18" cy="15" r="9" fill="#eb001b" opacity="0.9"/>
        <circle cx="30" cy="15" r="9" fill="#f79e1b" opacity="0.9"/>
        <text x="24" y="28" text-anchor="middle" fill="white" font-size="5" font-family="sans-serif">MASTERCARD</text>
      </svg>
      <svg class="card-icon" viewBox="0 0 48 30" role="img" aria-label="Amex">
        <rect width="48" height="30" rx="4" fill="#2e77bc"/>
        <text x="24" y="20" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="sans-serif">AMEX</text>
      </svg>
      <svg class="card-icon" viewBox="0 0 48 30" role="img" aria-label="Discover">
        <rect width="48" height="30" rx="4" fill="#f76f20"/>
        <text x="24" y="20" text-anchor="middle" fill="white" font-size="7" font-weight="bold" font-family="sans-serif">DISCOVER</text>
      </svg>
    </div>
  </div>

</aside>

<style>
  .cart-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }

  .cart-aside {
    position: fixed;
    top: 0;
    right: 0;
    width: 24rem;
    max-width: 100vw;
    height: 100dvh;
    z-index: 50;
    display: flex;
    flex-direction: column;
    background: var(--body-background-color);
    border-left: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 12%, transparent);
    transform: translateX(100%);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(.dark) .cart-aside {
    background: var(--body-background-color-dark);
    border-left-color: color-mix(in oklch, var(--color-surface-50) 12%, transparent);
  }

  .cart-aside-open {
    transform: translateX(0);
  }

  /* Header */
  .cart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--spacing) * 5) calc(var(--spacing) * 5);
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
    flex-shrink: 0;
  }

  :global(.dark) .cart-header {
    border-bottom-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  .cart-title {
    font-size: 1.125rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0;
  }

  :global(.dark) .cart-title {
    color: var(--color-surface-50);
  }

  .cart-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-surface-500);
    border-radius: 9999px;
    transition: color 120ms, background 120ms;
  }

  .cart-close:hover {
    color: var(--color-surface-950);
    background: color-mix(in oklch, var(--color-surface-500) 10%, transparent);
  }

  :global(.dark) .cart-close:hover {
    color: var(--color-surface-50);
  }

  /* Body */
  .cart-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 4);
    padding: calc(var(--spacing) * 4);
  }

  /* Login card */
  .cart-login {
    padding: calc(var(--spacing) * 4);
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 3);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
  }

  :global(.dark) .cart-login {
    border-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  .login-text {
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-500);
    margin: 0;
  }

  .login-actions {
    display: flex;
    gap: calc(var(--spacing) * 2);
    flex-wrap: wrap;
  }

  .guest-btn {
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 25%, transparent);
    background: transparent;
    color: var(--color-surface-600);
  }

  :global(.dark) .guest-btn {
    border-color: color-mix(in oklch, var(--color-surface-50) 25%, transparent);
    color: var(--color-surface-300);
  }

  /* Empty state */
  .cart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--spacing) * 3);
    padding: calc(var(--spacing) * 12) 0;
    color: var(--color-surface-300);
    font-size: 0.875rem;
    font-family: var(--base-font-family);
  }

  .empty-icon {
    opacity: 0.4;
  }

  /* Item card */
  .cart-item {
    padding: calc(var(--spacing) * 3);
    display: flex;
    gap: calc(var(--spacing) * 3);
    align-items: flex-start;
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
  }

  :global(.dark) .cart-item {
    border-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  .item-image-wrap {
    flex-shrink: 0;
    width: 4rem;
    height: 4rem;
    overflow: hidden;
    background: color-mix(in oklch, var(--color-surface-500) 8%, transparent);
  }

  .item-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-image-placeholder {
    width: 100%;
    height: 100%;
  }

  .item-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 1);
  }

  .item-name {
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    font-weight: 500;
    color: var(--color-surface-900);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.dark) .item-name {
    color: var(--color-surface-100);
  }

  .item-selections {
    font-size: 0.6875rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-400);
    margin: 0;
  }

  .item-price {
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-700);
    margin: 0;
    display: flex;
    gap: calc(var(--spacing) * 2);
    align-items: center;
  }

  :global(.dark) .item-price {
    color: var(--color-surface-200);
  }

  .item-price-original {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .item-price-sale {
    color: var(--color-error-600);
  }

  :global(.dark) .item-price-sale {
    color: var(--color-error-400);
  }

  .item-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: calc(var(--spacing) * 2);
    flex-shrink: 0;
  }

  .qty-row {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 1);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 15%, transparent);
  }

  :global(.dark) .qty-row {
    border-color: color-mix(in oklch, var(--color-surface-50) 15%, transparent);
  }

  .qty-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-surface-500);
    transition: color 120ms, background 120ms;
  }

  .qty-btn:hover {
    background: color-mix(in oklch, var(--color-surface-500) 10%, transparent);
    color: var(--color-surface-950);
  }

  :global(.dark) .qty-btn:hover {
    color: var(--color-surface-50);
  }

  .qty-val {
    min-width: 1.5rem;
    text-align: center;
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-700);
  }

  :global(.dark) .qty-val {
    color: var(--color-surface-200);
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-surface-300);
    transition: color 120ms;
    border-radius: 9999px;
  }

  .remove-btn:hover {
    color: var(--color-error-500);
  }

  /* Gift options */
  .gift-btn {
    align-self: flex-start;
    background: none;
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 15%, transparent);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 4);
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-400);
    cursor: default;
    opacity: 0.7;
  }

  :global(.dark) .gift-btn {
    border-color: color-mix(in oklch, var(--color-surface-50) 15%, transparent);
  }

  .cart-divider {
    border: none;
    border-top: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
    margin: 0;
  }

  :global(.dark) .cart-divider {
    border-top-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  /* Order summary */
  .summary-heading {
    font-size: 0.875rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-700);
    margin: 0;
  }

  :global(.dark) .summary-heading {
    color: var(--color-surface-300);
  }

  .summary-card {
    padding: calc(var(--spacing) * 4);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 3);
  }

  :global(.dark) .summary-card {
    border-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-600);
  }

  :global(.dark) .summary-row {
    color: var(--color-surface-300);
  }

  .summary-tbd {
    color: var(--color-surface-300);
  }

  .summary-divider {
    border: none;
    border-top: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
    margin: 0;
  }

  :global(.dark) .summary-divider {
    border-top-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  .summary-total {
    font-weight: 600;
    color: var(--color-surface-900);
  }

  :global(.dark) .summary-total {
    color: var(--color-surface-50);
  }

  /* Footer */
  .cart-footer {
    flex-shrink: 0;
    padding: calc(var(--spacing) * 4);
    border-top: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 10%, transparent);
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 3);
  }

  :global(.dark) .cart-footer {
    border-top-color: color-mix(in oklch, var(--color-surface-50) 10%, transparent);
  }

  .checkout-btn {
    width: 100%;
    padding: calc(var(--spacing) * 3.5);
    font-size: 0.875rem;
    font-family: var(--base-font-family);
  }

  .pickup-btn {
    width: 100%;
    padding: calc(var(--spacing) * 3);
    font-size: 0.875rem;
    font-family: var(--base-font-family);
    background: transparent;
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-950) 25%, transparent);
    color: var(--color-surface-600);
  }

  :global(.dark) .pickup-btn {
    border-color: color-mix(in oklch, var(--color-surface-50) 25%, transparent);
    color: var(--color-surface-300);
  }

  .secure-label {
    font-size: 0.75rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-400);
    text-align: center;
    margin: 0;
  }

  .card-icons {
    display: flex;
    justify-content: center;
    gap: calc(var(--spacing) * 2);
  }

  .card-icon {
    width: 3rem;
    height: 1.875rem;
    border-radius: 4px;
    display: block;
  }
</style>
