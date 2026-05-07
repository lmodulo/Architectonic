<script lang="ts">
  import type { AgileSprint, AgileTask } from '$lib/utils/agile';

  let { sprint, tasks }: { sprint: AgileSprint; tasks: AgileTask[] } = $props();

  const PL = 44, PR = 16, PT = 20, PB = 32;
  const VW = 560, VH = 200;
  const CW = VW - PL - PR;
  const CH = VH - PT - PB;

  function lcg(seed: number): () => number {
    let s = seed >>> 0;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
  }

  function strHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  const chart = $derived.by(() => {
    if (!sprint.startDate || !sprint.endDate) return null;

    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const MS = 86_400_000;
    const n = Math.max(2, Math.round((end.getTime() - start.getTime()) / MS) + 1);
    const days = Array.from({ length: n }, (_, i) => new Date(start.getTime() + i * MS));

    const totalScope = tasks.reduce((s, t) => s + (t.estimateHours ?? 0), 0);
    if (totalScope === 0) return { days, maxY: 1, ideal: [] as number[], actual: [] as (number | null)[], todayIdx: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIdx = Math.min(n - 1, Math.max(0, Math.round((today.getTime() - start.getTime()) / MS)));

    const rng = lcg(strHash(sprint.id ?? 'sprint'));
    const burnByDay = new Array<number>(n).fill(0);
    for (const task of tasks.filter(t => t.status === 'Done')) {
      const d = Math.floor(rng() * (todayIdx + 1));
      burnByDay[d] += task.estimateHours ?? 0;
    }

    const ideal = days.map((_, i) => totalScope * (1 - i / (n - 1)));

    let rem = totalScope;
    const actual: (number | null)[] = days.map((_, i) => {
      rem -= burnByDay[i];
      return i <= todayIdx ? Math.max(0, rem) : null;
    });

    return { days, maxY: totalScope, ideal, actual, todayIdx };
  });

  function xp(i: number): number {
    const n = chart?.days.length ?? 1;
    return PL + (i / Math.max(n - 1, 1)) * CW;
  }

  function yp(v: number): number {
    return PT + (1 - v / (chart?.maxY ?? 1)) * CH;
  }

  const idealPath = $derived(
    chart?.ideal.map((v, i) => `${i === 0 ? 'M' : 'L'}${xp(i).toFixed(1)},${yp(v).toFixed(1)}`).join(' ') ?? ''
  );

  const actualPath = $derived.by(() => {
    if (!chart) return '';
    const parts: string[] = [];
    let started = false;
    for (let i = 0; i < chart.actual.length; i++) {
      const v = chart.actual[i];
      if (v === null) continue;
      parts.push(`${!started ? 'M' : 'L'}${xp(i).toFixed(1)},${yp(v).toFixed(1)}`);
      started = true;
    }
    return parts.join(' ');
  });

  const yTicks = $derived.by(() => {
    if (!chart) return [] as { label: string; yPos: number }[];
    return Array.from({ length: 5 }, (_, i) => {
      const v = chart.maxY * (1 - i / 4);
      return { label: v >= 1 ? `${Math.round(v)}h` : '0h', yPos: yp(v) };
    });
  });

  const xTicks = $derived.by(() => {
    if (!chart) return [] as { label: string; xPos: number }[];
    const n = chart.days.length;
    const step = Math.max(1, Math.floor((n - 1) / 4));
    const idxSet = new Set<number>([0]);
    for (let i = step; i < n - 1; i += step) idxSet.add(i);
    idxSet.add(n - 1);
    return [...idxSet].sort((a, b) => a - b).map(i => {
      const d = chart.days[i];
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, xPos: xp(i) };
    });
  });
</script>

{#if chart}
  <svg viewBox="0 0 {VW} {VH}" width="100%" class="block" aria-label="Sprint burndown chart">
    <!-- gridlines + Y labels -->
    {#each yTicks as tick}
      <line x1={PL} y1={tick.yPos} x2={VW - PR} y2={tick.yPos} stroke="currentColor" stroke-opacity="0.08" />
      <text x={PL - 6} y={tick.yPos + 4} font-size="9" text-anchor="end" fill="currentColor" fill-opacity="0.45">{tick.label}</text>
    {/each}

    <!-- X labels -->
    {#each xTicks as tick}
      <text x={tick.xPos} y={VH - 4} font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.45">{tick.label}</text>
    {/each}

    <!-- Axes -->
    <line x1={PL} y1={PT + CH} x2={VW - PR} y2={PT + CH} stroke="currentColor" stroke-opacity="0.15" />
    <line x1={PL} y1={PT}      x2={PL}       y2={PT + CH} stroke="currentColor" stroke-opacity="0.15" />

    <!-- Ideal (dashed) -->
    {#if idealPath}
      <path d={idealPath} fill="none" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="5 4" />
    {/if}

    <!-- Actual -->
    {#if actualPath}
      <path d={actualPath} fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    {/if}

    <!-- Today marker -->
    <line
      x1={xp(chart.todayIdx)} y1={PT}
      x2={xp(chart.todayIdx)} y2={PT + CH}
      stroke="var(--color-warning)" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.7"
    />
    <text x={xp(chart.todayIdx)} y={PT - 5} font-size="8" text-anchor="middle" fill="var(--color-warning)" fill-opacity="0.8">today</text>

    <!-- Current remaining dot -->
    {#if chart.actual[chart.todayIdx] !== null}
      {@const cx = xp(chart.todayIdx)}
      {@const cy = yp(chart.actual[chart.todayIdx] as number)}
      <circle {cx} {cy} r="7" fill="var(--color-primary)" fill-opacity="0.18" />
      <circle {cx} {cy} r="4" fill="var(--color-primary)" />
    {/if}
  </svg>

  <div class="flex gap-5 text-[10px] opacity-40 mt-0.5">
    <span class="flex items-center gap-1.5">
      <svg width="18" height="8" aria-hidden="true"><line x1="0" y1="4" x2="18" y2="4" stroke="currentColor" stroke-dasharray="5 4" stroke-width="1.5"/></svg>
      Ideal
    </span>
    <span class="flex items-center gap-1.5">
      <svg width="18" height="8" aria-hidden="true"><line x1="0" y1="4" x2="18" y2="4" stroke="var(--color-primary)" stroke-width="2"/></svg>
      Actual
    </span>
  </div>
{:else}
  <p class="text-sm opacity-40 text-center py-6">Set sprint start and end dates to view burndown.</p>
{/if}
