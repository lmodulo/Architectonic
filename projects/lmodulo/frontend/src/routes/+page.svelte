<script lang="ts">
  import { onMount } from 'svelte';
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let scrollY  = $state(0);
  let progress = $state(0);
  let mouseX   = $state(-9999);
  let mouseY   = $state(-9999);
  let latticeCanvas: HTMLCanvasElement | undefined = $state();

  const features = [
    { num: '01', title: 'Auth & Sessions',       body: 'Login, registration, and password reset — bcrypt hashing, HTTP-only signed session cookies, and server-side validation on every request.' },
    { num: '02', title: 'Role-Based Access',      body: 'Per-route Fastify preHandlers, component-level permission checks, and a full roles management UI. Add a resource by appending to a JSON file.' },
    { num: '03', title: 'In-App Messaging',        body: 'A full email-style thread system — inbox, sent, archive, unread badges, and Tiptap rich-text composition. Ships ready to extend.' },
    { num: '04', title: 'Skeleton UI System',      body: 'Skeleton v4 with Tailwind v4 — buttons, badges, cards, forms, and a branded dark theme. Every component is already wired into the scaffold.' },
    { num: '05', title: 'Docker Dev Stack',        body: 'One command stands up SvelteKit, Fastify, and MongoDB with health-checked startup sequencing. Production uses the same compose file minus the dev overlay.' },
    { num: '06', title: 'CLI Module System',       body: 'arch.js merges nav entries, routes, permissions, and env vars from each module manifest into the scaffold — collision-checked before any write.' },
  ];

  const stackGroups = [
    { label: 'Frontend',  items: ['SvelteKit 2', 'Svelte 5 Runes', 'TypeScript', 'Tailwind v4', 'Skeleton v4'] },
    { label: 'Backend',   items: ['Fastify 5', 'MongoDB 7', 'TypeScript', 'connect-mongo', 'bcryptjs'] },
    { label: 'Tooling',   items: ['Docker Compose', 'Vite', 'Node 22', 'ESLint', 'Prettier'] },
    { label: 'Extras',    items: ['Ollama AI chat', 'Tiptap rich text', 'Lucide icons', 'Audit logging'] },
  ];

  const steps = [
    { num: '01', title: 'Clone the repository',  body: 'One git clone pulls the entire scaffold — API, frontend, and database configured and wired together.' },
    { num: '02', title: 'Set two env vars',       body: 'Copy .env.example, set a session secret and Mongo URI. Everything else runs on sensible defaults.' },
    { num: '03', title: 'Bring up the stack',     body: 'docker compose up — SvelteKit, Fastify, and MongoDB start in the correct order, health-checked.' },
    { num: '04', title: 'Start building',          body: 'Auth is wired, RBAC is live, the dashboard is seeded. Write your first feature in minutes, not days.' },
  ];

  const stats = [
    { value: '< 5 min', label: 'to a running app'      },
    { value: '100%',    label: 'TypeScript coverage'    },
    { value: '3',       label: 'services, one command'  },
    { value: 'MIT',     label: 'open source license'    },
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
    document.querySelectorAll<Element>('.reveal').forEach(el => io.observe(el));

    // ── Lattice ──────────────────────────────────────────────────────
    let rafId = 0;
    const canvas = latticeCanvas;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('mousemove', onMouse);
        io.disconnect();
      };
    }

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0, cx = 0, cy = 0;

    type LNode = { q: number; r: number; restX: number; restY: number; x: number; y: number; height: number; idx: number };
    let nodes: LNode[] = [], nodeMap: Record<string, LNode> = {}, edges: [LNode, LNode][] = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]] as const;
    const spacing = 10;
    const sqrt3 = Math.sqrt(3);

    function hexPx(q: number, r: number) {
      return { x: spacing * 1.5 * q + cx, y: spacing * (sqrt3 * 0.5 * q + sqrt3 * r) + cy };
    }

    function buildLattice() {
      nodes = []; nodeMap = {}; edges = [];
      const R = Math.ceil(Math.max(W, H) / spacing / 1.5) + 2;
      for (let q = -R; q <= R; q++) {
        for (let r = -R; r <= R; r++) {
          if (Math.abs(-q - r) > R) continue;
          const pos = hexPx(q, r);
          if (pos.x < -40 || pos.x > W + 40 || pos.y < -40 || pos.y > H + 40) continue;
          const n: LNode = { q, r, restX: pos.x, restY: pos.y, x: pos.x, y: pos.y, height: 0, idx: nodes.length };
          nodes.push(n); nodeMap[`${q},${r}`] = n;
        }
      }
      const seen: Record<string, true> = {};
      for (const n of nodes) {
        for (const [dq, dr] of dirs) {
          const nb = nodeMap[`${n.q + dq},${n.r + dr}`];
          if (!nb) continue;
          const key = `${Math.min(n.idx, nb.idx)}-${Math.max(n.idx, nb.idx)}`;
          if (seen[key]) continue;
          seen[key] = true;
          edges.push([n, nb]);
        }
      }
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
      buildLattice();
    }

    // Colors — drift across the primary purple hue range (270–310 deg)
    const HUE_A = 302, HUE_B = 268, HUE_SPAN = HUE_A - HUE_B;

    function nodeColor(h: number, n: LNode, time: number) {
      const crest  = Math.max(0, h);
      const trough = Math.max(0, -h);
      const mix  = (((n.restX / W * 0.7 + n.restY / H * 0.3) + (Math.sin(time * 0.18) + 1) * 0.5) % 1 + 1) % 1;
      const hue  = HUE_A - HUE_SPAN * mix;
      const sat  = 18 + crest * 55;
      const lit  = 28 + crest * 38 - trough * 10;
      const a    = 0.12 + crest * 0.88 + trough * 0.06;
      return `hsla(${hue.toFixed(1)},${sat.toFixed(0)}%,${lit.toFixed(0)}%,${a.toFixed(2)})`;
    }

    function edgeColor(h: number, a: LNode, b: LNode, time: number) {
      const crest  = Math.max(0, h);
      const trough = Math.max(0, -h);
      const mx = (a.restX + b.restX) * 0.5, my = (a.restY + b.restY) * 0.5;
      const mix  = (((mx / W * 0.7 + my / H * 0.3) + (Math.sin(time * 0.18) + 1) * 0.5) % 1 + 1) % 1;
      const hue  = HUE_A - HUE_SPAN * mix;
      const sat  = 14 + crest * 60;
      const lit  = 18 + crest * 38 - trough * 5;
      const al   = 0.03 + crest * 0.36 + trough * 0.02;
      return `hsla(${hue.toFixed(1)},${sat.toFixed(0)}%,${lit.toFixed(0)}%,${al.toFixed(2)})`;
    }

    let amp = 60 + Math.random() * 120, wavelength = 180 + Math.random() * 120;
    let ampPrev = amp, ampTarget = amp, wlPrev = wavelength, wlTarget = wavelength;
    let lerpStart = 0, lerpDur = 1500;
    const speed = 1.2, decayRate = 0.0018;

    const emitters = [
      { phase: 0,   strength: 1.0, cx: 0, cy: 0 },
      { phase: 2.1, strength: 0.6, cx: 0, cy: 0 },
      { phase: 4.3, strength: 0.5, cx: 0, cy: 0 },
    ];

    function sched() {
      const delay = (3 + Math.random() * 5) * 1000;
      setTimeout(() => {
        ampPrev = amp; wlPrev = wavelength;
        ampTarget = 60 + Math.random() * 120; wlTarget = 180 + Math.random() * 120;
        lerpStart = performance.now(); lerpDur = delay * 0.6;
        sched();
      }, delay);
    }
    sched();

    function animate(t: number) {
      const lt = Math.min(1, (t - lerpStart) / lerpDur);
      const ease = lt * lt * (3 - 2 * lt);
      amp        = ampPrev + (ampTarget - ampPrev) * ease;
      wavelength = wlPrev  + (wlTarget  - wlPrev)  * ease;
      const time = t * 0.001 * speed;
      ctx.clearRect(0, 0, W, H);

      const maxD = Math.min(W, H) * 0.15;
      for (let i = 0; i < emitters.length; i++) {
        const em = emitters[i];
        em.cx = cx + Math.sin(time * 0.07 + em.phase) * maxD * (1 + i * 0.3);
        em.cy = cy + Math.cos(time * 0.05 + em.phase * 1.3) * maxD * (1 + i * 0.2);
      }

      for (const n of nodes) {
        let disp = 0;
        for (const em of emitters) {
          const dx = n.restX - em.cx, dy = n.restY - em.cy;
          const d  = Math.sqrt(dx * dx + dy * dy);
          const env = em.strength * amp * Math.exp(-d * decayRate);
          disp += env * (Math.sin((d / wavelength) * Math.PI * 2 - time + em.phase) * 0.75
                       + Math.sin((d / (wavelength * 0.55)) * Math.PI * 2 - time * 1.3 + em.phase) * 0.25);
        }
        const cdx = n.restX - cx, cdy = n.restY - cy;
        const cd  = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cd < 0.1) { n.x = n.restX; n.y = n.restY; n.height = 0; continue; }
        n.x = n.restX + (cdx / cd) * disp * 0.7;
        n.y = n.restY + (cdy / cd) * disp * 0.7;
        n.height = disp / (amp + 0.01);
      }

      for (const [a, b] of edges) {
        const eh = Math.max(-1, Math.min(1, (a.height + b.height) * 0.5));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = edgeColor(eh, a, b, time);
        ctx.lineWidth = 0.2 + Math.max(0, eh) * 0.5;
        ctx.stroke();
      }
      for (const n of nodes) {
        const h = Math.max(-1, Math.min(1, n.height));
        ctx.beginPath(); ctx.arc(n.x, n.y, 0.4 + Math.max(0, h), 0, Math.PI * 2);
        ctx.fillStyle = nodeColor(h, n, time);
        ctx.fill();
      }
      rafId = requestAnimationFrame(animate);
    }

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    resize();
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      io.disconnect();
    };
  });
