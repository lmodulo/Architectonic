<script lang="ts">
  import { ChevronLeft, Plus, X, Zap, LayoutGrid } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import KanbanBoard from '$lib/components/agile/KanbanBoard.svelte';
  import {
    STATUS_COLOR, JOB_STATUSES, JOB_CATEGORIES, TASK_STATUSES, PRIORITIES,
    fmtDateRange, fmtEffort, toDateInput, completionColor,
    type AgileSprint, type AgileJob, type AgileTask,
  } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  let sprint  = $state<AgileSprint>(data.sprint);
  let jobs    = $state<AgileJob[]>(data.jobs ?? []);
  let tasks   = $state<AgileTask[]>((data.tasks ?? []) as AgileTask[]);

  const pct    = $derived(Math.round(sprint.completionPct ?? 0));
  const barClr = $derived(completionColor(pct));

  // ── Velocity bar chart (last N sprints placeholder: single sprint) ──
  const velocity   = $derived(sprint.velocity ?? 0);
  const capacity   = $derived(sprint.capacity ?? 0);
  const committed  = $derived(sprint.committedEffort ?? 0);
  const maxBar     = $derived(Math.max(capacity, committed, velocity, 1));

  // ── New job modal ──────────────────────────────────────────────────
  let jobModal  = $state(false);
  let savingJob = $state(false);
  let jobError  = $state('');
  let jobForm   = $state({ title: '', description: '', category: 'Feature', status: 'Backlog', startDate: '', endDate: '' });

  function openJobModal() {
    jobForm = { title: '', description: '', category: 'Feature', status: 'Backlog', startDate: '', endDate: '' };
    jobError = '';
    jobModal = true;
  }

  async function saveJob() {
    if (!jobForm.title.trim()) { jobError = 'Title is required'; return; }
    savingJob = true; jobError = '';
    try {
      const res = await fetch('/api/agile/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...jobForm, sprintId: sprint.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { jobError = (d as any).message ?? 'Save failed'; return; }
      jobs = [...jobs, d as AgileJob];
      jobModal = false;
    } catch { jobError = 'Network error'; }
    finally { savingJob = false; }
  }

  // ── Task status change via drag-and-drop ──────────────────────────
  async function handleStatusChange(taskId: string, newStatus: string) {
    const res = await fetch(`/api/agile/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Update failed');
    // Update velocity/sprint locally
    const updated = await fetch(`/api/agile/sprints/${sprint.id}`).then(r => r.json());
    sprint = { ...sprint, ...updated };
  }

  // ── Active job filter for board ────────────────────────────────────
  let selectedJob = $state('');
  const boardTasks = $derived(
    selectedJob ? tasks.filter(t => t.jobId === selectedJob) : tasks
  );
</script>

<svelte:head><title>Sprint {sprint.sprintNumber}: {sprint.title}</title></svelte:head>

<div class="space-y-6">

  <!-- Back + header -->
  <div class="space-y-3">
    <button class="btn btn-sm preset-tonal gap-1" onclick={() => sprint.milestoneId && goto(`/agile/milestones/${sprint.milestoneId}`)}>
      <ChevronLeft class="size-4" /> Milestone
    </button>

    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="badge text-xs preset-tonal-surface font-mono">Sprint {sprint.sprintNumber}</span>
          <span class="badge text-xs {STATUS_COLOR[sprint.status] ?? 'preset-tonal-surface'}">{sprint.status}</span>
        </div>
        <h1 class="text-2xl font-bold">{sprint.title}</h1>
        <p class="text-xs opacity-50">{fmtDateRange(sprint.startDate ?? null, sprint.endDate ?? null)}</p>
      </div>
    </div>
  </div>

  <!-- Stats row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Progress -->
    <div class="card preset-filled-surface-100-900 p-4 col-span-2 space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium">Sprint Progress</span>
        <span class="font-bold" style="color:{barClr}">{pct}%</span>
      </div>
      <div class="w-full h-2 rounded-full bg-surface-200-800 overflow-hidden">
        <div class="h-full rounded-full" style="width:{pct}%;background:{barClr}"></div>
      </div>
    </div>

    <!-- Velocity chart (SVG mini-bar) -->
    <div class="card preset-filled-surface-100-900 p-4 space-y-2">
      <div class="flex items-center gap-2">
        <Zap class="size-4 text-warning-500" />
        <span class="text-xs font-semibold opacity-70">Velocity</span>
      </div>
      <svg viewBox="0 0 120 60" width="100%" height="60" class="block" aria-hidden="true">
        {@const bw = 30}
        {@const gap = 10}
        <!-- Capacity -->
        <rect x={5}        y={60 - (capacity  / maxBar)*50} width={bw} height={(capacity  / maxBar)*50} rx="3" fill="var(--color-surface-500)" fill-opacity="0.3"/>
        <!-- Committed -->
        <rect x={5+bw+gap} y={60 - (committed / maxBar)*50} width={bw} height={(committed / maxBar)*50} rx="3" fill="var(--color-primary-500)" fill-opacity="0.6"/>
        <!-- Velocity -->
        <rect x={5+2*(bw+gap)} y={60 - (velocity  / maxBar)*50} width={bw} height={(velocity  / maxBar)*50} rx="3" fill="var(--color-success-500)" fill-opacity="0.8"/>
        <text x="20"  y="58" font-size="7" text-anchor="middle" fill="currentColor" fill-opacity="0.5">Cap</text>
        <text x="55"  y="58" font-size="7" text-anchor="middle" fill="currentColor" fill-opacity="0.5">Com</text>
        <text x="90"  y="58" font-size="7" text-anchor="middle" fill="currentColor" fill-opacity="0.5">Vel</text>
      </svg>
      <p class="text-[10px] opacity-50 text-center">{fmtEffort(velocity)} done of {fmtEffort(committed)} committed</p>
    </div>

    <!-- Jobs -->
    <div class="card preset-filled-surface-100-900 p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg preset-tonal-primary"><LayoutGrid class="size-4 text-primary-500"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Jobs</p>
        <p class="text-xl font-bold">{jobs.length}</p>
        <p class="text-xs opacity-40">{tasks.length} tasks</p>
      </div>
    </div>
  </div>

  <!-- Jobs summary table -->
  {#if jobs.length > 0}
    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold">Jobs</h2>
        {#if hasPermission(data.user, 'agile_jobs', 'create')}
          <button class="btn btn-sm preset-filled-primary-500" onclick={openJobModal}>
            <Plus class="size-3.5" /> New Job
          </button>
        {/if}
      </div>
      <div class="card preset-filled-surface-100-900 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-surface-200-800">
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Job</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Category</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold opacity-50">Status</th>
              <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Tasks</th>
              <th class="text-right px-4 py-2.5 text-xs font-semibold opacity-50">Progress</th>
            </tr>
          </thead>
          <tbody>
            {#each jobs as job (job.id)}
              <tr
                class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
                onclick={() => goto(`/agile/jobs/${job.id}`)}
              >
                <td class="px-4 py-2.5 font-medium">
                  {job.title}
                  {#if job.blocked}
                    <span class="ml-1 badge text-[9px] preset-tonal-error">Blocked</span>
                  {/if}
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge text-xs preset-tonal-surface">{job.category}</span>
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge text-xs {STATUS_COLOR[job.status] ?? 'preset-tonal-surface'}">{job.status}</span>
                </td>
                <td class="px-4 py-2.5 text-right text-xs opacity-60">{job.taskCount ?? 0}</td>
                <td class="px-4 py-2.5">
                  {@const p = Math.round(job.completionPct ?? 0)}
                  <div class="flex items-center gap-2 justify-end">
                    <div class="w-16 h-1.5 rounded-full bg-surface-200-800 overflow-hidden">
                      <div class="h-full rounded-full" style="width:{p}%;background:{completionColor(p)}"></div>
                    </div>
                    <span class="text-xs font-medium w-8 text-right">{p}%</span>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else}
    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold">Jobs</h2>
        {#if hasPermission(data.user, 'agile_jobs', 'create')}
          <button class="btn btn-sm preset-filled-primary-500" onclick={openJobModal}>
            <Plus class="size-3.5" /> New Job
          </button>
        {/if}
      </div>
      <div class="card preset-filled-surface-100-900 p-8 text-center opacity-50">
        <p class="text-sm">No jobs yet.</p>
      </div>
    </section>
  {/if}

  <!-- Task Kanban Board -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold">Task Board</h2>
      <select class="select text-xs h-8 px-2" bind:value={selectedJob}>
        <option value="">All jobs</option>
        {#each jobs as j}
          <option value={j.id}>{j.title}</option>
        {/each}
      </select>
    </div>
    <KanbanBoard
      tasks={boardTasks}
      canUpdate={hasPermission(data.user, 'agile_tasks', 'update')}
      onStatusChange={handleStatusChange}
      onTaskClick={t => goto(`/agile/jobs/${t.jobId}`)}
    />
  </section>

</div>

<!-- ── New Job Modal ──────────────────────────────────────────────── -->
{#if jobModal}
  <div transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-lg shadow-xl mx-4">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">New Job</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (jobModal = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4">
        {#if jobError}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{jobError}</aside>
        {/if}
        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="jb-title">Title *</label>
          <input id="jb-title" type="text" class="input w-full" placeholder="Job title" bind:value={jobForm.title} />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide">Category</label>
            <select class="select w-full" bind:value={jobForm.category}>
              {#each JOB_CATEGORIES as c}<option value={c}>{c}</option>{/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={jobForm.status}>
              {#each JOB_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="jb-start">Start Date</label>
            <input id="jb-start" type="date" class="input w-full" bind:value={jobForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="jb-end">End Date</label>
            <input id="jb-end" type="date" class="input w-full" bind:value={jobForm.endDate} min={jobForm.startDate} />
          </div>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-surface-200-800 pt-3">
        <button type="button" class="btn preset-tonal" onclick={() => (jobModal = false)}>Cancel</button>
        <button type="button" class="btn preset-filled-primary-500" disabled={savingJob} onclick={saveJob}>
          {savingJob ? 'Creating…' : 'Create Job'}
        </button>
      </footer>
    </div>
  </div>
{/if}
