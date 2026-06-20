<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
  import { m } from '$lib/paraglide/messages.js';
  let { brandName = '', brandLogo = '', hideSignIn = false }: { brandName?: string | null; brandLogo?: string | null; hideSignIn?: boolean } = $props();
</script>

<nav class="marketing-nav">
  <a href="/" class="nav-brand" aria-label={m.marketing_nav_home()}>
    <Logo brandName={brandName ?? ''} brandLogo={brandLogo ?? ''} />
  </a>
  {#if !hideSignIn}
    <a href="/login" class="btn btn-primary btn-sm">{m.marketing_nav_sign_in()}</a>
  {/if}
</nav>

<style>
  .marketing-nav {
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.75rem;
    background: color-mix(in oklch, var(--color-base-100) 88%, transparent);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid color-mix(in oklch, var(--color-base-content) 7%, transparent);
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
</style>
