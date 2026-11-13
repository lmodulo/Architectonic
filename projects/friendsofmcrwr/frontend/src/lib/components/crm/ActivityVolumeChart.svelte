<script lang="ts">
  import { ACTIVITY_TYPES, type CrmActivity } from '$lib/utils/crm';

  let { activities = [] }: { activities?: CrmActivity[] } = $props();

  const W = 480;
  const H = 160;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 16;
  const PAD_B = 28;

  const counts = $derived(
    ACTIVITY_TYPES.map(t => ({
      type: t,
      count: activities.filter(a => a.type === t).length,
    }))
  );

  const maxCount = $derived(Math.max(1, ...counts.map(c => c.count)));
  const chartW   = $derived(W - PAD_L - PAD_R);
  const chartH   = $derived(H - PAD_T - PAD_B);
  const barW     = $derived(chartW / counts.length - 8);

  const COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-base-300)',
    'var(--color-accent)',
  ];

  // ── Tooltip ──────────────────────────────────────────────────────────
  let tt = $state({ v: false, x: 0, y: 0, type: '', count: 0 });
  let el: HTMLDivElement | undefined = $state(undefined);

  function move(e: MouseEvent) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    tt.x = e.clientX - r.left;
    tt.y = e.clientY - r.top;
  }
</script>

<div class="relative" bind:this={el} onmousemove={move}>
  <svg viewBox="0 0 {W} {H}" width="100%" aria-label="Activity volume by type">
    {#each counts as c, i}
      {@const x   = PAD_L + i * (chartW / counts.length) + 4}
      {@const bh  = (c.count / maxCount) * chartH}
      {@const y   = PAD_T + chartH - bh}
      <rect x={x} y={y} width={barW} height={bh} rx={3}
        fill={COLORS[i % COLORS.length]} opacity="0.75"
        class="bar-grow cursor-default"
        style="animation-delay:{i * 80}ms"
        onmouseenter={() => { tt.v = true; tt.type = c.type; tt.count = c.count; }}
        onmouseleave={() => { tt.v = false; }}
      />
      <text x={x + barW / 2} y={H - 6} text-anchor="middle" font-size="10"
        fill="currentColor" opacity="0.6">{c.type}</text>
      {#if c.count > 0}
        <text x={x + barW / 2} y={y - 3} text-anchor="middle" font-size="10"
          fill="currentColor" opacity="0.7">{c.count}</text>
      {/if}
    {/each}
  </svg>

  {#if tt.v}
    <div
      class="pointer-events-none absolute z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap"
      style="left:{tt.x + 12}px;top:{tt.y}px;transform:translateY(-100%)"
    >
      <p class="font-semibold">{tt.type}</p>
      <p class="opacity-60">{tt.count} {tt.count === 1 ? 'activity' : 'activities'}</p>
    </div>
  {/if}
</div>

<style>
  @keyframes barGrowUp {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  .bar-grow {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: barGrowUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  }
</style>
