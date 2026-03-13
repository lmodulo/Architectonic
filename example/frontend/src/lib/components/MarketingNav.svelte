<nav class="marketing-nav">
  <a href="/" class="nav-brand">AppFramework</a>
  <div class="flex items-center gap-3">
    <a href="/register" class="btn preset-outlined-primary-500 btn-sm">Register</a>
    <a href="/login"    class="btn preset-filled-primary-500 btn-sm">Sign In</a>
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
    background: color-mix(in oklch, var(--color-surface-950) 85%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid color-mix(in oklch, var(--color-primary-500) 20%, transparent);
  }

  .nav-brand {
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-primary-300);
    text-decoration: none;
  }
</style>
