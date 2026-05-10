<script lang="ts">
  import { Plus, X, Zap, LayoutGrid, Trash2 } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/agile/Breadcrumb.svelte';
  import AttachmentPanel from '$lib/components/agile/AttachmentPanel.svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import KanbanBoard from '$lib/components/agile/KanbanBoard.svelte';
  import BurndownChart from '$lib/components/agile/BurndownChart.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    STATUS_COLOR, JOB_STATUSES, JOB_CATEGORIES, TASK_STATUSES, PRIORITIES, SPRINT_STATUSES, LEVEL,
    fmtDateRange, fmtEffort, toDateInput, completionColor,
    type AgileSprint, type AgileJob, type AgileTask, type AgileAttachment,
  } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  let sprint      = $state<AgileSprint>(data.sprint);
  let jobs        = $state<AgileJob[]>(data.jobs ?? []);
  let tasks       = $state<AgileTask[]>((data.tasks ?? []) as AgileTask[]);
  let attachments = $state<AgileAttachment[]>(data.sprint.attachments ?? []);

  const pct    = $derived(Math.round(sprint.completionPct ?? 0));
  const barClr = $derived(completionColor(pct));

  const velocity   = $derived(sprint.velocity ?? 0);
  const capacity   = $derived(sprint.capacity ?? 0);
  const committed  = $derived(sprint.committedEffort ?? 0);
  const maxBar     = $derived(Math.max(capacity, committed, velocity, 1));
  const bw = 30;
  const gap = 10;

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

  // ── Edit sprint ────────────────────────────────────────────────────
  const teams = $derived((data.teams ?? []) as { id: string; name: string }[]);
  const sprintTeam = $derived(teams.find(t => t.id === (sprint as any).teamId));

  let sprintEditing   = $state(false);
  let sprintEditSaving = $state(false);
  let sprintEditError  = $state('');
  let sprintEditForm   = $state({
    title:       sprint.title,
    description: sprint.description ?? '',
    capacity:    sprint.capacity ?? 0,
    status:      sprint.status,
    startDate:   toDateInput(sprint.startDate),
    endDate:     toDateInput(sprint.endDate),
    teamId:      (sprint as any).teamId ?? '',
  });

  async function saveSprintEdit() {
    if (!sprintEditForm.title.trim()) { sprintEditError = 'Title is required'; return; }
    sprintEditSaving = true; sprintEditError = '';
    try {
      const res = await fetch(`/api/agile/sprints/${sprint.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sprintEditForm),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { sprintEditError = (d as any).message ?? 'Save failed'; return; }
      sprint = { ...sprint, ...sprintEditForm };
      sprintEditing = false;
    } catch { sprintEditError = 'Network error'; }
    finally { sprintEditSaving = false; }
  }

  // ── Delete sprint ──────────────────────────────────────────────────
  let deleteConfirm = $state(false);
  let deleting      = $state(false);
  let deleteError   = $state('');

  async function deleteSprint() {
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/agile/sprints/${sprint.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        deleteError = (d as any).message ?? 'Delete failed';
        deleteConfirm = false;
        return;
      }
      goto(sprint.milestoneId ? `/agile/milestones/${sprint.milestoneId}` : '/agile');
    } catch { deleteError = 'Network error'; deleteConfirm = false; }
    finally { deleting = false; }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    const res = await fetch(`/api/agile/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Update failed');
    const updated = await fetch(`/api/agile/sprints/${sprint.id}`).then(r => r.json());
    sprint = { ...sprint, ...updated };
  }

  const users = $derived((data.users ?? []) as any[]);

  function userName(id: string): string {
    const u = users.find((u: any) => u.id === id);
    if (!u) return id;
    return (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.username;
  }

  function userInitials(id: string): string {
    const u = users.find((u: any) => u.id === id);
    if (!u) return '?';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return u.username[0].toUpperCase();
  }

  // ── Retrospective ──────────────────────────────────────────────────
  let retroEditing  = $state(false);
  let retroSaving   = $state(false);
  let retroError    = $state('');
  let retroForm     = $state({
    retroWentWell:    (sprint as any).retroWentWell    ?? '',
    retroToImprove:   (sprint as any).retroToImprove   ?? '',
    retroActionItems: (sprint as any).retroActionItems ?? '',
  });

  // Keep form in sync if sprint data is refreshed
  $effect(() => {
    if (!retroEditing) {
      retroForm = {
        retroWentWell:    (sprint as any).retroWentWell    ?? '',
        retroToImprove:   (sprint as any).retroToImprove   ?? '',
        retroActionItems: (sprint as any).retroActionItems ?? '',
      };
    }
  });

  function hasRetroContent(): boolean {
    return !!(
      (sprint as any).retroWentWell?.replace(/<[^>]+>/g, '').trim() ||
      (sprint as any).retroToImprove?.replace(/<[^>]+>/g, '').trim() ||
      (sprint as any).retroActionItems?.replace(/<[^>]+>/g, '').trim()
    );
  }

  async function saveRetro() {
    retroSaving = true; retroError = '';
    try {
      const res = await fetch(`/api/agile/sprints/${sprint.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(retroForm),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { retroError = (d as any).message ?? 'Save failed'; return; }
      sprint = { ...sprint, ...retroForm } as any;
      retroEditing = false;
    } catch { retroError = 'Network error'; }
    finally { retroSaving = false; }
  }

  let selectedJob      = $state('');
  let selectedAssignee = $state('');

  const assignedUids = $derived(
    [...new Set(tasks.map(t => t.assignedTo).filter(Boolean) as string[])]
  );

  const boardTasks = $derived(
    tasks
      .filter(t => !selectedJob      || t.jobId      === selectedJob)
      .filter(t => !selectedAssignee || t.assignedTo === selectedAssignee)
  );
</script>

<svelte:head><title>Sprint {sprint.sprintNumber}: {sprint.title}</title></svelte:head>

<div class="space-y-6">

  <!-- Header -->
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[
        { label: 'Agile', href: '/agile' },
        { label: (data as any).milestone?.title ?? 'Milestone', href: sprint.milestoneId ? `/agile/milestones/${sprint.milestoneId}` : '/agile', colorClass: LEVEL.milestone.badge },
        { label: `Sprint ${sprint.sprintNumber}`, colorClass: LEVEL.sprint.badge },
      ]} />
    </div>

    <div class="space-y-1">
      <h1 class="text-2xl font-bold">{sprint.title}</h1>
      <p class="text-xs opacity-50">{fmtDateRange(sprint.startDate ?? null, sprint.endDate ?? null)}</p>
    </div>

    <div class="flex items-center justify-between gap-4 border-t border-base-300/60 pt-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="badge text-xs {LEVEL.sprint.badge}">Sprint {sprint.sprintNumber}</span>
        <span class="badge text-xs {STATUS_COLOR[sprint.status] ?? 'badge-ghost'}">{sprint.status}</span>
        {#if sprintTeam}
          <span class="badge badge-ghost text-xs">{sprintTeam.name}</span>
        {/if}
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#if hasPermission(data.user, 'agile_sprints', 'update')}
          <button class="btn btn-ghost btn-sm" onclick={() => {
            sprintEditForm = { title: sprint.title, description: sprint.description ?? '', capacity: sprint.capacity ?? 0, status: sprint.status, startDate: toDateInput(sprint.startDate), endDate: toDateInput(sprint.endDate), teamId: (sprint as any).teamId ?? '' };
            sprintEditing = true;
          }}>Edit</button>
        {/if}
        {#if hasPermission(data.user, 'agile_sprints', 'delete')}
          {#if deleteConfirm}
            <span class="text-xs text-error font-medium">Delete sprint?</span>
            <button class="btn btn-error btn-sm" disabled={deleting} onclick={deleteSprint}>
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button class="btn btn-ghost btn-sm" onclick={() => { deleteConfirm = false; deleteError = ''; }}>Cancel</button>
          {:else}
            <button class="btn btn-ghost btn-sm text-error hover:bg-error/10" onclick={() => deleteConfirm = true}>
              <Trash2 class="size-4" /> Delete
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  {#if deleteError}
    <aside class="alert alert-error p-3 rounded text-sm">{deleteError}</aside>
  {/if}

  <!-- Description -->
  {#if sprint.description?.replace(/<[^>]+>/g, '').trim()}
    <div class="prose prose-sm dark:prose-invert max-w-none opacity-80">
      {@html sprint.description}
    </div>
  {/if}

  <!-- Stats row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Progress -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 col-span-2 space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium">Sprint Progress</span>
        <span class="font-bold" style="color:{barClr}">{pct}%</span>
      </div>
      <div class="w-full h-2 rounded-full bg-base-300 overflow-hidden">
        <div class="h-full rounded-full" style="width:{pct}%;background:{barClr}"></div>
      </div>
    </div>

    <!-- Velocity chart (SVG mini-bar) -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
      <div class="flex items-center gap-2">
        <Zap class="size-4 text-warning" />
        <span class="text-xs font-semibold opacity-70">Velocity</span>
      </div>
      <svg viewBox="0 0 120 60" width="100%" height="60" class="block" aria-hidden="true">
        <!-- Capacity -->
        <rect x={5}        y={60 - (capacity  / maxBar)*50} width={bw} height={(capacity  / maxBar)*50} rx="3" fill="currentColor" fill-opacity="0.3"/>
        <!-- Committed -->
        <rect x={5+bw+gap} y={60 - (committed / maxBar)*50} width={bw} height={(committed / maxBar)*50} rx="3" fill="var(--color-primary)" fill-opacity="0.6"/>
        <!-- Velocity -->
        <rect x={5+2*(bw+gap)} y={60 - (velocity  / maxBar)*50} width={bw} height={(velocity  / maxBar)*50} rx="3" fill="var(--color-success)" fill-opacity="0.8"/>
        <text x="20"  y="58" font-size="7" text-anchor="middle" fill="currentColor" fill-opacity="0.5">Cap</text>
        <text x="55"  y="58" font-size="7" text-anchor="middle" fill="currentColor" fill-opacity="0.5">Com</text>
        <text x="90"  y="58" font-size="7" text-anchor="middle" fill="currentColor" fill-opacity="0.5">Vel</text>
      </svg>
      <p class="text-[10px] opacity-50 text-center">{fmtEffort(velocity)} done of {fmtEffort(committed)} committed</p>
    </div>

    <!-- Jobs -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-primary/15"><LayoutGrid class="size-4 text-primary"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Jobs</p>
        <p class="text-xl font-bold">{jobs.length}</p>
        <p class="text-xs opacity-40">{tasks.length} tasks</p>
      </div>
    </div>
  </div>

  <!-- Burndown chart -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
    <h2 class="text-sm font-semibold opacity-70">Burndown</h2>
    <BurndownChart {sprint} {tasks} />
  </section>

  <!-- Attachments -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Attachments</h2>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <AttachmentPanel
        bind:attachments
        uploadUrl="/api/agile/sprints/{sprint.id}/attachments"
        deleteUrlFn={(fn) => `/api/agile/sprints/${sprint.id}/attachments/${encodeURIComponent(fn)}`}
        canDelete={hasPermission(data.user, 'agile_sprints', 'update')}
      />
    </div>
  </section>

  <!-- Jobs summary table -->
  {#if jobs.length > 0}
    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold">Jobs</h2>
        {#if hasPermission(data.user, 'agile_jobs', 'create')}
          <button class="btn btn-primary btn-sm" onclick={openJobModal}>
            <Plus class="size-3.5" /> New Job
          </button>
        {/if}
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-base-300">
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
                class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
                onclick={() => goto(`/agile/jobs/${job.id}`)}
              >
                <td class="px-4 py-2.5 font-medium">
                  <span class="flex items-center gap-1">
                    {job.title}
                    {#if job.blocked}
                      <span class="badge badge-error badge-soft text-[9px]">Blocked</span>
                    {/if}
                  </span>
                  <span class="font-mono text-[10px] opacity-30 select-all">{job.id}</span>
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge badge-ghost text-xs">{job.category}</span>
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge text-xs {STATUS_COLOR[job.status] ?? 'badge-ghost'}">{job.status}</span>
                </td>
                <td class="px-4 py-2.5 text-right text-xs opacity-60">{job.taskCount ?? 0}</td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-2 justify-end">
                    <div class="w-16 h-1.5 rounded-full bg-base-300 overflow-hidden">
                      <div class="h-full rounded-full" style="width:{Math.round(job.completionPct ?? 0)}%;background:{completionColor(Math.round(job.completionPct ?? 0))}"></div>
                    </div>
                    <span class="text-xs font-medium w-8 text-right">{Math.round(job.completionPct ?? 0)}%</span>
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
          <button class="btn btn-primary btn-sm" onclick={openJobModal}>
            <Plus class="size-3.5" /> New Job
          </button>
        {/if}
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center opacity-50">
        <p class="text-sm">No jobs yet.</p>
      </div>
    </section>
  {/if}

  <!-- Task Kanban Board -->
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h2 class="text-base font-semibold">Task Board</h2>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Assignee avatars -->
        {#if assignedUids.length > 0}
          <div class="flex items-center gap-1" role="group" aria-label="Filter by assignee">
            {#each assignedUids as uid}
              <button
                type="button"
                class="size-7 rounded-full text-[10px] font-bold transition-all select-none
                  {selectedAssignee === uid
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-base-100 bg-primary text-primary-content'
                    : 'bg-base-300 hover:bg-base-content/20 text-base-content'}"
                onclick={() => selectedAssignee = selectedAssignee === uid ? '' : uid}
                title={userName(uid)}
                aria-pressed={selectedAssignee === uid}
                aria-label="Filter by {userName(uid)}"
              >{userInitials(uid)}</button>
            {/each}
          </div>
          {#if selectedAssignee}
            <span class="text-xs opacity-50">{userName(selectedAssignee)}</span>
          {/if}
        {/if}
        <!-- Job filter -->
        <select class="select text-xs h-8 px-2" bind:value={selectedJob}>
          <option value="">All jobs</option>
          {#each jobs as j}
            <option value={j.id}>{j.title}</option>
          {/each}
        </select>
      </div>
    </div>
    <KanbanBoard
      tasks={boardTasks}
      canUpdate={hasPermission(data.user, 'agile_tasks', 'update')}
      onStatusChange={handleStatusChange}
      onTaskClick={t => goto(`/agile/tasks/${t.id}`)}
    />
  </section>

  <!-- Retrospective -->
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold">Retrospective</h2>
      {#if hasPermission(data.user, 'agile_sprints', 'update')}
        {#if retroEditing}
          <div class="flex items-center gap-2">
            {#if retroError}
              <span class="text-xs text-error">{retroError}</span>
            {/if}
            <button class="btn btn-ghost btn-sm" onclick={() => { retroEditing = false; retroError = ''; }}>Cancel</button>
            <button class="btn btn-primary btn-sm" disabled={retroSaving} onclick={saveRetro}>
              {retroSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        {:else}
          <button class="btn btn-ghost btn-sm" onclick={() => retroEditing = true}>
            {hasRetroContent() ? 'Edit Retrospective' : 'Add Retrospective'}
          </button>
        {/if}
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- What went well -->
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-success shrink-0"></span>
          <h3 class="text-sm font-semibold">What went well</h3>
        </div>
        {#if retroEditing}
          <MessageEditor bind:html={retroForm.retroWentWell} placeholder="Things that went smoothly…" />
        {:else if (sprint as any).retroWentWell?.replace(/<[^>]+>/g, '').trim()}
          <div class="prose prose-sm dark:prose-invert max-w-none opacity-80">{@html (sprint as any).retroWentWell}</div>
        {:else}
          <p class="text-xs opacity-40 italic">Nothing recorded yet.</p>
        {/if}
      </div>

      <!-- What to improve -->
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-warning shrink-0"></span>
          <h3 class="text-sm font-semibold">What to improve</h3>
        </div>
        {#if retroEditing}
          <MessageEditor bind:html={retroForm.retroToImprove} placeholder="Areas needing improvement…" />
        {:else if (sprint as any).retroToImprove?.replace(/<[^>]+>/g, '').trim()}
          <div class="prose prose-sm dark:prose-invert max-w-none opacity-80">{@html (sprint as any).retroToImprove}</div>
        {:else}
          <p class="text-xs opacity-40 italic">Nothing recorded yet.</p>
        {/if}
      </div>

      <!-- Action items -->
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-primary shrink-0"></span>
          <h3 class="text-sm font-semibold">Action items</h3>
        </div>
        {#if retroEditing}
          <MessageEditor bind:html={retroForm.retroActionItems} placeholder="Concrete steps to take next sprint…" />
        {:else if (sprint as any).retroActionItems?.replace(/<[^>]+>/g, '').trim()}
          <div class="prose prose-sm dark:prose-invert max-w-none opacity-80">{@html (sprint as any).retroActionItems}</div>
        {:else}
          <p class="text-xs opacity-40 italic">Nothing recorded yet.</p>
        {/if}
      </div>
    </div>
  </section>

</div>

<!-- ── New Job Modal ──────────────────────────────────────────────── -->
{#if jobModal}
  <Modal size="lg" label="New Job">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">New Job</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (jobModal = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if jobError}
          <aside class="alert alert-error p-3 rounded text-sm">{jobError}</aside>
        {/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="jb-title">Title *</label>
          <input id="jb-title" type="text" class="input w-full" placeholder="Job title" bind:value={jobForm.title} />
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={jobForm.description} placeholder="Describe this job…" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Category</label>
            <select class="select w-full" bind:value={jobForm.category}>
              {#each JOB_CATEGORIES as c}<option value={c}>{c}</option>{/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={jobForm.status}>
              {#each JOB_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="jb-start">Start Date</label>
            <input id="jb-start" type="date" class="input w-full" bind:value={jobForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="jb-end">End Date</label>
            <input id="jb-end" type="date" class="input w-full" bind:value={jobForm.endDate} min={jobForm.startDate} />
          </div>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (jobModal = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={savingJob} onclick={saveJob}>
          {savingJob ? 'Creating…' : 'Create Job'}
        </button>
      </footer>
  </Modal>
{/if}

<!-- ── Edit Sprint Modal ──────────────────────────────────────────── -->
{#if sprintEditing}
  <Modal size="lg" label="Edit Sprint">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">Edit Sprint</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (sprintEditing = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if sprintEditError}
          <aside class="alert alert-error p-3 rounded text-sm">{sprintEditError}</aside>
        {/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="se-title">Title *</label>
          <input id="se-title" type="text" class="input w-full" bind:value={sprintEditForm.title} />
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={sprintEditForm.description} placeholder="Describe this sprint's goals…" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={sprintEditForm.status}>
              {#each SPRINT_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="se-cap">Capacity (hrs)</label>
            <input id="se-cap" type="number" min="0" class="input w-full" bind:value={sprintEditForm.capacity} />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="se-start">Start Date</label>
            <input id="se-start" type="date" class="input w-full" bind:value={sprintEditForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="se-end">End Date</label>
            <input id="se-end" type="date" class="input w-full" bind:value={sprintEditForm.endDate} min={sprintEditForm.startDate} />
          </div>
        </div>
        {#if teams.length > 0}
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Team</label>
            <select class="select w-full" bind:value={sprintEditForm.teamId}>
              <option value="">— None —</option>
              {#each teams as team}<option value={team.id}>{team.name}</option>{/each}
            </select>
          </div>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (sprintEditing = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={sprintEditSaving} onclick={saveSprintEdit}>
          {sprintEditSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
  </Modal>
{/if}
