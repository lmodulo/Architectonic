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
</script>

<svg viewBox="0 0 {W} {H}" width="100%" aria-label="Activity volume by type">
  {#each counts as c, i}
    {@const x   = PAD_L + i * (chartW / counts.length) + 4}
    {@const bh  = (c.count / maxCount) * chartH}
    {@const y   = PAD_T + chartH - bh}
    <rect x={x} y={y} width={barW} height={bh} rx={3}
      fill={COLORS[i % COLORS.length]} opacity="0.75" />
    <text x={x + barW / 2} y={H - 6} text-anchor="middle" font-size="10"
      fill="currentColor" opacity="0.6">{c.type}</text>
    {#if c.count > 0}
      <text x={x + barW / 2} y={y - 3} text-anchor="middle" font-size="10"
        fill="currentColor" opacity="0.7">{c.count}</text>
    {/if}
  {/each}
</svg>