</script>

<svelte:head>
  <title>Architectonic — Full-Stack SvelteKit Scaffold</title>
</svelte:head>

<!-- ── Fixed backgrounds ───────────────────────────────────────────── -->
<canvas bind:this={latticeCanvas} class="lattice-canvas" aria-hidden="true"></canvas>
<div class="lattice-vignette" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<div class="spotlight" style="left:{mouseX}px; top:{mouseY}px" aria-hidden="true"></div>
<div class="scroll-progress" style="width:{progress}%" aria-hidden="true"></div>

<!-- ── Nav ─────────────────────────────────────────────────────────── -->
<MarketingNav brandName={data.brandName} brandLogo={data.brandLogo} />

<!-- ══ HERO ══════════════════════════════════════════════════════════ -->
<section class="hero">
  <!-- Calibration mark -->
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
      Full-Stack SvelteKit Scaffold · MIT License
    </div>

    <h1 class="display-heading">
      Stop scaffolding.<br><em>Start shipping.</em>
    </h1>

    <p class="hero-tagline">
      Authentication, RBAC, sessions, in-app messaging, and a polished
      UI system — all pre-wired before you write a single line of
      business logic.
    </p>

    <div class="hero-meta">
      <span>SvelteKit 2 + Svelte 5</span>
      <span class="meta-dot">·</span>
      <span>Fastify 5</span>
      <span class="meta-dot">·</span>
      <span>MongoDB 7</span>
      <span class="meta-dot">·</span>
      <span>Docker Compose</span>
    </div>

    <div class="hero-actions">
      <a href="https://github.com/lmodulo/Architectonic" target="_blank" rel="noopener" class="btn preset-filled-primary-500">
        View on GitHub →
      </a>
      <a href="/login" class="hero-ghost-btn">Sign In</a>
    </div>
  </div>

  <div class="hero-bottom-rule" aria-hidden="true"></div>
