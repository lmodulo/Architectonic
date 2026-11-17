<script lang="ts">
  import { fade } from 'svelte/transition';
  import { page } from '$app/state';
  import Logo from '$lib/components/Logo.svelte';

  // Brand and user come from the root layout load (Settings → Brand; brand keys are public).
  const brandName = $derived((page.data.brandName as string | null) ?? '');
  const brandLogo = $derived((page.data.brandLogo as string | null) ?? '');
  const wordmark  = $derived((page.data.appName as string | null) || 'Shop');
  const user      = $derived(page.data.user ?? null);

  // The storefront's menu: categories (/shop/<category>) and tags (/shop?tag=…), from GET /storefront/meta.
  // Its links are the URLs ShopComponent's storefront serves (routes/shop/[...rest]).
  type Category = { id: string; slug: string; name: string };
  type Meta = { categories: Category[]; tags: string[] };

  let { meta }: { meta: Meta } = $props();

  // Colors come from the active DaisyUI theme (Settings → Theme), so there is no
  // per-visitor light/dark toggle here.
  let menuOpen = $state(false);
  let navEl: HTMLElement | null = $state(null);

  function handleClickOutside(e: MouseEvent) {
    if (menuOpen && navEl && !navEl.contains(e.target as Node)) {
      menuOpen = false;
    }
  }

  function closeMenu() {
    menuOpen = false;
  }
</script>

<svelte:window onmousedown={handleClickOutside} />

<nav class="storefront-nav" bind:this={navEl} onmouseleave={() => (menuOpen = false)}>
  <!-- Left: brand -->
  <div class="nav-brand-zone">
    <a href="/" class="nav-brand" onclick={closeMenu}>
      {#if brandName || brandLogo}
        <Logo {brandName} {brandLogo} />
      {:else}
        <span class="nav-wordmark">{wordmark}</span>
      {/if}
    </a>
  </div>

  <!-- Center: primary links -->
  <div class="nav-center-zone">
    <div class="products-trigger" onmouseenter={() => (menuOpen = true)}>
      <a href="/shop" class="nav-link" onclick={closeMenu}>Products</a>

      {#if menuOpen}
        <div class="mega-menu" role="dialog" aria-label="Products menu" transition:fade={{ duration: 150 }}>
          <div class="mega-inner">
            <div class="mega-col">
              <p class="mega-heading">Categories</p>
              <ul>
                {#each meta.categories as cat (cat.id)}
                  <li><a href="/shop/{cat.slug}" class="mega-link" onclick={closeMenu}>{cat.name}</a></li>
                {/each}
                {#if meta.categories.length === 0}
                  <li class="mega-empty">No categories yet</li>
                {/if}
              </ul>
            </div>

            <div class="mega-col">
              <p class="mega-heading">Collections</p>
              <ul>
                {#each meta.tags as tag (tag)}
                  <li><a href="/shop?tag={encodeURIComponent(tag)}" class="mega-link" onclick={closeMenu}>{tag}</a></li>
                {/each}
                {#if meta.tags.length === 0}
                  <li class="mega-empty">—</li>
                {/if}
              </ul>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Right: controls -->
  <div class="nav-trail-zone">
    {#if user}
      <a href={user.role === 'customer' ? '/profile' : '/dashboard'} class="btn btn-primary btn-sm">
        {user.role === 'customer' ? 'My Account' : 'Dashboard'}
      </a>
    {:else}
      <a href="/login" class="btn btn-primary btn-sm">Sign In</a>
    {/if}
  </div>
</nav>

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
    background: color-mix(in oklch, var(--color-base-100) 94%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: var(--border) solid var(--color-base-300);
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

  .nav-wordmark {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--color-base-content);
  }

  .nav-center-zone {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-trail-zone {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: calc(var(--spacing) * 3);
  }

  .nav-link {
    display: block;
    font-size: 0.8125rem;
    text-decoration: none;
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
    transition: color 150ms;
  }

  .nav-link:hover {
    color: var(--color-base-content);
  }

  /* Mega menu */
  .mega-menu {
    position: fixed;
    top: 3.5rem;
    left: 0;
    right: 0;
    z-index: 60;
    background: color-mix(in oklch, var(--color-base-100) 97%, transparent);
    backdrop-filter: blur(16px);
    border-bottom: var(--border) solid var(--color-base-300);
    box-shadow: 0 calc(var(--spacing) * 8) calc(var(--spacing) * 8) color-mix(in oklch, var(--color-base-content) 6%, transparent);
  }

  .mega-inner {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    max-width: 48rem;
    margin: 0 auto;
    padding: calc(var(--spacing) * 10) calc(var(--spacing) * 8);
  }

  .mega-col {
    padding: 0 calc(var(--spacing) * 8);
    border-right: var(--border) solid var(--color-base-300);
  }

  .mega-col:first-child { padding-left: 0; }
  .mega-col:last-child  { border-right: none; }

  .mega-heading {
    font-size: 0.6875rem;
    color: color-mix(in oklch, var(--color-base-content) 45%, transparent);
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
    color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
    text-decoration: none;
    transition: color 120ms;
  }

  .mega-link:hover {
    color: var(--color-base-content);
  }

  .mega-empty {
    font-size: 0.875rem;
    color: color-mix(in oklch, var(--color-base-content) 45%, transparent);
  }
</style>
