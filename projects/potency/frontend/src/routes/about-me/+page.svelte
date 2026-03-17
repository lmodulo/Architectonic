<script lang="ts">
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
</script>

<svelte:head>
  <title>About Me — Potency By Potamus</title>
  <meta name="description" content="Meet Nick — also known as Nickapotamus. Learn about his journey with CBD and what drives every product he makes." />
</svelte:head>

<MarketingNav />

<div class="page-wrap">

  <!-- ── HERO ──────────────────────────────────────────────── -->
  <section class="page-hero">
    <div class="page-hero-inner">
      <div class="hero-text">
        <p class="page-eyebrow">The Principle</p>
        <h1 class="page-title">Nickapotamus</h1>
      </div>
      <div class="principle-photo-wrap">
        <img src="/principle.jpg" alt="Nick — Nickapotamus" class="principle-photo" />
      </div>
    </div>
  </section>

  <!-- ── BIO ───────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-inner bio-inner">
      <p class="section-label">My Story</p>
      <h2 class="section-heading">Where It All Began</h2>
      <div class="bio-body">
        <p>
          I'm Nick — also known as Nickapotamus or Potamus. I've been extracting and infusing
          for over five years. All of my products are made from a full-spectrum extraction of
          naturally high-CBD hemp.
        </p>
        <p>
          I deal with chronic pain. Every product I make started from a straightforward need:
          feel better, hurt less. CBD has made a real difference for me and for my family, and
          I want other people to have access to that same relief. Less pain, less stress — that's
          the goal.
        </p>
        <p>
          Try one of my tinctures, balms, bath salts, or bath bombs and see for yourself.
        </p>
        <div class="bio-cta">
          <a href="/shop" class="btn preset-filled-primary-500">Shop Products</a>
        </div>
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

  /* ── HERO ──────────────────────────────────────────────── */
  .page-hero {
    background: var(--color-tertiary-500);
    padding: calc(var(--spacing) * 20) calc(var(--spacing) * 8);
  }

  .page-hero-inner {
    max-width: 50rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: calc(var(--spacing) * 12);
  }

  .hero-text {
    text-align: left;
  }

  .page-eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
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

  .principle-photo-wrap {
    flex-shrink: 0;
  }

  .principle-photo {
    width: min(18rem, 40vw);
    height: min(18rem, 40vw);
    object-fit: cover;
    border-radius: calc(var(--spacing) * 3);
    border: 4px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
    display: block;
  }

  /* ── SECTIONS ──────────────────────────────────────────── */
  .section {
    padding: calc(var(--spacing) * 24) calc(var(--spacing) * 8);
  }

  .section-inner {
    max-width: 72rem;
    margin: 0 auto;
  }

  .bio-inner {
    max-width: 44rem;
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
    margin: 0 0 calc(var(--spacing) * 10);
    line-height: 1.2;
  }

  :global(.dark) .section-heading {
    color: var(--color-surface-50);
  }

  .bio-body {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 6);
  }

  .bio-body p {
    font-size: 1.0625rem;
    line-height: 1.8;
    color: var(--color-surface-500);
    margin: 0;
  }

  :global(.dark) .bio-body p {
    color: var(--color-surface-300);
  }

  .bio-cta {
    padding-top: calc(var(--spacing) * 4);
  }
</style>
