<script lang="ts">
  import { DEAL_STAGES, fmtCurrency, type CrmDeal } from '$lib/utils/crm';

  let { deals = [] }: { deals?: CrmDeal[] } = $props();

  const W = 480;
  const ROW_H = 36;
  const PAD = 8;
  const H = $derived(DEAL_STAGES.length * (ROW_H + PAD) + PAD);

  const stageCounts = $derived(
    DEAL_STAGES.map(s => ({
      stage: s,
      count: deals.filter(d => d.stage === s).length,
      value: deals.filter(d => d.stage === s).reduce((a, d) => a + (d.value ?? 0), 0),
    }))
  );

  const maxCount = $derived(Math.max(1, ...stageCounts.map(s => s.count)));

  const COLORS: Record<string, string> = {
    'Discovery':   'var(--color-primary)',
    'Proposal':    'var(--color-secondary)',
    'Negotiation': 'var(--color-warning)',
    'Contract':    'var(--color-success)',
    'Closed Won':  'var(--color-success)',
    'Closed Lost': 'var(--color-base-300)',
  };
</script>

<svg viewBox="0 0 {W} {H}" width="100%" aria-label="Pipeline funnel">
  {#each stageCounts as s, i}
    {@const barW = Math.max(4, (s.count / maxCount) * (W - 140))}
    {@const y    = PAD + i * (ROW_H + PAD)}
    <rect x={130} y={y} width={barW} height={ROW_H} rx={4}
      fill={COLORS[s.stage] ?? 'var(--color-base-300)'} opacity="0.7" />
    <text x={124} y={y + ROW_H / 2 + 4} text-anchor="end" font-size="11"
      fill="currentColor" opacity="0.7">{s.stage}</text>
    <text x={134 + barW} y={y + ROW_H / 2 + 4} font-size="11"
      fill="currentColor" opacity="0.6">
      {s.count} · {fmtCurrency(s.value)}
    </text>
  {/each}
</svg>
