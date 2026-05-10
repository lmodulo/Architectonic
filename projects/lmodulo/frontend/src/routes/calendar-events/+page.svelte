<script lang="ts">
  import { page } from '$app/state';
  import { ChevronLeft, ChevronRight, Plus, Search, LayoutList, Calendar as CalIcon } from 'lucide-svelte';
  import type { PageData } from './$types';
  import EventCard          from '$lib/components/EventCard.svelte';
  import EventCalendarGrid  from '$lib/components/EventCalendarGrid.svelte';
  import EventModal         from '$lib/components/EventModal.svelte';
  import { hasPermission }  from '$lib/permissions';
  import { normalizeEvent, groupByMonth, typeLabel, type CalendarEvent } from '$lib/utils/calendarEvents';

  let { data }: { data: PageData } = $props();

  // ── Shared state ───────────────────────────────────────────────────────────
  type UserOption = { id: string; username: string; firstName: string; lastName: string };
  let events    = $state<CalendarEvent[]>(data.events ?? []);
  const tasks   = $derived((data.tasks ?? []) as any[]);
  const users   = $derived((data.users ?? []) as UserOption[]);
  const userId  = $derived((data.user as { id?: string } | null)?.id ?? '');
  const canManage = $derived(hasPermission(data.user, 'calendar_events', 'create'));

  // ── Tabs ───────────────────────────────────────────────────────────────────
  type Tab = 'calendar' | 'events' | 'manage';

  function getInitialTab(): Tab {
    const raw = page.url.searchParams.get('tab');
    if (raw === 'manage' && hasPermission(data.user, 'calendar_events', 'create')) return 'manage';
    if (raw === 'events') return 'events';
    if (raw === 'calendar' && data.user) return 'calendar';
    return data.user ? 'calendar' : 'events';
  }

  let activeTab = $state<Tab>(getInitialTab());

  function switchTab(tab: Tab) {
    activeTab = tab;
    const u = new URL(window.location.href);
    u.searchParams.set('tab', tab);
    history.replaceState({}, '', u.toString());
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  let modalOpen    = $state(false);
  let editing      = $state<CalendarEvent | null>(null);
  let newEventDate = $state('');

  function openNew() { editing = null; newEventDate = ''; modalOpen = true; }
  function openNewOnDate(dateStr: string) { editing = null; newEventDate = dateStr; modalOpen = true; }
  function openEdit(ev: CalendarEvent) { editing = ev; modalOpen = true; }

  async function handleSave(body: Record<string, unknown>) {
    let res: Response;
    if (editing) {
      res = await fetch(`/api/calendar-events/${editing.id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch('/api/calendar-events', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { message?: string }).message ?? 'Save failed');
    }
    if (editing) {
      const updated = await fetch(`/api/calendar-events/${editing.id}`);
      if (updated.ok) {
        const d = await updated.json();
        events = events.map(e => e.id === editing!.id ? normalizeEvent(d) : e);
      } else {
        events = events.map(e => e.id === editing!.id ? normalizeEvent({ ...e, ...body }) : e);
      }
    } else {
      const saved = await res.json();
      events = [...events, normalizeEvent(saved)];
    }
    modalOpen = false;
  }

  async function handleDelete() {
    if (!editing) return;
    const res = await fetch(`/api/calendar-events/${editing.id}`, { method: 'DELETE' });
    if (res.status !== 204 && !res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { message?: string }).message ?? 'Delete failed');
    }
    events    = events.filter(e => e.id !== editing!.id);
    modalOpen = false;
  }

  // ── Calendar tab ───────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  const calLabel = $derived(new Date(calYear, calMonth, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  function prevMonth() { calMonth === 0 ? (calMonth = 11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth = 0, calYear++) : calMonth++; }

  function ds(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const dStr = ds(year, month, day);
      const d    = new Date(year, month, day);
      const myEvs = events.filter(e =>
        e.startDate <= dStr && dStr <= e.endDate && e.ownerId === userId);
      const sharedEvs = events.filter(e =>
        e.startDate <= dStr && dStr <= e.endDate && e.ownerId !== userId &&
        e.status !== 'draft' && e.status !== 'cancelled');
      const dueTasks = tasks.filter((t: any) => t.dueDate?.slice(0, 10) === dStr);
      return { day, isToday: d.toDateString() === today.toDateString(), myEvs, sharedEvs, dueTasks };
    });
  }

  const calDays = $derived(buildCal(calYear, calMonth));

  const upcoming = $derived.by(() => {
    const now    = new Date(); now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + 90);
    const nowStr    = now.toISOString().slice(0, 10);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return events
      .filter(e => {
        if (e.endDate < nowStr || e.startDate > cutoffStr) return false;
        if (e.ownerId === userId) return true;
        return e.status !== 'draft' && e.status !== 'cancelled';
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  });

  function fmtShort(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function visIcon(v: string | undefined) {
    if (v === 'public') return '🌐';
    if (v === 'shared') return '👥';
    return '🔒';
  }

  // ── Events tab ─────────────────────────────────────────────────────────────
  let eventTypeFilter = $state(data.activeType ?? '');

  const publicEvents = $derived(
    data.user
      ? events.filter(e => e.visibility === 'public' && e.status !== 'draft' && e.status !== 'cancelled')
      : events
  );

  const eventTypes = $derived(
    data.user
      ? [...new Set(publicEvents.map(e => e.eventType))].sort()
      : (data.eventTypes ?? [])
  );

  const filteredPublic = $derived(
    eventTypeFilter ? publicEvents.filter(e => e.eventType === eventTypeFilter) : publicEvents
  );

  const groups = $derived(groupByMonth(filteredPublic));

  // ── Manage tab ─────────────────────────────────────────────────────────────
  let manageView   = $state<'calendar' | 'list'>('calendar');
  let query        = $state('');
  let filterType   = $state('');
  let filterStatus = $state('');

  const filtered = $derived(
    events.filter(e => {
      const q = query.trim().toLowerCase();
      if (q && !e.title.toLowerCase().includes(q) && !e.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (filterType   && e.eventType !== filterType)   return false;
      if (filterStatus && e.status    !== filterStatus) return false;
      return true;
    })
  );

  const distinctTypes    = $derived([...new Set(events.map(e => e.eventType))].sort());
  const distinctStatuses = $derived([...new Set(events.map(e => e.status ?? 'active'))].sort());
</script>

<svelte:head><title>Calendar Events</title></svelte:head>

<div class="space-y-5">

  <!-- Header -->
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">Calendar Events</h1>
      <p class="text-sm opacity-60 mt-0.5">Events, announcements, and your personal schedule.</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      {#if data.user}
        <a href="/calendar-events/preferences" class="btn btn-ghost btn-sm">Notification Preferences</a>
      {/if}
      {#if hasPermission(data.user, 'calendar_events', 'create')}
        <button type="button" class="btn btn-primary btn-sm" onclick={openNew}>
          <Plus class="size-4" /> New Event
        </button>
      {/if}
    </div>
  </div>

  <!-- Tab bar -->
  <div class="border-b border-base-300">
    <div class="flex">
      {#if data.user}
        <button
          type="button"
          class="px-5 py-2.5 text-sm font-medium transition-colors rounded-t
            {activeTab === 'calendar' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
          onclick={() => switchTab('calendar')}
        >My Calendar</button>
      {/if}
      <button
        type="button"
        class="px-5 py-2.5 text-sm font-medium transition-colors rounded-t
          {activeTab === 'events' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        onclick={() => switchTab('events')}
      >Events</button>
      {#if canManage}
        <button
          type="button"
          class="px-5 py-2.5 text-sm font-medium transition-colors rounded-t
            {activeTab === 'manage' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
          onclick={() => switchTab('manage')}
        >Manage</button>
      {/if}
    </div>
  </div>

  <!-- ── My Calendar tab ──────────────────────────────────────────────────── -->
  {#if activeTab === 'calendar' && data.user}
    <div class="space-y-6">

      <!-- Monthly calendar grid -->
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">

        <div class="flex items-center justify-between px-5 py-3 border-b border-base-300">
          <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={prevMonth} aria-label="Previous month">
            <ChevronLeft class="size-4" />
          </button>
          <span class="font-semibold text-sm">{calLabel}</span>
          <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={nextMonth} aria-label="Next month">
            <ChevronRight class="size-4" />
          </button>
        </div>

        <div class="grid grid-cols-7 border-b border-base-300">
          {#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as dow}
            <div class="px-2 py-2 text-center text-xs font-semibold opacity-50 uppercase tracking-wide">{dow}</div>
          {/each}
        </div>

        <div class="grid grid-cols-7">
          {#each calDays as cell, i}
            {@const borderR = (i+1) % 7 !== 0 ? 'border-r' : ''}
            {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
            <div
              class="min-h-[5.5rem] p-2 border-base-300 {borderR} {borderB} {cell?.isToday ? 'bg-primary/5' : ''}"
              ondblclick={() => { if (cell && hasPermission(data.user, 'calendar_events', 'create')) openNewOnDate(ds(calYear, calMonth, cell.day)); }}
            >
              {#if cell}
                <span class="text-xs font-semibold {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-content' : 'opacity-70'}">
                  {cell.day}
                </span>
                <div class="mt-1 space-y-0.5">
                  {#each cell.myEvs as ev}
                    <button
                      type="button"
                      class="w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-primary/80 text-white hover:bg-primary/100 transition-colors"
                      title="{ev.title}"
                      onclick={() => openEdit(ev)}
                    >{ev.title}</button>
                  {/each}
                  {#each cell.sharedEvs as ev}
                    <div
                      class="text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-secondary/70 text-white"
                      title="{ev.title} · shared by {ev.ownerName ?? 'someone'}"
                    >{ev.title}</div>
                  {/each}
                  {#each cell.dueTasks.slice(0, 2) as t}
                    <div
                      class="text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-warning/70 text-warning-content"
                      title={t.title}
                    >{t.title}</div>
                  {/each}
                  {#if cell.dueTasks.length > 2}
                    <div class="text-[9px] opacity-50 px-1">+{cell.dueTasks.length - 2} tasks</div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-4 text-xs opacity-60">
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-primary/80 inline-block"></span>My events</span>
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-secondary/70 inline-block"></span>Shared with me</span>
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-warning/70 inline-block"></span>Task due</span>
      </div>

      <!-- Upcoming events list -->
      {#if upcoming.length > 0}
        <div class="space-y-3">
          <h2 class="text-sm font-semibold opacity-60 uppercase tracking-wide">Upcoming (next 90 days)</h2>
          {#each upcoming as ev}
            <div
              class="card bg-base-200 border border-base-300 rounded-box px-4 py-3 flex items-start gap-3
                {ev.ownerId === userId ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}"
              role={ev.ownerId === userId ? 'button' : undefined}
              tabindex={ev.ownerId === userId ? 0 : undefined}
              onclick={() => { if (ev.ownerId === userId) openEdit(ev); }}
              onkeydown={(e) => { if (ev.ownerId === userId && (e.key === 'Enter' || e.key === ' ')) openEdit(ev); }}
            >
              <div class="shrink-0 text-center w-10">
                <div class="text-xs font-semibold opacity-50 uppercase leading-none">
                  {new Date(ev.startDate + 'T00:00:00').toLocaleString('en-US', { month: 'short' })}
                </div>
                <div class="text-xl font-bold leading-tight">
                  {new Date(ev.startDate + 'T00:00:00').getDate()}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="font-medium text-sm truncate">{ev.title}</span>
                  <span class="text-[10px] opacity-40">{visIcon(ev.visibility)}</span>
                  {#if ev.ownerId !== userId}
                    <span class="text-[10px] opacity-50">shared by {ev.ownerName ?? 'someone'}</span>
                  {/if}
                </div>
                {#if ev.location}
                  <p class="text-xs opacity-50 mt-0.5">{ev.location}</p>
                {/if}
                {#if !ev.singleDay}
                  <p class="text-xs opacity-40">{fmtShort(ev.startDate)} – {fmtShort(ev.endDate)}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

    </div>
  {/if}

  <!-- ── Events tab ────────────────────────────────────────────────────────── -->
  {#if activeTab === 'events'}
    <div class="space-y-8">

      <!-- Type filter tabs -->
      {#if eventTypes.length > 1}
        <nav class="flex flex-wrap gap-2" aria-label="Event type filter">
          <button
            type="button"
            class="btn btn-sm {!eventTypeFilter ? 'btn-primary' : 'btn-ghost'}"
            onclick={() => (eventTypeFilter = '')}
          >All</button>
          {#each eventTypes as type}
            <button
              type="button"
              class="btn btn-sm {eventTypeFilter === type ? 'btn-primary' : 'btn-ghost'}"
              onclick={() => (eventTypeFilter = type)}
            >{typeLabel(type)}</button>
          {/each}
        </nav>
      {/if}

      <!-- Events grouped by month -->
      {#if groups.length === 0}
        <div class="card bg-base-200 border border-base-300 p-10 text-center space-y-2 rounded-box">
          <p class="text-lg font-semibold opacity-50">No upcoming events scheduled.</p>
          <p class="text-sm opacity-40">Check back soon.</p>
        </div>
      {:else}
        {#each groups as group}
          <section class="space-y-4">
            <h2 class="text-xs font-semibold uppercase tracking-widest opacity-50 border-b border-base-300 pb-2">
              {group.month}
            </h2>
            {#each group.items as ev}
              <EventCard event={ev} />
            {/each}
          </section>
        {/each}
      {/if}

    </div>
  {/if}

  <!-- ── Manage tab ────────────────────────────────────────────────────────── -->
  {#if activeTab === 'manage' && canManage}
    <div class="space-y-5">

      <p class="text-sm opacity-50">{events.length} event{events.length !== 1 ? 's' : ''} total</p>

      <!-- Filters + view toggle -->
      <div class="flex flex-wrap items-center gap-3">
        <label class="input flex items-center gap-2 flex-1 min-w-48">
          <Search class="size-4 opacity-50" />
          <input type="search" class="grow" placeholder="Search events…" bind:value={query} />
        </label>

        {#if distinctTypes.length > 1}
          <select class="select" bind:value={filterType}>
            <option value="">All types</option>
            {#each distinctTypes as t}
              <option value={t}>{typeLabel(t)}</option>
            {/each}
          </select>
        {/if}

        {#if distinctStatuses.length > 1}
          <select class="select" bind:value={filterStatus}>
            <option value="">All statuses</option>
            {#each distinctStatuses as s}
              <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            {/each}
          </select>
        {/if}

        <div class="join">
          <button
            type="button"
            class="join-item btn btn-sm {manageView === 'calendar' ? 'btn-primary' : 'btn-ghost'}"
            onclick={() => (manageView = 'calendar')} aria-label="Calendar view"
          ><CalIcon class="size-4" /></button>
          <button
            type="button"
            class="join-item btn btn-sm {manageView === 'list' ? 'btn-primary' : 'btn-ghost'}"
            onclick={() => (manageView = 'list')} aria-label="List view"
          ><LayoutList class="size-4" /></button>
        </div>
      </div>

      {#if manageView === 'calendar'}
        <EventCalendarGrid events={filtered} onEventClick={openEdit} />
      {/if}

      {#if manageView === 'list'}
        {#if filtered.length === 0}
          <div class="card bg-base-200 border border-base-300 p-10 text-center rounded-box">
            <p class="opacity-50">No events match your filters.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each filtered as ev}
              <button type="button" class="w-full text-left" onclick={() => openEdit(ev)}>
                <EventCard event={ev} compact />
              </button>
            {/each}
          </div>
        {/if}
      {/if}

    </div>
  {/if}

</div>

<EventModal
  event={editing}
  open={modalOpen}
  user={data.user}
  {users}
  defaultStartDate={editing ? undefined : (newEventDate || undefined)}
  onSave={handleSave}
  onDelete={handleDelete}
  onClose={() => (modalOpen = false)}
/>
