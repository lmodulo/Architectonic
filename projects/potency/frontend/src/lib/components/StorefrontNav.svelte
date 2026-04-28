<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { Sun, Moon, Menu, X, ShoppingCart } from 'lucide-svelte';
  import { cart } from '$lib/stores/cart.svelte.ts';
  import Logo from '$lib/components/Logo.svelte';
  import { brand } from '$lib/config/logo';

  const branding = getContext<{ name: string; logo: string }>('appBranding') ?? { name: brand.text, logo: '' };

  type Category = { id: string; slug: string; name: string };
  type Meta = { categories: Category[]; variantTypes: string[]; tags: string[] };

  let { meta }: { meta: Meta } = $props();

  let isDark = $state(false);
  let mobileOpen = $state(false);

  const extraLinks = [
    { href: '/about-me', label: 'About Me' },
    { href: '/affiliates', label: 'Affiliates' },
    { href: '/upcoming-events', label: 'Upcoming Events' },
  ];

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
  }

  function closeMobile() {
    mobileOpen = false;
  }
</script>

<nav class="storefront-nav">
  <!-- Left: brand -->
  <div class="nav-brand-zone">
    <a href="/" class="nav-brand" onclick={closeMobile}>
      <Logo name={branding.name} logo={branding.logo} />
    </a>
  </div>

  <!-- Center: primary links (desktop only) -->
  <div class="nav-center-zone">

    <!-- Products with hover mega-menu -->
    <div class="products-trigger">
      <a href="/shop" class="nav-link">Products</a>

      <div class="mega-menu" role="dialog" aria-label="Products menu">
        <div class="mega-inner">
          <div class="mega-col">
            <p class="mega-heading">Categories</p>
            <ul>
              {#each meta.categories as cat (cat.id)}
                <li><a href="/shop/{cat.slug}" class="mega-link">{cat.name}</a></li>
              {/each}
              {#if meta.categories.length === 0}
                <li class="mega-empty">No categories yet</li>
              {/if}
            </ul>
          </div>

          <div class="mega-col">
            <p class="mega-heading">Shop by Type</p>
            <ul>
              {#each meta.variantTypes as vt (vt)}
                <li><a href="/shop?variant={encodeURIComponent(vt)}" class="mega-link">{vt}</a></li>
              {/each}
              {#if meta.variantTypes.length === 0}
                <li class="mega-empty">—</li>
              {/if}
            </ul>
          </div>

          <div class="mega-col">
            <p class="mega-heading">Collections</p>
            <ul>
              {#each meta.tags as tag (tag)}
                <li><a href="/shop?tag={encodeURIComponent(tag)}" class="mega-link">{tag}</a></li>
              {/each}
              {#if meta.tags.length === 0}
                <li class="mega-empty">—</li>
              {/if}
            </ul>
          </div>
        </div>
      </div>
    </div>

    {#each extraLinks as link}
      <a href={link.href} class="nav-link">{link.label}</a>
    {/each}

  </div>

  <!-- Right: controls -->
  <div class="nav-trail-zone">
    <button
      type="button"
      class="theme-toggle"
      onclick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {#if isDark}
        <Sun class="size-4" />
      {:else}
        <Moon class="size-4" />
      {/if}
    </button>

    <button type="button" class="cart-btn" onclick={() => cart.openCart()} aria-label="Open cart">
      <ShoppingCart class="size-5" />
      {#if cart.count > 0}
        <span class="cart-badge">{cart.count > 99 ? '99+' : cart.count}</span>
      {/if}
    </button>

    <a href="/signin" class="btn preset-filled-primary-500 btn-sm nav-signin">Sign In</a>

    <!-- Mobile hamburger -->
    <button
      type="button"
      class="hamburger"
      onclick={() => (mobileOpen = !mobileOpen)}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
    >
      {#if mobileOpen}
        <X class="size-5" />
      {:else}
        <Menu class="size-5" />
      {/if}
    </button>
  </div>
</nav>

<!-- Mobile dropdown -->
{#if mobileOpen}
  <div class="mobile-menu" role="dialog" aria-label="Navigation">
    <a href="/shop" class="mobile-link" onclick={closeMobile}>Products</a>
    {#each extraLinks as link}
      <a href={link.href} class="mobile-link" onclick={closeMobile}>{link.label}</a>
    {/each}
    <div class="mobile-divider"></div>
    <button type="button" class="mobile-link mobile-cart-link" onclick={() => { closeMobile(); cart.openCart(); }}>
      <ShoppingCart class="size-4" />
      Cart
      {#if cart.count > 0}
        <span class="mobile-cart-badge">{cart.count > 99 ? '99+' : cart.count}</span>
      {/if}
    </button>
    <a href="/signin" class="mobile-link mobile-signin" onclick={closeMobile}>Sign In</a>
  </div>
{/if}

<style>
  .storefront-nav {
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 3.5rem;
    padding: 0 calc(var(--spacing) * 4);
    background: color-mix(in oklch, var(--body-background-color) 94%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-300) 25%, transparent);
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  .nav-brand-zone {
    display: flex;
    align-items: center;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
    text-decoration: none;
  }

  /* Desktop center links */
  .nav-center-zone {
    display: none;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 1);
    align-self: stretch;
  }

  @media (min-width: 768px) {
    .nav-center-zone {
      display: flex;
    }
  }

  .nav-trail-zone {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: calc(var(--spacing) * 3);
  }

  /* Sign In hidden on mobile */
  .nav-signin {
    display: none;
  }

  @media (min-width: 768px) {
    .nav-signin {
      display: inline-flex;
    }
  }

  /* Products trigger — stretches full nav height so there's no gap above the mega menu */
  .products-trigger {
    align-self: stretch;
    display: flex;
    align-items: center;
    position: relative;
  }

  /* Mega menu — hidden until .products-trigger is hovered */
  .mega-menu {
    display: none;
    position: fixed;
    top: 3.5rem;
    left: 0;
    right: 0;
    z-index: 60;
    background: color-mix(in oklch, var(--body-background-color) 97%, transparent);
    backdrop-filter: blur(16px);
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-300) 25%, transparent);
    box-shadow: 0 calc(var(--spacing) * 8) calc(var(--spacing) * 8) color-mix(in oklch, var(--color-surface-950) 6%, transparent);
  }

  .products-trigger:hover .mega-menu {
    display: block;
  }

  .mega-inner {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    max-width: 72rem;
    margin: 0 auto;
    padding: calc(var(--spacing) * 10) calc(var(--spacing) * 8);
  }

  .mega-col {
    padding: 0 calc(var(--spacing) * 8);
    border-right: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-300) 20%, transparent);
  }

  .mega-col:first-child { padding-left: 0; }
  .mega-col:last-child  { border-right: none; }

  .mega-heading {
    font-size: 0.6875rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-surface-200);
    margin: 0 0 calc(var(--spacing) * 4);
  }

  .mega-col ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 3);
  }

  .mega-link {
    font-size: 0.9375rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    color: var(--color-surface-400);
    text-decoration: none;
    transition: color 120ms;
  }

  .mega-link:hover {
    color: var(--color-surface-950);
  }

  .mega-empty {
    font-size: 0.875rem;
    font-family: var(--base-font-family);
    color: var(--color-surface-200);
  }

  .nav-link {
    display: block;
    font-size: 0.8125rem;
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    text-decoration: none;
    color: var(--color-surface-500);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
    transition: color 150ms;
  }

  .nav-link:hover {
    color: var(--color-surface-950);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: var(--radius-base);
    border: none;
    background: transparent;
    color: var(--color-surface-500);
    cursor: pointer;
    transition: background 150ms, color 150ms;
  }

  .theme-toggle:hover {
    background: color-mix(in oklch, var(--color-surface-300) 15%, transparent);
    color: var(--color-surface-950);
  }

  .cart-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: var(--radius-base);
    border: none;
    background: transparent;
    color: var(--color-surface-500);
    cursor: pointer;
    transition: background 150ms, color 150ms;
  }

  .cart-btn:hover {
    background: color-mix(in oklch, var(--color-surface-300) 15%, transparent);
    color: var(--color-surface-950);
  }

  .cart-badge {
    position: absolute;
    top: -0.125rem;
    right: -0.125rem;
    min-width: 14px;
    height: 14px;
    padding: 0 2px;
    border-radius: 9999px;
    background: var(--color-error-500);
    color: white;
    font-size: 10px;
    line-height: 14px;
    text-align: center;
    font-family: var(--base-font-family);
    font-weight: 600;
  }

  .mobile-cart-link {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }

  .mobile-cart-badge {
    margin-left: auto;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9999px;
    background: var(--color-error-500);
    color: white;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
    font-family: var(--base-font-family);
    font-weight: 600;
  }

  /* Hamburger hidden on desktop */
  .hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: var(--radius-base);
    border: none;
    background: transparent;
    color: var(--color-surface-500);
    cursor: pointer;
    transition: background 150ms, color 150ms;
  }

  .hamburger:hover {
    background: color-mix(in oklch, var(--color-surface-300) 15%, transparent);
    color: var(--color-surface-950);
  }

  @media (min-width: 768px) {
    .hamburger {
      display: none;
    }
  }

  /* Mobile dropdown */
  .mobile-menu {
    position: fixed;
    inset-inline: 0;
    top: 3.5rem;
    z-index: 49;
    display: flex;
    flex-direction: column;
    background: color-mix(in oklch, var(--body-background-color) 97%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-300) 25%, transparent);
    padding: calc(var(--spacing) * 2) 0;
    font-family: var(--base-font-family);
  }

  @media (min-width: 768px) {
    .mobile-menu {
      display: none;
    }
  }

  .mobile-link {
    font-size: 0.9375rem;
    text-decoration: none;
    color: var(--color-surface-600);
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 6);
    transition: background 150ms, color 150ms;
  }

  .mobile-link:hover {
    background: color-mix(in oklch, var(--color-surface-500) 8%, transparent);
    color: var(--color-surface-950);
  }

  .mobile-divider {
    height: var(--default-border-width);
    background: color-mix(in oklch, var(--color-surface-300) 25%, transparent);
    margin: calc(var(--spacing) * 2) 0;
  }

  .mobile-signin {
    color: var(--color-primary-500);
    font-weight: 500;
  }

  /* ── Dark mode ─────────────────────────────────────────── */
  :global(.dark) .storefront-nav {
    background: color-mix(in oklch, var(--body-background-color-dark) 90%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .nav-link {
    color: var(--color-surface-300);
  }

  :global(.dark) .nav-link:hover {
    color: var(--color-surface-50);
  }

  :global(.dark) .mega-menu {
    background: color-mix(in oklch, var(--body-background-color-dark) 95%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .mega-col {
    border-right-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .mega-link {
    color: var(--color-surface-100);
  }

  :global(.dark) .mega-link:hover {
    color: var(--color-surface-50);
  }

  :global(.dark) .theme-toggle {
    color: var(--color-surface-300);
  }

  :global(.dark) .theme-toggle:hover {
    background: color-mix(in oklch, var(--color-surface-700) 50%, transparent);
    color: var(--color-surface-50);
  }

  :global(.dark) .cart-btn {
    color: var(--color-surface-300);
  }

  :global(.dark) .cart-btn:hover {
    background: color-mix(in oklch, var(--color-surface-700) 50%, transparent);
    color: var(--color-surface-50);
  }

  :global(.dark) .hamburger {
    color: var(--color-surface-300);
  }

  :global(.dark) .hamburger:hover {
    background: color-mix(in oklch, var(--color-surface-700) 50%, transparent);
    color: var(--color-surface-50);
  }

  :global(.dark) .mobile-menu {
    background: color-mix(in oklch, var(--body-background-color-dark) 95%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .mobile-link {
    color: var(--color-surface-200);
  }

  :global(.dark) .mobile-link:hover {
    background: color-mix(in oklch, var(--color-surface-300) 8%, transparent);
    color: var(--color-surface-50);
  }

  :global(.dark) .mobile-divider {
    background: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }
</style>
