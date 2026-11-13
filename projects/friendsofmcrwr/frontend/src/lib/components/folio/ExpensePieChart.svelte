<script lang="ts">
  type Category = { category: string; amount: number };

  let { categories = [] }: { categories?: Category[] } = $props();

  const CX = 100;
  const CY = 100;
  const R  = 70;
  const IR = 42;

  const COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-error)',
  ];

  const total = $derived(categories.reduce((s, c) => s + c.amount, 0));

  type Slice = {
    category: string;
    amount: number;
    color: string;
    startAngle: number;
    endAngle: number;
    path: string;
  };

  const slices = $derived.by((): Slice[] => {
    if (total === 0) return [];
    let angle = -Math.PI / 2;
    return categories.map((c, i) => {
      const sweep = (c.amount / total) * 2 * Math.PI;
      const start = angle;
      const end   = angle + sweep;
      angle = end;

      const x1 = CX + R  * Math.cos(start);
      const y1 = CY + R  * Math.sin(start);
      const x2 = CX + R  * Math.cos(end);
      const y2 = CY + R  * Math.sin(end);
      const ix1 = CX + IR * Math.cos(end);
      const iy1 = CY + IR * Math.sin(end);
      const ix2 = CX + IR * Math.cos(start);
      const iy2 = CY + IR * Math.sin(start);
      const large = sweep > Math.PI ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${IR} ${IR} 0 ${large} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return { category: c.category, amount: c.amount, color: COLORS[i % COLORS.length], startAngle: start, endAngle: end, path };
    });
  });

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  function pct(n: number) {
    return total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';
  }

  // ── Tooltip ──────────────────────────────────────────────────────────
  let tt = $state({ v: false, x: 0, y: 0, cat: '', amt: '', pctStr: '' });
  let el: HTMLDivElement | undefined = $state(undefined);

  function move(e: MouseEvent) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    tt.x = e.clientX - r.left;
    tt.y = e.clientY - r.top;
  }
</script>

<style>
  @keyframes pie-slice-in {
    from { opacity: 0; transform: scale(0.85); transform-origin: 100px 100px; }
    to   { opacity: 0.8; transform: scale(1); transform-origin: 100px 100px; }
  }
</style>

<div class="relative" bind:this={el} onmousemove={move}>
  <svg viewBox="0 0 320 200" width="100%" aria-label="Expenses by category">
    {#if slices.length === 0}
      <text x="160" y="105" text-anchor="middle" font-size="12"
        fill="currentColor" opacity="0.3">No expense data</text>
    {:else}
      <!-- Donut slices -->
      {#each slices as s, i}
        <path
          d={s.path}
          fill={s.color}
          opacity="0.8"
          class="cursor-default"
          style="animation:pie-slice-in 0.45s ease-out {i * 0.07}s both"
          onmouseenter={() => { tt.v = true; tt.cat = s.category; tt.amt = fmtCurrency(s.amount); tt.pctStr = pct(s.amount); }}
          onmouseleave={() => { tt.v = false; }}
        />
      {/each}

      <!-- Centre total -->
      <text x={CX} y={CY - 4}  text-anchor="middle" font-size="9"
        fill="currentColor" opacity="0.45">Total</text>
      <text x={CX} y={CY + 10} text-anchor="middle" font-size="11" font-weight="600"
        fill="currentColor">{fmtCurrency(total)}</text>

      <!-- Legend (right side) -->
      {#each slices as s, i}
        {@const ly = 24 + i * 22}
        <rect x={210} y={ly} width={10} height={10} rx={2} fill={s.color} opacity="0.8" />
        <text x={224} y={ly + 9} font-size="10" fill="currentColor" opacity="0.7">
          {s.category}
        </text>
        <text x={318} y={ly + 9} text-anchor="end" font-size="10"
          fill="currentColor" opacity="0.55">{pct(s.amount)}</text>
      {/each}
    {/if}
  </svg>

  {#if tt.v}
    <div
      class="pointer-events-none absolute z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap"
      style="left:{tt.x + 12}px;top:{tt.y}px;transform:translateY(-100%)"
    >
      <p class="font-semibold">{tt.cat}</p>
      <p class="opacity-60">{tt.amt} · {tt.pctStr}</p>
    </div>
  {/if}
</div>
