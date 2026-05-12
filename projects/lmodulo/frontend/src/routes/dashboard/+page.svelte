<script lang="ts">
  import type { PageData } from './$types';
  import { dashboardWidgets } from '$lib/config/dashboard-widgets';
  import { hasPermission } from '$lib/permissions';
  import RoleQuickView from '$lib/components/agile/RoleQuickView.svelte';
  import type { AgileMilestone, AgileSprint, AgileTask } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ── Dashboard widgets ──────────────────────────────────────────────
  const sortedWidgets = $derived([...dashboardWidgets].sort((a, b) => a.order - b.order));

  // ── Agile metrics ─────────────────────────────────────────────────
  const agileMilestones = $derived((data.milestones ?? []) as AgileMilestone[]);
  const agileSprints    = $derived((data.sprints    ?? []) as AgileSprint[]);
  const agileTasks      = $derived((data.agileTasks ?? []) as AgileTask[]);
  const myAgileTasks    = $derived(agileTasks.filter(t => t.assignedTo === data.user?.id));
  const agileBlocked    = $derived(agileTasks.filter(t => t.status === 'Blocked').length);
  const agileOverdue    = $derived(agileTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < today && t.status !== 'Done'
  ).length);
  const agileRole      = $derived(data.user?.role ?? '');
  const agileIsAdmin   = $derived(['owner', 'admin'].includes(agileRole));
  const agileIsLead    = $derived(agileRole === 'lead');

  // ── CRM metrics ───────────────────────────────────────────────────
  const crmDeals          = $derived((data.crmDeals      ?? []) as any[]);
  const crmActivities     = $derived((data.crmActivities ?? []) as any[]);
  const crmContactsTotal  = $derived(data.crmContactsTotal  ?? 0);
  const crmCompaniesTotal = $derived(data.crmCompaniesTotal ?? 0);

  const openDeals     = $derived(crmDeals.filter((d: any) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'));
  const pipelineValue = $derived(openDeals.reduce((sum: number, d: any) => sum + (d.value ?? 0), 0));
  const closingSoon   = $derived(openDeals.filter((d: any) => {
    if (!d.expectedCloseDate) return false;
    const days = (new Date(d.expectedCloseDate).getTime() - today.getTime()) / 86400000;
    return days >= 0 && days <= 30;
  }).length);

  const DEAL_STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Contract', 'Closed Won', 'Closed Lost'];
  const dealsByStage = $derived(() => {
    const counts: Record<string, number> = {};
    for (const d of crmDeals) counts[d.stage] = (counts[d.stage] ?? 0) + 1;
    return DEAL_STAGES.map(s => ({ stage: s, count: counts[s] ?? 0 })).filter(s => s.count > 0);
  });

  function fmtCurrency(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  }

  // ── Task status donut chart ────────────────────────────────────────
  const STATUS_COLORS: Record<string, string> = {
    'Todo':        'var(--color-base-content)',
    'In Progress': 'var(--color-primary)',
    'In Review':   'var(--color-secondary)',
    'Done':        'var(--color-success)',
    'Blocked':     'var(--color-error)',
  };

  const taskStatusCounts = $derived(() => {
    const counts: Record<string, number> = {};
    for (const t of agileTasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  });

  function donutSegs(pts: { label: string; value: number }[], cx = 90, cy = 90, r = 70, ir = 44) {
    const total = pts.reduce((s, d) => s + d.value, 0) || 1;
    let a = -Math.PI / 2;
    return pts.map(d => {
      const sw = (d.value / total) * Math.PI * 2;
      const [x1, y1]   = [cx + r  * Math.cos(a),      cy + r  * Math.sin(a)];
      const [x2, y2]   = [cx + r  * Math.cos(a + sw), cy + r  * Math.sin(a + sw)];
      const [xi1, yi1] = [cx + ir * Math.cos(a + sw), cy + ir * Math.sin(a + sw)];
      const [xi2, yi2] = [cx + ir * Math.cos(a),      cy + ir * Math.sin(a)];
      const lg   = sw > Math.PI ? 1 : 0;
      const path = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi1.toFixed(2)},${yi1.toFixed(2)} A${ir},${ir} 0 ${lg} 0 ${xi2.toFixed(2)},${yi2.toFixed(2)}Z`;
      a += sw;
      return { path, color: STATUS_COLORS[d.label] ?? 'var(--color-neutral)', label: d.label, pct: Math.round(d.value / total * 100), value: d.value };
    });
  }

  const taskSegs = $derived(donutSegs(taskStatusCounts()));
</script>

<svelte:head><title>Dashboard</title></svelte:head>

<div class="space-y-8">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="text-sm opacity-60 mt-0.5">Welcome back, <strong>{data.user?.firstName ?? data.user?.username}</strong></p>
  </div>

  <!-- ── Agile Summary ───────────────────────────────────────────────── -->
  {#if hasPermission(data.user, 'agile_milestones', 'read')}
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Agile Tracker</h2>
        <a href="/agile" class="btn btn-ghost btn-sm text-xs">Open Tracker →</a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- KPI cards (role-aware) -->
        <div class="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {#if agileIsAdmin || agileIsLead}
            <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Milestones</p>
              <p class="text-2xl font-bold">{agileMilestones.length}</p>
              <p class="text-xs opacity-40">{agileMilestones.filter((m: any) => m.status === 'Active').length} active</p>
            </div>
            <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Blocked Tasks</p>
              <p class="text-2xl font-bold text-error">{agileBlocked}</p>
              <p class="text-xs opacity-40">{agileOverdue} overdue</p>
            </div>
            <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Tasks</p>
              <p class="text-2xl font-bold">{agileTasks.length}</p>
              <p class="text-xs opacity-40">{agileTasks.filter((t: any) => t.status === 'Done').length} done</p>
            </div>
          {:else}
            <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">My Tasks</p>
              <p class="text-2xl font-bold">{myAgileTasks.length}</p>
              <p class="text-xs opacity-40">assigned to me</p>
            </div>
            <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">In Progress</p>
              <p class="text-2xl font-bold">{myAgileTasks.filter((t: any) => t.status === 'In Progress').length}</p>
              <p class="text-xs opacity-40">of my tasks</p>
            </div>
            <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Done</p>
              <p class="text-2xl font-bold text-success">{myAgileTasks.filter((t: any) => t.status === 'Done').length}</p>
              <p class="text-xs opacity-40">of my tasks</p>
            </div>
          {/if}
        </div>

        <!-- Role quick view -->
        <RoleQuickView user={data.user} />
      </div>

      <!-- Charts row -->
      {#if agileTasks.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <!-- Task status donut -->
          <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
            <h3 class="text-sm font-semibold opacity-70">Task Status Breakdown</h3>
            <div class="flex items-center gap-6">
              <svg viewBox="0 0 180 180" width="160" height="160" class="shrink-0" aria-hidden="true">
                {#each taskSegs as seg}
                  <path d={seg.path} fill={seg.color} fill-opacity="0.9"/>
                {/each}
                <text x="90" y="85" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">{agileTasks.length}</text>
                <text x="90" y="100" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.5">tasks</text>
              </svg>
              <ul class="space-y-2 text-sm flex-1">
                {#each taskSegs as seg}
                  <li class="flex items-center justify-between gap-2">
                    <span class="flex items-center gap-2">
                      <span class="size-2.5 rounded-full shrink-0" style="background:{seg.color}"></span>
                      <span class="opacity-70">{seg.label}</span>
                    </span>
                    <span class="font-semibold">{seg.value} <span class="opacity-40 font-normal text-xs">{seg.pct}%</span></span>
                  </li>
                {/each}
              </ul>
            </div>
          </div>

          <!-- Active milestones -->
          {#if agileMilestones.filter((m: any) => m.status === 'Active').length > 0 && (agileIsAdmin || agileIsLead)}
            <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
              <div class="px-4 py-2.5 border-b border-base-300">
                <span class="text-xs font-semibold opacity-60 uppercase tracking-wide">Active Milestones</span>
              </div>
              <div class="divide-y divide-base-300">
                {#each agileMilestones.filter((m: any) => m.status === 'Active').slice(0, 5) as m}
                  {@const pct = Math.round(m.completionPct ?? 0)}
                  <a href="/agile/milestones/{m.id}"
                    class="flex items-center gap-4 px-4 py-3 hover:bg-base-300/50 transition-colors">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{m.title}</p>
                      <p class="text-xs opacity-50 truncate">{m.strategicGoal ?? ''}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <div class="w-20 h-1.5 rounded-full bg-base-300 overflow-hidden">
                        <div class="h-full rounded-full bg-primary" style="width:{pct}%"></div>
                      </div>
                      <span class="text-xs font-semibold w-8 text-right">{pct}%</span>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/if}

        </div>
      {/if}
    </div>
  {/if}

  <!-- ── CRM Summary ────────────────────────────────────────────────── -->
  {#if hasPermission(data.user, 'crm_contacts', 'read')}
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">CRM</h2>
        <a href="/crm" class="btn btn-ghost btn-sm text-xs">Open CRM →</a>
      </div>

      <!-- KPI cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Pipeline</p>
          <p class="text-2xl font-bold">{fmtCurrency(pipelineValue)}</p>
          <p class="text-xs opacity-40">{openDeals.length} open deal{openDeals.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Closing Soon</p>
          <p class="text-2xl font-bold {closingSoon > 0 ? 'text-warning' : ''}">{closingSoon}</p>
          <p class="text-xs opacity-40">within 30 days</p>
        </div>
        <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Contacts</p>
          <p class="text-2xl font-bold">{crmContactsTotal}</p>
          <p class="text-xs opacity-40">total</p>
        </div>
        <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Companies</p>
          <p class="text-2xl font-bold">{crmCompaniesTotal}</p>
          <p class="text-xs opacity-40">total</p>
        </div>
      </div>

      {#if crmDeals.length > 0 || crmActivities.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <!-- Deal stage funnel -->
          {#if crmDeals.length > 0}
            <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
              <div class="px-4 py-2.5 border-b border-base-300">
                <span class="text-xs font-semibold opacity-60 uppercase tracking-wide">Deal Stages</span>
              </div>
              <div class="p-4 space-y-3">
                {#each dealsByStage() as { stage, count }}
                  {@const maxCount = Math.max(...dealsByStage().map((s: any) => s.count))}
                  {@const barColor = stage === 'Closed Won' ? 'bg-success' : stage === 'Closed Lost' ? 'bg-error/60' : 'bg-primary'}
                  <div class="flex items-center gap-3">
                    <span class="text-xs w-24 shrink-0 opacity-70">{stage}</span>
                    <div class="flex-1 h-1.5 rounded-full bg-base-300 overflow-hidden">
                      <div class="h-full rounded-full {barColor}" style="width:{Math.round(count / maxCount * 100)}%"></div>
                    </div>
                    <span class="text-xs font-semibold w-3 text-right">{count}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Recent activities -->
          {#if crmActivities.length > 0}
            <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
              <div class="px-4 py-2.5 border-b border-base-300">
                <span class="text-xs font-semibold opacity-60 uppercase tracking-wide">Recent Activities</span>
              </div>
              <div class="divide-y divide-base-300">
                {#each crmActivities as act}
                  <div class="px-4 py-2.5 flex items-start gap-3">
                    <span class="badge badge-sm badge-ghost shrink-0 mt-0.5">{act.type}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm truncate">{act.title}</p>
                      <p class="text-xs opacity-40">
                        {act.scheduledAt
                          ? new Date(act.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'No date'}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

        </div>
      {/if}
    </div>
  {/if}

  <!-- Module Widgets -->
  {#each sortedWidgets as w}
    {#if hasPermission(data.user, w.permission.resource, w.permission.action)}
      <w.component />
    {/if}
  {/each}

</div>

