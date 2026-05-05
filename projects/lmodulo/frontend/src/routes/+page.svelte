<script lang="ts">
  import { onMount } from 'svelte';
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { brand } from '$lib/config/logo';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // ── Hex background ────────────────────────────────────────────────
  const SIZE  = 32;
  const SQRT3 = Math.sqrt(3);
  const COLS  = 28;
  const ROWS  = 16;

  function polyPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  }

  const cq = (COLS - 1) / 2;
  const cr = (ROWS - 1) / 2;
  const hexes = Array.from({ length: COLS * ROWS }, (_, idx) => {
    const q    = idx % COLS;
    const r    = Math.floor(idx / COLS);
    const x    = SIZE * 1.5 * q + SIZE;
    const y    = SIZE * SQRT3 * r + (q % 2 ? SIZE * SQRT3 / 2 : 0) + SIZE;
    const dist = Math.sqrt((q - cq) ** 2 + (r - cr) ** 2);
    return { pts: polyPoints(x, y, SIZE - 2), dist };
  });
  const svgW = SIZE * 1.5 * (COLS - 1) + SIZE * 2;
  const svgH = SIZE * SQRT3 * (ROWS - 1) + SIZE * SQRT3 + SIZE * 2;

  // ── Scroll / cursor ───────────────────────────────────────────────
  let scrollY  = $state(0);
  let progress = $state(0);
  let mouseX   = $state(-9999);
  let mouseY   = $state(-9999);

  // ── Reveal refs ───────────────────────────────────────────────────
  let revealEls: (Element | undefined)[] = $state(Array(20).fill(undefined));

  // ── Content ───────────────────────────────────────────────────────
  const features = [
    { num: '01', title: 'Secure Authentication', body: 'Login and registration with bcrypt hashing, server-side session validation on every request, and redirect guards built in.' },
    { num: '02', title: 'Session Management',    body: 'MongoDB-backed sessions via connect-mongo with configurable TTL, signed HTTP-only cookies, and automatic cleanup.' },
    { num: '03', title: 'RBAC & Permissions',    body: 'Role-based access control with per-route preHandlers, component-level permission checks, and a full roles management UI.' },
    { num: '04', title: 'Skeleton UI System',    body: 'Skeleton v4 with Tailwind v4 — buttons, badges, cards, forms, navigation, and a custom branded theme right out of the box.' },
    { num: '05', title: 'Docker Dev Stack',       body: 'One command brings up SvelteKit, Fastify, and MongoDB with bind-mount hot reload and health-checked startup sequencing.' },
    { num: '06', title: 'Type-Safe API',          body: 'Fastify v5 with TypeScript, JSON Schema request validation, plugin encapsulation, and a clean structured route layout.' },
  ];

  const stackGroups = [
    { label: 'Frontend',  items: ['SvelteKit 2', 'Svelte 5 Runes', 'Tailwind v4', 'Skeleton v4', 'TypeScript'] },
    { label: 'Backend',   items: ['Fastify 5', 'MongoDB 7', 'TypeScript', 'connect-mongo', 'bcryptjs'] },
    { label: 'Tooling',   items: ['Docker Compose', 'Vite', 'ESLint', 'Prettier', 'Node 20'] },
    { label: 'Extras',    items: ['Ollama (AI chat)', 'Tiptap (rich text)', 'Lucide icons', 'In-app messaging'] },
  ];

  const steps = [
    { num: '01', title: 'Clone the repository',  body: 'One git clone pulls the entire scaffold — API, frontend, and database all configured and ready to run together.' },
    { num: '02', title: 'Set your environment',  body: 'Copy .env.example, add a session secret and Mongo URI. Everything else runs on sensible defaults with zero config.' },
    { num: '03', title: 'Bring up the stack',    body: 'docker compose up. SvelteKit, Fastify, and MongoDB start in the correct order with automated health checks.' },
    { num: '04', title: 'Start building',         body: 'Auth is wired, RBAC is live, and the dashboard is ready. Write your first feature in minutes, not days.' },
  ];

  const stats = [
    { value: '< 5min', label: 'to running app'       },
    { value: '100%',   label: 'TypeScript coverage'   },
    { value: '3',      label: 'services, one command' },
    { value: 'MIT',    label: 'open source license'   },
  ];

  onMount(() => {
    const onScroll = () => {
      scrollY = window.scrollY;
      const max = document.body.scrollHeight - window.innerHeight;
      progress = max > 0 ? (scrollY / max) * 100 : 0;
    };
    const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });

    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.08 }
    );
    revealEls.forEach(el => el && io.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
      io.disconnect();
    };
  });
