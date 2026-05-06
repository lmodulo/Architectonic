<script lang="ts">
  import { ChevronLeft, Plus, X, AlertCircle, Pencil } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import DependencyGraph from '$lib/components/agile/DependencyGraph.svelte';
  import EffortBar from '$lib/components/agile/EffortBar.svelte';
  import {
    STATUS_COLOR, PRIORITY_COLOR, CATEGORY_COLOR, JOB_STATUSES, TASK_STATUSES, PRIORITIES,
    fmtEffort, fmtDate, toDateInput, completionColor,
    type AgileJob, type AgileTask,
  } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  let job   = $state<AgileJob>(data.job);
  let tasks = $state<AgileTask[]>((data.tasks ?? []) as AgileTask[]);
  const users       = $derived((data.users ?? []) as any[]);
  const sprintJobs  = $derived((data.sprintJobs ?? []) as AgileJob[]);

  const pct    = $derived(Math.round(job.completionPct ?? 0));
  const barClr = $derived(completionColor(pct));

  function userName(id: string | undefined) {
    if (!id) return 'Unassigned';
    const u = users.find((u: any) => u.id === id);
    return u ? (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username) : id;
  }

  // ── New task modal ─────────────────────────────────────────────────
  let taskModal  = $state(false);
  let savingTask = $state(false);
  let taskError  = $state('');
  let taskForm   = $state({
    title: '', description: '', assignedTo: '',
    estimateHours: 1, priority: 'Medium', status: 'Backlog',
    blockedReason: '', dueDate: '',
  });

  function openTaskModal() {
    taskForm = { title: '', description: '', assignedTo: '', estimateHours: 1, priority: 'Medium', status: 'Backlog', blockedReason: '', dueDate: '' };
    taskError = '';
    taskModal = true;
  }

  async function saveTask() {
    if (!taskForm.title.trim()) { taskError = 'Title is required'; return; }
    if (taskForm.estimateHours <= 0) { taskError = 'Estimate must be > 0'; return; }
    savingTask = true; taskError = '';
    try {
      const body: Record<string, unknown> = {
        ...taskForm,
        jobId: job.id,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate:    taskForm.dueDate    || undefined,
      };
      const res = await fetch('/api/agile/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { taskError = (d as any).message ?? 'Save failed'; return; }
      tasks = [...tasks, d as AgileTask];
      taskModal = false;
    } catch { taskError = 'Network error'; }
    finally { savingTask = false; }
  }

  async function updateTaskStatus(task: AgileTask, newStatus: string) {
    const res = await fetch(`/api/agile/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      tasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    }
  }

  const totalEst = $derived(tasks.reduce((s, t) => s + (t.estimateHours ?? 0), 0));
  const totalAct = $derived(tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0));
  const totalRem = $derived(tasks.reduce((s, t) => s + (t.remainingHours ?? Math.max(0, (t.estimateHours ?? 0) - (t.actualHours ?? 0))), 0));

  // ── Edit task modal ────────────────────────────────────────────────
  let editModal   = $state(false);
  let savingEdit  = $state(false);
  let editError   = $state('');
  let editingId   = $state('');
  let editForm    = $state({
    title: '', description: '', assignedTo: '',
    priority: 'Medium', status: 'Backlog',
    actualHours: 0, remainingHours: 0,
    blockedReason: '', dueDate: '',
    estimateHours: 0,
  });

  function openEditModal(task: AgileTask) {
    editingId = task.id ?? '';
    editError = '';
    editForm = {
      title:         task.title,
      description:   task.description ?? '',
      assignedTo:    task.assignedTo ?? '',
      priority:      task.priority,
      status:        task.status,
      actualHours:   task.actualHours ?? 0,
      remainingHours: task.remainingHours ?? Math.max(0, (task.estimateHours ?? 0) - (task.actualHours ?? 0)),
      blockedReason: task.blockedReason ?? '',
      dueDate:       toDateInput(task.dueDate),
      estimateHours: task.estimateHours ?? 0,
    };
    editModal = true;
  }

  async function saveEdit() {
    if (!editForm.title.trim()) { editError = 'Title is required'; return; }
    savingEdit = true; editError = '';
    try {
      const body: Record<string, unknown> = {
        title:          editForm.title.trim(),
        description:    editForm.description,
        assignedTo:     editForm.assignedTo || undefined,
        priority:       editForm.priority,
        status:         editForm.status,
        actualHours:    editForm.actualHours,
        remainingHours: editForm.remainingHours,
        blockedReason:  editForm.blockedReason,
        dueDate:        editForm.dueDate || undefined,
      };
      const res = await fetch(`/api/agile/tasks/${editingId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { editError = (d as any).message ?? 'Save failed'; return; }
      tasks = tasks.map(t => t.id === editingId ? {
        ...t,
        title:          editForm.title.trim(),
        description:    editForm.description,
        assignedTo:     editForm.assignedTo || undefined,
        priority:       editForm.priority,
        status:         editForm.status,
        actualHours:    editForm.actualHours,
        remainingHours: editForm.remainingHours,
        blockedReason:  editForm.blockedReason,
        dueDate:        editForm.dueDate || undefined,
      } as AgileTask : t);
      editModal = false;
    } catch { editError = 'Network error'; }
    finally { savingEdit = false; }
  }
</script>

<svelte:head><title>{job.title} — Job</title></svelte:head>

<div class="space-y-6">

  <!-- Back + header -->
  <div class="space-y-3">
    <button class="btn btn-ghost btn-sm gap-1" onclick={() => job.sprintId && goto(`/agile/sprints/${job.sprintId}`)}>
      <ChevronLeft class="size-4" /> Sprint
    </button>

    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge text-xs {CATEGORY_COLOR[job.category] ?? 'badge-ghost'}">{job.category}</span>
          <span class="badge text-xs {STATUS_COLOR[job.status] ?? 'badge-ghost'}">{job.status}</span>
          {#if job.blocked}
            <span class="flex items-center gap-1 text-xs text-error">
              <AlertCircle class="size-3.5" /> Blocked
            </span>
          {/if}
        </div>
        <h1 class="text-2xl font-bold">{job.title}</h1>
      </div>
      <div class="flex items-center gap-2 shrink-0 text-right">
        <div>
          <p class="text-sm font-bold" style="color:{barClr}">{pct}%</p>
          <p class="text-xs opacity-50">complete</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Effort bar -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-3">
    <h2 class="text-sm font-semibold opacity-70">Effort Breakdown</h2>
    <EffortBar estimated={totalEst} actual={totalAct} remaining={totalRem} />
  </div>

  <!-- Tasks table -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Tasks</h2>
      {#if hasPermission(data.user, 'agile_tasks', 'create')}
        <button class="btn btn-primary btn-sm" onclick={openTaskModal}>
          <Plus class="size-3.5" /> New Task
        </button>
      {/if}
    </div>

    {#if tasks.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center opacity-50">
        <p class="text-sm">No tasks yet.</p>
      </div>
    {:else}
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-base-300">
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Task</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Assignee</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Priority</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Status</th>
              <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Est</th>
              <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Logged</th>
              <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Due</th>
              {#if hasPermission(data.user, 'agile_tasks', 'update')}
                <th class="w-8 px-2 py-2.5"></th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each tasks as task (task.id)}
              <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                <td class="px-4 py-2.5 font-medium">
                  {task.title}
                  {#if task.status === 'Blocked' && task.blockedReason}
                    <p class="text-[10px] text-error mt-0.5">{task.blockedReason}</p>
                  {/if}
                </td>
                <td class="px-4 py-2.5 text-xs opacity-70">{userName(task.assignedTo)}</td>
                <td class="px-4 py-2.5">
                  <span class="badge text-xs {PRIORITY_COLOR[task.priority] ?? 'badge-ghost'}">{task.priority}</span>
                </td>
                <td class="px-4 py-2.5">
                  {#if hasPermission(data.user, 'agile_tasks', 'update')}
                    <select
                      class="select text-xs h-7 px-2"
                      value={task.status}
                      onchange={e => updateTaskStatus(task, (e.target as HTMLSelectElement).value)}
                    >
                      {#each TASK_STATUSES as s}
                        <option value={s}>{s}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="badge text-xs {STATUS_COLOR[task.status] ?? 'badge-ghost'}">{task.status}</span>
                  {/if}
                </td>
                <td class="px-4 py-2.5 text-right text-xs opacity-70">{fmtEffort(task.estimateHours)}</td>
                <td class="px-4 py-2.5 text-right text-xs opacity-70">{fmtEffort(task.actualHours ?? 0)}</td>
                <td class="px-4 py-2.5 text-right text-xs opacity-70">{fmtDate(task.dueDate)}</td>
                {#if hasPermission(data.user, 'agile_tasks', 'update')}
                  <td class="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm btn-square opacity-40 hover:opacity-100"
                      onclick={() => openEditModal(task)}
                      aria-label="Edit task"
                    >
                      <Pencil class="size-3.5" />
                    </button>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <!-- Dependency graph -->
  {#if sprintJobs.length > 1}
    <section class="space-y-3">
      <h2 class="text-base font-semibold">Job Dependencies</h2>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <DependencyGraph jobs={sprintJobs} />
      </div>
    </section>
  {/if}

</div>

<!-- ── Edit Task Modal ───────────────────────────────────────────── -->
{#if editModal}
  <div transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="Edit task">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card bg-base-200 border border-base-300 rounded-box w-full max-w-lg shadow-xl mx-4 flex flex-col max-h-[90vh]">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">Edit Task</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editModal = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if editError}
          <aside class="alert alert-error p-3 rounded text-sm">{editError}</aside>
        {/if}

        <!-- Estimate shown read-only -->
        <div class="rounded bg-base-300/40 px-3 py-2 text-xs opacity-60 flex items-center gap-2">
          <span class="font-semibold uppercase tracking-wide">Estimate:</span>
          <span>{fmtEffort(editForm.estimateHours)}</span>
          <span class="ml-auto italic">read-only</span>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-title">Title *</label>
          <input id="et-title" type="text" class="input w-full" placeholder="Task title" bind:value={editForm.title} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-desc">Description</label>
          <textarea id="et-desc" class="textarea w-full" rows="2" placeholder="Optional details…" bind:value={editForm.description}></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Assigned To</label>
            <select class="select w-full" bind:value={editForm.assignedTo}>
              <option value="">Unassigned</option>
              {#each users as u}
                <option value={u.id}>{u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}</option>
              {/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-due">Due Date</label>
            <input id="et-due" type="date" class="input w-full" bind:value={editForm.dueDate} />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Priority</label>
            <select class="select w-full" bind:value={editForm.priority}>
              {#each PRIORITIES as p}<option value={p}>{p}</option>{/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={editForm.status}>
              {#each TASK_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-act">Logged Hours</label>
            <input id="et-act" type="number" min="0" step="0.5" class="input w-full" bind:value={editForm.actualHours} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-rem">Remaining Hours</label>
            <input id="et-rem" type="number" min="0" step="0.5" class="input w-full" bind:value={editForm.remainingHours} />
          </div>
        </div>
        {#if editForm.status === 'Blocked'}
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-reason">Blocked Reason *</label>
            <input id="et-reason" type="text" class="input w-full" placeholder="Why is this blocked?" bind:value={editForm.blockedReason} />
          </div>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (editModal = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={savingEdit} onclick={saveEdit}>
          {savingEdit ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- ── New Task Modal ─────────────────────────────────────────────── -->
{#if taskModal}
  <div transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card bg-base-200 border border-base-300 rounded-box w-full max-w-lg shadow-xl mx-4 flex flex-col max-h-[90vh]">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">New Task</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (taskModal = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if taskError}
          <aside class="alert alert-error p-3 rounded text-sm">{taskError}</aside>
        {/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="tk-title">Title *</label>
          <input id="tk-title" type="text" class="input w-full" placeholder="Task title" bind:value={taskForm.title} />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Assigned To</label>
            <select class="select w-full" bind:value={taskForm.assignedTo}>
              <option value="">Unassigned</option>
              {#each users as u}
                <option value={u.id}>{u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}</option>
              {/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="tk-est">Estimate (hrs) *</label>
            <input id="tk-est" type="number" min="0.5" step="0.5" class="input w-full" bind:value={taskForm.estimateHours} />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Priority</label>
            <select class="select w-full" bind:value={taskForm.priority}>
              {#each PRIORITIES as p}<option value={p}>{p}</option>{/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={taskForm.status}>
              {#each TASK_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="tk-due">Due Date</label>
          <input id="tk-due" type="date" class="input w-full" bind:value={taskForm.dueDate} />
        </div>
        {#if taskForm.status === 'Blocked'}
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="tk-reason">Blocked Reason *</label>
            <input id="tk-reason" type="text" class="input w-full" placeholder="Why is this blocked?" bind:value={taskForm.blockedReason} />
          </div>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (taskModal = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={savingTask} onclick={saveTask}>
          {savingTask ? 'Creating…' : 'Create Task'}
        </button>
      </footer>
    </div>
  </div>
{/if}
