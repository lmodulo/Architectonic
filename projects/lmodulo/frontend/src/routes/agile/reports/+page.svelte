<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { STATUS_COLOR, fmtEffort } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  const milestones = $derived((data.milestones ?? []) as any[]);
  const sprints    = $derived((data.sprints    ?? []) as any[]);
  let milestoneId  = $state(data.milestoneId ?? '');

  function onMilestoneChange(id: string) {
    milestoneId = id;
    goto(`/agile/reports?milestoneId=${id}`, { replaceState: true });
  }

  // ── Aggregate KPIs ─────────────────────────────────────────────────
  const completedSprints = $derived(sprints.filter((s: any) => s.status === 'Completed'));
  const avgVelocity      = $derived(
    completedSprints.length
      ? Math.round(completedSprints.reduce((s: number, sp: any) => s + (sp.velocity ?? 0), 0) / completedSprints.length)
      : null
  );
  const avgCompletion = $derived(
    sprints.length
      ? Math.round(sprints.reduce((s: number, sp: any) => s + (sp.completionPct ?? 0), 0) / sprints.length)
      : null
  );
  const totalTasks = $derived(sprints.reduce((s: number, sp: any) => s + (sp.taskCount ?? 0), 0));
  const totalJobs  = $derived(sprints.reduce((s: number, sp: any) => s + (sp.jobCount  ?? 0), 0));

  // ── Velocity chart (grouped bar) ───────────────────────────────────
  const VPL = 48, VPR = 16, VPT = 20, VPB = 36;
  const VVW = 600, VVH = 220;
  const VCW = $derived(VVW - VPL - VPR);
  const VCH = VVH - VPT - VPB;

  const velMax = $derived(
    Math.max(1, ...sprints.map((s: any) => Math.max(s.capacity ?? 0, s.committedEffort ?? 0, s.velocity ?? 0)))
  );

  function velBarX(spIdx: number, barIdx: number): number {
    const n = sprints.length || 1;
    const groupW = VCW / n;
    const BAR_W  = Math.min(18, groupW / 4);
    const GAP    = 2;
    const totalBarsW = 3 * BAR_W + 2 * GAP;
    const groupX = VPL + spIdx * groupW + (groupW - totalBarsW) / 2;
    return groupX + barIdx * (BAR_W + GAP);
  }

  function velBarW(): number {
    const n = sprints.length || 1;
    const groupW = VCW / n;
    return Math.min(18, groupW / 4);
  }

  function velBarY(val: number): number {
    return VPT + VCH - (val / velMax) * VCH;
  }

  function velBarH(val: number): number {
    return (val / velMax) * VCH;
  }

  function velGroupCenter(i: number): number {
    const n = sprints.length || 1;
    return VPL + (i + 0.5) * (VCW / n);
  }

  const velYTicks = $derived(
    Array.from({ length: 5 }, (_, i) => {
      const v = velMax * (1 - i / 4);
      return { label: `${Math.round(v)}h`, y: VPT + (i / 4) * VCH };
    })
  );

  // ── Completion line chart ──────────────────────────────────────────
  const CPL = 44, CPR = 16, CPT = 20, CPB = 36;
  const CVW = 600, CVH = 180;
  const CCW = $derived(CVW - CPL - CPR);
  const CCH = CVH - CPT - CPB;

  function compX(i: number): number {
    const n = sprints.length;
    return CPL + (n < 2 ? CCW / 2 : (i / (n - 1)) * CCW);
  }

  function compY(pct: number): number {
    return CPT + (1 - pct / 100) * CCH;
  }

  const compPath = $derived.by(() => {
    if (sprints.length === 0) return '';
    return sprints
      .map((s: any, i: number) => `${i === 0 ? 'M' : 'L'}${compX(i).toFixed(1)},${compY(s.completionPct ?? 0).toFixed(1)}`)
      .join(' ');
  });

  const compArea = $derived.by(() => {
    if (sprints.length === 0) return '';
    const pts = sprints.map((s: any, i: number) =>
      `${compX(i).toFixed(1)},${compY(s.completionPct ?? 0).toFixed(1)}`
    );
    const base = compY(0).toFixed(1);
    return `M${pts[0]} L${pts.join(' L')} L${compX(sprints.length - 1).toFixed(1)},${base} L${CPL},${base} Z`;
  });

  const compYTicks = Array.from({ length: 5 }, (_, i) => ({
    label: `${100 - i * 25}%`,
    y: CPT + (i / 4) * CCH,
  }));
</script>

<svelte:head><title>Agile Reports</title></svelte:head>