</script>

<svelte:head>
  <title>lmodulo — {brand.description}</title>
</svelte:head>

<!-- Cursor spotlight -->
<div class="spotlight" style="left:{mouseX}px; top:{mouseY}px" aria-hidden="true"></div>

<!-- Grain overlay -->
<div class="grain" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
    <filter id="grain-filter" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
      <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
      <feBlend in="SourceGraphic" in2="grey" mode="overlay" />
    </filter>
  </svg>
</div>

<!-- Scroll progress -->
<div class="scroll-progress" style="width:{progress}%" aria-hidden="true"></div>

<!-- Nav -->
<MarketingNav brandName={data.brandName} brandLogo={data.brandLogo} />

<!-- ══ HERO ══════════════════════════════════════════════════════════ -->
<section class="hero">

  <div class="hex-bg" style="transform:translateY({scrollY * 0.25}px)" aria-hidden="true">
    <svg viewBox="0 0 {svgW} {svgH}" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      {#each hexes as hex}
        <polygon points={hex.pts} class="hex-cell"
          style="animation-delay:-{(hex.dist * 0.22).toFixed(2)}s" />
      {/each}
    </svg>
  </div>

  <div class="hero-vignette" aria-hidden="true"></div>

  <!-- Calibration SVG -->
  <svg class="calibration" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4 8"/>
    <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="0.5"/>
    <circle cx="100" cy="100" r="3"  fill="currentColor"/>
    <line x1="10"  y1="100" x2="190" y2="100" stroke="currentColor" stroke-width="0.5"/>
    <line x1="100" y1="10"  x2="100" y2="190" stroke="currentColor" stroke-width="0.5"/>
  </svg>

  <div class="hero-content">
    <div class="eyebrow">
      <span class="eyebrow-dot"></span>
      Full-Stack SvelteKit Scaffold
    </div>

    <h1 class="display-heading">
      Build faster.<br>Ship smarter.
    </h1>

    <p class="hero-tagline">
      Authentication, RBAC, sessions, and a polished UI — all wired before you write
      a single line of business logic.
    </p>

    <div class="hero-meta">
      <span>SvelteKit 2 + Svelte 5</span>
      <span class="meta-dot">·</span>
      <span>Fastify 5</span>
      <span class="meta-dot">·</span>
      <span>MongoDB 7</span>
      <span class="meta-dot">·</span>
      <span>Docker</span>
    </div>

    <div class="hero-actions">
      <a href="/login" class="btn preset-filled-primary-500">Get Started Free</a>
      <a href="/login" class="hero-ghost-btn">Sign In →</a>
    </div>
  </div>

</section>

<!-- ══ §01 OVERVIEW ══════════════════════════════════════════════════ -->
<section class="lp-section" id="overview">
  <div class="lp-inner">

    <div class="sec-head reveal" bind:this={revealEls[0]}>
      <span class="sec-num">§01</span>
      <span class="sec-label">Overview</span>
      <div class="sec-rule"></div>
    </div>

    <div class="overview-layout reveal" bind:this={revealEls[1]}>
      <div class="overview-copy">
        <h2 class="sec-heading">
          Every layer configured.<br>Nothing left to wire.
        </h2>
        <p class="sec-sub">
          Architectonic eliminates the boilerplate standing between your idea and a
          running application. Authentication, role-based access control, session
          management, and a polished component system — all pre-configured and connected.
          Clone it, set two environment variables, and you're building.
        </p>
        <a href="/login" class="btn preset-outlined-primary-500 mt-6">Start Building →</a>
      </div>

      <div class="stats-cluster">
        {#each stats as s}
          <div class="stat-block">
            <span class="stat-val">{s.value}</span>
            <span class="stat-lbl">{s.label}</span>
          </div>
        {/each}
      </div>
    </div>

  </div>
</section>

<!-- ══ §02 FEATURES ══════════════════════════════════════════════════ -->
<section class="lp-section lp-alt" id="features">
  <div class="lp-inner">

    <div class="sec-head reveal" bind:this={revealEls[2]}>
      <span class="sec-num">§02</span>
      <span class="sec-label">Features</span>
      <div class="sec-rule"></div>
    </div>

    <div class="features-grid reveal" bind:this={revealEls[3]}>
      {#each features as f, i}
        <div class="feat-card" style="transition-delay:{i * 55}ms">
          <span class="feat-num">{f.num}</span>
          <h3 class="feat-title">{f.title}</h3>
          <p class="feat-body">{f.body}</p>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ══ §03 STACK ═════════════════════════════════════════════════════ -->
<section class="lp-section" id="stack">
  <div class="lp-inner">

    <div class="sec-head reveal" bind:this={revealEls[4]}>
      <span class="sec-num">§03</span>
      <span class="sec-label">Stack</span>
      <div class="sec-rule"></div>
    </div>

    <div class="stack-layout reveal" bind:this={revealEls[5]}>
      {#each stackGroups as group}
        <div class="stack-group">
          <h3 class="stack-group-label">{group.label}</h3>
          <ul class="stack-list">
            {#each group.items as item}
              <li class="stack-item">
                <span class="stack-bullet">—</span>
                {item}
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ══ §04 HOW IT WORKS ══════════════════════════════════════════════ -->
<section class="lp-section lp-alt" id="how">
  <div class="lp-inner">

    <div class="sec-head reveal" bind:this={revealEls[6]}>
      <span class="sec-num">§04</span>
      <span class="sec-label">How It Works</span>
      <div class="sec-rule"></div>
    </div>

    <div class="steps-layout reveal" bind:this={revealEls[7]}>
      {#each steps as s, i}
        <div class="step-row">
          <div class="step-track">
            <span class="step-badge">{s.num}</span>
            {#if i < steps.length - 1}
              <div class="step-line"></div>
            {/if}
          </div>
          <div class="step-content">
            <h3 class="step-title">{s.title}</h3>
            <p class="step-body">{s.body}</p>
          </div>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ══ §05 GET STARTED ═══════════════════════════════════════════════ -->
<section class="lp-section cta-wrap" id="start">
  <div class="lp-inner">

    <div class="sec-head reveal" bind:this={revealEls[8]}>
      <span class="sec-num">§05</span>
      <span class="sec-label">Get Started</span>
      <div class="sec-rule"></div>
    </div>

    <div class="cta-body reveal" bind:this={revealEls[9]}>
      <h2 class="cta-heading">Clone it. Configure it.<br>Ship something real.</h2>
      <p class="cta-sub">
        Full source code, MIT licensed. Every feature from auth to admin — yours on day one.
      </p>
      <div class="cta-code-block">
        <code>git clone https://github.com/your-org/lmodulo</code>
      </div>
      <div class="flex gap-4 flex-wrap">
        <a href="/login" class="btn preset-filled-primary-500 btn-lg">Create Account</a>
        <a href="/login" class="btn preset-outlined-primary-500 btn-lg">Sign In</a>
      </div>
    </div>

  </div>
</section>

<!-- ══ FOOTER ════════════════════════════════════════════════════════ -->
<footer class="lp-footer">
  <div class="footer-inner">
    <Logo />
    <span class="footer-copy">MIT License · {new Date().getFullYear()}</span>
  </div>
</footer>

<style>
  /* ── Design tokens ─────────────────────────────────────────────── */
  :root {
    --lp-bg:         #08080b;
    --lp-alt-bg:     #0d0d11;
    --lp-border:     rgba(255, 255, 255, 0.07);
    --lp-border-md:  rgba(255, 255, 255, 0.12);
    --lp-text:       #e6e2d8;
    --lp-muted:      rgba(230, 226, 216, 0.45);
    --lp-dim:        rgba(230, 226, 216, 0.22);
    --lp-card-bg:    rgba(255, 255, 255, 0.025);
  }

  /* ── Cursor spotlight ──────────────────────────────────────────── */
  .spotlight {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 700px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      color-mix(in oklch, var(--color-primary-500) 6%, transparent) 0%,
      transparent 70%
    );
  }

  /* ── Grain overlay ─────────────────────────────────────────────── */
  .grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size: 300px 300px;
  }

  /* ── Scroll progress bar ───────────────────────────────────────── */
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: var(--color-primary-500);
    z-index: 200;
    transition: width 100ms linear;
  }

  /* ── Hero ──────────────────────────────────────────────────────── */
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--lp-bg);
  }

  .hex-bg {
    position: absolute;
    inset: -10% -5%;
    opacity: 0.35;
    pointer-events: none;
    will-change: transform;
  }

  :global(.hex-cell) {
    fill: transparent;
    stroke: var(--color-primary-500);
    stroke-width: 0.8;
    animation: hex-pulse 6s ease-in-out infinite;
  }

  @keyframes hex-pulse {
    0%, 100% { fill: transparent; stroke-opacity: 0.08; }
    50%       { fill: color-mix(in oklch, var(--color-primary-500) 10%, transparent); stroke-opacity: 0.4; }
  }

  .hero-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 65% 55% at 50% 50%,
      transparent 10%,
      color-mix(in oklch, var(--lp-bg) 55%, transparent) 60%,
      var(--lp-bg) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  .calibration {
    position: absolute;
    right: 6%;
    bottom: 8%;
    width: clamp(120px, 14vw, 200px);
    height: clamp(120px, 14vw, 200px);
    color: var(--lp-dim);
    opacity: 0.6;
    z-index: 2;
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8rem 1.75rem 5rem;
    max-width: 56rem;
    width: 100%;
    margin-inline: auto;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--lp-muted);
    margin-bottom: 1.75rem;
  }

  .eyebrow-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary-500);
    animation: dot-pulse 2.4s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }

  .display-heading {
    font-size: clamp(3rem, 8.5vw, 6.5rem);
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.04em;
    color: var(--lp-text);
    margin-bottom: 1.75rem;
    font-variant-ligatures: discretionary-ligatures;
  }

  .hero-tagline {
    font-size: clamp(1rem, 2vw, 1.175rem);
    color: var(--lp-muted);
    max-width: 34rem;
    line-height: 1.75;
    margin-bottom: 2rem;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--lp-dim);
    letter-spacing: 0.02em;
    margin-bottom: 2.5rem;
  }

  .meta-dot { opacity: 0.4; }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }

  .hero-ghost-btn {
    font-size: 0.9375rem;
    color: var(--lp-text);
    opacity: 0.6;
    text-decoration: none;
    letter-spacing: 0.01em;
    transition: opacity 150ms;
  }
  .hero-ghost-btn:hover { opacity: 1; }

  /* ── Sections ──────────────────────────────────────────────────── */
  .lp-section {
    background: var(--lp-bg);
    padding: 5rem 1.75rem;
    position: relative;
    z-index: 2;
  }

  .lp-alt {
    background: var(--lp-alt-bg);
  }

  .lp-inner {
    max-width: 64rem;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 3.5rem;
  }

  /* ── Section header row ────────────────────────────────────────── */
  .sec-head {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .sec-num {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--color-primary-500);
    opacity: 0.8;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .sec-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--lp-muted);
    white-space: nowrap;
  }

  .sec-rule {
    flex: 1;
    height: 1px;
    background: var(--lp-border);
  }

  /* ── Section copy ──────────────────────────────────────────────── */
  .sec-heading {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.025em;
    color: var(--lp-text);
  }

  .sec-sub {
    font-size: 1.0625rem;
    color: var(--lp-muted);
    line-height: 1.75;
    max-width: 42rem;
    margin-top: 1.25rem;
  }

  /* ── Overview ──────────────────────────────────────────────────── */
  .overview-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
  }

  @media (max-width: 720px) {
    .overview-layout { grid-template-columns: 1fr; gap: 3rem; }
  }

  .overview-copy { display: flex; flex-direction: column; align-items: flex-start; }

  .stats-cluster {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 2rem;
    align-self: center;
  }

  .stat-block {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1.5rem;
    border: 1px solid var(--lp-border);
    background: var(--lp-card-bg);
    transition: border-color 200ms;
  }
  .stat-block:hover { border-color: var(--lp-border-md); }

  .stat-val {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--color-primary-500);
    line-height: 1;
  }

  .stat-lbl {
    font-size: 0.75rem;
    color: var(--lp-muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Features ──────────────────────────────────────────────────── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1px;
    border: 1px solid var(--lp-border);
    background: var(--lp-border);
    overflow: hidden;
  }

  .feat-card {
    background: var(--lp-bg);
    padding: 2rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    border-left: 2px solid transparent;
    transition: border-color 200ms, background 200ms;
  }
  .lp-alt .feat-card { background: var(--lp-alt-bg); }
  .feat-card:hover {
    border-left-color: var(--color-primary-500);
    background: color-mix(in oklch, var(--color-primary-500) 4%, var(--lp-alt-bg));
  }

  .feat-num {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--color-primary-500);
    opacity: 0.65;
  }

  .feat-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--lp-text);
    line-height: 1.3;
  }

  .feat-body {
    font-size: 0.875rem;
    color: var(--lp-muted);
    line-height: 1.65;
    flex: 1;
  }

  /* ── Stack ─────────────────────────────────────────────────────── */
  .stack-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    gap: 3rem 4rem;
  }

  @media (max-width: 560px) {
    .stack-layout { grid-template-columns: 1fr 1fr; gap: 2rem; }
  }

  .stack-group-label {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-primary-500);
    opacity: 0.75;
    margin-bottom: 1rem;
  }

  .stack-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .stack-item {
    display: flex;
    align-items: baseline;
    gap: 0.625rem;
    font-size: 0.9375rem;
    color: var(--lp-text);
    line-height: 1.4;
  }

  .stack-bullet {
    color: var(--lp-dim);
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  /* ── Steps ─────────────────────────────────────────────────────── */
  .steps-layout {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step-row {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: 2rem;
    padding-bottom: 3rem;
  }

  .step-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .step-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--lp-border-md);
    background: var(--lp-card-bg);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-primary-500);
    flex-shrink: 0;
  }

  .step-line {
    flex: 1;
    width: 1px;
    min-height: 2rem;
    background: var(--lp-border);
    margin-top: 0.5rem;
  }

  .step-content { padding-top: 0.25rem; }

  .step-title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--lp-text);
    margin-bottom: 0.5rem;
  }

  .step-body {
    font-size: 0.9375rem;
    color: var(--lp-muted);
    line-height: 1.7;
  }

  /* ── CTA ───────────────────────────────────────────────────────── */
  .cta-wrap {
    border-top: 1px solid var(--lp-border);
  }

  .cta-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
    max-width: 42rem;
  }

  .cta-heading {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.035em;
    color: var(--lp-text);
  }

  .cta-sub {
    font-size: 1.0625rem;
    color: var(--lp-muted);
    line-height: 1.7;
  }

  .cta-code-block {
    background: var(--lp-card-bg);
    border: 1px solid var(--lp-border);
    padding: 0.875rem 1.25rem;
    font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
    font-size: 0.875rem;
    color: var(--lp-text);
    letter-spacing: 0.01em;
    width: 100%;
    max-width: 38rem;
  }

  /* ── Footer ─────────────────────────────────────────────────────── */
  .lp-footer {
    background: var(--lp-bg);
    border-top: 1px solid var(--lp-border);
    padding: 1.75rem;
    position: relative;
    z-index: 2;
  }

  .footer-inner {
    max-width: 64rem;
    margin-inline: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .footer-copy {
    font-size: 0.8125rem;
    color: var(--lp-dim);
    letter-spacing: 0.02em;
  }

  /* ── Scroll reveal ──────────────────────────────────────────────── */
  .reveal {
    opacity: 0;
    transform: translateY(1.25rem);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

</style>
