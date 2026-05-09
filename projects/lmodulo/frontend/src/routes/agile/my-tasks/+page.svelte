<script lang="ts">
  import { goto } from '$app/navigation';
  import { AlertTriangle, Clock } from 'lucide-svelte';
  import { STATUS_COLOR, fmtDate, fmtEffort } from '$lib/utils/agile';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const tasks     = data.tasks as any[];
  const jobMap    = data.jobMap    as Record<string, any>;
  const sprintMap = data.sprintMap as Record<string, any>;

  const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const STATUS_ORDER: Record<string, number>   = {
    'In Progress': 0, Blocked: 1, Review: 2, Ready: 3, Backlog: 4, Done: 5,
  };

  const now      = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  function isOverdue(t: any) { return t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now; }
  function isDueSoon(t: any) { return t.dueDate && t.status !== 'Done' && !isOverdue(t) && new Date(t.dueDate) <= weekAhead; }

  let selectedStatus = $state('');
  let showDone       = $state(false);

  const statusCounts = $derived.by(() => {
    const c: Record<string, number> = {};
    for (const t of tasks) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  });

  const inProgressCount = $derived(statusCounts['In Progress'] ?? 0);
  const blockedCount    = $derived(statusCounts['Blocked'] ?? 0);
  const dueSoonCount    = $derived(tasks.filter(t => isOverdue(t) || isDueSoon(t)).length);

  const allStatuses = $derived(
    [...new Set(tasks.map(t => t.status))].sort((a, b) => (STATUS_ORDER[a] ?? 9) - (STATUS_ORDER[b] ?? 9))
  );

  const filtered = $derived.by(() => {
    let list = tasks.slice();
    if (selectedStatus) {
      list = list.filter(t => t.status === selectedStatus);
    } else if (!showDone) {
      list = list.filter(t => t.status !== 'Done');
    }
    return list.sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (so !== 0) return so;
      const po = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      if (po !== 0) return po;
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });
  });

  const priorityDot: Record<string, string> = {
    Critical: 'bg-error',
    High:     'bg-warning',
    Medium:   'bg-primary',
    Low:      'bg-base-content/30',
  };
</script>

<svelte:head><title>My Tasks</title></svelte:head>

<div class="space-y-6">

  <!-- Header -->
  <div class="space-y-0.5">
    <h1 class="text-xl font-bold">My Tasks</h1>
    <p class="text-xs opacity-50">Tasks assigned to you across all active sprints</p>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="card bg-base-200 border border-base-300 rounded-box p-3 text-center">
      <p class="text-2xl font-bold">{tasks.length}</p>
      <p class="text-xs opacity-50">Total assigned</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-3 text-center">
      <p class="text-2xl font-bold {inProgressCount > 0 ? 'text-success' : ''}">{inProgressCount}</p>
      <p class="text-xs opacity-50">In progress</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-3 text-center">
      <p class="text-2xl font-bold {blockedCount > 0 ? 'text-error' : ''}">{blockedCount}</p>
      <p class="text-xs opacity-50">Blocked</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-3 text-center">
      <p class="text-2xl font-bold {dueSoonCount > 0 ? 'text-warning' : ''}">{dueSoonCount}</p>
      <p class="text-xs opacity-50">Due / overdue</p>
    </div>
  </div>

  <!-- Status filter chips -->
  <div class="flex items-center gap-2 flex-wrap">
    <button
      class="btn btn-sm {selectedStatus === '' ? 'btn-primary' : 'btn-ghost'}"
      onclick={() => { selectedStatus = ''; showDone = false; }}
    >Active</button>
    {#each allStatuses as s}
      <button
        class="btn btn-sm {selectedStatus === s ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => selectedStatus = selectedStatus === s ? '' : s}
      >
        {s}
        <span class="badge badge-sm ml-0.5">{statusCounts[s] ?? 0}</span>
      </button>
    {/each}
    {#if !selectedStatus && (statusCounts['Done'] ?? 0) > 0}
      <button
        class="btn btn-sm btn-ghost opacity-60 ml-auto"
        onclick={() => showDone = !showDone}
      >{showDone ? 'Hide done' : `Show ${statusCounts['Done']} done`}</button>
    {/if}
  </div>

  <!-- Task list -->
  {#if tasks.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center opacity-50">
      <p class="text-sm">No tasks assigned to you.</p>
    </div>
  {:else if filtered.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center opacity-50">
      <p class="text-sm">No tasks match the current filter.</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each filtered as task (task.id)}
        {@const job     = jobMap[task.jobId]}
        {@const sprint  = job ? sprintMap[job.sprintId] : null}
        {@const overdue = isOverdue(task)}
        {@const soon    = isDueSoon(task)}
        <button
          type="button"
          class="w-full text-left card bg-base-200 border border-base-300 rounded-box px-4 py-3 hover:bg-base-300/60 transition-colors"
          onclick={() => goto(`/agile/tasks/${task.id}`)}
        >
          <div class="flex items-start gap-3">
            <!-- Priority dot -->
            <span class="mt-[7px] size-2 rounded-full shrink-0 {priorityDot[task.priority] ?? 'bg-base-content/30'}"></span>

            <div class="flex-1 min-w-0 space-y-1">
              <!-- Title + badges -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-sm leading-tight">{task.title}</span>
                <span class="badge text-[10px] {STATUS_COLOR[task.status] ?? 'badge-ghost'}">{task.status}</span>
                <span class="badge badge-ghost text-[10px]">{task.priority}</span>
              </div>

              <!-- Blocked reason -->
              {#if task.status === 'Blocked' && task.blockedReason?.replace(/<[^>]+>/g, '').trim()}
                <p class="text-xs text-error flex items-center gap-1">
                  <AlertTriangle class="size-3 shrink-0" />
                  {task.blockedReason.replace(/<[^>]+>/g, '').slice(0, 120)}
                </p>
              {/if}

              <!-- Breadcrumb: Sprint → Job -->
              <div class="flex items-center gap-1.5 text-xs opacity-50 flex-wrap">
                {#if sprint}
                  <span>S{sprint.sprintNumber}: {sprint.title}</span>
                  <span class="opacity-50">›</span>
                {/if}
                {#if job}
                  <span>{job.title}</span>
                {/if}
              </div>
            </div>

            <!-- Due date + estimate -->
            <div class="flex flex-col items-end gap-1 shrink-0 text-right">
              {#if task.dueDate}
                <span class="text-xs {overdue ? 'text-error font-semibold' : soon ? 'text-warning' : 'opacity-50'}">
                  {fmtDate(task.dueDate)}
                </span>
              {/if}
              {#if task.estimateHours}
                <span class="text-[10px] opacity-40 flex items-center gap-0.5">
                  <Clock class="size-3" />{fmtEffort(task.estimateHours)}
                </span>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}

</div>
