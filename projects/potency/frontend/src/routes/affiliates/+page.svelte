<script lang="ts">
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
</script>

<svelte:head>
  <title>Affiliates — Potency By Potamus</title>
  <meta name="description" content="Partner with Potency By Potamus. Our affiliate program is coming soon." />
</svelte:head>

<MarketingNav />

<div class="page-wrap">

  <!-- ── HERO ──────────────────────────────────────────────── -->
  <section class="page-hero">
    <div class="page-hero-inner">
      <p class="page-eyebrow">Potency By Potamus</p>
      <h1 class="page-title">Affiliates</h1>
    </div>
  </section>

  <!-- ── CONTENT ───────────────────────────────────────────── -->
  <section class="section">
    <div class="section-inner">
      <p class="section-label">Coming Soon</p>
      <h2 class="section-heading">Affiliate Program</h2>
      <p class="body-text">
        Details about our affiliate program are on the way. Check back soon or
        reach out at <a href="mailto:potencybypotamus@gmail.com">potencybypotamus@gmail.com</a>
        if you're interested in partnering with us.
      </p>
    </div>
  </section>

  <PublicFooter />

</div>

<style>
  .page-wrap {
    min-height: 100vh;
    background: var(--body-background-color);
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  :global(.dark) .page-wrap {
    background: var(--body-background-color-dark);
  }

  .page-hero {
    background: oklch(40% 0.12 155);
    padding: calc(var(--spacing) * 36) calc(var(--spacing) * 8) calc(var(--spacing) * 20);
    text-align: center;
  }

  .page-hero-inner {
    max-width: 52rem;
    margin: 0 auto;
  }

  .page-eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .page-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: #fff;
    margin: 0;
    line-height: 1.1;
  }

  .section {
    padding: calc(var(--spacing) * 24) calc(var(--spacing) * 8);
  }

  .section-inner {
    max-width: 44rem;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.6875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-primary-500);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .section-heading {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0 0 calc(var(--spacing) * 8);
    line-height: 1.2;
  }

  :global(.dark) .section-heading {
    color: var(--color-surface-50);
  }

  .body-text {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--color-surface-500);
    margin: 0;
  }

  :global(.dark) .body-text {
    color: var(--color-surface-300);
  }

  .body-text a {
    color: var(--color-primary-500);
    text-decoration: none;
  }

  .body-text a:hover {
    text-decoration: underline;
  }
</style>
