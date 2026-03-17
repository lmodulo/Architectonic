<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { Sun, Moon } from 'lucide-svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { brand } from '$lib/config/logo';

  const branding = getContext<{ name: string; logo: string }>('appBranding') ?? { name: brand.text, logo: '' };

  let isDark = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
  }
</script>

<nav class="marketing-nav">
  <div class="nav-brand-zone">
    <a href="/" class="nav-brand">
      <Logo name={branding.name} logo={branding.logo} />
    </a>
  </div>

  <div class="nav-center-zone">
    <a href="/shop" class="nav-link">Shop</a>
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
    <a href="/login" class="btn preset-filled-primary-500 btn-sm">Sign In</a>
  </div>
</nav>

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

  :global(.dark) .marketing-nav {
    background: color-mix(in oklch, var(--body-background-color-dark) 88%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-surface-700) 40%, transparent);
  }

  :global(.dark) .nav-link {
    color: var(--color-surface-100);
  }

  :global(.dark) .nav-link:hover {
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
