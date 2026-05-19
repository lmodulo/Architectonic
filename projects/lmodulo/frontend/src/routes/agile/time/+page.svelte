<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Clock, Play, Square, Plus, Search, ChevronLeft, ChevronRight, Timer, X } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const { weekDates, user } = data;
  let weekStart   = $state(data.weekStart);
  let entries     = $state<any[]>(data.entries);
  let activeTimer = $state<{ entry: any; task: any } | null>(data.activeTimer);
  const tasks: any[]              = data.tasks;
  const taskMap: Record<string, any> = data.taskMap;

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

  // ── Palette ───────────────────────────────────────────────────
  let palOpen     = $state(false);
  let palQuery    = $state('');
  let palTaskId   = $state('');
  let palDate     = $state(today);
  let palMinutes  = $state(60);
  let palNote     = $state('');
  let palSaving   = $state(false);

  const palResults = $derived.by(() => {
    const q = palQuery.trim().toLowerCase();
    if (!q) return tasks.slice(0, 8);
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.jobTitle ?? '').toLowerCase().includes(q)
    ).slice(0, 10);
  });

  const palTask = $derived(taskMap[palTaskId]);

  function openPalette(prefillTaskId = '', prefillDate = '') {
    palOpen    = true;
    palQuery   = '';
    palTaskId  = prefillTaskId;
    palDate    = prefillDate || today;
    palMinutes = 60;
    palNote    = '';
  }

  function closePalette() { palOpen = false; palTaskId = ''; palQuery = ''; }

  async function submitPalette() {
    if (!palTaskId || palSaving) return;
    palSaving = true;
    try {
      const res = await fetch('/api/agile/time-entries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId: palTaskId, date: palDate, durationMinutes: palMinutes, note: palNote, billable: true }),
      });
      if (res.ok) {
        entries = [...entries, await res.json()];
        closePalette();
      }
    } finally { palSaving = false; }
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
        if (weekDates.includes(stopped.date)) entries = [...entries, stopped];
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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        palOpen ? closePalette() : openPalette();
      }
      if (e.key === 'Escape') { closePalette(); cellOpen = false; }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
</script>

<svelte:head><title>Time</title></svelte:head>

