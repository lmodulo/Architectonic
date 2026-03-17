<script lang="ts">
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type PublicEvent = {
    id: string;
    title: string;
    content: string;
    startDate: string;
    endDate: string;
    singleDay: boolean;
  };

  const events = (data.events ?? []) as PublicEvent[];

  function fmtRange(ev: PublicEvent): string {
    const start = new Date(ev.startDate);
    if (ev.singleDay) {
      return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    const end = new Date(ev.endDate);
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
</script>

<svelte:head>
  <title>Upcoming Events — Potency By Potamus</title>
  <meta name="description" content="Find Potency By Potamus at festivals and markets across the Pacific Northwest. See where we'll be next." />
</svelte:head>

<MarketingNav />

<div class="page-wrap">

  <!-- ── HERO ──────────────────────────────────────────────── -->
  <section class="page-hero">
    <div class="page-hero-inner">
      <p class="page-eyebrow">Potency By Potamus</p>
      <h1 class="page-title">Upcoming Events</h1>
    </div>
  </section>

  <!-- ── CONTENT ───────────────────────────────────────────── -->
  <section class="section">
    <div class="section-inner">
      <p class="section-label">On the Road</p>
      <h2 class="section-heading">Where We'll Be Next</h2>

      {#if events.length === 0}
        <p class="body-text">
          We travel year-round to festivals and markets across the Pacific Northwest. Check back
          soon for upcoming dates, or follow us on
          <a href="https://facebook.com/potencybypotamus" target="_blank" rel="noopener noreferrer">Facebook</a>
          or
          <a href="https://instagram.com/potencybypotamus" target="_blank" rel="noopener noreferrer">Instagram</a>
          to stay in the loop.
        </p>
      {:else}
        <div class="event-list">
          {#each events as ev}
            <article class="event-card">
              <div class="event-date-badge">
                <span class="event-month">{new Date(ev.startDate).toLocaleString('en-US', { month: 'short' })}</span>
                <span class="event-day">{new Date(ev.startDate).getDate()}</span>
              </div>
              <div class="event-body">
                <h3 class="event-title">{ev.title}</h3>
                <p class="event-date-range">{fmtRange(ev)}</p>
                {#if ev.content && ev.content !== '<p></p>'}
                  <div class="event-content prose">
                    {@html ev.content}
                  </div>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
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
    background: var(--color-warning-600);
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
    color: var(--color-warning-600);
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
    color: var(--color-warning-600);
    text-decoration: none;
  }

  .body-text a:hover {
    text-decoration: underline;
  }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 6);
    margin-top: calc(var(--spacing) * 8);
  }

  .event-card {
    display: flex;
    gap: calc(var(--spacing) * 5);
    padding: calc(var(--spacing) * 6);
    border-radius: calc(var(--spacing) * 3);
    background: color-mix(in oklch, var(--color-warning-600) 8%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-warning-600) 20%, transparent);
  }

  .event-date-badge {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: calc(var(--spacing) * 2);
    background: var(--color-warning-600);
    color: #fff;
  }

  .event-month {
    font-size: 0.625rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
  }

  .event-day {
    font-size: 1.5rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    line-height: 1;
  }

  .event-body {
    flex: 1;
    min-width: 0;
  }

  .event-title {
    font-size: 1.125rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0 0 calc(var(--spacing) * 1);
    line-height: 1.2;
  }

  :global(.dark) .event-title {
    color: var(--color-surface-50);
  }

  .event-date-range {
    font-size: 0.8125rem;
    color: var(--color-warning-600);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .event-content {
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--color-surface-500);
  }

  :global(.dark) .event-content {
    color: var(--color-surface-300);
  }
</style>
