<script lang="ts">
  import { onMount } from 'svelte';

  // ── Honeycomb SVG generation ──────────────────────────────────────
  const SIZE  = 32;
  const SQRT3 = Math.sqrt(3);
  const COLS  = 28;
  const ROWS  = 16;

  function polyPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i; // flat-top hexagon
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  }

  const cq = (COLS - 1) / 2;
  const cr = (ROWS - 1) / 2;

  const hexes = Array.from({ length: COLS * ROWS }, (_, idx) => {
    const q   = idx % COLS;
    const r   = Math.floor(idx / COLS);
    const x   = SIZE * 1.5 * q + SIZE;
    const y   = SIZE * SQRT3 * r + (q % 2 ? SIZE * SQRT3 / 2 : 0) + SIZE;
    const dist = Math.sqrt((q - cq) ** 2 + (r - cr) ** 2);
    return { pts: polyPoints(x, y, SIZE - 2), dist };
  });

  const svgW = SIZE * 1.5 * (COLS - 1) + SIZE * 2;
  const svgH = SIZE * SQRT3 * (ROWS - 1) + SIZE * SQRT3 + SIZE * 2;

  // ── Parallax ──────────────────────────────────────────────────────
  let scrollY = $state(0);

  // ── Fade-in refs ──────────────────────────────────────────────────
  let fadeRefs: (Element | undefined)[] = $state(Array(12).fill(undefined));

  const features = [
    {
      icon: '🔐',
      title: 'Secure Authentication',
      body: 'Login and registration with bcrypt hashing, server-side session validation on every request, and redirect guards.'
    },
    {
      icon: '🗄️',
      title: 'Session Management',
      body: 'MongoDB-backed sessions via connect-mongo with configurable TTL, signed HTTP-only cookies, and auto cleanup.'
    },
    {
      icon: '🎨',
      title: 'UI Component System',
      body: 'Skeleton v4 with Tailwind v4 — buttons, badges, cards, forms, navigation, and a custom branded theme.'
    },
    {
      icon: '🐳',
      title: 'Docker Dev Stack',
      body: 'One command brings up SvelteKit, Fastify, and MongoDB with bind-mount hot reload and health-checked startup order.'
    },
    {
      icon: '⚡',
      title: 'Type-Safe API',
      body: 'Fastify v5 with TypeScript, JSON Schema request validation, plugin encapsulation, and a structured route layout.'
    },
    {
      icon: '🚀',
      title: 'Production Ready',
      body: 'Separate dev and prod Docker configs, environment-aware security settings, and health endpoints built in.'
    }
  ];

  const stack = [
    'SvelteKit 2', 'Svelte 5', 'Fastify 5', 'MongoDB 7',
    'TypeScript', 'Tailwind v4', 'Skeleton v4', 'Docker'
  ];

  onMount(() => {
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    fadeRefs.forEach((el) => el && io.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  });
</script>

<svelte:head>
  <title>AppFramework — Build faster. Ship smarter.</title>
</svelte:head>

<!-- ── Fixed nav ──────────────────────────────────────────────────── -->
<nav class="nav-bar">
  <span class="nav-brand">AppFramework</span>
  <div class="flex items-center gap-3">
    <a href="/register" class="btn preset-outlined-primary-500 btn-sm">Register</a>
    <a href="/login"    class="btn preset-filled-primary-500 btn-sm">Sign In</a>
  </div>
</nav>

<!-- ── Hero ───────────────────────────────────────────────────────── -->
<section class="hero">

  <!-- Honeycomb background (parallax) -->
  <div class="hex-bg" style="transform: translateY({scrollY * 0.3}px)">
    <svg
      viewBox="0 0 {svgW} {svgH}"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      {#each hexes as hex}
        <polygon
          points={hex.pts}
          class="hex-cell"
          style="animation-delay: -{(hex.dist * 0.22).toFixed(2)}s"
        />
      {/each}
    </svg>
  </div>

  <!-- Radial vignette overlay -->
  <div class="hero-vignette"></div>

  <!-- Hero content -->
  <div class="hero-content">
    <span class="badge preset-tonal-primary mb-6">Production-ready scaffold</span>

    <h1 class="hero-headline">
      Build faster.<br />Ship smarter.
    </h1>

    <p class="hero-sub">
      A full-stack SvelteKit + Fastify scaffold with authentication, session management,
      MongoDB, and a polished Skeleton UI — clone it and start shipping.
    </p>

    <div class="flex flex-wrap gap-4 justify-center">
      <a href="/register" class="btn preset-filled-primary-500 btn-lg">Get Started Free</a>
      <a href="/login"    class="btn preset-outlined-primary-500 btn-lg">Sign In</a>
    </div>
  </div>
</section>

<!-- ── Features ───────────────────────────────────────────────────── -->
<section class="section-dark">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[0]}>
      <h2 class="section-heading">Everything wired up on day one</h2>
      <p class="section-sub">No boilerplate hunting. Every layer is configured and connected.</p>
    </div>

    <div class="features-grid">
      {#each features as f, i}
        <div
          class="feature-card fade-el"
          style="transition-delay: {i * 70}ms"
          bind:this={fadeRefs[i + 1]}
        >
          <span class="feature-icon">{f.icon}</span>
          <h3 class="feature-title">{f.title}</h3>
          <p class="feature-body">{f.body}</p>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ── Stack ──────────────────────────────────────────────────────── -->
<section class="section-mid">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[8]}>
      <h2 class="section-heading-alt">The stack</h2>
      <p class="section-sub-alt">Modern, opinionated, and fully typed end to end.</p>
    </div>

    <div class="fade-el stack-grid" bind:this={fadeRefs[9]}>
      {#each stack as tech}
        <span class="badge preset-tonal-primary text-sm px-4 py-2">{tech}</span>
      {/each}
    </div>

  </div>
</section>

<!-- ── CTA ────────────────────────────────────────────────────────── -->
<section class="section-cta">
  <div class="fade-el section-inner text-center space-y-6" bind:this={fadeRefs[10]}>
    <h2 class="cta-heading">Ready to build something?</h2>
    <p class="cta-sub">Create your account and have a running authenticated app in minutes.</p>
    <a href="/register" class="btn preset-filled-primary-500 btn-lg">Start Building</a>
  </div>
</section>

<!-- ── Footer ─────────────────────────────────────────────────────── -->
<footer class="footer">
  <p>AppFramework — MIT License</p>
</footer>

<style>
  /* ── Nav ─────────────────────────────────────────────────────── */
  .nav-bar {
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
  }

  /* ── Hero ────────────────────────────────────────────────────── */
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--color-surface-950);
  }

  .hex-bg {
    position: absolute;
    inset: -10% -5%;
    opacity: 0.22;
    pointer-events: none;
    will-change: transform;
  }

  /* Honeycomb ripple animation */
  :global(.hex-cell) {
    fill: transparent;
    stroke: var(--color-primary-400);
    stroke-width: 1;
    animation: hex-ripple 5s ease-in-out infinite;
  }

  @keyframes hex-ripple {
    0%, 100% {
      fill: transparent;
      stroke-opacity: 0.12;
    }
    45%, 55% {
      fill: color-mix(in oklch, var(--color-primary-500) 18%, transparent);
      stroke-opacity: 0.75;
    }
  }

  .hero-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 70% 60% at 50% 50%,
      transparent 20%,
      color-mix(in oklch, var(--color-surface-950) 60%, transparent) 70%,
      var(--color-surface-950) 100%
    );
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 6rem 1.5rem 4rem;
    max-width: 52rem;
    margin-inline: auto;
  }

  .hero-headline {
    font-size: clamp(2.5rem, 7vw, 5rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--color-surface-50);
    margin-bottom: 1.5rem;
  }

  .hero-sub {
    font-size: 1.125rem;
    color: var(--color-surface-300);
    max-width: 36rem;
    margin-bottom: 2.5rem;
    line-height: 1.7;
  }

  /* ── Sections ────────────────────────────────────────────────── */
  .section-dark {
    background: var(--color-surface-900);
    padding: 6rem 1.5rem;
  }

  .section-mid {
    background: var(--color-surface-950);
    padding: 6rem 1.5rem;
  }

  .section-cta {
    background: linear-gradient(
      135deg,
      color-mix(in oklch, var(--color-primary-900) 80%, var(--color-surface-950)),
      color-mix(in oklch, var(--color-secondary-900) 60%, var(--color-surface-950))
    );
    padding: 7rem 1.5rem;
  }

  .section-inner {
    max-width: 64rem;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .section-heading {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--color-surface-50);
  }

  .section-heading-alt {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--color-surface-50);
  }

  .section-sub {
    color: var(--color-surface-400);
    font-size: 1.0625rem;
  }

  .section-sub-alt {
    color: var(--color-surface-400);
    font-size: 1.0625rem;
  }

  /* ── Features grid ───────────────────────────────────────────── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1.25rem;
  }

  .feature-card {
    background: color-mix(in oklch, var(--color-surface-800) 80%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-primary-500) 15%, transparent);
    border-radius: var(--radius-container);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    transition: border-color 200ms, background 200ms;
  }

  .feature-card:hover {
    border-color: color-mix(in oklch, var(--color-primary-500) 40%, transparent);
    background: color-mix(in oklch, var(--color-surface-700) 70%, transparent);
  }

  .feature-icon { font-size: 1.75rem; }

  .feature-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-surface-100);
  }

  .feature-body {
    font-size: 0.875rem;
    color: var(--color-surface-400);
    line-height: 1.6;
  }

  /* ── Stack badges ─────────────────────────────────────────────── */
  .stack-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  /* ── CTA ─────────────────────────────────────────────────────── */
  .cta-heading {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 700;
    color: var(--color-surface-50);
  }

  .cta-sub {
    color: var(--color-surface-300);
    font-size: 1.0625rem;
    max-width: 32rem;
    margin-inline: auto;
  }

  /* ── Footer ──────────────────────────────────────────────────── */
  .footer {
    background: var(--color-surface-950);
    border-top: 1px solid color-mix(in oklch, var(--color-surface-800) 60%, transparent);
    padding: 1.5rem;
    text-align: center;
    font-size: 0.8125rem;
    color: var(--color-surface-600);
  }

  /* ── Fade-in ─────────────────────────────────────────────────── */
  .fade-el {
    opacity: 0;
    transform: translateY(1.5rem);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }

  .fade-el.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>
