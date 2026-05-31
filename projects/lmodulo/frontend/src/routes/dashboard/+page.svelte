<script lang="ts">
  import { onMount } from 'svelte';
  import { hasPermission } from '$lib/permissions';
  import type { AgileMilestone, AgileSprint, AgileTask } from '$lib/utils/agile';
  import type { DateRange } from '$lib/utils/dashboard';
  import ActivityVolumeChart from '$lib/components/crm/ActivityVolumeChart.svelte';
  import DateRangeFilter from '$lib/components/DateRangeFilter.svelte';
  import { fmtCurrency, donutSegs, funnelPolygons } from '$lib/utils/dashboard';
  import { Eye, EyeOff, GripVertical, LayoutDashboard, Check, RotateCcw } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ── Layout types & defaults ────────────────────────────────────────
  interface ItemConfig    { id: string; visible: boolean; }
  interface SectionConfig { id: string; visible: boolean; items?: ItemConfig[]; }
  interface DashboardLayout { sections: SectionConfig[]; }

  const SECTION_LABELS: Record<string, string> = {
    agile:     'Agile',
    nexus:     'Nexus',
    folio:     'Folio',
    contracts: 'Contracts',
    calendar:  'Calendar',
  };

  const ITEM_LABELS: Record<string, Record<string, string>> = {
    agile:     { 'kpi-strip': 'KPI Strip', 'task-status': 'Task Status Chart', 'milestones-sprints': 'Milestones & Sprints' },
    nexus:     { 'kpi-strip': 'KPI Strip', 'pipeline':    'Deal Pipeline',     'activity':          'Activity Volume' },
    folio:     { 'kpi-strip': 'KPI Strip', 'inv-status':  'Invoice Status',    'top-clients':       'Top Clients' },
    contracts: { 'kpi-strip': 'KPI Strip', 'con-status':  'Contract Status',   'expiring':          'Expiring Soon' },
    calendar:  { 'events':    'Upcoming Events' },
  };

  function defaultLayout(): DashboardLayout {
    return {
      sections: [
        { id: 'agile',     visible: true, items: [
          { id: 'kpi-strip',          visible: true },
          { id: 'task-status',        visible: true },
          { id: 'milestones-sprints', visible: true },
        ]},
        { id: 'nexus',     visible: true, items: [
          { id: 'kpi-strip', visible: true },
          { id: 'pipeline',  visible: true },
          { id: 'activity',  visible: true },
        ]},
        { id: 'folio',     visible: true, items: [
          { id: 'kpi-strip',   visible: true },
          { id: 'inv-status',  visible: true },
          { id: 'top-clients', visible: true },
        ]},
        { id: 'contracts', visible: true, items: [
          { id: 'kpi-strip',  visible: true },
          { id: 'con-status', visible: true },
          { id: 'expiring',   visible: true },
        ]},
        { id: 'calendar',  visible: true, items: [
          { id: 'events', visible: true },
        ]},
      ]
    };
  }

  function mergeLayout(stored: DashboardLayout): DashboardLayout {
    const defs = defaultLayout();
    const merged = defs.sections.map(def => {
      const ss = stored.sections.find(s => s.id === def.id);
      if (!ss) return def;
      if (!def.items) return { ...def, visible: ss.visible };
      const mergedItems = def.items.map(di => {
        const si = ss.items?.find(i => i.id === di.id);
        return si ? { ...di, visible: si.visible } : di;
      });
      const ordered = [
        ...mergedItems
          .filter(mi => ss.items?.some(si => si.id === mi.id))
          .sort((a, b) => ss.items!.findIndex(i => i.id === a.id) - ss.items!.findIndex(i => i.id === b.id)),
        ...mergedItems.filter(mi => !ss.items?.some(si => si.id === mi.id)),
      ];
      return { ...def, visible: ss.visible, items: ordered };
    });
    const orderedSections = [
      ...merged
        .filter(ms => stored.sections.some(ss => ss.id === ms.id))
        .sort((a, b) => stored.sections.findIndex(s => s.id === a.id) - stored.sections.findIndex(s => s.id === b.id)),
      ...merged.filter(ms => !stored.sections.some(ss => ss.id === ms.id)),
    ];
    return { sections: orderedSections };
  }

  // ── DATE RANGE HELPERS ─────────────────────────────────────────────
  function inRange(v: string | null | undefined, r: DateRange): boolean {
    if (!v) return true;
    const d = new Date(v);
    if (isNaN(d.getTime())) return true;
    return (!r.from || d >= r.from) && (!r.to || d <= r.to);
  }

  // ══ AGILE ══════════════════════════════════════════════════════════
  let agileRange = $state<DateRange>({ from: null, to: null });

  const milestones = $derived((data.milestones ?? []) as AgileMilestone[]);
  const sprints    = $derived((data.sprints    ?? []) as AgileSprint[]);

  const tasks = $derived(
    (agileRange.from || agileRange.to)
      ? ((data.agileTasks ?? []) as AgileTask[]).filter(t =>
          t.dueDate ? inRange(t.dueDate, agileRange) : false
        )
      : (data.agileTasks ?? []) as AgileTask[]
  );
  const myTasks = $derived(tasks.filter(t => t.assignedTo === data.user?.id));

  const agileRole      = $derived(data.user?.role ?? '');
  const isPriv         = $derived(['owner', 'admin', 'lead'].includes(agileRole));
  const doneCount      = $derived(tasks.filter(t => t.status === 'Done').length);
  const blockedCount   = $derived(tasks.filter(t => t.status === 'Blocked').length);
  const agileOverdue   = $derived(tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'Done').length);
  const donePct        = $derived(tasks.length ? Math.round(doneCount / tasks.length * 100) : 0);
  const activeSprints  = $derived(sprints.filter(s => s.status === 'Active').length);

  const TASK_COLORS: Record<string, string> = {
    'Backlog':     'var(--color-base-content)',
    'Ready':       'var(--color-info)',
    'Todo':        'var(--color-base-content)',
    'In Progress': 'var(--color-primary)',
    'Review':      'var(--color-secondary)',
    'In Review':   'var(--color-secondary)',
    'Done':        'var(--color-success)',
    'Blocked':     'var(--color-error)',
  };

  const taskStatusCounts = $derived(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return Object.entries(counts).filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  });

  const taskSegs = $derived(donutSegs(taskStatusCounts()));

  const sprintBars = $derived(
    [...sprints]
      .filter(s => !['Planning', 'Cancelled'].includes(s.status))
      .sort((a, b) => (b.sprintNumber ?? 0) - (a.sprintNumber ?? 0))
      .slice(0, 6)
      .reverse()
  );

  const activeMilestones = $derived(milestones.filter(m => m.status === 'Active').slice(0, 5));

  // ══ NEXUS (CRM) ════════════════════════════════════════════════════
  let nexusRange = $state<DateRange>({ from: null, to: null });

  const crmDeals = $derived(
    (nexusRange.from || nexusRange.to)
      ? ((data.crmDeals ?? []) as any[]).filter(d => inRange(d.createdAt, nexusRange))
      : (data.crmDeals ?? []) as any[]
  );
  const crmActivities = $derived(
    (nexusRange.from || nexusRange.to)
      ? ((data.crmActivities ?? []) as any[]).filter(a => inRange(a.createdAt, nexusRange))
      : (data.crmActivities ?? []) as any[]
  );
  const contactsTotal  = $derived(data.crmContactsTotal  ?? 0);
  const companiesTotal = $derived(data.crmCompaniesTotal ?? 0);

  const DEAL_STAGES   = ['Discovery', 'Proposal', 'Negotiation', 'Contract', 'Closed Won', 'Closed Lost'];
  const FUNNEL_COLORS = [
    'var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)',
    'var(--color-info)', 'var(--color-success)', 'var(--color-error)',
  ];

  const openDeals   = $derived(crmDeals.filter((d: any) => !['Closed Won', 'Closed Lost'].includes(d.stage)));
  const pipelineVal = $derived(openDeals.reduce((s: number, d: any) => s + (d.value ?? 0), 0));
  const closingSoon = $derived(openDeals.filter((d: any) => {
    if (!d.expectedCloseDate) return false;
    const days = (new Date(d.expectedCloseDate).getTime() - today.getTime()) / 86400000;
    return days >= 0 && days <= 30;
  }).length);
  const wonDeals    = $derived(crmDeals.filter((d: any) => d.stage === 'Closed Won').length);
  const closedDeals = $derived(crmDeals.filter((d: any) => ['Closed Won', 'Closed Lost'].includes(d.stage)));
  const winRate     = $derived(closedDeals.length > 0 ? Math.round(wonDeals / closedDeals.length * 100) : null);

  const dealStageData = $derived(() => {
    const counts: Record<string, number> = {};
    const values: Record<string, number> = {};
    for (const d of crmDeals) {
      counts[d.stage] = (counts[d.stage] ?? 0) + 1;
      values[d.stage] = (values[d.stage] ?? 0) + (d.value ?? 0);
    }
    return DEAL_STAGES
      .map((s, i) => ({ stage: s, count: counts[s] ?? 0, value: values[s] ?? 0, color: FUNNEL_COLORS[i] }))
      .filter(s => s.count > 0);
  });

  const funnelSegs = $derived(funnelPolygons(dealStageData()));

  // ══ FOLIO ══════════════════════════════════════════════════════════
  let folioRange = $state<DateRange>({ from: null, to: null });

  const folioInvoices = $derived(
    (folioRange.from || folioRange.to)
      ? ((data.folioInvoices ?? []) as any[]).filter(i => inRange(i.issueDate ?? i.createdAt, folioRange))
      : (data.folioInvoices ?? []) as any[]
  );
  const folioExpenses = $derived(
    (folioRange.from || folioRange.to)
      ? ((data.folioExpenses ?? []) as any[]).filter(e => inRange(e.date ?? e.createdAt, folioRange))
      : (data.folioExpenses ?? []) as any[]
  );
  const folioCustomers = $derived((data.folioCustomers ?? []) as any[]);

  const INV_COLORS: Record<string, string> = {
    draft:   'var(--color-base-content)',
    sent:    'var(--color-primary)',
    paid:    'var(--color-success)',
    overdue: 'var(--color-error)',
  };

  const totalBilled      = $derived(folioInvoices.reduce((s: number, i: any) => s + (i.total ?? 0), 0));
  const totalPaid        = $derived(folioInvoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total ?? 0), 0));
  const totalOutstanding = $derived(folioInvoices.filter((i: any) => ['sent', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + (i.total ?? 0), 0));
  const overdueInvCount  = $derived(folioInvoices.filter((i: any) => i.status === 'overdue').length);
  const totalExpenses    = $derived(folioExpenses.reduce((s: number, e: any) => s + (e.amount ?? 0), 0));
  const netProfit        = $derived(totalPaid - totalExpenses);
  const collectionRate   = $derived(totalBilled > 0 ? Math.round(totalPaid / totalBilled * 100) : 0);

  const invStatusCounts = $derived(() => {
    const counts: Record<string, number> = {};
    for (const inv of folioInvoices) counts[inv.status] = (counts[inv.status] ?? 0) + 1;
    return Object.entries(counts).filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  });

  const invSegs = $derived(donutSegs(invStatusCounts()));

  const topClients = $derived(() => {
    const map: Record<string, { name: string; paid: number; outstanding: number }> = {};
    for (const inv of folioInvoices) {
      if (!inv.customerId) continue;
      if (!map[inv.customerId]) {
        const c = folioCustomers.find((x: any) => x.id === inv.customerId);
        map[inv.customerId] = { name: c ? `${c.firstName} ${c.lastName}` : 'Client', paid: 0, outstanding: 0 };
      }
      if (inv.status === 'paid') map[inv.customerId].paid += inv.total ?? 0;
      else if (['sent', 'overdue'].includes(inv.status)) map[inv.customerId].outstanding += inv.total ?? 0;
    }
    return Object.values(map)
      .map(c => ({ ...c, total: c.paid + c.outstanding }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  // ══ CONTRACTS ══════════════════════════════════════════════════════
  let contractsRange = $state<DateRange>({ from: null, to: null });

  const CONTRACT_STATUS_COLORS: Record<string, string> = {
    draft:             'var(--color-base-content)',
    pending_signature: 'var(--color-warning)',
    signed:            'var(--color-success)',
    active:            'var(--color-info)',
    voided:            'var(--color-error)',
  };

  const CONTRACT_STATUS_LABELS: Record<string, string> = {
    draft:             'Draft',
    pending_signature: 'Pending',
    signed:            'Signed',
    active:            'Active',
    voided:            'Voided',
  };

  const contracts = $derived(
    (contractsRange.from || contractsRange.to)
      ? ((data.contracts ?? []) as any[]).filter(c => inRange(c.createdAt, contractsRange))
      : (data.contracts ?? []) as any[]
  );

  const activeContractCount    = $derived(contracts.filter(c => ['signed', 'active'].includes(c.status)).length);
  const contractTotalValue     = $derived(contracts.filter(c => !['voided', 'draft'].includes(c.status)).reduce((s: number, c: any) => s + (c.value ?? 0), 0));
  const pendingSignatureCount  = $derived(contracts.filter(c => c.status === 'pending_signature').length);
  const expiringSoonCount      = $derived(contracts.filter(c => {
    if (!c.expiryDate) return false;
    if (!['signed', 'active', 'pending_signature'].includes(c.status)) return false;
    const exp = new Date(c.expiryDate);
    const soon = new Date(today.getTime() + 30 * 86400000);
    return exp >= today && exp <= soon;
  }).length);

  const contractStatusCounts = $derived(() => {
    const counts: Record<string, number> = {};
    for (const c of contracts) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return Object.entries(counts).filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  });

  const contractSegs = $derived(donutSegs(contractStatusCounts()));

  const expiringList = $derived(() => {
    const ninety = new Date(today.getTime() + 90 * 86400000);
    return contracts
      .filter(c => {
        if (!c.expiryDate) return false;
        if (!['signed', 'active', 'pending_signature'].includes(c.status)) return false;
        const exp = new Date(c.expiryDate);
        return exp >= today && exp <= ninety;
      })
      .map(c => {
        const exp = new Date(c.expiryDate);
        const eff = c.effectiveDate ? new Date(c.effectiveDate) : null;
        const daysLeft  = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
        const totalDays = eff ? Math.max(1, Math.ceil((exp.getTime() - eff.getTime()) / 86400000)) : 90;
        const pct       = Math.max(2, Math.min(100, Math.round(daysLeft / totalDays * 100)));
        return { ...c, daysLeft, pct };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  });

  // ══ CALENDAR ═══════════════════════════════════════════════════════
  const events = $derived((data.events ?? []) as any[]);
  const upcomingEvents = $derived(
    [...events]
      .map((e: any) => ({ ...e, _d: new Date(e.start ?? e.startDate ?? e.startTime) }))
      .filter((e: any) => !isNaN(e._d.getTime()) && e._d >= today)
      .sort((a: any, b: any) => a._d.getTime() - b._d.getTime())
      .slice(0, 6)
  );

  // ── Edit Mode & Layout ────────────────────────────────────────────
  let editMode        = $state(false);
  let layout          = $state<DashboardLayout>(defaultLayout());
  let saveStatus      = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let draggingSection = $state<string | null>(null);
  let dragOverSection = $state<string | null>(null);
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  function reorder<T>(arr: T[], fromId: string, toId: string, getId: (item: T) => string): T[] {
    const from = arr.findIndex(a => getId(a) === fromId);
    const to   = arr.findIndex(a => getId(a) === toId);
    if (from === -1 || to === -1 || from === to) return arr;
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }

  function toggleSection(id: string) {
    layout = { ...layout, sections: layout.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) };
    scheduleLayoutSave();
  }

  function toggleItem(sectionId: string, itemId: string) {
    layout = {
      ...layout,
      sections: layout.sections.map(s =>
        s.id === sectionId && s.items
          ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, visible: !i.visible } : i) }
          : s
      )
    };
    scheduleLayoutSave();
  }

  function sectionItem(sectionId: string, itemId: string): ItemConfig | undefined {
    return layout.sections.find(s => s.id === sectionId)?.items?.find(i => i.id === itemId);
  }

  function itemVisible(sectionId: string, itemId: string): boolean {
    return sectionItem(sectionId, itemId)?.visible ?? true;
  }

  function scheduleLayoutSave() {
    clearTimeout(saveTimer);
    saveStatus = 'saving';
    saveTimer = setTimeout(saveLayout, 700);
  }

  async function saveLayout() {
    const jsonStr = JSON.stringify(layout);
    try { localStorage.setItem('dashboard_layout', jsonStr); } catch { /* ignore */ }
    try {
      const res = await fetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: 'dashboardLayout', value: jsonStr }),
      });
      saveStatus = res.ok ? 'saved' : 'error';
    } catch {
      saveStatus = 'error';
    }
    setTimeout(() => { if (saveStatus !== 'saving') saveStatus = 'idle'; }, 2000);
  }

  function resetLayout() {
    layout = defaultLayout();
    scheduleLayoutSave();
  }

  function onSectionDragStart(e: DragEvent, id: string) {
    e.dataTransfer?.setData('text/plain', id);
    draggingSection = id;
  }
  function onSectionDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (draggingSection && draggingSection !== targetId) dragOverSection = targetId;
  }
  function onSectionDrop(targetId: string) {
    if (!draggingSection || draggingSection === targetId) { draggingSection = null; dragOverSection = null; return; }
    layout = { ...layout, sections: reorder(layout.sections, draggingSection, targetId, s => s.id) };
    draggingSection = null;
    dragOverSection = null;
    scheduleLayoutSave();
  }
  function onSectionDragEnd() { draggingSection = null; dragOverSection = null; }

  onMount(async () => {
    try {
      const res = await fetch('/api/users/me/preferences');
      if (res.ok) {
        const d = await res.json();
        if (d.preferences?.dashboardLayout) {
          layout = mergeLayout(JSON.parse(d.preferences.dashboardLayout));
          return;
        }
      }
    } catch { /* ignore */ }
    try {
      const stored = localStorage.getItem('dashboard_layout');
      if (stored) layout = mergeLayout(JSON.parse(stored));
    } catch { /* use default */ }
  });
