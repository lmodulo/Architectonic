<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { Sun, Moon } from 'lucide-svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { brand } from '$lib/config/logo';

  const branding = getContext<{ name: string; logo: string }>('appBranding') ?? { name: brand.text, logo: '' };

  type Category = { id: string; slug: string; name: string };
  type Meta = { categories: Category[]; variantTypes: string[]; tags: string[] };

  let { meta }: { meta: Meta } = $props();

  let isDark = $state(false);
  let menuOpen = $state(false);
  let navEl: HTMLElement | null = $state(null);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
  }

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
      <Logo name={branding.name} logo={branding.logo} />
    </a>
  </div>

  <!-- Center: primary links -->
  <div class="nav-center-zone">
    <div class="products-trigger" onmouseenter={() => (menuOpen = true)}>
      <a href="/shop" class="nav-link" onclick={closeMenu}>Products</a>

      {#if menuOpen}
        <div class="mega-menu" role="dialog" aria-label="Products menu">
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
              <p class="mega-heading">Shop by Type</p>
              <ul>
                {#each meta.variantTypes as vt (vt)}
                  <li><a href="/shop?variant={encodeURIComponent(vt)}" class="mega-link" onclick={closeMenu}>{vt}</a></li>
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
    <a href="/login" class="btn preset-filled-primary-500 btn-sm">Sign In</a>
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
    height: 64px;
    padding: 0 calc(var(--spacing) * 8);
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
    text-decoration: none;
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
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
    text-decoration: none;
    color: var(--color-surface-300);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
    transition: color 150ms;
  }

  .nav-link:hover {
    color: var(--color-surface-950);
  }

  /* Mega menu */
  .mega-menu {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    z-index: 60;
    background: color-mix(in oklch, var(--body-background-color) 97%, transparent);
    backdrop-filter: blur(16px);
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-surface-300) 25%, transparent);
    box-shadow: 0 calc(var(--spacing) * 8) calc(var(--spacing) * 8) color-mix(in oklch, var(--color-surface-950) 6%, transparent);
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

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: var(--radius-base);
    border: none;
    background: transparent;
    color: var(--color-surface-300);
    cursor: pointer;
    transition: background 150ms, color 150ms;
  }

  .theme-toggle:hover {
    background: color-mix(in oklch, var(--color-surface-300) 15%, transparent);
    color: var(--color-surface-950);
  }

  /* Dark overrides */
  :global(.dark) .storefront-nav {
    background: color-mix(in oklch, var(--body-background-color-dark) 90%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .nav-link {
    color: var(--color-surface-100);
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
    color: var(--color-surface-100);
  }

  :global(.dark) .theme-toggle:hover {
    background: color-mix(in oklch, var(--color-surface-700) 50%, transparent);
    color: var(--color-surface-50);
  }
</style>
