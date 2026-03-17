<script lang="ts">
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
</script>

<svelte:head>
  <title>Certificate Of Analysis — Potency By Potamus</title>
  <meta name="description" content="Third-party lab testing certificates for Potency By Potamus products." />
</svelte:head>

<MarketingNav />

<div class="page-wrap">

  <!-- ── HERO ──────────────────────────────────────────────── -->
  <section class="page-hero">
    <div class="page-hero-inner">
      <p class="page-eyebrow">Potency By Potamus</p>
      <h1 class="page-title">Certificate Of Analysis</h1>
    </div>
  </section>

  <!-- ── INTRO ─────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-inner">
      <p class="section-label">Lab Tested</p>
      <h2 class="section-heading">Third-Party Testing</h2>

      <p class="body-text">
        At Potency by Potamus, we believe you deserve to know exactly what you're putting on your
        body. Because the CBD industry isn't strictly regulated, a Certificate of Analysis (COA) is
        our way of providing a "report card" for every product we make. It is a verified document
        from an independent, third-party lab that proves our products are safe, potent, and
        accurately labeled.
      </p>

      <h3 class="coa-heading">Why Our COAs Matter to You</h3>

      <ul class="coa-list">
        <li>
          <strong>Verified Potency:</strong> We don't just guess. A COA confirms the exact amount of
          CBD in your product so you get the results you expect.
        </li>
        <li>
          <strong>Safety First:</strong> It acts as a safety net, certifying that our topicals are
          free from harmful contaminants like heavy metals, pesticides, mold, and residual solvents.
        </li>
        <li>
          <strong>Legal Compliance:</strong> Every COA verifies that our hemp-derived products
          contain less than 0.3% THC, keeping them federally legal and non-intoxicating.
        </li>
        <li>
          <strong>Total Transparency:</strong> We use third-party labs to ensure the results are
          unbiased and objective. If we wouldn't use it ourselves, we won't sell it to you.
        </li>
      </ul>

      <p class="body-text">
        By checking the batch number on your Potency by Potamus product and matching it to its COA,
        you can shop with the confidence that you are receiving the high-quality, pure CBD you
        deserve.
      </p>

      <div class="coa-cta">
        <a
          href="/2026 Jan COAs.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="coa-link"
        >
          View January 2026 COAs
          <svg class="coa-link-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
          </svg>
        </a>
      </div>
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
    background: oklch(44% 0.16 145);
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
    margin: 0 0 calc(var(--spacing) * 5);
  }

  :global(.dark) .body-text {
    color: var(--color-surface-300);
  }

  .coa-heading {
    font-size: 1.125rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: calc(var(--spacing) * 10) 0 calc(var(--spacing) * 4);
    line-height: 1.3;
  }

  :global(.dark) .coa-heading {
    color: var(--color-surface-50);
  }

  .coa-list {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--color-surface-500);
    margin: 0 0 calc(var(--spacing) * 8);
    padding-left: calc(var(--spacing) * 6);
    list-style-type: disc;
  }

  :global(.dark) .coa-list {
    color: var(--color-surface-300);
  }

  .coa-list li {
    margin-bottom: calc(var(--spacing) * 3);
  }

  .coa-cta {
    margin-top: calc(var(--spacing) * 10);
  }

  .coa-link {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
    background: var(--color-primary-500);
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: none;
    padding: calc(var(--spacing) * 3.5) calc(var(--spacing) * 6);
    border-radius: calc(var(--spacing) * 2);
    transition: background 0.15s;
  }

  .coa-link:hover {
    background: var(--color-primary-600);
  }

  .coa-link-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
</style>
