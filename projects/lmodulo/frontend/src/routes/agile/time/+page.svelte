<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types';
  import { openLogTimePalette, getLastSavedEntry, getLastTimerStarted, getCachedTasks } from '$lib/stores/logTimePalette.svelte';

  let { data }: { data: PageData } = $props();

  const user      = data.user;
  const weekStart = $derived(data.weekStart);
  const weekDates = $derived(data.weekDates);
  let entries     = $state<any[]>(data.entries);
  let activeTimer = $state<{ entry: any; task: any } | null>(data.activeTimer);
  const tasks: any[] = data.tasks;
  let taskMap = $state<Record<string, any>>(data.taskMap);

  // Reset mutable state when navigating to a different week
  $effect(() => {
    weekStart; // reactive dependency — fires on navigation
    entries     = data.entries;
    activeTimer = data.activeTimer;
    taskMap     = { ...data.taskMap };
  });

  // ── Timer banner ──────────────────────────────────────────────
  let elapsedSeconds = $state(0);

  $effect(() => {
    if (!activeTimer?.entry?.timerStartedAt) { elapsedSeconds = 0; return; }
    const start = new Date(activeTimer.entry.timerStartedAt).getTime();
    elapsedSeconds = Math.floor((Date.now() - start) / 1000);
    const id = setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - start) / 1000);
    }, 1000);
    return () => clearInterval(id);
  });

  function fmtElapsed(s: number): string {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // ── Week navigation ───────────────────────────────────────────
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function shiftWeek(delta: number) {
    const d = new Date(weekStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta * 7);
    goto(`?week=${d.toISOString().slice(0, 10)}`);
  }

  const weekLabel = $derived.by(() => {
    const s = new Date(weekDates[0] + 'T00:00:00Z');
    const e = new Date(weekDates[6] + 'T00:00:00Z');
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${fmt(s)} – ${fmt(e)}, ${s.getUTCFullYear()}`;
  });

  const today = new Date().toISOString().slice(0, 10);

  // ── Grid helpers ──────────────────────────────────────────────
  function fmtMins(m: number): string {
    if (!m) return '—';
    const h   = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  }

  function cellEntries(taskId: string, date: string): any[] {
    return entries.filter(e => e.taskId === taskId && e.date === date && !e.timerRunning);
  }

  function cellMinutes(taskId: string, date: string): number {
    return cellEntries(taskId, date).reduce((s, e) => s + e.durationMinutes, 0);
  }

  function rowTotalMins(taskId: string): number {
    return weekDates.reduce((s, d) => s + cellMinutes(taskId, d), 0);
  }

  function dayTotalMins(date: string): number {
    return rowTaskIds.reduce((s, tid) => s + cellMinutes(tid, date), 0);
  }

  const weekTotalMins = $derived(weekDates.reduce((s, d) => s + dayTotalMins(d), 0));

  const rowTaskIds = $derived.by(() => {
    const fromEntries = entries.filter(e => !e.timerRunning).map(e => e.taskId);
    const fromTasks   = tasks.map(t => t.id);
    return [...new Set([...fromTasks, ...fromEntries])];
  });

  let timeSortField = $state<'title' | 'total'>('title');
  let timeSortDir   = $state<'asc' | 'desc'>('asc');

  function toggleTimeSort(field: 'title' | 'total') {
    if (timeSortField === field) timeSortDir = timeSortDir === 'asc' ? 'desc' : 'asc';
    else { timeSortField = field; timeSortDir = 'asc'; }
  }

  const sortedRowTaskIds = $derived.by(() => {
    return [...rowTaskIds].sort((a, b) => {
      let av: any, bv: any;
      if (timeSortField === 'title') {
        av = taskMap[a]?.title ?? '';
        bv = taskMap[b]?.title ?? '';
      } else {
        av = rowTotalMins(a);
        bv = rowTotalMins(b);
      }
      if (av < bv) return timeSortDir === 'asc' ? -1 : 1;
      if (av > bv) return timeSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // ── Cell dialog ───────────────────────────────────────────────
  let cellOpen    = $state(false);
  let cellTaskId  = $state('');
  let cellDate    = $state('');
  let cellAddMin  = $state(60);
  let cellAddNote = $state('');
  let cellSaving  = $state(false);

  const cellTask           = $derived(taskMap[cellTaskId]);
  const cellCurrentEntries = $derived.by(() => cellTaskId ? cellEntries(cellTaskId, cellDate) : []);

  function openCell(taskId: string, date: string) {
    cellTaskId  = taskId;
    cellDate    = date;
    cellAddMin  = 60;
    cellAddNote = '';
    cellOpen    = true;
  }

  async function addCellEntry() {
    if (!cellTaskId || cellSaving) return;
    cellSaving = true;
    try {
      const res = await fetch('/api/agile/time-entries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId: cellTaskId, date: cellDate, durationMinutes: cellAddMin, note: cellAddNote, billable: true }),
      });
      if (res.ok) {
        entries     = [...entries, await res.json()];
        cellAddMin  = 60;
        cellAddNote = '';
      }
    } finally { cellSaving = false; }
  }

  async function deleteCellEntry(id: string) {
    const res = await fetch(`/api/agile/time-entries/${id}`, { method: 'DELETE' });
    if (res.ok) entries = entries.filter(e => e.id !== id);
  }

  // ── Timer controls ────────────────────────────────────────────
  let timerStopping = $state(false);

  async function stopTimer() {
    if (timerStopping) return;
    timerStopping = true;
    try {
      const res = await fetch('/api/agile/time-entries/timer/stop', { method: 'POST' });
      if (res.ok) {
        const stopped = await res.json();
        if (weekDates.includes(stopped.date)) {
          entries = [...entries, stopped];
          if (stopped.taskId && !taskMap[stopped.taskId]) {
            const t = getCachedTasks().find((t: any) => t.id === stopped.taskId);
            if (t) taskMap = { ...taskMap, [stopped.taskId]: t };
          }
        }
        activeTimer = null;
      }
    } finally { timerStopping = false; }
  }

  async function startTimer(taskId: string) {
    const res = await fetch('/api/agile/time-entries/timer/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    if (res.ok) {
      const entry = await res.json();
      activeTimer = { entry, task: taskMap[entry.taskId] ?? null };
    }
  }

  // ── Keyboard shortcut ─────────────────────────────────────────
  onMount(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { cellOpen = false; }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // ── Sync global palette saves/timer to local grid state ───────
  $effect(() => {
    const saved = getLastSavedEntry();
    if (saved && weekDates.includes(saved.date) && !entries.find((e: any) => e.id === saved.id)) {
      entries = [...entries, saved];
      if (saved.taskId && !taskMap[saved.taskId]) {
        const t = getCachedTasks().find((t: any) => t.id === saved.taskId);
        if (t) taskMap = { ...taskMap, [saved.taskId]: t };
      }
    }
  });

  $effect(() => {
    const timerEntry = getLastTimerStarted();
    if (timerEntry) {
      let task = taskMap[timerEntry.taskId] ?? null;
      if (!task) {
        task = getCachedTasks().find((t: any) => t.id === timerEntry.taskId) ?? null;
        if (task) taskMap = { ...taskMap, [timerEntry.taskId]: task };
      }
      activeTimer = { entry: timerEntry, task };
    }
  });
</script>

<svelte:head><title>Time</title></svelte:head>

<div class="space-y-5">

  <!-- Timer banner -->
  {#if activeTimer}
    <div class="bg-success/15 border border-success/30 rounded-box px-4 py-3 flex items-center gap-3 flex-wrap">
      <Icon name="Timer" size={16} class="size-4 text-success shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold leading-tight truncate">{activeTimer.task?.title ?? 'Unknown task'}</p>
        {#if activeTimer.task?.jobTitle}
          <p class="text-[11px] opacity-50 truncate">{activeTimer.task.jobTitle}</p>
        {/if}
      </div>
      <span class="font-mono text-lg font-bold tabular-nums text-success">{fmtElapsed(elapsedSeconds)}</span>
      <button class="btn btn-sm btn-error" onclick={stopTimer} disabled={timerStopping}>
        <Icon name="Square" size={14} class="size-3.5" />Stop
      </button>
      <button class="btn btn-sm btn-ghost" onclick={() => openLogTimePalette()}>Switch task</button>
    </div>
  {/if}

  <!-- Page header -->
  <div class="flex items-center gap-3 flex-wrap">
    <div>
      <h1 class="text-xl font-bold leading-none">Time</h1>
      <p class="text-xs opacity-50 mt-0.5">Log and review your weekly hours</p>
    </div>
    <div class="flex items-center gap-1 ml-auto">
      <button class="btn btn-sm btn-ghost btn-circle" onclick={() => shiftWeek(-1)}>
        <Icon name="ChevronLeft" size={16} class="size-4" />
      </button>
      <span class="text-sm font-medium px-2 whitespace-nowrap">{weekLabel}</span>
      <button class="btn btn-sm btn-ghost btn-circle" onclick={() => shiftWeek(1)}>
        <Icon name="ChevronRight" size={16} class="size-4" />
      </button>
    </div>
    <button class="btn btn-sm btn-primary" onclick={() => openLogTimePalette()}>
      <Icon name="Plus" size={16} class="size-4" />Log time
      <kbd class="kbd kbd-xs opacity-60">⌘K</kbd>
    </button>
  </div>

  <!-- Week grid -->
  {#if rowTaskIds.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-14 text-center">
      <Icon name="Clock" size={24} class="size-8 mx-auto mb-3 opacity-30" />
      <p class="text-sm opacity-50">No entries this week and no assigned tasks.</p>
      <p class="text-xs opacity-40 mt-1">Press <kbd class="kbd kbd-xs">⌘K</kbd> to log time on any task.</p>
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <div class="overflow-x-auto">
      <table class="table table-sm w-full min-w-[820px]">
        <thead>
          <tr class="bg-base-300/30">
            <th class="min-w-[200px] font-medium">
              <button type="button" class="flex items-center gap-1 hover:opacity-80 transition-opacity" onclick={() => toggleTimeSort('title')}>
                Task
                {#if timeSortField === 'title'}
                  {#if timeSortDir === 'asc'}<Icon name="ChevronUp" size={12} class="size-3 opacity-70" />{:else}<Icon name="ChevronDown" size={12} class="size-3 opacity-70" />{/if}
                {:else}
                  <Icon name="ChevronsUpDown" size={12} class="size-3 opacity-30" />
                {/if}
              </button>
            </th>
            {#each weekDates as d, i}
              <th class="text-right min-w-[70px] font-medium
                {d === today ? 'text-primary' : ''}">
                {DAY_LABELS[i]}&nbsp;{new Date(d + 'T00:00:00Z').getUTCDate()}
              </th>
            {/each}
            <th class="text-right min-w-[70px] font-medium opacity-50">
              <button type="button" class="flex items-center gap-1 hover:opacity-80 transition-opacity ml-auto" onclick={() => toggleTimeSort('total')}>
                Total
                {#if timeSortField === 'total'}
                  {#if timeSortDir === 'asc'}<Icon name="ChevronUp" size={12} class="size-3 opacity-70" />{:else}<Icon name="ChevronDown" size={12} class="size-3 opacity-70" />{/if}
                {:else}
                  <Icon name="ChevronsUpDown" size={12} class="size-3 opacity-30" />
                {/if}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each sortedRowTaskIds as taskId (taskId)}
            {@const task     = taskMap[taskId]}
            {@const rowTotal = rowTotalMins(taskId)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td class="py-2.5 pr-3">
                <p class="text-sm font-medium leading-tight line-clamp-1">{task?.title ?? 'Unknown task'}</p>
                {#if task?.jobTitle || task?.sprintTitle}
                  <p class="text-[11px] opacity-40 mt-0.5 line-clamp-1">
                    {task?.sprintTitle ?? ''}{task?.sprintTitle && task?.jobTitle ? ' › ' : ''}{task?.jobTitle ?? ''}
                  </p>
                {/if}
              </td>
              {#each weekDates as d}
                {@const mins = cellMinutes(taskId, d)}
                <td class="text-right py-1 px-1">
                  <button
                    class="w-full text-right rounded-md px-2 py-1.5 text-xs transition-colors
                      {mins > 0
                        ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/20'
                        : 'text-base-content/20 hover:bg-base-300/60 hover:text-base-content'}"
                    onclick={() => openCell(taskId, d)}
                  >{mins > 0 ? fmtMins(mins) : '+'}</button>
                </td>
              {/each}
              <td class="text-right text-xs pr-3 {rowTotal > 0 ? 'opacity-60' : 'opacity-20'}">
                {fmtMins(rowTotal)}
              </td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="bg-base-200 font-semibold text-xs">
            <td class="opacity-40 uppercase tracking-wide py-2.5">Total</td>
            {#each weekDates as d}
              {@const dt = dayTotalMins(d)}
              <td class="text-right py-2.5 {d === today ? 'text-primary' : dt > 0 ? '' : 'opacity-30'}">
                {fmtMins(dt)}
              </td>
            {/each}
            <td class="text-right pr-3 py-2.5 {weekTotalMins > 0 ? 'text-primary' : 'opacity-30'}">
              {fmtMins(weekTotalMins)}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  {/if}

</div>

<!-- Cell dialog -->
{#if cellOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onclick={() => cellOpen = false}>
    <div class="card bg-base-100 shadow-xl rounded-box w-full max-w-sm" onclick={e => e.stopPropagation()}>
      <div class="p-4 space-y-4">

        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-sm leading-tight">{cellTask?.title ?? 'Unknown task'}</p>
            <p class="text-xs opacity-50">
              {new Date(cellDate + 'T00:00:00Z').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
              })}
            </p>
          </div>
          <button class="btn btn-xs btn-ghost btn-circle shrink-0" onclick={() => cellOpen = false}>
            <Icon name="X" size={14} class="size-3.5" />
          </button>
        </div>

        <!-- Existing entries -->
        {#if cellCurrentEntries.length > 0}
          <div class="space-y-1">
            {#each cellCurrentEntries as e (e.id)}
              <div class="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2">
                <Icon name="Clock" size={14} class="size-3.5 opacity-40 shrink-0" />
                <span class="text-sm font-medium">{fmtMins(e.durationMinutes)}</span>
                {#if e.note}
                  <span class="text-xs opacity-50 flex-1 truncate">{e.note}</span>
                {:else}
                  <span class="flex-1"></span>
                {/if}
                <button
                  class="btn btn-xs btn-ghost opacity-30 hover:opacity-100 hover:btn-error"
                  onclick={() => deleteCellEntry(e.id)}
                ><Icon name="X" size={12} class="size-3" /></button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Add entry form -->
        <div class="space-y-2.5 {cellCurrentEntries.length > 0 ? 'border-t border-base-300 pt-3' : ''}">
          {#if cellCurrentEntries.length > 0}
            <p class="text-xs font-medium opacity-40 uppercase tracking-wide">Add entry</p>
          {/if}
          <div class="flex items-center gap-2">
            <span class="text-xs opacity-50 w-16 shrink-0">Duration</span>
            <div class="flex items-center gap-1 flex-1">
              <button class="btn btn-xs btn-ghost font-mono" onclick={() => cellAddMin = Math.max(15, cellAddMin - 60)}>−1h</button>
              <button class="btn btn-xs btn-ghost font-mono" onclick={() => cellAddMin = Math.max(15, cellAddMin - 15)}>−15m</button>
              <span class="flex-1 text-center text-sm font-semibold tabular-nums">{fmtMins(cellAddMin)}</span>
              <button class="btn btn-xs btn-ghost font-mono" onclick={() => cellAddMin = cellAddMin + 15}>+15m</button>
              <button class="btn btn-xs btn-ghost font-mono" onclick={() => cellAddMin = cellAddMin + 60}>+1h</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs opacity-50 w-16 shrink-0">Note</span>
            <input
              type="text"
              class="input input-sm input-bordered flex-1"
              placeholder="optional"
              bind:value={cellAddNote}
            />
          </div>
          <div class="flex gap-2 pt-1">
            <button
              class="btn btn-sm btn-primary flex-1"
              onclick={addCellEntry}
              disabled={cellSaving || cellAddMin < 15}
            >{cellSaving ? 'Saving…' : 'Log time'}</button>
            {#if !activeTimer || activeTimer.entry?.taskId !== cellTaskId}
              <button
                class="btn btn-sm btn-success btn-outline"
                onclick={async () => { await startTimer(cellTaskId); cellOpen = false; }}
              ><Icon name="Play" size={14} class="size-3.5" />Timer</button>
            {/if}
          </div>
        </div>

      </div>
    </div>
  </div>
{/if}