<div class="space-y-8">

  <!-- ── Milestone selector ────────────────────────────────────────── -->
  <div class="flex items-center gap-3">
    <select
      class="select text-sm h-9"
      value={milestoneId}
      onchange={e => onMilestoneChange((e.target as HTMLSelectElement).value)}
    >
      <option value="">— Select milestone —</option>
      {#each milestones as m}
        <option value={m.id}>{m.title}</option>
      {/each}
    </select>
    {#if milestoneId && sprints.length > 0}
      <span class="text-xs opacity-40">{sprints.length} sprint{sprints.length !== 1 ? 's' : ''}</span>
    {/if}
  </div>

  {#if !milestoneId}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center opacity-40">
      <p class="text-sm">Select a milestone to view cross-sprint reports.</p>
    </div>
  {:else if sprints.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center opacity-40">
      <p class="text-sm">No sprints in this milestone yet.</p>
    </div>
  {:else}

    <!-- ── KPI row ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <p class="text-xs opacity-50 uppercase tracking-wide font-medium">Sprints</p>
        <p class="text-2xl font-bold mt-1">{sprints.length}</p>
        <p class="text-xs opacity-40">{completedSprints.length} completed</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <p class="text-xs opacity-50 uppercase tracking-wide font-medium">Avg Velocity</p>
        <p class="text-2xl font-bold mt-1">{avgVelocity !== null ? fmtEffort(avgVelocity) : '—'}</p>
        <p class="text-xs opacity-40">per completed sprint</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <p class="text-xs opacity-50 uppercase tracking-wide font-medium">Avg Completion</p>
        <p class="text-2xl font-bold mt-1">{avgCompletion !== null ? `${avgCompletion}%` : '—'}</p>
        <p class="text-xs opacity-40">across all sprints</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <p class="text-xs opacity-50 uppercase tracking-wide font-medium">Total Work</p>
        <p class="text-2xl font-bold mt-1">{totalJobs}</p>
        <p class="text-xs opacity-40">jobs · {totalTasks} tasks</p>
      </div>
    </div>

    <!-- ── Velocity & Capacity chart ────────────────────────────────── -->
    <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
      <h2 class="text-sm font-semibold">Velocity &amp; Capacity</h2>

      <svg viewBox="0 0 {VVW} {VVH}" width="100%" class="block" aria-label="Velocity and capacity chart">
        <!-- Gridlines + Y labels -->
        {#each velYTicks as tick}
          <line x1={VPL} y1={tick.y} x2={VVW - VPR} y2={tick.y} stroke="currentColor" stroke-opacity="0.07" />
          <text x={VPL - 6} y={tick.y + 4} font-size="9" text-anchor="end" fill="currentColor" fill-opacity="0.4">{tick.label}</text>
        {/each}
        <!-- Axes -->
        <line x1={VPL} y1={VPT + VCH} x2={VVW - VPR} y2={VPT + VCH} stroke="currentColor" stroke-opacity="0.15" />
        <line x1={VPL} y1={VPT}       x2={VPL}        y2={VPT + VCH} stroke="currentColor" stroke-opacity="0.15" />

        {#each sprints as sprint, i}
          {@const bw = velBarW()}
          {@const cap  = sprint.capacity       ?? 0}
          {@const com  = sprint.committedEffort ?? 0}
          {@const vel  = sprint.velocity        ?? 0}

          <!-- Capacity bar (gray) -->
          {#if cap > 0}
            <rect
              x={velBarX(i, 0)} y={velBarY(cap)} width={bw} height={velBarH(cap)}
              rx="2" fill="currentColor" fill-opacity="0.18"
            />
          {/if}
          <!-- Committed bar (primary) -->
          {#if com > 0}
            <rect
              x={velBarX(i, 1)} y={velBarY(com)} width={bw} height={velBarH(com)}
              rx="2" fill="var(--color-primary)" fill-opacity="0.55"
            />
          {/if}
          <!-- Velocity bar (success) -->
          {#if vel > 0}
            <rect
              x={velBarX(i, 2)} y={velBarY(vel)} width={bw} height={velBarH(vel)}
              rx="2" fill="var(--color-success)" fill-opacity="0.75"
            />
          {/if}

          <!-- X label -->
          <text
            x={velGroupCenter(i)} y={VPT + VCH + 16}
            font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.45"
          >S{sprint.sprintNumber}</text>
        {/each}
      </svg>

      <div class="flex gap-5 text-[10px] opacity-50">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-sm bg-current opacity-20"></span>Capacity
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-sm" style="background:var(--color-primary);opacity:.55"></span>Committed
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-sm" style="background:var(--color-success);opacity:.75"></span>Velocity (done)
        </span>
      </div>
    </section>

    <!-- ── Completion line chart ─────────────────────────────────────── -->
    <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
      <h2 class="text-sm font-semibold">Sprint Completion Rate</h2>

      <svg viewBox="0 0 {CVW} {CVH}" width="100%" class="block" aria-label="Sprint completion rate chart">
        <!-- Gridlines + Y labels -->
        {#each compYTicks as tick}
          <line x1={CPL} y1={tick.y} x2={CVW - CPR} y2={tick.y} stroke="currentColor" stroke-opacity="0.07" />
          <text x={CPL - 6} y={tick.y + 4} font-size="9" text-anchor="end" fill="currentColor" fill-opacity="0.4">{tick.label}</text>
        {/each}
        <!-- Axes -->
        <line x1={CPL} y1={CPT + CCH} x2={CVW - CPR} y2={CPT + CCH} stroke="currentColor" stroke-opacity="0.15" />
        <line x1={CPL} y1={CPT}       x2={CPL}        y2={CPT + CCH} stroke="currentColor" stroke-opacity="0.15" />

        <!-- Area fill -->
        {#if compArea}
          <path d={compArea} fill="var(--color-primary)" fill-opacity="0.08" />
        {/if}
        <!-- Line -->
        {#if compPath}
          <path d={compPath} fill="none" stroke="var(--color-primary)" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" />
        {/if}

        <!-- Dots + X labels -->
        {#each sprints as sprint, i}
          {@const cx = compX(i)}
          {@const cy = compY(sprint.completionPct ?? 0)}
          <circle {cx} {cy} r="4" fill="var(--color-primary)" />
          <text x={cx} y={CPT + CCH + 16} font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.45">
            S{sprint.sprintNumber}
          </text>
          <!-- Value label above dot -->
          {#if (sprint.completionPct ?? 0) > 5}
            <text x={cx} y={cy - 7} font-size="8" text-anchor="middle" fill="var(--color-primary)" fill-opacity="0.7">
              {Math.round(sprint.completionPct ?? 0)}%
            </text>
          {/if}
        {/each}
      </svg>
    </section>

    <!-- ── Summary table ─────────────────────────────────────────────── -->
    <section class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-base-300">
            <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Sprint</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Status</th>
            <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Capacity</th>
            <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Committed</th>
            <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Velocity</th>
            <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Jobs</th>
            <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Tasks</th>
            <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Complete</th>
          </tr>
        </thead>
        <tbody>
          {#each sprints as sprint}
            {@const pct = Math.round(sprint.completionPct ?? 0)}
            <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td class="px-4 py-2.5">
                <a href="/agile/sprints/{sprint.id}" class="font-medium hover:text-primary hover:underline">
                  S{sprint.sprintNumber}: {sprint.title}
                </a>
              </td>
              <td class="px-4 py-2.5">
                <span class="badge text-xs {STATUS_COLOR[sprint.status] ?? 'badge-ghost'}">{sprint.status}</span>
              </td>
              <td class="px-4 py-2.5 text-right text-xs opacity-70 tabular-nums">
                {sprint.capacity ? fmtEffort(sprint.capacity) : '—'}
              </td>
              <td class="px-4 py-2.5 text-right text-xs opacity-70 tabular-nums">
                {fmtEffort(sprint.committedEffort ?? 0)}
              </td>
              <td class="px-4 py-2.5 text-right text-xs tabular-nums">
                <span class="font-medium text-success">{fmtEffort(sprint.velocity ?? 0)}</span>
              </td>
              <td class="px-4 py-2.5 text-right text-xs opacity-70 tabular-nums">{sprint.jobCount ?? 0}</td>
              <td class="px-4 py-2.5 text-right text-xs opacity-70 tabular-nums">{sprint.taskCount ?? 0}</td>
              <td class="px-4 py-2.5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <div class="w-14 h-1.5 rounded-full bg-base-300 overflow-hidden">
                    <div class="h-full rounded-full bg-primary" style="width:{pct}%"></div>
                  </div>
                  <span class="text-xs font-medium tabular-nums w-8 text-right">{pct}%</span>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>

        <!-- Totals row -->
        <tfoot>
          <tr class="border-t-2 border-base-300 bg-base-300/30">
            <td class="px-4 py-2.5 text-xs font-semibold opacity-60" colspan="2">Totals / Averages</td>
            <td class="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
              {fmtEffort(sprints.reduce((s: number, sp: any) => s + (sp.capacity ?? 0), 0))}
            </td>
            <td class="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
              {fmtEffort(sprints.reduce((s: number, sp: any) => s + (sp.committedEffort ?? 0), 0))}
            </td>
            <td class="px-4 py-2.5 text-right text-xs font-semibold tabular-nums text-success">
              {fmtEffort(sprints.reduce((s: number, sp: any) => s + (sp.velocity ?? 0), 0))}
            </td>
            <td class="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">{totalJobs}</td>
            <td class="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">{totalTasks}</td>
            <td class="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
              {avgCompletion !== null ? `${avgCompletion}%` : '—'} avg
            </td>
          </tr>
        </tfoot>
      </table>
    </section>

  {/if}
</div>
