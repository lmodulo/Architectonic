<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, X, ChevronLeft, Play } from 'lucide-svelte';
  import {
    getPrefillTaskId, getPrefillDate,
    getCachedTasks, areTasksFetched, setCachedTasks,
    closeLogTimePalette, notifyEntrySaved, notifyTimerStarted,
  } from '$lib/stores/logTimePalette.svelte';

  const today = new Date().toISOString().slice(0, 10);

  let palQuery   = $state('');
  let palTaskId  = $state(getPrefillTaskId());
  let palDate    = $state(getPrefillDate() || today);
  let palMinutes = $state(60);
  let palNote    = $state('');
  let palSaving  = $state(false);

  let highlighted = $state(-1);
  let resultEls   = $state<(HTMLButtonElement | null)[]>([]);

  $effect(() => {
    palResults;
    highlighted = -1;
  });

  $effect(() => {
    if (highlighted >= 0) resultEls[highlighted]?.scrollIntoView({ block: 'nearest' });
  });

  function onSearchKeydown(e: KeyboardEvent) {
    if (palResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlighted = (highlighted + 1) % palResults.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlighted = (highlighted - 1 + palResults.length) % palResults.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = highlighted >= 0 ? highlighted : 0;
      if (palResults[idx]) palTaskId = palResults[idx].id;
    }
  }

  const palResults = $derived.by(() => {
    const q = palQuery.trim().toLowerCase();
    const tasks = getCachedTasks();
    if (!q) return tasks.slice(0, 8);
    return tasks.filter((t: any) =>
      t.title.toLowerCase().includes(q) ||
      (t.jobTitle   ?? '').toLowerCase().includes(q) ||
      (t.sprintTitle ?? '').toLowerCase().includes(q)
    ).slice(0, 10);
  });

  const palTask = $derived(getCachedTasks().find((t: any) => t.id === palTaskId) ?? null);

  function fmtMins(m: number): string {
    if (!m) return '—';
    const h   = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  }

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
        notifyEntrySaved(await res.json());
        closeLogTimePalette();
      }
    } finally { palSaving = false; }
  }

  async function startTimer(taskId: string) {
    const res = await fetch('/api/agile/time-entries/timer/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    if (res.ok) {
      notifyTimerStarted(await res.json());
      closeLogTimePalette();
    }
  }

  onMount(async () => {
    if (!areTasksFetched()) {
      try {
        const res = await fetch('/api/agile/tasks?limit=500');
        if (res.ok) {
          const data = await res.json();
          setCachedTasks(data.tasks ?? []);
        } else {
          setCachedTasks([]);
        }
      } catch { setCachedTasks([]); }
    }
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[14vh] p-4" onclick={closeLogTimePalette}>
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
            onkeydown={onSearchKeydown}
          />
          {#if palQuery}
            <button class="opacity-40 hover:opacity-100" onclick={() => palQuery = ''}>
              <X class="size-4" />
            </button>
          {/if}
        </div>

        <div class="space-y-0.5 max-h-60 overflow-y-auto">
          {#each palResults as t, i (t.id)}
            <button
              bind:this={resultEls[i]}
              class="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors {highlighted === i ? 'bg-base-200' : 'hover:bg-base-200'}"
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
            {#if !areTasksFetched()}
              <p class="text-center py-8 text-sm opacity-40">Loading tasks…</p>
            {:else}
              <p class="text-center py-8 text-sm opacity-40">No tasks match "{palQuery}"</p>
            {/if}
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
                <button class="btn btn-xs btn-ghost font-mono" onclick={() => palMinutes = Math.max(15, palMinutes - 60)}>−1h</button>
                <button class="btn btn-xs btn-ghost font-mono" onclick={() => palMinutes = Math.max(15, palMinutes - 15)}>−15m</button>
                <span class="flex-1 text-center text-sm font-semibold tabular-nums">{fmtMins(palMinutes)}</span>
                <button class="btn btn-xs btn-ghost font-mono" onclick={() => palMinutes = palMinutes + 15}>+15m</button>
                <button class="btn btn-xs btn-ghost font-mono" onclick={() => palMinutes = palMinutes + 60}>+1h</button>
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
            <button class="btn btn-sm btn-ghost flex-1" onclick={closeLogTimePalette}>Cancel</button>
            <button
              class="btn btn-sm btn-primary flex-1"
              onclick={submitPalette}
              disabled={palSaving || palMinutes < 15}
            >{palSaving ? 'Saving…' : 'Log time'}</button>
          </div>
          <div class="border-t border-base-300 pt-2">
            <button
              class="btn btn-sm btn-success btn-outline w-full"
              onclick={async () => { await startTimer(palTaskId); }}
            ><Play class="size-3.5" />Start timer instead</button>
          </div>
        </div>
      {/if}

    </div>
  </div>
</div>
