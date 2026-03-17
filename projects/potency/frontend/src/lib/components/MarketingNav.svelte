<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { Sun, Moon, Menu, X } from 'lucide-svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { brand } from '$lib/config/logo';
  import { page } from '$app/state';

  const branding = getContext<{ name: string; logo: string }>('appBranding') ?? { name: brand.text, logo: '' };

  let isDark = $state(false);
  let menuOpen = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
  }

  const navLinks = [
    { href: '/shop',            label: 'Shop',            activeColor: 'var(--color-primary-500)' },
    { href: '/about-me',        label: 'About Me',        activeColor: 'var(--color-secondary-500)' },
    { href: '/affiliates',      label: 'Affiliates',      activeColor: 'var(--color-primary-700)' },
    { href: '/upcoming-events', label: 'Upcoming Events', activeColor: 'var(--color-warning-600)' },
  ];

  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }
</script>

<nav class="marketing-nav">
  <div class="nav-brand-zone">
    <a href="/" class="nav-brand" onclick={() => (menuOpen = false)}>
      <Logo name={branding.name} logo={branding.logo} />
    </a>
  </div>

  <!-- Desktop links -->
  <div class="nav-center-zone">
    {#each navLinks as link}
      <a
        href={link.href}
        class="nav-link"
        class:nav-link-active={isActive(link.href)}
        style={isActive(link.href) ? `--active-color: ${link.activeColor}` : ''}
      >{link.label}</a>
    {/each}
  </div>

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
    <a href="/login" class="btn preset-filled-primary-500 btn-sm nav-signin">Sign In</a>

    <!-- Mobile hamburger -->
    <button
      type="button"
      class="hamburger"
      onclick={() => (menuOpen = !menuOpen)}
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
    >
      {#if menuOpen}
        <X class="size-5" />
      {:else}
        <Menu class="size-5" />
      {/if}
    </button>
  </div>
</nav>

<!-- Mobile dropdown -->
{#if menuOpen}
  <div class="mobile-menu" role="dialog" aria-label="Navigation">
    {#each navLinks as link}
      <a
        href={link.href}
        class="mobile-link"
        class:mobile-link-active={isActive(link.href)}
        style={isActive(link.href) ? `--active-color: ${link.activeColor}` : ''}
        onclick={() => (menuOpen = false)}
      >{link.label}</a>
    {/each}
    <div class="mobile-divider"></div>
    <a href="/login" class="mobile-link mobile-signin" onclick={() => (menuOpen = false)}>Sign In</a>
  </div>
{/if}

<style>
  .marketing-nav {
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 3.5rem;
    padding: 0 calc(var(--spacing) * 4);
    background: color-mix(in oklch, var(--body-background-color) 92%, transparent);
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

  /* Desktop center links — hidden on mobile */
  .nav-center-zone {
    display: none;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 1);
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

  /* Sign In button hidden on mobile (appears in mobile menu) */
  .nav-signin {
    display: none;
  }

  @media (min-width: 768px) {
    .nav-signin {
      display: inline-flex;
    }
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

  .nav-link {
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

  .nav-link-active {
    color: var(--active-color) !important;
    border-bottom: 2px solid var(--active-color);
    margin-bottom: -2px;
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

  .mobile-link-active {
    color: var(--active-color) !important;
    border-left: 3px solid var(--active-color);
    padding-left: calc(calc(var(--spacing) * 6) - 3px);
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
  :global(.dark) .marketing-nav {
    background: color-mix(in oklch, var(--body-background-color-dark) 88%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .nav-link {
    color: var(--color-surface-300);
  }

  :global(.dark) .nav-link:hover {
    color: var(--color-surface-50);
  }

  :global(.dark) .theme-toggle {
    color: var(--color-surface-300);
  }

  :global(.dark) .theme-toggle:hover {
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
