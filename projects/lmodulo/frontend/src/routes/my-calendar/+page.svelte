<script lang="ts">
  import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import EventModal from '$lib/components/EventModal.svelte';
  import { normalizeEvent, typeLabel, type CalendarEvent } from '$lib/utils/calendarEvents';

  let { data }: { data: PageData } = $props();

  let events = $state<CalendarEvent[]>(data.events ?? []);
  const tasks  = $derived((data.tasks  ?? []) as any[]);
  const users  = $derived((data.users  ?? []) as { id: string; username: string; firstName: string; lastName: string }[]);

  let modalOpen     = $state(false);
  let editing       = $state<CalendarEvent | null>(null);
  let newEventDate  = $state('');

  const userId = (data.user as { id: string }).id;

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
      const dStr  = ds(year, month, day);
      const d     = new Date(year, month, day);
      const myEvs = events.filter(e => e.startDate <= dStr && dStr <= e.endDate && e.ownerId === userId);
      const sharedEvs = events.filter(e => e.startDate <= dStr && dStr <= e.endDate && e.ownerId !== userId);
      const dueTasks  = tasks.filter((t: any) => t.dueDate?.slice(0, 10) === dStr);
      return { day, isToday: d.toDateString() === today.toDateString(), myEvs, sharedEvs, dueTasks };
    });
  }

  const calDays = $derived(buildCal(calYear, calMonth));

  // Upcoming events section (next 90 days)
  const upcoming = $derived.by(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + 90);
    const nowStr = now.toISOString().slice(0, 10);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return events
      .filter(e => e.endDate >= nowStr && e.startDate <= cutoffStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  });

  function openNew() { editing = null; newEventDate = ''; modalOpen = true; }
  function openNewOnDate(dateStr: string) { editing = null; newEventDate = dateStr; modalOpen = true; }
  function openEdit(ev: CalendarEvent) {
    if (ev.ownerId !== userId) return; // can only edit own events
    editing = ev;
    modalOpen = true;
  }

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

  function fmtShort(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function visIcon(v: string | undefined) {
    if (v === 'public') return '🌐';
    if (v === 'shared') return '👥';
    return '🔒';
  }
</script>

<svelte:head><title>My Calendar</title></svelte:head>

<div class="space-y-6">

  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">My Calendar</h1>
      <p class="text-sm opacity-60 mt-0.5">Your meetings, shared events, and task due dates.</p>
    </div>
    {#if hasPermission(data.user, 'calendar_events', 'create')}
      <button type="button" class="btn btn-primary btn-sm" onclick={openNew}>
        <Plus class="size-4" /> New Event
      </button>
    {/if}
  </div>

  <!-- Monthly calendar grid -->
  <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">

    <div class="flex items-center justify-between px-5 py-3 border-b border-base-300">
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={prevMonth} aria-label="Previous month">
        <ChevronLeft class="size-4"/>
      </button>
      <span class="font-semibold text-sm">{calLabel}</span>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={nextMonth} aria-label="Next month">
        <ChevronRight class="size-4"/>
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
                  title="{ev.title} ({typeLabel(ev.eventType)})"
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
