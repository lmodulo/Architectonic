<script lang="ts">
  import type { PageData } from './$types';
  import { fmtCurrency, type CrmDeal, type CrmActivity } from '$lib/utils/crm';
  import PipelineFunnel from '$lib/components/crm/PipelineFunnel.svelte';
  import ActivityVolumeChart from '$lib/components/crm/ActivityVolumeChart.svelte';

  let { data }: { data: PageData } = $props();

  const deals      = $derived<CrmDeal[]>(data.deals ?? []);
  const activities = $derived<CrmActivity[]>(data.activities ?? []);

  const totalPipeline = $derived(
    deals.filter(d => d.stage !== 'Closed Lost').reduce((s, d) => s + (d.value ?? 0), 0)
  );
  const wonValue = $derived(
    deals.filter(d => d.stage === 'Closed Won').reduce((s, d) => s + (d.value ?? 0), 0)
  );
  const winRate = $derived(
    deals.length > 0
      ? Math.round((deals.filter(d => d.stage === 'Closed Won').length / deals.filter(d => ['Closed Won','Closed Lost'].includes(d.stage)).length || 0) * 100)
      : 0
  );

  // Revenue by month (last 6 months from closed won)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyRevenue = $derived(months.map(m => ({
    label: m.label,
    value: deals
      .filter(d => {
        if (d.stage !== 'Closed Won' || !d.updatedAt) return false;
        const dd = new Date(d.updatedAt);
        return dd.getFullYear() === m.year && dd.getMonth() === m.month;
      })
      .reduce((s, d) => s + (d.value ?? 0), 0),
  })));

  const maxRevenue = $derived(Math.max(1, ...monthlyRevenue.map(m => m.value)));

  // SVG dims
  const W = 480;
  const H = 140;
  const PAD_L = 60;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;
  const chartW = $derived(W - PAD_L - PAD_R);
  const chartH = $derived(H - PAD_T - PAD_B);
  const barW   = $derived(chartW / months.length - 8);
</script>

<svelte:head><title>Reports — Nexus</title></svelte:head>

<div class="space-y-8">

  <!-- Summary KPIs -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Deals</p>
      <p class="text-2xl font-bold mt-1">{deals.length}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Open Pipeline</p>
      <p class="text-2xl font-bold mt-1">{fmtCurrency(totalPipeline)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Revenue Closed</p>
      <p class="text-2xl font-bold mt-1 text-success">{fmtCurrency(wonValue)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Win Rate</p>
      <p class="text-2xl font-bold mt-1">{winRate}%</p>
    </div>
  </div>

  <!-- Charts row -->
  <div class="grid lg:grid-cols-2 gap-6">
    <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
      <h2 class="text-sm font-semibold">Pipeline Funnel</h2>
      <PipelineFunnel {deals} />
    </section>

    <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
      <h2 class="text-sm font-semibold">Activity Volume by Type</h2>
      <ActivityVolumeChart {activities} />
    </section>
  </div>

  <!-- Revenue trend (last 6 months) -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
    <h2 class="text-sm font-semibold">Revenue Closed — Last 6 Months</h2>
    <svg viewBox="0 0 {W} {H}" width="100%" aria-label="Monthly revenue">
      <!-- Y-axis labels -->
      {#each [0, 0.5, 1] as ratio}
        {@const yPos = PAD_T + chartH - ratio * chartH}
        <text x={PAD_L - 4} y={yPos + 4} text-anchor="end" font-size="10"
          fill="currentColor" opacity="0.5">
          {fmtCurrency(maxRevenue * ratio)}
        </text>
        <line x1={PAD_L} y1={yPos} x2={W - PAD_R} y2={yPos}
          stroke="currentColor" stroke-opacity="0.08" stroke-dasharray="4 4" />
      {/each}

      {#each monthlyRevenue as m, i}
        {@const x  = PAD_L + i * (chartW / months.length) + 4}
        {@const bh = (m.value / maxRevenue) * chartH}
        {@const y  = PAD_T + chartH - bh}
        <rect x={x} y={y} width={barW} height={bh} rx={3}
          fill="var(--color-success)" opacity="0.7" />
        <text x={x + barW / 2} y={H - 6} text-anchor="middle" font-size="10"
          fill="currentColor" opacity="0.6">{m.label}</text>
      {/each}
    </svg>
  </section>

</div>
