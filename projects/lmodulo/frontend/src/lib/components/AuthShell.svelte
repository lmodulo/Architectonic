<script lang="ts">
  import type { Snippet } from 'svelte';
  import MarketingNav from './MarketingNav.svelte';
  import { m } from '$lib/paraglide/messages.js';

  let { children, title, subtitle, brandName, brandLogo, hideSignIn = false }: {
    children: Snippet;
    title: string;
    subtitle?: string;
    brandName?: string | null;
    brandLogo?: string | null;
    hideSignIn?: boolean;
  } = $props();
</script>

<div class="auth-page">
  <MarketingNav {brandName} {brandLogo} {hideSignIn} />

  <div class="grain" aria-hidden="true"></div>
  <div class="auth-glow" aria-hidden="true"></div>

  <div class="auth-center">
    <div class="auth-card">

      <div class="auth-head">
        <div class="auth-eyebrow">
          <span class="auth-dot"></span>
          {brandName ?? m.auth_shell_application()}
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
    background: var(--color-base-100);
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
    background: radial-gradient(ellipse, color-mix(in oklch, var(--color-primary) 10%, transparent) 0%, transparent 68%);
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
    background: color-mix(in oklch, var(--color-base-200) 40%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-base-content) 8%, transparent);
    border-radius: var(--radius-box);
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--color-base-content) 3%, transparent), 0 24px 56px oklch(0% 0 0 / 0.4);
    display: flex;
    flex-direction: column;
  }

  .auth-head {
    padding: 2.25rem 2.25rem 1.75rem;
    border-bottom: 1px solid color-mix(in oklch, var(--color-base-content) 7%, transparent);
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
    color: color-mix(in oklch, var(--color-base-content) 40%, transparent);
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
    color: var(--color-base-content);
    line-height: 1.2;
  }

  .auth-sub {
    font-size: 0.875rem;
    color: color-mix(in oklch, var(--color-base-content) 45%, transparent);
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
    color: color-mix(in oklch, var(--color-base-content) 65%, transparent);
    letter-spacing: 0.01em;
  }

  :global(.auth-body .input) {
    background: color-mix(in oklch, var(--color-base-200) 50%, transparent) !important;
    border-color: color-mix(in oklch, var(--color-base-content) 10%, transparent) !important;
    color: var(--color-base-content) !important;
    transition: border-color 150ms;
  }

  :global(.auth-body .input:focus) {
    border-color: var(--color-primary) !important;
    outline: none;
  }

  :global(.auth-body .input::placeholder) {
    color: color-mix(in oklch, var(--color-base-content) 20%, transparent) !important;
  }
</style>
