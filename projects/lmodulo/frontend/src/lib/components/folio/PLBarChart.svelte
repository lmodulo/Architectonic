<script lang="ts">
  type Period = { label: string; revenue: number; expenses: number };

  let { periods = [] }: { periods?: Period[] } = $props();

  const W     = 600;
  const H     = 220;
  const PAD_L = 52;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 48;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = $derived(Math.max(1, ...periods.flatMap(p => [p.revenue, p.expenses])));

  const TICKS = 5;
  const yTicks = $derived(
    Array.from({ length: TICKS + 1 }, (_, i) => {
      const v = (maxVal / TICKS) * i;
      return { v, y: PAD_T + chartH - (v / maxVal) * chartH };
    })
  );

  function abbr(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }

  const groupW   = $derived(periods.length > 0 ? chartW / periods.length : chartW);
  const barW     = $derived(Math.max(4, groupW * 0.35));
  const gap      = $derived(groupW * 0.05);
  const rotate   = $derived(periods.length > 8);
</script>

<style>
  @keyframes plbar-grow-up {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
</style>

<svg viewBox="0 0 {W} {H}" width="100%" aria-label="Revenue vs Expenses by period">
  <!-- Y grid + labels -->
  {#each yTicks as tick}
    <line
      x1={PAD_L} y1={tick.y}
      x2={W - PAD_R} y2={tick.y}
      stroke="currentColor" stroke-opacity="0.08" stroke-width="1"
    />
    <text x={PAD_L - 6} y={tick.y + 4} text-anchor="end" font-size="10"
      fill="currentColor" opacity="0.5">{abbr(tick.v)}</text>
  {/each}

  <!-- Axes -->
  <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + chartH}
    stroke="currentColor" stroke-opacity="0.2" stroke-width="1" />
  <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH}
    stroke="currentColor" stroke-opacity="0.2" stroke-width="1" />

  <!-- Bars + X labels -->
  {#each periods as p, i}
    {@const gx  = PAD_L + i * groupW}
    {@const rh  = (p.revenue  / maxVal) * chartH}
    {@const eh  = (p.expenses / maxVal) * chartH}
    {@const rx  = gx + gap}
    {@const ex  = rx + barW + gap}
    {@const labelX = gx + groupW / 2}
    {@const labelY = PAD_T + chartH + (rotate ? 6 : 14)}

    <!-- Revenue bar -->
    <rect
      x={rx} y={PAD_T + chartH - rh}
      width={barW} height={rh}
      rx={2}
      fill="var(--color-success)"
      opacity="0.75"
      style="transform-box:fill-box;transform-origin:bottom center;animation:plbar-grow-up 0.55s cubic-bezier(0.34,1.56,0.64,1) {i * 0.08}s both"
    />
    <!-- Expense bar -->
    <rect
      x={ex} y={PAD_T + chartH - eh}
      width={barW} height={eh}
      rx={2}
      fill="var(--color-error)"
      opacity="0.75"
      style="transform-box:fill-box;transform-origin:bottom center;animation:plbar-grow-up 0.55s cubic-bezier(0.34,1.56,0.64,1) {i * 0.08 + 0.04}s both"
    />

    <!-- X label -->
    {#if rotate}
      <text
        x={labelX} y={labelY}
        text-anchor="end"
        font-size="9"
        fill="currentColor"
        opacity="0.55"
        transform="rotate(-35, {labelX}, {labelY})"
      >{p.label}</text>
    {:else}
      <text x={labelX} y={labelY} text-anchor="middle" font-size="10"
        fill="currentColor" opacity="0.55">{p.label}</text>
    {/if}
  {/each}

  <!-- Legend -->
  <rect x={PAD_L} y={H - 14} width={10} height={10} rx={2}
    fill="var(--color-success)" opacity="0.75" />
  <text x={PAD_L + 14} y={H - 5} font-size="10" fill="currentColor" opacity="0.6">Revenue</text>
  <rect x={PAD_L + 80} y={H - 14} width={10} height={10} rx={2}
    fill="var(--color-error)" opacity="0.75" />
  <text x={PAD_L + 94} y={H - 5} font-size="10" fill="currentColor" opacity="0.6">Expenses</text>
</svg>