</section>

<!-- ══ §01 OVERVIEW ══════════════════════════════════════════════════ -->
<section class="lp-section" id="overview">
  <div class="lp-inner">

    <div class="sec-head reveal">
      <span class="sec-num">§01</span>
      <span class="sec-label">Overview</span>
      <div class="sec-rule"></div>
    </div>

    <div class="overview-layout reveal">
      <div class="overview-copy">
        <h2 class="sec-heading">
          Every layer configured.<br>Nothing left to wire.
        </h2>
        <p class="sec-sub">
          Architectonic eliminates the boilerplate between your idea and a
          running application. Clone the scaffold, set two environment
          variables, and you're building features — not plumbing auth,
          debugging sessions, or hand-wiring permissions.
        </p>
        <p class="sec-sub" style="margin-top:0.75rem;">
          A build-time module system extends the scaffold without manual
          wiring. Each module declares its nav entries, routes, permissions,
          and env vars in a manifest — <code class="inline-code">arch.js create</code>
          merges them in, collision-checked, before any file is written.
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

    <div class="sec-head reveal">
      <span class="sec-num">§02</span>
      <span class="sec-label">What Ships By Default</span>
      <div class="sec-rule"></div>
    </div>

    <div class="features-grid reveal">
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

    <div class="sec-head reveal">
      <span class="sec-num">§03</span>
      <span class="sec-label">Stack</span>
      <div class="sec-rule"></div>
    </div>

    <div class="stack-layout reveal">
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

    <div class="sec-head reveal">
      <span class="sec-num">§04</span>
      <span class="sec-label">How It Works</span>
      <div class="sec-rule"></div>
    </div>

    <div class="steps-layout reveal">
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

    <div class="sec-head reveal">
      <span class="sec-num">§05</span>
      <span class="sec-label">Get Started</span>
      <div class="sec-rule"></div>
    </div>

    <div class="cta-body reveal">
      <h2 class="cta-heading">Clone it. Configure it.<br>Ship something real.</h2>
      <p class="cta-sub">
        Full source code, MIT licensed. Auth, RBAC, messaging, and the
        module system — yours on day one, no license fees, no vendor lock-in.
      </p>
      <div class="cta-code-block">
        <code>git clone https://github.com/lmodulo/Architectonic</code>
      </div>
      <div class="flex gap-4 flex-wrap">
        <a href="https://github.com/lmodulo/Architectonic" target="_blank" rel="noopener"
           class="btn preset-filled-primary-500 btn-lg">
          View on GitHub
        </a>
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
  /* ── Tokens ──────────────────────────────────────────────────────── */
  :root {
    --lp-bg-solid:   oklch(8% 0.006 265deg);
    --lp-alt-solid:  oklch(10% 0.006 265deg);
    --lp-bg:         color-mix(in oklch, oklch(8%  0.006 265deg) 86%, transparent);
    --lp-alt-bg:     color-mix(in oklch, oklch(10% 0.006 265deg) 88%, transparent);
    --lp-border:     rgba(255, 255, 255, 0.07);
    --lp-border-md:  rgba(255, 255, 255, 0.12);
    --lp-text:       #e6e2d8;
    --lp-muted:      rgba(230, 226, 216, 0.48);
    --lp-dim:        rgba(230, 226, 216, 0.22);
    --lp-card-bg:    rgba(255, 255, 255, 0.03);
  }

  /* ── Lattice canvas ──────────────────────────────────────────────── */
  .lattice-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.7;
  }

  /* ── Lattice edge vignette ───────────────────────────────────────── */
  .lattice-vignette {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(
      ellipse 80% 70% at 50% 50%,
      transparent 25%,
      rgba(8, 8, 11, 0.5) 65%,
      rgba(8, 8, 11, 0.92) 88%,
      #08080b 100%
    );
  }

  /* ── Grain ───────────────────────────────────────────────────────── */
  .grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    opacity: 0.032;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size: 300px 300px;
  }

  /* ── Cursor spotlight ────────────────────────────────────────────── */
  .spotlight {
    position: fixed;
    pointer-events: none;
    z-index: 3;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 700px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      color-mix(in oklch, var(--color-primary-500) 8%, transparent) 0%,
      transparent 65%
    );
  }

  /* ── Scroll progress ─────────────────────────────────────────────── */
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: var(--color-primary-500);
    z-index: 200;
    transition: width 100ms linear;
  }

  /* ── Hero ────────────────────────────────────────────────────────── */
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    z-index: 10;
  }

  .calibration {
    position: absolute;
    right: 6%;
    bottom: 8%;
    width: clamp(100px, 12vw, 180px);
    height: clamp(100px, 12vw, 180px);
    color: var(--lp-dim);
    opacity: 0.5;
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

  .hero-bottom-rule {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--lp-border);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.14em;
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
    50%       { opacity: 0.35; transform: scale(0.65); }
  }

  .display-heading {
    font-size: clamp(3rem, 8.5vw, 6.5rem);
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.04em;
    color: var(--lp-text);
    margin-bottom: 1.75rem;
  }

  .display-heading em {
    font-style: normal;
    color: var(--color-primary-400);
  }

  .hero-tagline {
    font-size: clamp(1rem, 2vw, 1.175rem);
    color: var(--lp-muted);
    max-width: 36rem;
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
    opacity: 0.5;
    text-decoration: none;
    letter-spacing: 0.01em;
    transition: opacity 150ms;
  }
  .hero-ghost-btn:hover { opacity: 1; }

  /* ── Sections ────────────────────────────────────────────────────── */
  .lp-section {
    background: var(--lp-bg);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 5rem 1.75rem;
    position: relative;
    z-index: 10;
    border-top: 1px solid var(--lp-border);
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

  /* ── Section header ──────────────────────────────────────────────── */
  .sec-head {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .sec-num {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--color-primary-500);
    opacity: 0.75;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .sec-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-muted);
    white-space: nowrap;
  }

  .sec-rule {
    flex: 1;
    height: 1px;
    background: var(--lp-border);
  }

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

  .inline-code {
    font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
    font-size: 0.875em;
    background: var(--lp-card-bg);
    border: 1px solid var(--lp-border);
    padding: 0.1em 0.4em;
    color: var(--color-primary-400);
  }

  /* ── Overview ────────────────────────────────────────────────────── */
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
    gap: 1.5rem;
    align-self: center;
  }

  .stat-block {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 1.5rem;
    border: 1px solid var(--lp-border);
    background: var(--lp-card-bg);
    transition: border-color 220ms;
  }
  .stat-block:hover { border-color: var(--color-primary-500); }

  .stat-val {
    font-size: clamp(1.375rem, 3vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--color-primary-400);
    line-height: 1;
  }

  .stat-lbl {
    font-size: 0.7rem;
    color: var(--lp-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ── Features ────────────────────────────────────────────────────── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1px;
    border: 1px solid var(--lp-border);
    background: var(--lp-border);
    overflow: hidden;
  }

  .feat-card {
    background: color-mix(in oklch, oklch(10% 0.006 265deg) 88%, transparent);
    padding: 2rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    border-left: 2px solid transparent;
    transition: border-color 200ms, background 200ms;
  }
  .feat-card:hover {
    border-left-color: var(--color-primary-500);
    background: color-mix(in oklch, var(--color-primary-500) 5%, oklch(10% 0.006 265deg));
  }

  .feat-num {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--color-primary-500);
    opacity: 0.7;
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

  /* ── Stack ───────────────────────────────────────────────────────── */
  .stack-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    gap: 3rem 4rem;
  }

  @media (max-width: 560px) {
    .stack-layout { grid-template-columns: 1fr 1fr; gap: 2rem; }
  }

  .stack-group-label {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.14em;
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

  /* ── Steps ───────────────────────────────────────────────────────── */
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
  }

  .step-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--lp-border-md);
    background: var(--lp-card-bg);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-primary-400);
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

  /* ── CTA ─────────────────────────────────────────────────────────── */
  .cta-wrap { border-top: 1px solid var(--lp-border); }

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

  /* ── Footer ──────────────────────────────────────────────────────── */
  .lp-footer {
    background: var(--lp-bg);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-top: 1px solid var(--lp-border);
    padding: 1.75rem;
    position: relative;
    z-index: 10;
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

  /* ── Scroll reveal ───────────────────────────────────────────────── */
  :global(.reveal) {
    opacity: 0;
    transform: translateY(1.25rem);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  :global(.reveal.is-visible) {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.reveal) { transition: none; }
    .eyebrow-dot { animation: none; }
  }
</style>
