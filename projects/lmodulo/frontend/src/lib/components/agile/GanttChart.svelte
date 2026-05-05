<script lang="ts">
  import type { AgileMilestone, AgileSprint } from '$lib/utils/agile';
  import { goto } from '$app/navigation';

  let {
    milestones = [],
    sprints    = [],
    width      = 900,
  }: {
    milestones?: AgileMilestone[];
    sprints?:    AgileSprint[];
    width?:      number;
  } = $props();

  const LABEL_W  = 180;
  const ROW_H    = 32;
  const HEADER_H = 36;
  const PAD      = 8;

  interface Row {
    label: string;
    start: Date | null;
    end:   Date | null;
    color: string;
    href:  string;
    depth: number;
  }

  const rows = $derived.by((): Row[] => {
    const result: Row[] = [];
    for (const m of milestones) {
      result.push({
        label: m.title,
        start: m.startDate ? new Date(m.startDate) : null,
        end:   m.endDate   ? new Date(m.endDate)   : null,
        color: 'var(--color-primary-500)',
        href:  `/agile/milestones/${m.id}`,
        depth: 0,
      });
      for (const s of sprints.filter(sp => sp.milestoneId === m.id)) {
        result.push({
          label: `Sprint ${s.sprintNumber}: ${s.title}`,
          start: s.startDate ? new Date(s.startDate) : null,
          end:   s.endDate   ? new Date(s.endDate)   : null,
          color: 'var(--color-secondary-500)',
          href:  `/agile/sprints/${s.id}`,
          depth: 1,
        });
      }
    }
    return result;
  });

  const allDates = $derived.by(() => {
    const dates: Date[] = [];
    for (const r of rows) {
      if (r.start) dates.push(r.start);
      if (r.end)   dates.push(r.end);
    }
    return dates;
  });

  const minDate = $derived(allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date());
  const maxDate = $derived(allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date());
  const spanMs  = $derived(Math.max(maxDate.getTime() - minDate.getTime(), 1));
  const chartW  = $derived(width - LABEL_W - PAD * 2);
  const totalH  = $derived(HEADER_H + rows.length * ROW_H + PAD);

  const today   = new Date();
  const todayX  = $derived(LABEL_W + PAD + ((today.getTime() - minDate.getTime()) / spanMs) * chartW);

  function barX(row: Row): number {
    if (!row.start) return LABEL_W + PAD;
    return LABEL_W + PAD + ((row.start.getTime() - minDate.getTime()) / spanMs) * chartW;
  }
  function barW(row: Row): number {
    if (!row.start || !row.end) return 4;
    return Math.max(4, ((row.end.getTime() - row.start.getTime()) / spanMs) * chartW);
  }

  const monthTicks = $derived.by(() => {
    const ticks: { x: number; label: string }[] = [];
    const cursor = new Date(minDate);
    cursor.setDate(1);
    while (cursor <= maxDate) {
      const x = LABEL_W + PAD + ((cursor.getTime() - minDate.getTime()) / spanMs) * chartW;
      ticks.push({ x, label: cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' }) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return ticks;
  });
</script>

<div class="overflow-x-auto">
  <svg
    viewBox="0 0 {width} {totalH}"
    width="100%"
    height={totalH}
    class="block font-sans"
    aria-label="Gantt chart"
  >
    <!-- Header background -->
    <rect x="0" y="0" width={width} height={HEADER_H} fill="currentColor" fill-opacity="0.04"/>

    <!-- Month tick lines + labels -->
    {#each monthTicks as tick}
      <line x1={tick.x} x2={tick.x} y1={HEADER_H} y2={totalH}
        stroke="currentColor" stroke-opacity="0.06" stroke-width="1"/>
      <text x={tick.x + 4} y={HEADER_H - 8} font-size="9" fill="currentColor" fill-opacity="0.5">{tick.label}</text>
    {/each}

    <!-- Row bars -->
    {#each rows as row, i}
      {@const y = HEADER_H + i * ROW_H}
      {@const bx = barX(row)}
      {@const bw = barW(row)}
      {@const isEven = i % 2 === 0}

      <!-- Row bg -->
      <rect x="0" y={y} width={width} height={ROW_H}
        fill="currentColor" fill-opacity={isEven ? 0 : 0.025}/>

      <!-- Label -->
      <text
        x={row.depth === 1 ? 14 : 4} y={y + ROW_H / 2 + 4}
        font-size={row.depth === 0 ? 11 : 10}
        font-weight={row.depth === 0 ? '600' : '400'}
        fill="currentColor" fill-opacity="0.8"
        class="cursor-pointer hover:fill-primary-500"
        role="button"
        tabindex="0"
        onclick={() => goto(row.href)}
        onkeydown={e => e.key === 'Enter' && goto(row.href)}
      >
        {row.label.length > 22 ? row.label.slice(0, 22) + '…' : row.label}
      </text>

      <!-- Bar -->
      {#if row.start}
        <rect
          x={bx} y={y + 8} width={bw} height={ROW_H - 16}
          rx="3"
          fill={row.color} fill-opacity={row.depth === 0 ? 0.85 : 0.55}
          class="cursor-pointer"
          role="button"
          tabindex="0"
          onclick={() => goto(row.href)}
          onkeydown={e => e.key === 'Enter' && goto(row.href)}
        >
          <title>{row.label}: {row.start?.toLocaleDateString()} – {row.end?.toLocaleDateString()}</title>
        </rect>
      {/if}

      <!-- Row border -->
      <line x1="0" x2={width} y1={y + ROW_H} y2={y + ROW_H}
        stroke="currentColor" stroke-opacity="0.06" stroke-width="1"/>
    {/each}

    <!-- Today line -->
    {#if todayX >= LABEL_W && todayX <= width}
      <line x1={todayX} x2={todayX} y1={0} y2={totalH}
        stroke="var(--color-error-500)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>
      <text x={todayX + 3} y={totalH - 4} font-size="9" fill="var(--color-error-500)" opacity="0.8">Today</text>
    {/if}

    <!-- Legend -->
    <rect x={LABEL_W + PAD} y={8} width={12} height={8} rx="2" fill="var(--color-primary-500)" fill-opacity="0.85"/>
    <text x={LABEL_W + PAD + 16} y={16} font-size="9" fill="currentColor" fill-opacity="0.6">Milestone</text>
    <rect x={LABEL_W + PAD + 80} y={8} width={12} height={8} rx="2" fill="var(--color-secondary-500)" fill-opacity="0.55"/>
    <text x={LABEL_W + PAD + 96} y={16} font-size="9" fill="currentColor" fill-opacity="0.6">Sprint</text>
  </svg>
</div>
