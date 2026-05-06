<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
  let { brandName = '', brandLogo = '' }: { brandName?: string | null; brandLogo?: string | null } = $props();
</script>

<nav class="marketing-nav">
  <a href="/" class="nav-brand" aria-label="Home">
    <Logo brandName={brandName ?? ''} brandLogo={brandLogo ?? ''} />
  </a>
  <a href="/login" class="btn btn-primary btn-sm">Sign In</a>
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
    background: color-mix(in oklch, oklch(8% 0.006 265deg) 88%, transparent);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
</style>