<div class="space-y-5">

  <!-- Timer banner -->
  {#if activeTimer}
    <div class="bg-success/15 border border-success/30 rounded-box px-4 py-3 flex items-center gap-3 flex-wrap">
      <Timer class="size-4 text-success shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold leading-tight truncate">{activeTimer.task?.title ?? 'Unknown task'}</p>
        {#if activeTimer.task?.jobTitle}
          <p class="text-[11px] opacity-50 truncate">{activeTimer.task.jobTitle}</p>
        {/if}
      </div>
      <span class="font-mono text-lg font-bold tabular-nums text-success">{fmtElapsed(elapsedSeconds)}</span>
      <button class="btn btn-sm btn-error" onclick={stopTimer} disabled={timerStopping}>
        <Square class="size-3.5" />Stop
      </button>
      <button class="btn btn-sm btn-ghost" onclick={() => openPalette()}>Switch task</button>
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
        <ChevronLeft class="size-4" />
      </button>
      <span class="text-sm font-medium px-2 whitespace-nowrap">{weekLabel}</span>
      <button class="btn btn-sm btn-ghost btn-circle" onclick={() => shiftWeek(1)}>
        <ChevronRight class="size-4" />
      </button>
    </div>
    <button class="btn btn-sm btn-primary" onclick={() => openPalette()}>
      <Plus class="size-4" />Log time
      <kbd class="kbd kbd-xs opacity-60">⌘K</kbd>
    </button>
  </div>

  <!-- Week grid -->
  {#if rowTaskIds.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-14 text-center">
      <Clock class="size-8 mx-auto mb-3 opacity-30" />
      <p class="text-sm opacity-50">No entries this week and no assigned tasks.</p>
      <p class="text-xs opacity-40 mt-1">Press <kbd class="kbd kbd-xs">⌘K</kbd> to log time on any task.</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-box border border-base-300">
      <table class="table table-sm w-full min-w-[820px]">
        <thead>
          <tr class="bg-base-200 text-xs">
            <th class="min-w-[200px] font-medium">Task</th>
            {#each weekDates as d, i}
              <th class="text-right min-w-[70px] font-medium
                {d === today ? 'text-primary' : ''}">
                {DAY_LABELS[i]}&nbsp;{new Date(d + 'T00:00:00Z').getUTCDate()}
              </th>
            {/each}
            <th class="text-right min-w-[70px] font-medium opacity-50">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each rowTaskIds as taskId (taskId)}
            {@const task     = taskMap[taskId]}
            {@const rowTotal = rowTotalMins(taskId)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-base-300/40 transition-colors">
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
            <X class="size-3.5" />
          </button>
        </div>

        <!-- Existing entries -->
        {#if cellCurrentEntries.length > 0}
          <div class="space-y-1">
            {#each cellCurrentEntries as e (e.id)}
              <div class="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2">
                <Clock class="size-3.5 opacity-40 shrink-0" />
                <span class="text-sm font-medium">{fmtMins(e.durationMinutes)}</span>
                {#if e.note}
                  <span class="text-xs opacity-50 flex-1 truncate">{e.note}</span>
                {:else}
                  <span class="flex-1"></span>
                {/if}
                <button
                  class="btn btn-xs btn-ghost opacity-30 hover:opacity-100 hover:btn-error"
                  onclick={() => deleteCellEntry(e.id)}
                ><X class="size-3" /></button>
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
            <input
              type="number"
              class="input input-sm input-bordered w-20"
              bind:value={cellAddMin}
              min="15"
              step="15"
            />
            <span class="text-xs opacity-40">min&nbsp;·&nbsp;{fmtMins(cellAddMin)}</span>
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
              ><Play class="size-3.5" />Timer</button>
            {/if}
          </div>
        </div>

      </div>
    </div>
  </div>
{/if}

<!-- Palette modal -->
{#if palOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[14vh] p-4" onclick={closePalette}>
    <div class="card bg-base-100 shadow-xl rounded-box w-full max-w-lg" onclick={e => e.stopPropagation()}>
      <div class="p-4 space-y-3">

        {#if !palTaskId}
          <!-- Step 1: search -->
          <div class="flex items-center gap-2 border border-base-300 rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
            <Search class="size-4 opacity-40 shrink-0" />
            <!-- svelte-ignore a11y-autofocus -->
            <input
              autofocus
              type="text"
              class="flex-1 bg-transparent text-sm outline-none"
              placeholder="Search tasks…"
              bind:value={palQuery}
            />
            {#if palQuery}
              <button class="opacity-40 hover:opacity-100" onclick={() => palQuery = ''}>
                <X class="size-4" />
              </button>
            {/if}
          </div>

          <div class="space-y-0.5 max-h-60 overflow-y-auto">
            {#each palResults as t (t.id)}
              <button
                class="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors"
                onclick={() => palTaskId = t.id}
              >
                <span class="size-2 rounded-full mt-1.5 shrink-0
                  {t.priority === 'Critical' ? 'bg-error' :
                   t.priority === 'High'     ? 'bg-warning' :
                   t.priority === 'Medium'   ? 'bg-primary' : 'bg-base-content/30'}
                "></span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm leading-tight">{t.title}</p>
                  {#if t.jobTitle || t.sprintTitle}
                    <p class="text-[11px] opacity-40 mt-0.5">
                      {t.sprintTitle ?? ''}{t.sprintTitle && t.jobTitle ? ' › ' : ''}{t.jobTitle ?? ''}
                    </p>
                  {/if}
                </div>
                {#if t.estimateHours}
                  <span class="text-[11px] opacity-30 shrink-0 mt-0.5">{t.estimateHours}h est.</span>
                {/if}
              </button>
            {:else}
              <p class="text-center py-8 text-sm opacity-40">No tasks match "{palQuery}"</p>
            {/each}
          </div>

        {:else}
          <!-- Step 2: form -->
          <div class="flex items-center gap-2">
            <button class="btn btn-xs btn-ghost opacity-50" onclick={() => palTaskId = ''}>
              <ChevronLeft class="size-3.5" />
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold leading-tight">{palTask?.title ?? ''}</p>
              {#if palTask?.jobTitle || palTask?.sprintTitle}
                <p class="text-[11px] opacity-40">
                  {palTask?.sprintTitle ?? ''}{palTask?.sprintTitle && palTask?.jobTitle ? ' › ' : ''}{palTask?.jobTitle ?? ''}
                </p>
              {/if}
            </div>
          </div>

          <div class="space-y-3 pt-1">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs opacity-50">Date</label>
                <input type="date" class="input input-sm input-bordered w-full" bind:value={palDate} />
              </div>
              <div class="space-y-1">
                <label class="text-xs opacity-50">Duration</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    class="input input-sm input-bordered w-20"
                    bind:value={palMinutes}
                    min="15"
                    step="15"
                  />
                  <span class="text-xs opacity-40">min&nbsp;·&nbsp;{fmtMins(palMinutes)}</span>
                </div>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs opacity-50">Note <span class="opacity-60">(optional)</span></label>
              <input
                type="text"
                class="input input-sm input-bordered w-full"
                placeholder="What did you work on?"
                bind:value={palNote}
              />
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-ghost flex-1" onclick={closePalette}>Cancel</button>
              <button
                class="btn btn-sm btn-primary flex-1"
                onclick={submitPalette}
                disabled={palSaving || palMinutes < 15}
              >{palSaving ? 'Saving…' : 'Log time'}</button>
            </div>
            <div class="border-t border-base-300 pt-2">
              <button
                class="btn btn-sm btn-success btn-outline w-full"
                onclick={async () => { await startTimer(palTaskId); closePalette(); }}
              ><Play class="size-3.5" />Start timer instead</button>
            </div>
          </div>
        {/if}

      </div>
    </div>
  </div>
{/if}
