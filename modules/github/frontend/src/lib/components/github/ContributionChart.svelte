<script lang="ts">
  import { onMount } from 'svelte';

  interface WeekData {
    weekStart: string;
    commits: number;
  }

  const WEEKS = 12;
  const W = 480;
  const H = 120;
  const PAD_L = 28;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 28;
  const GAP = 3;

  let chartData = $state<WeekData[]>([]);
  let loading = $state(true);
  let failed = $state(false);

  onMount(async () => {
    try {
      const res = await fetch(`/api/github/contributions?weeks=${WEEKS}`);
      if (res.ok) {
        const json = await res.json() as { data: WeekData[] };
        chartData = json.data ?? [];
      } else {
        failed = true;
      }
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  });

  const maxCommits = $derived(Math.max(...chartData.map(d => d.commits), 1));

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  function bars(data: WeekData[]) {
    if (data.length === 0) return [];
    const barW = Math.max((chartW - GAP * (data.length - 1)) / data.length, 4);
    const mx = Math.max(...data.map(d => d.commits), 1);
    return data.map((d, i) => {
      const bh = Math.max((d.commits / mx) * chartH, 1);
      return {
        x: PAD_L + i * (barW + GAP),
        y: PAD_T + chartH - bh,
        w: barW,
        h: bh,
        weekStart: d.weekStart,
        commits: d.commits,
        label: formatLabel(d.weekStart),
      };
    });
  }

  function formatLabel(iso: string): string {
    const [, m, d] = iso.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${monthNames[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
  }

  const computedBars = $derived(bars(chartData));
  const totalCommits = $derived(chartData.reduce((s, d) => s + d.commits, 0));

  // Y gridlines at 50% and 100% of max
  const gridLines = $derived([
    { y: PAD_T, label: maxCommits.toString() },
    { y: PAD_T + chartH / 2, label: Math.round(maxCommits / 2).toString() },
  ]);
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold opacity-70">GitHub Contributions — Last {WEEKS} Weeks</h2>
    {#if !loading && !failed}
      <span class="text-xs opacity-40">{totalCommits.toLocaleString()} total commits</span>
    {/if}
  </div>

  <div class="card preset-filled-surface-100-900 p-5">
    {#if loading}
      <div class="h-[120px] flex items-center justify-center text-sm opacity-40">Loading…</div>
    {:else if failed}
      <div class="h-[120px] flex items-center justify-center text-sm opacity-40">Could not load contribution data.</div>
    {:else if chartData.length === 0}
      <div class="h-[120px] flex items-center justify-center text-sm opacity-40">No contributions recorded yet. Sync GitHub to populate data.</div>
    {:else}
      <svg viewBox="0 0 {W} {H}" width="100%" aria-label="Contribution chart — commits per week" class="block">
        <!-- Grid lines -->
        {#each gridLines as gl}
          <line
            x1={PAD_L} x2={W - PAD_R}
            y1={gl.y} y2={gl.y}
            stroke="currentColor" stroke-opacity="0.08" stroke-width="1"
          />
          <text
            x={PAD_L - 4} y={gl.y + 3.5}
            font-size="8" text-anchor="end" fill="currentColor" fill-opacity="0.35"
          >{gl.label}</text>
        {/each}

        <!-- Bars -->
        {#each computedBars as b}
          <rect
            x={b.x} y={b.y} width={b.w} height={b.h}
            rx="2"
            fill="var(--color-primary-500)" fill-opacity="0.85"
          >
            <title>{b.label}: {b.commits} commit{b.commits !== 1 ? 's' : ''}</title>
          </rect>
        {/each}

        <!-- X labels — show first, middle, last -->
        {#if computedBars.length > 0}
          {@const first = computedBars[0]}
          {@const last = computedBars[computedBars.length - 1]}
          {@const mid = computedBars[Math.floor(computedBars.length / 2)]}
          <text x={first.x + first.w / 2} y={H - 6} font-size="8" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{first.label}</text>
          {#if computedBars.length > 2}
            <text x={mid.x + mid.w / 2} y={H - 6} font-size="8" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{mid.label}</text>
          {/if}
          <text x={last.x + last.w / 2} y={H - 6} font-size="8" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{last.label}</text>
        {/if}
      </svg>
    {/if}
  </div>
</div>
