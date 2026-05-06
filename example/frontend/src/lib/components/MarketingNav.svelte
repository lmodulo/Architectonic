<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
</script>

<nav class="marketing-nav">
  <a href="/" class="nav-brand">
    <Logo />
  </a>
  <div class="flex items-center gap-3">
    <a href="/login" class="btn btn-primary btn-sm">Sign In</a>
  </div>
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
    padding: 0.75rem 1.5rem;
    background: color-mix(in oklch, var(--color-base-100) 85%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid color-mix(in oklch, var(--color-primary) 20%, transparent);
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
</style>
