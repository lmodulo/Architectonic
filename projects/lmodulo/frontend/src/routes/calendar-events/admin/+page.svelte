<script lang="ts">
  import { Plus, Search, LayoutList, Calendar } from 'lucide-svelte';
  import type { PageData } from './$types';
  import EventCalendarGrid from '$lib/components/EventCalendarGrid.svelte';
  import EventCard          from '$lib/components/EventCard.svelte';
  import EventModal         from '$lib/components/EventModal.svelte';
  import { hasPermission }  from '$lib/permissions';
  import {
    normalizeEvent, typeLabel, type CalendarEvent,
  } from '$lib/utils/calendarEvents';

  let { data }: { data: PageData } = $props();

  let events = $state<CalendarEvent[]>(data.events ?? []);
  const users = $derived((data.users ?? []) as { id: string; username: string; firstName: string; lastName: string }[]);

  let view         = $state<'calendar' | 'list'>('calendar');
  let query        = $state('');
  let filterType   = $state('');
  let filterStatus = $state('');
  let modalOpen    = $state(false);
  let editing      = $state<CalendarEvent | null>(null);

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

  function openNew() {
    editing = null;
    modalOpen = true;
  }

  function openEdit(ev: CalendarEvent) {
    editing = ev;
    modalOpen = true;
  }

  async function handleSave(body: Record<string, unknown>) {
    let res: Response;
    if (editing) {
      res = await fetch(`/api/calendar-events/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
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
</script>

<svelte:head><title>Manage Events</title></svelte:head>

<div class="space-y-6">

  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">Calendar Events</h1>
      <p class="text-sm opacity-60 mt-0.5">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
    </div>
    {#if hasPermission(data.user, 'calendar_events', 'create')}
      <button type="button" class="btn btn-primary" onclick={openNew}>
        <Plus class="size-4" /> New Event
      </button>
    {/if}
  </div>

  <!-- Filters -->
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

    <!-- View toggle -->
    <div class="join">
      <button
        type="button"
        class="join-item btn btn-sm {view === 'calendar' ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => (view = 'calendar')} aria-label="Calendar view"
      ><Calendar class="size-4" /></button>
      <button
        type="button"
        class="join-item btn btn-sm {view === 'list' ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => (view = 'list')} aria-label="List view"
      ><LayoutList class="size-4" /></button>
    </div>
  </div>

  <!-- Calendar view -->
  {#if view === 'calendar'}
    <EventCalendarGrid events={filtered} onEventClick={openEdit} />
  {/if}

  <!-- List view -->
  {#if view === 'list'}
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

<EventModal
  event={editing}
  open={modalOpen}
  user={data.user}
  {users}
  onSave={handleSave}
  onDelete={handleDelete}
  onClose={() => (modalOpen = false)}
/>
