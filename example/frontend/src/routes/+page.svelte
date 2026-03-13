<script lang="ts">
  import { onMount } from 'svelte';

  // ── Honeycomb SVG generation ──────────────────────────────────────
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
  let fadeRefs: (Element | undefined)[] = $state(Array(30).fill(undefined));

  // ── Data ──────────────────────────────────────────────────────────
  const features = [
    { icon: '🔐', title: 'Secure Authentication', body: 'Login and registration with bcrypt hashing, server-side session validation on every request, and redirect guards.' },
    { icon: '🗄️', title: 'Session Management',    body: 'MongoDB-backed sessions via connect-mongo with configurable TTL, signed HTTP-only cookies, and auto cleanup.' },
    { icon: '🎨', title: 'UI Component System',    body: 'Skeleton v4 with Tailwind v4 — buttons, badges, cards, forms, navigation, and a custom branded theme.' },
    { icon: '🐳', title: 'Docker Dev Stack',        body: 'One command brings up SvelteKit, Fastify, and MongoDB with bind-mount hot reload and health-checked startup order.' },
    { icon: '⚡', title: 'Type-Safe API',           body: 'Fastify v5 with TypeScript, JSON Schema request validation, plugin encapsulation, and a structured route layout.' },
    { icon: '🚀', title: 'Production Ready',        body: 'Separate dev and prod Docker configs, environment-aware security settings, and health endpoints built in.' }
  ];

  const stats = [
    { value: '10k+',   label: 'Developers' },
    { value: '< 5min', label: 'Setup Time' },
    { value: '100%',   label: 'TypeScript' },
    { value: 'MIT',    label: 'License'    }
  ];

  const steps = [
    { num: '01', title: 'Clone the repo',       body: 'One git clone pulls the entire scaffold — API, frontend, and database all configured and ready.' },
    { num: '02', title: 'Set your env vars',     body: 'Copy .env.example, add a session secret and Mongo URI. Everything else has sensible defaults.' },
    { num: '03', title: 'Deploy anywhere',       body: 'Docker Compose for local dev. Drop the same image into any cloud provider for production.' }
  ];

  const buttons = [
    { label: 'Primary',   cls: 'btn preset-filled-primary-500'   },
    { label: 'Secondary', cls: 'btn preset-tonal-secondary-500'  },
    { label: 'Outlined',  cls: 'btn preset-outlined-primary-500' },
    { label: 'Error',     cls: 'btn preset-tonal-error-500'      },
    { label: 'Success',   cls: 'btn preset-tonal-success-500'    },
    { label: 'Warning',   cls: 'btn preset-tonal-warning-500'    }
  ];

  const badges = [
    { label: 'primary',   cls: 'badge preset-tonal-primary'   },
    { label: 'secondary', cls: 'badge preset-tonal-secondary' },
    { label: 'success',   cls: 'badge preset-tonal-success'   },
    { label: 'warning',   cls: 'badge preset-tonal-warning'   },
    { label: 'error',     cls: 'badge preset-tonal-error'     },
    { label: 'surface',   cls: 'badge preset-tonal-surface'   }
  ];

  const alerts = [
    { preset: 'preset-tonal-success', label: 'Success', msg: 'Your changes have been saved successfully.' },
    { preset: 'preset-tonal-warning', label: 'Warning', msg: 'This action will affect all team members.' },
    { preset: 'preset-tonal-error',   label: 'Error',   msg: 'Connection failed. Please try again.' }
  ];

  const testimonials = [
    { quote: 'Saved me two weeks of boilerplate. Auth, roles, and a polished UI all wired before I wrote a single line of business logic.', name: 'Alex Rivera',  role: 'Senior Engineer',    initials: 'AR', hue: 'var(--color-primary-500)'   },
    { quote: "The RBAC system is exactly what I needed. Per-route guards and component-level permission checks that actually work.", name: 'Sam Chen',    role: 'Fullstack Developer',  initials: 'SC', hue: 'var(--color-secondary-500)' },
    { quote: "Best scaffold I've tried. SvelteKit + Fastify is a killer combo and the Skeleton UI themes are gorgeous out of the box.", name: 'Jamie Brooks', role: 'Indie Hacker',         initials: 'JB', hue: 'var(--color-tertiary-500)'  }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      desc: 'Everything you need to launch a project today.',
      badge: null,
      features: ['Full source code', 'Auth & session management', 'SvelteKit + Fastify', 'Docker dev stack', 'MIT License'],
      cta: 'Clone Now',
      href: '/register',
      highlight: false
    },
    {
      name: 'Pro',
      price: '$12',
      period: 'per month',
      desc: 'Advanced features for growing applications.',
      badge: 'Most Popular',
      features: ['Everything in Starter', 'RBAC roles & permissions', 'Admin dashboard', 'Manage Users UI', 'Priority support'],
      cta: 'Get Started',
      href: '/register',
      highlight: true
    },
    {
      name: 'Team',
      price: '$49',
      period: 'per month',
      desc: 'Built for teams that ship fast.',
      badge: null,
      features: ['Everything in Pro', 'Unlimited team seats', 'Custom branding', 'Audit logging', 'SLA guarantee'],
      cta: 'Contact Sales',
      href: '/register',
      highlight: false
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

  <div class="hero-vignette"></div>

  <div class="hero-content">
    <span class="badge preset-tonal-primary mb-6">Production-ready scaffold</span>

    <h1 class="hero-headline">
      Build faster.<br />Ship smarter.
    </h1>

    <p class="hero-sub">
      A full-stack SvelteKit + Fastify scaffold with authentication, RBAC, session management,
      MongoDB, and a polished Skeleton UI — clone it and start shipping.
    </p>

    <div class="flex flex-wrap gap-4 justify-center">
      <a href="/register" class="btn preset-filled-primary-500 btn-lg">Get Started Free</a>
      <a href="/login"    class="btn preset-outlined-primary-500 btn-lg">Sign In</a>
    </div>
  </div>
</section>

<!-- ── Stats ──────────────────────────────────────────────────────── -->
<section class="section-stats">
  <div class="stats-inner fade-el" bind:this={fadeRefs[0]}>
    {#each stats as s}
      <div class="stat-item">
        <span class="stat-value">{s.value}</span>
        <span class="stat-label">{s.label}</span>
      </div>
    {/each}
  </div>
</section>

<!-- ── Features ───────────────────────────────────────────────────── -->
<section class="section-dark">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[1]}>
      <h2 class="section-heading">Everything wired up on day one</h2>
      <p class="section-sub">No boilerplate hunting. Every layer is configured and connected.</p>
    </div>

    <div class="features-grid">
      {#each features as f, i}
        <div
          class="feature-card fade-el"
          style="transition-delay: {i * 70}ms"
          bind:this={fadeRefs[i + 2]}
        >
          <span class="feature-icon">{f.icon}</span>
          <h3 class="feature-title">{f.title}</h3>
          <p class="feature-body">{f.body}</p>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ── How it works ───────────────────────────────────────────────── -->
<section class="section-mid">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[9]}>
      <h2 class="section-heading-alt">Up and running in three steps</h2>
      <p class="section-sub-alt">From zero to authenticated app in under five minutes.</p>
    </div>

    <div class="steps-grid fade-el" bind:this={fadeRefs[10]}>
      {#each steps as s}
        <div class="step-card">
          <span class="step-num">{s.num}</span>
          <h3 class="step-title">{s.title}</h3>
          <p class="step-body">{s.body}</p>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ── Component showcase ─────────────────────────────────────────── -->
<section class="section-dark">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[11]}>
      <h2 class="section-heading">UI components included</h2>
      <p class="section-sub">Skeleton v4 ships dozens of pre-styled, themeable components ready to use.</p>
    </div>

    <div class="showcase-grid fade-el" bind:this={fadeRefs[12]}>

      <!-- Buttons -->
      <div class="showcase-card">
        <p class="showcase-label">Buttons</p>
        <div class="flex flex-wrap gap-2">
          {#each buttons as b}
            <button type="button" class="{b.cls} btn-sm">{b.label}</button>
          {/each}
        </div>
      </div>

      <!-- Badges -->
      <div class="showcase-card">
        <p class="showcase-label">Badges</p>
        <div class="flex flex-wrap gap-2">
          {#each badges as b}
            <span class={b.cls}>{b.label}</span>
          {/each}
        </div>
      </div>

      <!-- Alerts -->
      <div class="showcase-card col-span-full">
        <p class="showcase-label">Alerts</p>
        <div class="space-y-2">
          {#each alerts as a}
            <div class="alert {a.preset} p-3 rounded-base text-sm flex items-center gap-2">
              <span class="font-semibold">{a.label}:</span>
              <span>{a.msg}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Card -->
      <div class="showcase-card">
        <p class="showcase-label">Card</p>
        <div class="card preset-filled-surface-100-900 overflow-hidden text-sm">
          <header class="preset-filled-primary-500 px-4 py-3 font-semibold">Card Header</header>
          <div class="p-4 space-y-2 text-surface-300">
            <p>Card body with any content — text, forms, tables, or nested components.</p>
            <div class="flex gap-2 pt-1">
              <button type="button" class="btn btn-sm preset-filled-primary-500">Action</button>
              <button type="button" class="btn btn-sm preset-tonal">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="showcase-card">
        <p class="showcase-label">Progress</p>
        <div class="space-y-3">
          {#each [
            { label: 'Storage',    pct: 72, cls: 'bg-primary-500'   },
            { label: 'Bandwidth',  pct: 45, cls: 'bg-secondary-500' },
            { label: 'API Quota',  pct: 91, cls: 'bg-error-500'     }
          ] as row}
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-surface-400">
                <span>{row.label}</span>
                <span>{row.pct}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-surface-700">
                <div class="h-2 rounded-full {row.cls}" style="width: {row.pct}%"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ── Stack ──────────────────────────────────────────────────────── -->
<section class="section-mid">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[13]}>
      <h2 class="section-heading-alt">The stack</h2>
      <p class="section-sub-alt">Modern, opinionated, and fully typed end to end.</p>
    </div>

    <div class="fade-el stack-grid" bind:this={fadeRefs[14]}>
      {#each stack as tech}
        <span class="badge preset-tonal-primary text-sm px-4 py-2">{tech}</span>
      {/each}
    </div>

  </div>
</section>

<!-- ── Testimonials ───────────────────────────────────────────────── -->
<section class="section-dark">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[15]}>
      <h2 class="section-heading">Trusted by developers</h2>
      <p class="section-sub">What people are saying after shipping with AppFramework.</p>
    </div>

    <div class="testimonials-grid fade-el" bind:this={fadeRefs[16]}>
      {#each testimonials as t}
        <div class="testimonial-card">
          <p class="testimonial-quote">"{t.quote}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar" style="background: {t.hue}">{t.initials}</div>
            <div>
              <div class="testimonial-name">{t.name}</div>
              <div class="testimonial-role">{t.role}</div>
            </div>
          </div>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ── Pricing ────────────────────────────────────────────────────── -->
<section class="section-mid">
  <div class="section-inner">

    <div class="fade-el text-center space-y-3" bind:this={fadeRefs[17]}>
      <h2 class="section-heading-alt">Simple, transparent pricing</h2>
      <p class="section-sub-alt">Start free. Scale when you're ready.</p>
    </div>

    <div class="pricing-grid fade-el" bind:this={fadeRefs[18]}>
      {#each plans as plan}
        <div class="pricing-card {plan.highlight ? 'pricing-card--highlight' : ''}">
          <div class="pricing-header">
            <div class="flex items-start justify-between gap-2">
              <h3 class="pricing-name">{plan.name}</h3>
              {#if plan.badge}
                <span class="badge preset-filled-primary-500 text-xs">{plan.badge}</span>
              {/if}
            </div>
            <div class="pricing-price">
              {plan.price}<span class="pricing-period"> / {plan.period}</span>
            </div>
            <p class="pricing-desc">{plan.desc}</p>
          </div>
          <ul class="pricing-features">
            {#each plan.features as feat}
              <li class="pricing-feat">
                <span class="feat-check">✓</span>
                {feat}
              </li>
            {/each}
          </ul>
          <a href={plan.href} class="btn w-full {plan.highlight ? 'preset-filled-primary-500' : 'preset-outlined-primary-500'}">
            {plan.cta}
          </a>
        </div>
      {/each}
    </div>

  </div>
</section>

<!-- ── CTA ────────────────────────────────────────────────────────── -->
<section class="section-cta">
  <div class="fade-el section-inner text-center space-y-6" bind:this={fadeRefs[19]}>
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

  /* ── Stats ───────────────────────────────────────────────────── */
  .section-stats {
    background: color-mix(in oklch, var(--color-primary-900) 40%, var(--color-surface-950));
    border-top: 1px solid color-mix(in oklch, var(--color-primary-500) 20%, transparent);
    border-bottom: 1px solid color-mix(in oklch, var(--color-primary-500) 20%, transparent);
    padding: 2.5rem 1.5rem;
  }

  .stats-inner {
    max-width: 56rem;
    margin-inline: auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 2rem;
    text-align: center;
  }

  .stat-item { display: flex; flex-direction: column; gap: 0.25rem; }

  .stat-value {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--color-primary-300);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--color-surface-400);
    text-transform: uppercase;
    letter-spacing: 0.06em;
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

  .section-heading, .section-heading-alt {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--color-surface-50);
  }

  .section-sub, .section-sub-alt {
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

  .feature-icon  { font-size: 1.75rem; }
  .feature-title { font-size: 1rem; font-weight: 600; color: var(--color-surface-100); }
  .feature-body  { font-size: 0.875rem; color: var(--color-surface-400); line-height: 1.6; }

  /* ── Steps ───────────────────────────────────────────────────── */
  .steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 1.5rem;
  }

  .step-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 2rem 1.5rem;
    border: 1px solid color-mix(in oklch, var(--color-primary-500) 12%, transparent);
    border-radius: var(--radius-container);
    background: color-mix(in oklch, var(--color-surface-900) 60%, transparent);
  }

  .step-num {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
    color: var(--color-primary-500);
    opacity: 0.6;
  }

  .step-title { font-size: 1.0625rem; font-weight: 600; color: var(--color-surface-100); }
  .step-body  { font-size: 0.875rem;  color: var(--color-surface-400); line-height: 1.6; }

  /* ── Component showcase ──────────────────────────────────────── */
  .showcase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 1.25rem;
  }

  .col-span-full { grid-column: 1 / -1; }

  .showcase-card {
    background: color-mix(in oklch, var(--color-surface-800) 70%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-surface-600) 30%, transparent);
    border-radius: var(--radius-container);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .showcase-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-surface-500);
  }

  /* ── Stack badges ─────────────────────────────────────────────── */
  .stack-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  /* ── Testimonials ────────────────────────────────────────────── */
  .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 1.25rem;
  }

  .testimonial-card {
    background: color-mix(in oklch, var(--color-surface-800) 70%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-primary-500) 12%, transparent);
    border-radius: var(--radius-container);
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .testimonial-quote {
    font-size: 0.9375rem;
    color: var(--color-surface-300);
    line-height: 1.65;
    flex: 1;
  }

  .testimonial-author {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .testimonial-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .testimonial-name { font-size: 0.875rem; font-weight: 600; color: var(--color-surface-100); }
  .testimonial-role { font-size: 0.75rem;  color: var(--color-surface-500); }

  /* ── Pricing ─────────────────────────────────────────────────── */
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    gap: 1.25rem;
    align-items: start;
  }

  .pricing-card {
    background: color-mix(in oklch, var(--color-surface-900) 80%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-surface-700) 40%, transparent);
    border-radius: var(--radius-container);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .pricing-card--highlight {
    background: color-mix(in oklch, var(--color-primary-900) 50%, var(--color-surface-900));
    border-color: color-mix(in oklch, var(--color-primary-500) 50%, transparent);
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--color-primary-500) 30%, transparent);
  }

  .pricing-header { display: flex; flex-direction: column; gap: 0.5rem; }
  .pricing-name   { font-size: 1.125rem; font-weight: 700; color: var(--color-surface-100); }

  .pricing-price {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--color-surface-50);
    line-height: 1;
  }

  .pricing-period { font-size: 0.875rem; font-weight: 400; color: var(--color-surface-500); }
  .pricing-desc   { font-size: 0.875rem; color: var(--color-surface-400); line-height: 1.5; }

  .pricing-features { display: flex; flex-direction: column; gap: 0.625rem; flex: 1; }

  .pricing-feat {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    font-size: 0.875rem;
    color: var(--color-surface-300);
  }

  .feat-check {
    color: var(--color-success-500);
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 0.05rem;
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
