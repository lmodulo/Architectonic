<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon } from 'lucide-svelte';
  import { brand } from '$lib/config/logo';

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
  <a href="/" class="nav-brand">
    <img src={brand.image} alt="" class="logo-icon" aria-hidden="true" />
    <span>{brand.text}</span>
  </a>
  <div class="flex items-center gap-3">
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
    <a href="/register" class="btn preset-outlined-primary-500 btn-sm">Register</a>
    <a href="/login"    class="btn preset-filled-primary-500 btn-sm">Sign In</a>
  </div>
</nav>

<style>
  /* ── Light (default) ─────────────────────────────────────────── */
  .marketing-nav {
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: color-mix(in oklch, var(--color-surface-50) 92%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid color-mix(in oklch, var(--color-surface-300) 60%, transparent);
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-primary-600);
    text-decoration: none;
  }

  .logo-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-base);
    border: none;
    background: transparent;
    color: var(--color-surface-600);
    cursor: pointer;
    transition: background 150ms, color 150ms;
  }

  .theme-toggle:hover {
    background: color-mix(in oklch, var(--color-surface-300) 40%, transparent);
    color: var(--color-surface-900);
  }

  /* ── Dark overrides ──────────────────────────────────────────── */
  :global(.dark) .marketing-nav {
    background: color-mix(in oklch, var(--color-surface-950) 85%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-primary-500) 20%, transparent);
  }

  :global(.dark) .nav-brand {
    color: var(--color-primary-300);
  }

  :global(.dark) .theme-toggle {
    color: var(--color-surface-400);
  }

  :global(.dark) .theme-toggle:hover {
    background: color-mix(in oklch, var(--color-surface-700) 50%, transparent);
    color: var(--color-surface-100);
  }
</style>
