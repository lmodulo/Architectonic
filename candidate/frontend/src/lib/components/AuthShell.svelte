<script lang="ts">
  import type { Snippet } from 'svelte';
  import MarketingNav from './MarketingNav.svelte';

  let { children, title, subtitle, brandName, brandLogo }: {
    children: Snippet;
    title: string;
    subtitle?: string;
    brandName?: string | null;
    brandLogo?: string | null;
  } = $props();
</script>

<div class="auth-page">
  <MarketingNav {brandName} {brandLogo} />

  <div class="grain" aria-hidden="true"></div>
  <div class="auth-glow" aria-hidden="true"></div>

  <div class="auth-center">
    <div class="auth-card">

      <div class="auth-head">
        <div class="auth-eyebrow">
          <span class="auth-dot"></span>
          {brandName ?? 'Application'}
        </div>
        <h1 class="auth-title">{title}</h1>
        {#if subtitle}
          <p class="auth-sub">{subtitle}</p>
        {/if}
      </div>

      <div class="auth-body">
        {@render children()}
      </div>

    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100svh;
    background: oklch(8% 0.006 265deg);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0.045;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size: 300px 300px;
  }

  .auth-glow {
    position: fixed;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(700px, 100vw);
    height: 480px;
    background: radial-gradient(ellipse, oklch(55% 0.22 305deg / 0.065) 0%, transparent 68%);
    pointer-events: none;
    z-index: 1;
  }

  .auth-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5.5rem 1.5rem 2rem;
    position: relative;
    z-index: 2;
  }

  .auth-card {
    width: 100%;
    max-width: 26rem;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.875rem;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03), 0 24px 56px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
  }

  .auth-head {
    padding: 2.25rem 2.25rem 1.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .auth-eyebrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(230, 226, 216, 0.4);
  }

  .auth-dot {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-primary);
    animation: dot-pulse 2.4s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(0.65); }
  }

  .auth-title {
    font-size: 1.625rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #e6e2d8;
    line-height: 1.2;
  }

  .auth-sub {
    font-size: 0.875rem;
    color: rgba(230, 226, 216, 0.45);
    line-height: 1.5;
  }

  .auth-body {
    padding: 2rem 2.25rem 2.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  :global(.auth-body label span) {
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(230, 226, 216, 0.65);
    letter-spacing: 0.01em;
  }

  :global(.auth-body .input) {
    background: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #e6e2d8 !important;
    transition: border-color 150ms;
  }

  :global(.auth-body .input:focus) {
    border-color: var(--color-primary) !important;
    outline: none;
  }

  :global(.auth-body .input::placeholder) {
    color: rgba(230, 226, 216, 0.2) !important;
  }
</style>
