<script lang="ts">
  import { Search, ChevronLeft, ChevronRight, Plus, X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { PageData } from './$types';
  import { dashboardWidgets } from '$lib/config/dashboard-widgets';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import RoleQuickView from '$lib/components/agile/RoleQuickView.svelte';
  import type { AgileMilestone, AgileSprint, AgileTask } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  // ── Calendar ───────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const d = new Date(year, month, day);
      return { day, isToday: d.toDateString() === today.toDateString() };
    });
  }

  const calDays  = $derived(buildCal(calYear, calMonth));
  const calLabel = $derived(new Date(calYear, calMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  function prevMonth() { calMonth === 0 ? (calMonth = 11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth = 0, calYear++) : calMonth++; }

  // ── Events ────────────────────────────────────────────────────────
  type CalEvent = {
    id: string;
    title: string;
    content: string;
    startDate: string;
    endDate: string;
    singleDay: boolean;
  };

  function toDateStr(val: unknown): string {
    if (!val) return '';
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  let events = $state<CalEvent[]>(
    ((data.events ?? []) as Record<string, unknown>[]).map(e => ({
      id:        String(e.id ?? ''),
      title:     String(e.title ?? ''),
      content:   String(e.content ?? ''),
      startDate: toDateStr(e.startDate),
      endDate:   toDateStr(e.endDate),
      singleDay: Boolean(e.singleDay),
    }))
  );

  let eventQuery         = $state('');
  let eventSearchOpen    = $state(false);
  let eventModalOpen     = $state(false);
  let eventDeleteConfirm = $state(false);
  let editingEventId     = $state<string | null>(null);
  let eventForm = $state({ title: '', content: '', startDate: '', endDate: '', singleDay: true });
  let eventLoading  = $state(false);
  let eventError    = $state('');

  const eventMatches = $derived(
    eventQuery.trim().length > 0
      ? events.filter(e => e.title.toLowerCase().includes(eventQuery.toLowerCase()))
      : []
  );

  $effect(() => {
    if (eventForm.singleDay) eventForm.endDate = eventForm.startDate;
  });

  function eventsForDay(year: number, month: number, day: number): CalEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startDate <= dateStr && dateStr <= e.endDate);
  }

  function selectEventFromSearch(ev: CalEvent) {
    eventQuery = '';
    eventSearchOpen = false;
    openEditEvent(ev);
  }

  function openNewEvent() {
    editingEventId = null;
    const todayStr = today.toISOString().slice(0, 10);
    eventForm = { title: '', content: '', startDate: todayStr, endDate: todayStr, singleDay: true };
    eventError = '';
    eventModalOpen = true;
  }

  function openEditEvent(ev: CalEvent) {
    editingEventId = ev.id;
    eventForm = { title: ev.title, content: ev.content, startDate: ev.startDate, endDate: ev.endDate, singleDay: ev.singleDay };
    eventError = '';
    eventModalOpen = true;
  }

  async function saveEvent() {
    if (!eventForm.title.trim()) { eventError = 'Title is required'; return; }
    if (!eventForm.startDate)    { eventError = 'Start date is required'; return; }

    eventLoading = true;
    eventError   = '';

    const body = {
      title:     eventForm.title.trim(),
      content:   eventForm.content,
      startDate: eventForm.startDate,
      endDate:   eventForm.singleDay ? eventForm.startDate : (eventForm.endDate || eventForm.startDate),
      singleDay: eventForm.singleDay,
    };

    try {
      let res: Response;
      if (editingEventId) {
        res = await fetch(`/api/events/${editingEventId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        eventError = (d as { message?: string }).message ?? 'Save failed';
        return;
      }

      const saved = await res.json();
      const normalized: CalEvent = {
        id:        editingEventId ?? String(saved.id ?? saved._id ?? ''),
        title:     String(saved.title ?? body.title),
        content:   String(saved.content ?? body.content),
        startDate: toDateStr(saved.startDate) || body.startDate,
        endDate:   toDateStr(saved.endDate)   || body.endDate,
        singleDay: Boolean(saved.singleDay ?? body.singleDay),
      };

      if (editingEventId) {
        events = events.map(e => e.id === editingEventId ? normalized : e);
      } else {
        events = [...events, normalized];
      }

      eventModalOpen = false;
    } catch {
      eventError = 'Network error';
    } finally {
      eventLoading = false;
    }
  }

  async function confirmDeleteEvent() {
    if (!editingEventId) return;
    eventLoading = true;
    try {
      const res = await fetch(`/api/events/${editingEventId}`, { method: 'DELETE' });
      if (res.status !== 204 && !res.ok) {
        const d = await res.json().catch(() => ({}));
        eventError = (d as { message?: string }).message ?? 'Delete failed';
        return;
      }
      events = events.filter(e => e.id !== editingEventId);
      eventDeleteConfirm = false;
      eventModalOpen     = false;
    } catch {
      eventError = 'Network error';
    } finally {
      eventLoading = false;
    }
  }

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

  // ── Agile calendar helpers ────────────────────────────────────────
  function dateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  function spansDay(start: string | undefined, end: string | undefined, ds: string): boolean {
    if (!start) return false;
    return start.slice(0, 10) <= ds && ds <= (end ?? start).slice(0, 10);
  }
  function milestonesForDay(y: number, m: number, d: number) {
    const ds = dateStr(y, m, d);
    return agileMilestones.filter(ms => spansDay(ms.startDate, ms.endDate, ds));
  }
  function sprintsForDay(y: number, m: number, d: number) {
    const ds = dateStr(y, m, d);
    return agileSprints.filter(sp => spansDay(sp.startDate, sp.endDate, ds));
  }
  function tasksForDay(y: number, m: number, d: number) {
    const ds = dateStr(y, m, d);
    return agileTasks.filter(t => t.dueDate?.slice(0, 10) === ds);
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

  <!-- Calendar -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Calendar</h2>

    <!-- Event search + New Event -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <label class="input flex items-center gap-2 w-full">
          <Search class="size-4 opacity-50" />
          <input
            type="search"
            class="grow"
            placeholder="Search events by title…"
            autocomplete="off"
            bind:value={eventQuery}
            onfocus={() => (eventSearchOpen = true)}
            onblur={() => setTimeout(() => (eventSearchOpen = false), 150)}
          />
        </label>
        {#if eventSearchOpen && eventMatches.length > 0}
          <div class="absolute top-full left-0 right-0 z-30 mt-1 card bg-base-200 border border-base-300 rounded-box shadow-xl overflow-hidden">
            {#each eventMatches as ev}
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-base-300/50 transition-colors border-b border-base-300 last:border-0"
                onmousedown={() => selectEventFromSearch(ev)}
              >
                <span class="font-medium">{ev.title}</span>
                <span class="text-xs opacity-50 ml-2">
                  {new Date(ev.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      {#if hasPermission(data.user, 'events', 'create')}
        <button type="button" class="btn btn-primary whitespace-nowrap" onclick={openNewEvent}>
          <Plus class="size-4" /> New Event
        </button>
      {/if}
    </div>

    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">

      <!-- Nav -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-base-300">
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={prevMonth} aria-label="Previous month">
          <ChevronLeft class="size-4"/>
        </button>
        <span class="font-semibold text-sm">{calLabel}</span>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={nextMonth} aria-label="Next month">
          <ChevronRight class="size-4"/>
        </button>
      </div>

      <!-- DOW header -->
      <div class="grid grid-cols-7 border-b border-base-300">
        {#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as dow}
          <div class="px-2 py-2 text-center text-xs font-semibold opacity-50 uppercase tracking-wide">{dow}</div>
        {/each}
      </div>

      <!-- Day cells -->
      <div class="grid grid-cols-7">
        {#each calDays as cell, i}
          {@const borderR = (i + 1) % 7 !== 0 ? 'border-r' : ''}
          {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
          <div class="min-h-[5.5rem] p-2 border-base-300 {borderR} {borderB}
            {cell?.isToday ? 'bg-primary/5' : ''}">
            {#if cell}
              <span class="text-xs font-semibold
                {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-content' : 'opacity-70'}">
                {cell.day}
              </span>
              <!-- Milestone pills -->
              {#each milestonesForDay(calYear, calMonth, cell.day) as ms}
                <a href="/agile/milestones/{ms.id}"
                  class="mt-1 flex w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate
                    bg-primary/80 text-white hover:bg-primary transition-colors"
                  title={ms.title}
                >{ms.title}</a>
              {/each}
              <!-- Sprint pills -->
              {#each sprintsForDay(calYear, calMonth, cell.day) as sp}
                <a href="/agile/sprints/{sp.id}"
                  class="mt-1 flex w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate
                    bg-secondary/80 text-white hover:bg-secondary transition-colors"
                  title="Sprint {sp.sprintNumber}: {sp.title}"
                >S{sp.sprintNumber}: {sp.title}</a>
              {/each}
              <!-- Task due-date pills (max 3 + overflow count) -->
              {#each tasksForDay(calYear, calMonth, cell.day).slice(0, 3) as task}
                <div
                  class="mt-1 w-full text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate
                    bg-warning/70 text-warning-content"
                  title={task.title}
                >{task.title}</div>
              {/each}
              {#if tasksForDay(calYear, calMonth, cell.day).length > 3}
                <div class="mt-0.5 text-[9px] opacity-50 px-1">
                  +{tasksForDay(calYear, calMonth, cell.day).length - 3} more
                </div>
              {/if}
              <!-- Event pills -->
              {#each eventsForDay(calYear, calMonth, cell.day) as ev}
                <button
                  type="button"
                  class="mt-1 w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate
                    bg-accent/80 text-accent-content hover:bg-accent transition-colors"
                  onclick={() => openEditEvent(ev)}
                  title={ev.title}
                >{ev.title}</button>
              {/each}
            {/if}
          </div>
        {/each}
      </div>

    </div>
  </div>

  <!-- Module Widgets -->
  {#each sortedWidgets as w}
    {#if hasPermission(data.user, w.permission.resource, w.permission.action)}
      <w.component />
    {/if}
  {/each}

</div>

<!-- ── Event Modal ──────────────────────────────────────────────────── -->
{#if eventModalOpen}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="{editingEventId ? 'Edit Event' : 'New Event'}"
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card bg-base-200 border border-base-300 rounded-box w-full max-w-2xl shadow-xl mx-4 flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{editingEventId ? 'Edit Event' : 'New Event'}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (eventModalOpen = false)} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if eventError}
          <aside class="alert alert-error p-3 rounded text-sm">{eventError}</aside>
        {/if}

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-title">Title</label>
          <input id="ev-title" type="text" class="input w-full" placeholder="Event title" bind:value={eventForm.title} maxlength="200" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-start">Start Date</label>
            <input id="ev-start" type="date" class="input w-full" bind:value={eventForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-end">End Date</label>
            <input id="ev-end" type="date" class="input w-full" bind:value={eventForm.endDate}
              disabled={eventForm.singleDay} min={eventForm.startDate} />
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" class="checkbox" bind:checked={eventForm.singleDay} />
          <span class="text-sm">Single-day event</span>
        </label>

        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={eventForm.content} placeholder="Event description…" />
        </div>
      </div>

      <footer class="flex items-center justify-between px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
        <div>
          {#if editingEventId && hasPermission(data.user, 'events', 'delete')}
            <button
              type="button"
              class="btn btn-error btn-soft"
              disabled={eventLoading}
              onclick={() => (eventDeleteConfirm = true)}
            >Delete this event</button>
          {/if}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-ghost" onclick={() => (eventModalOpen = false)}>Cancel</button>
          <button type="button" class="btn btn-primary" disabled={eventLoading} onclick={saveEvent}>
            {eventLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<!-- ── Delete Confirm Modal ─────────────────────────────────────────── -->
{#if eventDeleteConfirm}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="Confirm delete"
  >
    <div
      transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
      class="card bg-base-200 border border-base-300 rounded-box w-full max-w-sm shadow-xl mx-4"
    >
      <div class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">Delete event?</h2>
        <p class="text-sm opacity-70">
          "<strong>{eventForm.title}</strong>" will be permanently removed. This cannot be undone.
        </p>
        {#if eventError}
          <aside class="alert alert-error p-3 rounded text-sm">{eventError}</aside>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (eventDeleteConfirm = false)}>Cancel</button>
        <button type="button" class="btn btn-error" disabled={eventLoading} onclick={confirmDeleteEvent}>
          {eventLoading ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