</script>

<svelte:head><title>Dashboard</title></svelte:head>

<div class="space-y-10 pb-4">

  <!-- Header -->
  <div class="flex items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-sm opacity-50 mt-0.5">
        Welcome back, <span class="opacity-100 font-medium">{data.user?.firstName ?? data.user?.username}</span>
      </p>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <p class="text-xs opacity-25 hidden sm:block">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <button
        type="button"
        class="btn btn-sm {editMode ? 'btn-success' : 'btn-ghost border border-base-300'}"
        onclick={() => { editMode = !editMode; }}
      >
        {#if editMode}
          <Check class="size-4" /> Done
        {:else}
          <LayoutDashboard class="size-4" /> Edit Layout
        {/if}
      </button>
    </div>
  </div>

  <!-- Edit mode banner -->
  {#if editMode}
    <div
      transition:fade={{ duration: 150 }}
      class="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-sm"
    >
      <span class="flex-1 opacity-65 text-xs">
        Drag <GripVertical class="size-3.5 inline-block opacity-70" /> to reorder sections &middot;
        Click <Eye class="size-3.5 inline-block opacity-70" /> to show/hide sections and visualizations &middot; Changes save automatically
      </span>
      <span class="text-xs {saveStatus === 'saved' ? 'text-success' : saveStatus === 'error' ? 'text-error' : 'opacity-40'}">
        {#if saveStatus === 'saving'}Saving…{:else if saveStatus === 'saved'}Saved ✓{:else if saveStatus === 'error'}Save failed{/if}
      </span>
      <button type="button" class="btn btn-ghost btn-xs gap-1 opacity-60 hover:opacity-100" onclick={resetLayout}>
        <RotateCcw class="size-3" /> Reset
      </button>
    </div>
  {/if}

  <!-- ── Sections (rendered in layout order) ─────────────────────── -->
  {#each layout.sections as section (section.id)}
    {@const secCfg = layout.sections.find(s => s.id === section.id)!}

    <!-- Permission gate (always enforced regardless of edit mode) -->
    {#if
      (section.id === 'agile'     && hasPermission(data.user, 'agile_milestones', 'read')) ||
      (section.id === 'nexus'     && hasPermission(data.user, 'crm_contacts', 'read'))     ||
      (section.id === 'folio'     && hasPermission(data.user, 'finance_invoices', 'read')) ||
      (section.id === 'contracts' && hasPermission(data.user, 'contracts', 'read'))        ||
      (section.id === 'calendar')
    }
      {#if section.visible || editMode}

        <!-- Section drop zone + edit chrome -->
        <div
          class="relative transition-all duration-150
            {editMode ? 'rounded-xl ring-1 ring-base-300/60 p-3' : ''}
            {editMode && dragOverSection === section.id && draggingSection !== section.id ? 'ring-2 ring-primary/60 bg-primary/3' : ''}
            {editMode && draggingSection === section.id ? 'opacity-40 ring-dashed ring-base-content/30' : ''}"
          ondragover={editMode ? (e: DragEvent) => onSectionDragOver(e, section.id) : undefined}
          ondrop={editMode ? () => onSectionDrop(section.id) : undefined}
        >

          <!-- Edit mode: section handle bar -->
          {#if editMode}
            <div
              class="flex items-center gap-2 px-1 py-1.5 mb-3 rounded-lg cursor-grab active:cursor-grabbing select-none hover:bg-base-200/60 transition-colors"
              draggable="true"
              ondragstart={(e: DragEvent) => onSectionDragStart(e, section.id)}
              ondragend={onSectionDragEnd}
            >
              <GripVertical class="size-4 text-base-content/35 shrink-0" />
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/45 flex-1">
                {SECTION_LABELS[section.id] ?? section.id}
              </span>
              <!-- Per-visualization toggles for this section -->
              {#if secCfg.items && secCfg.items.length > 0 && secCfg.visible}
                <div class="flex items-center gap-1 mr-2">
                  {#each secCfg.items as item}
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs gap-1 opacity-50 hover:opacity-100 font-normal text-[10px]"
                      onclick={() => toggleItem(section.id, item.id)}
                      title="{item.visible ? 'Hide' : 'Show'} {ITEM_LABELS[section.id]?.[item.id] ?? item.id}"
                    >
                      {#if item.visible}<Eye class="size-3" />{:else}<EyeOff class="size-3 opacity-40" />{/if}
                      <span class="hidden lg:inline">{ITEM_LABELS[section.id]?.[item.id] ?? item.id}</span>
                    </button>
                  {/each}
                </div>
              {/if}
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-square"
                onclick={() => toggleSection(section.id)}
                title={section.visible ? 'Hide section' : 'Show section'}
              >
                {#if section.visible}<Eye class="size-3.5" />{:else}<EyeOff class="size-3.5 opacity-40" />{/if}
              </button>
            </div>
          {/if}

          <!-- Section content (dimmed when hidden in edit mode) -->
          <div class="transition-opacity duration-150 {editMode && !section.visible ? 'opacity-20 pointer-events-none select-none' : ''}">

            <!-- ══ AGILE ══════════════════════════════════════════ -->
            {#if section.id === 'agile'}
            <section class="space-y-4">
              {#if !editMode}
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-primary opacity-80"></span>
                  <h2 class="text-sm font-semibold">Agile</h2>
                </div>
                <div class="flex items-center gap-3">
                  <DateRangeFilter bind:value={agileRange} />
                  <a href="/agile" class="text-xs opacity-40 hover:opacity-80 transition-opacity">Open →</a>
                </div>
              </div>
              {:else}
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-primary opacity-80"></span>
                  <h2 class="text-sm font-semibold">Agile</h2>
                </div>
                <DateRangeFilter bind:value={agileRange} />
              </div>
              {/if}

              {#if itemVisible('agile', 'kpi-strip')}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {#if isPriv}
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Tasks</p>
                    <p class="text-2xl font-bold mt-1">{tasks.length}</p>
                    <p class="text-xs opacity-40 mt-0.5">{activeSprints} active sprint{activeSprints !== 1 ? 's' : ''}</p>
                  </div>
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Done</p>
                    <p class="text-2xl font-bold mt-1 text-success">{donePct}%</p>
                    <p class="text-xs opacity-40 mt-0.5">{doneCount} of {tasks.length}</p>
                  </div>
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Blocked</p>
                    <p class="text-2xl font-bold mt-1 {blockedCount > 0 ? 'text-error' : ''}">{blockedCount}</p>
                    <p class="text-xs opacity-40 mt-0.5">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Overdue</p>
                    <p class="text-2xl font-bold mt-1 {agileOverdue > 0 ? 'text-warning' : ''}">{agileOverdue}</p>
                    <p class="text-xs opacity-40 mt-0.5">past due date</p>
                  </div>
                {:else}
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">My Tasks</p>
                    <p class="text-2xl font-bold mt-1">{myTasks.length}</p>
                    <p class="text-xs opacity-40 mt-0.5">assigned</p>
                  </div>
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">In Progress</p>
                    <p class="text-2xl font-bold mt-1 text-primary">{myTasks.filter(t => t.status === 'In Progress').length}</p>
                    <p class="text-xs opacity-40 mt-0.5">active now</p>
                  </div>
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Done</p>
                    <p class="text-2xl font-bold mt-1 text-success">{myTasks.filter(t => t.status === 'Done').length}</p>
                    <p class="text-xs opacity-40 mt-0.5">completed</p>
                  </div>
                  <div class="bg-base-200 border border-base-300 rounded-box p-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Overdue</p>
                    <p class="text-2xl font-bold mt-1 {agileOverdue > 0 ? 'text-warning' : ''}">{agileOverdue}</p>
                    <p class="text-xs opacity-40 mt-0.5">need attention</p>
                  </div>
                {/if}
              </div>
              {/if}

              {#if tasks.length > 0}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {#if itemVisible('agile', 'task-status')}
                <div class="bg-base-200 border border-base-300 rounded-box p-5">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-4">Task Status</p>
                  <div class="flex items-center gap-6">
                    <svg viewBox="0 0 180 180" width="148" height="148" class="shrink-0" aria-hidden="true">
                      {#if taskSegs.length > 0}
                        {#each taskSegs as seg}
                          <path d={seg.path} fill={TASK_COLORS[seg.label] ?? 'var(--color-neutral)'} fill-opacity="0.9"/>
                        {/each}
                      {:else}
                        <circle cx="90" cy="90" r="72" fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="24"/>
                      {/if}
                      <text x="90" y="84" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor">{tasks.length}</text>
                      <text x="90" y="101" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.4">total tasks</text>
                    </svg>
                    <ul class="flex-1 space-y-2.5">
                      {#each taskSegs as seg}
                        <li class="flex items-center justify-between gap-2 text-xs">
                          <span class="flex items-center gap-1.5 min-w-0">
                            <span class="size-2 rounded-full shrink-0" style="background:{TASK_COLORS[seg.label] ?? 'var(--color-neutral)'}"></span>
                            <span class="opacity-60 truncate">{seg.label}</span>
                          </span>
                          <span class="font-semibold shrink-0">{seg.value} <span class="opacity-30 font-normal">{seg.pct}%</span></span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
                {/if}

                {#if itemVisible('agile', 'milestones-sprints') && isPriv && (activeMilestones.length > 0 || sprintBars.length > 0)}
                <div class="bg-base-200 border border-base-300 rounded-box p-5 space-y-5">
                  {#if activeMilestones.length > 0}
                  <div class="space-y-3">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Active Milestones</p>
                    {#each activeMilestones as m}
                      {@const pct = Math.round(m.completionPct ?? 0)}
                      <a href="/agile/milestones/{m.id}" class="block group">
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="text-xs font-medium truncate max-w-[72%] group-hover:opacity-60 transition-opacity">{m.title}</span>
                          <span class="text-xs font-bold opacity-50">{pct}%</span>
                        </div>
                        <div class="relative h-1.5 rounded-full bg-base-300 overflow-hidden">
                          <div class="absolute inset-y-0 left-0 rounded-full bg-primary opacity-80 transition-all" style="width:{pct}%"></div>
                        </div>
                      </a>
                    {/each}
                  </div>
                  {/if}
                  {#if sprintBars.length > 0}
                  <div class="space-y-2.5">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Sprint Progress</p>
                    {#each sprintBars as sprint}
                      {@const pct = Math.round(sprint.completionPct ?? 0)}
                      {@const done = sprint.status === 'Completed'}
                      {@const vel = sprint.velocity ?? null}
                      <div class="flex items-center gap-2.5">
                        <span class="text-[11px] opacity-50 w-[4.5rem] shrink-0 truncate">Sprint {sprint.sprintNumber}</span>
                        <div class="relative flex-1 h-2 rounded-full bg-base-300 overflow-hidden">
                          <div class="absolute inset-y-0 left-0 rounded-full"
                            style="width:{pct}%;background:{done ? 'var(--color-success)' : 'var(--color-primary)'};opacity:0.75"></div>
                        </div>
                        <span class="text-[11px] font-semibold w-7 text-right opacity-60">{pct}%</span>
                        {#if vel !== null}
                          <span class="text-[10px] opacity-30 w-8 text-right shrink-0">v{vel}</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                  {/if}
                </div>
                {/if}

              </div>
              {/if}
            </section>

            <!-- ══ NEXUS (CRM) ════════════════════════════════════ -->
            {:else if section.id === 'nexus'}
            <section class="space-y-4">
              {#if !editMode}
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-secondary opacity-80"></span>
                  <h2 class="text-sm font-semibold">Nexus</h2>
                </div>
                <div class="flex items-center gap-3">
                  <DateRangeFilter bind:value={nexusRange} />
                  <a href="/crm" class="text-xs opacity-40 hover:opacity-80 transition-opacity">Open →</a>
                </div>
              </div>
              {:else}
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-secondary opacity-80"></span>
                  <h2 class="text-sm font-semibold">Nexus</h2>
                </div>
                <DateRangeFilter bind:value={nexusRange} />
              </div>
              {/if}

              {#if itemVisible('nexus', 'kpi-strip')}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Pipeline</p>
                  <p class="text-2xl font-bold mt-1">{fmtCurrency(pipelineVal)}</p>
                  <p class="text-xs opacity-40 mt-0.5">{openDeals.length} open deal{openDeals.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Closing Soon</p>
                  <p class="text-2xl font-bold mt-1 {closingSoon > 0 ? 'text-warning' : ''}">{closingSoon}</p>
                  <p class="text-xs opacity-40 mt-0.5">within 30 days</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Contacts</p>
                  <p class="text-2xl font-bold mt-1">{contactsTotal}</p>
                  <p class="text-xs opacity-40 mt-0.5">{companiesTotal} compan{companiesTotal !== 1 ? 'ies' : 'y'}</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Win Rate</p>
                  <p class="text-2xl font-bold mt-1 {winRate !== null ? (winRate >= 50 ? 'text-success' : winRate < 25 ? 'text-error' : '') : ''}">{winRate !== null ? `${winRate}%` : '—'}</p>
                  <p class="text-xs opacity-40 mt-0.5">{wonDeals} won · {closedDeals.length - wonDeals} lost</p>
                </div>
              </div>
              {/if}

              {#if crmDeals.length > 0 || crmActivities.length > 0}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {#if itemVisible('nexus', 'pipeline') && funnelSegs.length > 0}
                <div class="bg-base-200 border border-base-300 rounded-box p-5">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-4">Deal Pipeline</p>
                  <div class="flex items-start gap-5">
                    <svg viewBox="0 0 200 240" width="130" height="156" class="shrink-0" aria-hidden="true">
                      {#each funnelSegs as seg}
                        <polygon points={seg.pts} fill={seg.color} fill-opacity="0.72"/>
                        <text x="100" y={seg.midY + 4} text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" fill-opacity="0.9">{seg.count}</text>
                      {/each}
                    </svg>
                    <ul class="flex-1 space-y-2 mt-1">
                      {#each funnelSegs as seg}
                        <li class="flex items-center justify-between gap-2 text-xs">
                          <span class="flex items-center gap-1.5 min-w-0">
                            <span class="size-2 rounded-sm shrink-0" style="background:{seg.color};opacity:0.72"></span>
                            <span class="opacity-60 truncate">{seg.stage}</span>
                          </span>
                          <span class="font-semibold shrink-0 opacity-80">{fmtCurrency(seg.value)}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
                {/if}
                {#if itemVisible('nexus', 'activity') && crmActivities.length > 0}
                <div class="bg-base-200 border border-base-300 rounded-box p-5">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-3">Activity Volume</p>
                  <ActivityVolumeChart activities={crmActivities} />
                </div>
                {/if}
              </div>
              {/if}
            </section>

            <!-- ══ FOLIO ══════════════════════════════════════════ -->
            {:else if section.id === 'folio'}
            <section class="space-y-4">
              {#if !editMode}
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-success opacity-80"></span>
                  <h2 class="text-sm font-semibold">Folio</h2>
                </div>
                <div class="flex items-center gap-3">
                  <DateRangeFilter bind:value={folioRange} />
                  <a href="/folio" class="text-xs opacity-40 hover:opacity-80 transition-opacity">Open →</a>
                </div>
              </div>
              {:else}
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-success opacity-80"></span>
                  <h2 class="text-sm font-semibold">Folio</h2>
                </div>
                <DateRangeFilter bind:value={folioRange} />
              </div>
              {/if}

              {#if itemVisible('folio', 'kpi-strip')}
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Revenue</p>
                  <p class="text-2xl font-bold mt-1">{fmtCurrency(totalBilled)}</p>
                  <p class="text-xs opacity-40 mt-0.5">{folioInvoices.length} invoice{folioInvoices.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Collected</p>
                  <p class="text-2xl font-bold mt-1 text-success">{fmtCurrency(totalPaid)}</p>
                  <p class="text-xs opacity-40 mt-0.5">{collectionRate}% rate</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Outstanding</p>
                  <p class="text-2xl font-bold mt-1 {totalOutstanding > 0 ? 'text-warning' : ''}">{fmtCurrency(totalOutstanding)}</p>
                  <p class="text-xs opacity-40 mt-0.5">{overdueInvCount > 0 ? `${overdueInvCount} overdue` : 'all current'}</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Expenses</p>
                  <p class="text-2xl font-bold mt-1">{fmtCurrency(totalExpenses)}</p>
                  <p class="text-xs opacity-40 mt-0.5">{folioExpenses.length} item{folioExpenses.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Net</p>
                  <p class="text-2xl font-bold mt-1 {netProfit >= 0 ? 'text-success' : 'text-error'}">{netProfit < 0 ? '-' : ''}{fmtCurrency(Math.abs(netProfit))}</p>
                  <p class="text-xs opacity-40 mt-0.5">{netProfit >= 0 ? 'profit' : 'loss'}</p>
                </div>
              </div>
              {/if}

              {#if folioInvoices.length > 0}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {#if itemVisible('folio', 'inv-status')}
                <div class="bg-base-200 border border-base-300 rounded-box p-5">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-4">Invoice Status</p>
                  <div class="flex items-center gap-6">
                    <svg viewBox="0 0 180 180" width="148" height="148" class="shrink-0" aria-hidden="true">
                      {#if invSegs.length > 0}
                        {#each invSegs as seg}
                          <path d={seg.path} fill={INV_COLORS[seg.label] ?? 'var(--color-neutral)'} fill-opacity="0.9"/>
                        {/each}
                      {:else}
                        <circle cx="90" cy="90" r="72" fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="24"/>
                      {/if}
                      <text x="90" y="84" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor">{folioInvoices.length}</text>
                      <text x="90" y="101" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.4">invoices</text>
                    </svg>
                    <ul class="flex-1 space-y-2.5">
                      {#each invSegs as seg}
                        <li class="flex items-center justify-between gap-2 text-xs">
                          <span class="flex items-center gap-1.5 min-w-0">
                            <span class="size-2 rounded-full shrink-0" style="background:{INV_COLORS[seg.label] ?? 'var(--color-neutral)'}"></span>
                            <span class="opacity-60 capitalize truncate">{seg.label}</span>
                          </span>
                          <span class="font-semibold shrink-0">{seg.value} <span class="opacity-30 font-normal">{seg.pct}%</span></span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
                {/if}
                {#if itemVisible('folio', 'top-clients') && topClients().length > 0}
                {@const clients = topClients()}
                {@const maxTotal = Math.max(...clients.map(c => c.total), 1)}
                <div class="bg-base-200 border border-base-300 rounded-box p-5">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-4">Top Clients</p>
                  <div class="space-y-3.5">
                    {#each clients as client}
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-medium truncate max-w-[60%] opacity-80">{client.name}</span>
                          <span class="font-semibold opacity-60 shrink-0">{fmtCurrency(client.total)}</span>
                        </div>
                        <div class="relative h-2 rounded-full bg-base-300 overflow-hidden">
                          <div class="absolute inset-y-0 left-0 rounded-full bg-success opacity-75" style="width:{Math.round(client.paid / maxTotal * 100)}%"></div>
                          {#if client.outstanding > 0}
                          <div class="absolute inset-y-0 rounded-full bg-warning opacity-75" style="left:{Math.round(client.paid / maxTotal * 100)}%;width:{Math.round(client.outstanding / maxTotal * 100)}%"></div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                  <div class="flex items-center gap-4 mt-4 text-[10px] opacity-50">
                    <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-success opacity-75 shrink-0"></span>Paid</span>
                    <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-warning opacity-75 shrink-0"></span>Outstanding</span>
                  </div>
                </div>
                {/if}
              </div>
              {/if}
            </section>

            <!-- ══ CONTRACTS ════════════════════════════════════════ -->
            {:else if section.id === 'contracts'}
            <section class="space-y-4">
              {#if !editMode}
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-info opacity-80"></span>
                  <h2 class="text-sm font-semibold">Contracts</h2>
                </div>
                <div class="flex items-center gap-3">
                  <DateRangeFilter bind:value={contractsRange} />
                  <a href="/contracts" class="text-xs opacity-40 hover:opacity-80 transition-opacity">Open →</a>
                </div>
              </div>
              {:else}
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-info opacity-80"></span>
                  <h2 class="text-sm font-semibold">Contracts</h2>
                </div>
                <DateRangeFilter bind:value={contractsRange} />
              </div>
              {/if}

              {#if itemVisible('contracts', 'kpi-strip')}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Active</p>
                  <p class="text-2xl font-bold mt-1">{activeContractCount}</p>
                  <p class="text-xs opacity-40 mt-0.5">{contracts.length} total</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Value</p>
                  <p class="text-2xl font-bold mt-1">{contractTotalValue > 0 ? fmtCurrency(contractTotalValue) : '—'}</p>
                  <p class="text-xs opacity-40 mt-0.5">executed contracts</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Pending</p>
                  <p class="text-2xl font-bold mt-1 {pendingSignatureCount > 0 ? 'text-warning' : ''}">{pendingSignatureCount}</p>
                  <p class="text-xs opacity-40 mt-0.5">awaiting signature</p>
                </div>
                <div class="bg-base-200 border border-base-300 rounded-box p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">Expiring</p>
                  <p class="text-2xl font-bold mt-1 {expiringSoonCount > 0 ? 'text-warning' : ''}">{expiringSoonCount}</p>
                  <p class="text-xs opacity-40 mt-0.5">within 30 days</p>
                </div>
              </div>
              {/if}

              {#if contracts.length > 0}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {#if itemVisible('contracts', 'con-status')}
                <div class="bg-base-200 border border-base-300 rounded-box p-5">
                  <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-4">Contract Status</p>
                  <div class="flex items-center gap-6">
                    <svg viewBox="0 0 180 180" width="148" height="148" class="shrink-0" aria-hidden="true">
                      {#if contractSegs.length > 0}
                        {#each contractSegs as seg}
                          <path d={seg.path} fill={CONTRACT_STATUS_COLORS[seg.label] ?? 'var(--color-neutral)'} fill-opacity="0.9"/>
                        {/each}
                      {:else}
                        <circle cx="90" cy="90" r="72" fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="24"/>
                      {/if}
                      <text x="90" y="84" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor">{contracts.length}</text>
                      <text x="90" y="101" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.4">contracts</text>
                    </svg>
                    <ul class="flex-1 space-y-2.5">
                      {#each contractSegs as seg}
                        <li class="flex items-center justify-between gap-2 text-xs">
                          <span class="flex items-center gap-1.5 min-w-0">
                            <span class="size-2 rounded-full shrink-0" style="background:{CONTRACT_STATUS_COLORS[seg.label] ?? 'var(--color-neutral)'}"></span>
                            <span class="opacity-60 truncate">{CONTRACT_STATUS_LABELS[seg.label] ?? seg.label}</span>
                          </span>
                          <span class="font-semibold shrink-0">{seg.value} <span class="opacity-30 font-normal">{seg.pct}%</span></span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
                {/if}
                {#if itemVisible('contracts', 'expiring')}
                  {#if expiringList().length > 0}
                  {@const expiring = expiringList()}
                  <div class="bg-base-200 border border-base-300 rounded-box p-5">
                    <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-4">Expiring Soon</p>
                    <div class="space-y-3.5">
                      {#each expiring as c}
                        {@const barColor = c.daysLeft < 14 ? 'var(--color-error)' : c.daysLeft < 30 ? 'var(--color-warning)' : 'var(--color-info)'}
                        <a href="/contracts/{c.id}" class="block group">
                          <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-medium truncate max-w-[72%] group-hover:opacity-60 transition-opacity">{c.title}</span>
                            <span class="text-xs font-bold opacity-50">{c.daysLeft}d</span>
                          </div>
                          <div class="relative h-1.5 rounded-full bg-base-300 overflow-hidden">
                            <div class="absolute inset-y-0 left-0 rounded-full opacity-75 transition-all" style="width:{c.pct}%;background:{barColor}"></div>
                          </div>
                        </a>
                      {/each}
                    </div>
                    <div class="flex items-center gap-4 mt-4 text-[10px] opacity-50">
                      <span class="flex items-center gap-1.5"><span class="size-2 rounded-full shrink-0" style="background:var(--color-info)"></span>30+ days</span>
                      <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-warning shrink-0"></span>14-30 days</span>
                      <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-error shrink-0"></span>&lt;14 days</span>
                    </div>
                  </div>
                  {:else}
                  <div class="bg-base-200 border border-base-300 rounded-box p-5 flex items-center justify-center">
                    <p class="text-xs opacity-30">No contracts expiring within 90 days</p>
                  </div>
                  {/if}
                {/if}
              </div>
              {/if}
            </section>

            <!-- ══ CALENDAR ════════════════════════════════════════ -->
            {:else if section.id === 'calendar'}
              {#if itemVisible('calendar', 'events') && upcomingEvents.length > 0}
              <section class="space-y-4">
                {#if !editMode}
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="block w-0.5 h-4 rounded-full bg-accent opacity-80"></span>
                    <h2 class="text-sm font-semibold">Calendar</h2>
                  </div>
                  <a href="/calendar-events" class="text-xs opacity-40 hover:opacity-80 transition-opacity">Open →</a>
                </div>
                {:else}
                <div class="flex items-center gap-2.5">
                  <span class="block w-0.5 h-4 rounded-full bg-accent opacity-80"></span>
                  <h2 class="text-sm font-semibold">Calendar</h2>
                </div>
                {/if}
                <div class="bg-base-200 border border-base-300 rounded-box overflow-hidden">
                  <ul class="divide-y divide-base-300">
                    {#each upcomingEvents as ev}
                      {@const isToday = ev._d.toDateString() === today.toDateString()}
                      <li class="flex items-center gap-4 px-5 py-3 {isToday ? 'bg-accent/5' : ''}">
                        <div class="text-center shrink-0 w-9">
                          <p class="text-[9px] font-semibold uppercase opacity-40 tracking-wide">
                            {ev._d.toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                          <p class="text-xl font-bold leading-none {isToday ? 'text-accent' : ''}">{ev._d.getDate()}</p>
                        </div>
                        <div class="w-px h-7 bg-base-300 shrink-0"></div>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium truncate">{ev.title ?? 'Event'}</p>
                          <p class="text-[10px] opacity-40 mt-0.5">
                            {ev._d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {ev.location ? ` · ${ev.location}` : ''}
                          </p>
                        </div>
                        {#if isToday}
                          <span class="text-[10px] font-semibold text-accent shrink-0">Today</span>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                </div>
              </section>
              {:else if editMode && upcomingEvents.length === 0}
              <div class="bg-base-200 border border-base-300 border-dashed rounded-box p-5 text-center">
                <div class="flex items-center gap-2.5 justify-center mb-2">
                  <span class="block w-0.5 h-4 rounded-full bg-accent opacity-80"></span>
                  <h2 class="text-sm font-semibold">Calendar</h2>
                </div>
                <p class="text-xs opacity-30">No upcoming events</p>
              </div>
              {/if}
            {/if}

          </div><!-- end section content -->
        </div><!-- end section wrapper -->
      {/if}
    {/if}
  {/each}

</div>
