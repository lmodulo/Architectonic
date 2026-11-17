<script lang="ts">
  import { onMount } from 'svelte';
  import { m } from '$lib/paraglide/messages.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { HouseIcon } from 'lucide-svelte';
  import { Search, ChevronLeft, ChevronRight, Plus, X, Eye, EyeOff, GripVertical, LayoutDashboard, Check, RotateCcw } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { PageData } from './$types';
  import { dashboardWidgets } from '$lib/config/dashboard-widgets';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';

  let { data }: { data: PageData } = $props();

  // ── Layout types & defaults ────────────────────────────────────────
  interface ItemConfig    { id: string; visible: boolean; }
  interface SectionConfig { id: string; visible: boolean; items?: ItemConfig[]; }
  interface DashboardLayout { sections: SectionConfig[]; }

  const SECTION_LABELS = $derived<Record<string, string>>({
    calendar:      m.dashboard_section_calendar(),
    widgets:       m.dashboard_section_widgets(),
  });

  // Per-item labels for sections that have toggleable items (none in the scaffold; modules add widgets instead)
  const ITEM_LABELS: Record<string, Record<string, string>> = {};

  function defaultLayout(): DashboardLayout {
    return {
      sections: [
        { id: 'calendar',    visible: true },
        { id: 'widgets',     visible: true },
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

  // ── Calendar ───────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month+1, 0).getDate();
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
  function prevMonth() { calMonth === 0 ? (calMonth=11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth=0, calYear++) : calMonth++; }


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

  $effect(() => { if (eventForm.singleDay) eventForm.endDate = eventForm.startDate; });

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
    if (!eventForm.title.trim()) { eventError = m.errors_title_required(); return; }
    if (!eventForm.startDate)    { eventError = m.errors_start_date_required(); return; }
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
        res = await fetch(`/api/events/${editingEventId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        eventError = (d as { message?: string }).message ?? m.errors_save_failed();
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
      eventError = m.errors_network_error();
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
        eventError = (d as { message?: string }).message ?? m.errors_delete_failed();
        return;
      }
      events = events.filter(e => e.id !== editingEventId);
      eventDeleteConfirm = false;
      eventModalOpen     = false;
    } catch {
      eventError = m.errors_network_error();
    } finally {
      eventLoading = false;
    }
  }

  function fmtEventDate(ev: CalEvent): string {
    const start = new Date(ev.startDate + 'T00:00:00');
    if (ev.singleDay) return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(ev.endDate + 'T00:00:00');
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  // ── Dashboard widgets ──────────────────────────────────────────────
  const sortedWidgets = $derived([...dashboardWidgets].sort((a, b) => a.order - b.order));

  // ── Edit Mode & Layout ────────────────────────────────────────────
  let editMode        = $state(false);
  let layout          = $state<DashboardLayout>(defaultLayout());
  let saveStatus      = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let draggingSection = $state<string | null>(null);
  let dragOverSection = $state<string | null>(null);
  let draggingItem    = $state<{ sectionId: string; itemId: string } | null>(null);
  let dragOverItem    = $state<{ sectionId: string; itemId: string } | null>(null);
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

  function scheduleLayoutSave() {
    clearTimeout(saveTimer);
    saveStatus = 'saving';
    saveTimer = setTimeout(saveLayout, 700);
  }

  async function saveLayout() {
    const jsonStr = JSON.stringify(layout);
    try {
      localStorage.setItem('dashboard_layout', jsonStr);
    } catch { /* ignore */ }
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

  // Section DnD — drag starts from the grip handle, drops on any section wrapper
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

  // Item DnD — drag starts from each card (stop propagation to avoid triggering section drag)
  function onItemDragStart(e: DragEvent, sectionId: string, itemId: string) {
    e.stopPropagation();
    e.dataTransfer?.setData('text/plain', itemId);
    draggingItem = { sectionId, itemId };
  }
  function onItemDragOver(e: DragEvent, sectionId: string, itemId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (draggingItem?.sectionId === sectionId && draggingItem.itemId !== itemId) {
      dragOverItem = { sectionId, itemId };
    }
  }
  function onItemDrop(e: DragEvent, sectionId: string, targetItemId: string) {
    e.stopPropagation();
    if (!draggingItem || draggingItem.sectionId !== sectionId || draggingItem.itemId === targetItemId) {
      draggingItem = null; dragOverItem = null; return;
    }
    layout = {
      ...layout,
      sections: layout.sections.map(s =>
        s.id === sectionId && s.items
          ? { ...s, items: reorder(s.items, draggingItem!.itemId, targetItemId, i => i.id) }
          : s
      )
    };
    draggingItem = null;
    dragOverItem = null;
    scheduleLayoutSave();
  }
  function onItemDragEnd(e: DragEvent) {
    e.stopPropagation();
    draggingItem = null;
    dragOverItem = null;
  }

  // Load preferences on mount (server preferences first, then localStorage fallback)
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

<svelte:head><title>{m.dashboard_title()}</title></svelte:head>

<div class="space-y-6">

  <!-- Header with Edit Layout toggle -->
  <PageHeader icon={HouseIcon} title={m.dashboard_title()}>
    {m.dashboard_welcome({ firstName: data.user?.firstName ?? data.user?.username ?? '' })}
    {#snippet actions()}
      <button
        type="button"
        class="btn btn-sm shrink-0 {editMode ? 'btn-success' : 'btn-ghost border border-base-300'}"
        onclick={() => { editMode = !editMode; }}
      >
        {#if editMode}
          <Check class="size-4" /> {m.dashboard_done()}
        {:else}
          <LayoutDashboard class="size-4" /> {m.dashboard_edit_layout()}
        {/if}
      </button>
    {/snippet}
  </PageHeader>

  <!-- Edit mode banner -->
  {#if editMode}
    <div
      transition:fade={{ duration: 150 }}
      class="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-sm"
    >
      <span class="flex-1 opacity-65 text-xs">{m.dashboard_edit_hint()}</span>
      <span class="text-xs {saveStatus === 'saved' ? 'text-success' : saveStatus === 'error' ? 'text-error' : 'opacity-40'}">
        {#if saveStatus === 'saving'}{m.common_saving()}{:else if saveStatus === 'saved'}{m.dashboard_saved()}{:else if saveStatus === 'error'}{m.errors_save_failed()}{/if}
      </span>
      <button type="button" class="btn btn-ghost btn-xs gap-1 opacity-60 hover:opacity-100" onclick={resetLayout}>
        <RotateCcw class="size-3" /> {m.common_reset()}
      </button>
    </div>
  {/if}

  <!-- ── Sections (rendered in layout order) ─────────────────────── -->
  {#each layout.sections as section (section.id)}
    {#if section.visible || editMode}

      <!-- Section drop zone + optional edit chrome -->
      <div
        class="relative transition-all duration-150
          {editMode ? 'rounded-xl ring-1 ring-base-300/60 p-2' : 'space-y-0'}
          {editMode && dragOverSection === section.id && draggingSection !== section.id ? 'ring-2 ring-primary/60 bg-primary/3' : ''}
          {editMode && draggingSection === section.id ? 'opacity-40 ring-dashed ring-base-content/30' : ''}"
        ondragover={editMode ? (e: DragEvent) => onSectionDragOver(e, section.id) : undefined}
        ondrop={editMode ? () => onSectionDrop(section.id) : undefined}
      >

        <!-- Edit mode: section handle bar -->
        {#if editMode}
          <div
            class="flex items-center gap-2 px-1 py-1.5 mb-2 rounded-lg cursor-grab active:cursor-grabbing select-none hover:bg-base-200/60 transition-colors"
            draggable="true"
            ondragstart={(e: DragEvent) => onSectionDragStart(e, section.id)}
            ondragend={onSectionDragEnd}
          >
            <GripVertical class="size-4 text-base-content/35 shrink-0" />
            <span class="text-xs font-semibold uppercase tracking-wider text-base-content/45 flex-1">
              {SECTION_LABELS[section.id] ?? section.id}
            </span>
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

          <!-- ── Calendar ────────────────────────────────────────── -->
          {#if section.id === 'calendar'}
            <div class="space-y-3">
              <h2 class="text-lg font-semibold">{m.dashboard_section_calendar()}</h2>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <label class="input input-bordered flex items-center gap-2">
                    <Search class="size-4 opacity-50 shrink-0" />
                    <input
                      type="search" class="grow" placeholder={m.dashboard_calendar_search()} autocomplete="off"
                      bind:value={eventQuery}
                      onfocus={() => (eventSearchOpen = true)}
                      onblur={() => setTimeout(() => (eventSearchOpen = false), 150)}
                    />
                  </label>
                  {#if eventSearchOpen && eventMatches.length > 0}
                    <div class="absolute top-full left-0 right-0 z-30 mt-1 card bg-base-100 border border-base-200 shadow-xl overflow-hidden">
                      {#each eventMatches as ev}
                        <button
                          type="button"
                          class="w-full text-left px-4 py-2.5 text-sm hover:bg-base-200 transition-colors border-b border-base-200 last:border-0"
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
                    <Plus class="size-4" /> {m.dashboard_new_event()}
                  </button>
                {/if}
              </div>
              <div class="card bg-base-100 border border-base-200 overflow-hidden">
                <div class="flex items-center justify-between px-5 py-3 border-b border-base-200">
                  <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={prevMonth} aria-label={m.dashboard_prev_month()}>
                    <ChevronLeft class="size-4"/>
                  </button>
                  <span class="font-semibold text-sm">{calLabel}</span>
                  <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={nextMonth} aria-label={m.dashboard_next_month()}>
                    <ChevronRight class="size-4"/>
                  </button>
                </div>
                <div class="grid grid-cols-7 border-b border-base-200">
                  {#each [m.dashboard_day_sun(), m.dashboard_day_mon(), m.dashboard_day_tue(), m.dashboard_day_wed(), m.dashboard_day_thu(), m.dashboard_day_fri(), m.dashboard_day_sat()] as dow}
                    <div class="px-2 py-2 text-center text-xs font-semibold opacity-50 uppercase tracking-wide">{dow}</div>
                  {/each}
                </div>
                <div class="grid grid-cols-7">
                  {#each calDays as cell, i}
                    {@const borderR = (i+1) % 7 !== 0 ? 'border-r' : ''}
                    {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
                    <div class="min-h-[5.5rem] p-2 border-base-200 {borderR} {borderB} relative {cell?.isToday ? 'bg-primary/5' : ''}">
                      {#if cell}
                        <span class="text-xs font-semibold {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-content' : 'opacity-70'}">
                          {cell.day}
                        </span>
                        {#each eventsForDay(calYear, calMonth, cell.day) as ev}
                          <button
                            type="button"
                            class="mt-1 w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-accent text-accent-content hover:opacity-90 transition-opacity"
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

          <!-- ── Module Widgets ──────────────────────────────────── -->
          {:else if section.id === 'widgets'}
            {#if sortedWidgets.length > 0}
              <!-- Grid: compact widgets take one cell; a widget whose root has col-span-full spans the row -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each sortedWidgets as w}
                  {#if hasPermission(data.user, w.permission.resource, w.permission.action)}
                    <w.component />
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="card bg-base-100 border border-base-200 border-dashed px-6 py-8 text-center opacity-60 text-sm">
                {m.dashboard_no_widgets()}
              </div>
            {/if}
          {/if}

        </div><!-- end section content -->
      </div><!-- end section wrapper -->
    {/if}
  {/each}

</div>

<!-- ── Event Modal ───────────────────────────────────────────────── -->
{#if eventModalOpen}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label={editingEventId ? m.dashboard_event_edit_title() : m.dashboard_new_event()}
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card bg-base-100 border border-base-200 w-full max-w-2xl shadow-xl mx-4 flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200 shrink-0">
        <h2 class="text-lg font-semibold">{editingEventId ? m.dashboard_event_edit_title() : m.dashboard_new_event()}</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (eventModalOpen = false)} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if eventError}
          <div role="alert" class="alert alert-error text-sm">{eventError}</div>
        {/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-title">{m.dashboard_event_field_title()}</label>
          <input id="ev-title" type="text" class="input input-bordered w-full" placeholder={m.dashboard_event_title_placeholder()} bind:value={eventForm.title} maxlength="200" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-start">{m.dashboard_event_field_start()}</label>
            <input id="ev-start" type="date" class="input input-bordered w-full" bind:value={eventForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-end">{m.dashboard_event_field_end()}</label>
            <input id="ev-end" type="date" class="input input-bordered w-full" bind:value={eventForm.endDate}
              disabled={eventForm.singleDay} min={eventForm.startDate} />
          </div>
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" class="checkbox" bind:checked={eventForm.singleDay} />
          <span class="text-sm">{m.dashboard_event_single_day()}</span>
        </label>
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.dashboard_event_field_desc()}</p>
          <MessageEditor bind:html={eventForm.content} placeholder={m.dashboard_event_desc_placeholder()} />
        </div>
      </div>
      <footer class="flex items-center justify-between px-6 pb-5 pt-3 border-t border-base-200 shrink-0">
        <div>
          {#if editingEventId && hasPermission(data.user, 'events', 'delete')}
            <button type="button" class="btn btn-outline btn-error" disabled={eventLoading} onclick={() => (eventDeleteConfirm = true)}>
              {m.dashboard_event_delete_btn()}
            </button>
          {/if}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-ghost" onclick={() => (eventModalOpen = false)}>{m.common_cancel()}</button>
          <button type="button" class="btn btn-primary" disabled={eventLoading} onclick={saveEvent}>
            {eventLoading ? m.common_saving() : m.common_save()}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<!-- ── Delete Confirm Modal ──────────────────────────────────────── -->
{#if eventDeleteConfirm}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="Confirm delete"
  >
    <div
      transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
      class="card bg-base-100 border border-base-200 w-full max-w-sm shadow-xl mx-4"
    >
      <div class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">{m.dashboard_event_confirm_delete()}</h2>
        <p class="text-sm opacity-70">{m.dashboard_event_confirm_delete_body({ title: eventForm.title })}</p>
        {#if eventError}
          <div role="alert" class="alert alert-error text-sm">{eventError}</div>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (eventDeleteConfirm = false)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-error" disabled={eventLoading} onclick={confirmDeleteEvent}>
          {eventLoading ? m.common_deleting() : m.common_delete()}
        </button>
      </footer>
    </div>
  </div>
{/if}
