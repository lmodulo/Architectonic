<script lang="ts">
  import { X, Copy, AlertCircle, Trash2, Pencil } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/agile/Breadcrumb.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import AttachmentPanel from '$lib/components/agile/AttachmentPanel.svelte';
  import CommentFeed from '$lib/components/agile/CommentFeed.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import UserSelect from '$lib/components/UserSelect.svelte';
  import UserNameLink from '$lib/components/UserNameLink.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    STATUS_COLOR, PRIORITY_COLOR, TASK_STATUSES, PRIORITIES, LEVEL,
    fmtEffort, fmtDate, toDateInput,
    type AgileTask, type AgileAttachment,
  } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  let task        = $state<AgileTask>(data.task);
  let attachments = $state<AgileAttachment[]>(data.task.attachments ?? []);
  const job       = $derived(data.job);
  const users     = $derived((data.users ?? []) as any[]);

  function userName(id: string | undefined) {
    if (!id) return null;
    const u = users.find((u: any) => u.id === id);
    return u ?? null;
  }

  // ── Edit modal ─────────────────────────────────────────────────────
  let editing   = $state(false);
  let editSaving = $state(false);
  let editError  = $state('');
  let editForm   = $state<{
    title: string; description: string; assignedTo: string | null;
    priority: string; status: string;
    estimateHours: number; actualHours: number; remainingHours: number;
    blockedReason: string; dueDate: string;
  }>({
    title: '', description: '', assignedTo: null,
    priority: 'Medium', status: 'Backlog',
    estimateHours: 0, actualHours: 0, remainingHours: 0,
    blockedReason: '', dueDate: '',
  });

  function openEdit() {
    editError = '';
    editForm = {
      title:          task.title,
      description:    task.description ?? '',
      assignedTo:     task.assignedTo ?? null,
      priority:       task.priority,
      status:         task.status,
      estimateHours:  task.estimateHours ?? 0,
      actualHours:    task.actualHours ?? 0,
      remainingHours: task.remainingHours ?? 0,
      blockedReason:  task.blockedReason ?? '',
      dueDate:        toDateInput(task.dueDate),
    };
    editing = true;
  }

  async function saveEdit() {
    if (!editForm.title.trim()) { editError = 'Title is required'; return; }
    if (editForm.estimateHours <= 0) { editError = 'Estimate must be > 0'; return; }
    editSaving = true; editError = '';
    try {
      const body: Record<string, unknown> = {
        title:          editForm.title.trim(),
        description:    editForm.description,
        assignedTo:     editForm.assignedTo || undefined,
        priority:       editForm.priority,
        status:         editForm.status,
        estimateHours:  editForm.estimateHours,
        actualHours:    editForm.actualHours,
        remainingHours: editForm.remainingHours,
        blockedReason:  editForm.blockedReason,
        dueDate:        editForm.dueDate || undefined,
      };
      const res = await fetch(`/api/agile/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { editError = (d as any).message ?? 'Save failed'; return; }
      task = { ...task, ...editForm, assignedTo: editForm.assignedTo ?? undefined } as AgileTask;
      editing = false;
    } catch { editError = 'Network error'; }
    finally { editSaving = false; }
  }

  // ── Delete task ────────────────────────────────────────────────────
  let deleteConfirm = $state(false);
  let deleting      = $state(false);
  let deleteError   = $state('');

  async function deleteTask() {
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/agile/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        deleteError = (d as any).message ?? 'Delete failed';
        deleteConfirm = false;
        return;
      }
      goto(task.jobId ? `/agile/jobs/${task.jobId}` : '/agile');
    } catch { deleteError = 'Network error'; deleteConfirm = false; }
    finally { deleting = false; }
  }
</script>

<svelte:head><title>{task.title} — Task</title></svelte:head>

<div class="space-y-6">

  <!-- Back + header -->
  <div class="space-y-3">
    <Breadcrumb crumbs={[
      { label: 'Agile', href: '/agile' },
      { label: (data as any).milestone?.title ?? 'Milestone', href: (data as any).sprint?.milestoneId ? `/agile/milestones/${(data as any).sprint.milestoneId}` : '/agile', colorClass: LEVEL.milestone.text },
      { label: `Sprint ${(data as any).sprint?.sprintNumber ?? ''}`, href: job?.sprintId ? `/agile/sprints/${job.sprintId}` : undefined, colorClass: LEVEL.sprint.text },
      { label: job?.title ?? 'Job', href: task.jobId ? `/agile/jobs/${task.jobId}` : undefined, colorClass: LEVEL.job.text },
      { label: task.title, colorClass: LEVEL.task.text },
    ]} />

    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge text-xs {LEVEL.task.badge}">{LEVEL.task.label}</span>
          <span class="badge text-xs {PRIORITY_COLOR[task.priority] ?? 'badge-ghost'}">{task.priority}</span>
          <span class="badge text-xs {STATUS_COLOR[task.status] ?? 'badge-ghost'}">{task.status}</span>
          {#if task.status === 'Blocked'}
            <span class="flex items-center gap-1 text-xs text-error">
              <AlertCircle class="size-3.5" /> Blocked
            </span>
          {/if}
        </div>
        <h1 class="text-2xl font-bold leading-tight">{task.title}</h1>
        <button
          type="button"
          class="flex items-center gap-1 font-mono text-[11px] opacity-30 hover:opacity-60 transition-opacity cursor-copy select-all w-fit"
          onclick={() => navigator.clipboard.writeText(task.id ?? '')}
          title="Copy task ID"
        >{task.id} <Copy class="size-2.5 shrink-0" /></button>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        {#if hasPermission(data.user, 'agile_tasks', 'update')}
          <button class="btn btn-ghost btn-sm" onclick={openEdit}>
            <Pencil class="size-4" /> Edit
          </button>
        {/if}
        {#if hasPermission(data.user, 'agile_tasks', 'delete')}
          {#if deleteConfirm}
            <span class="text-xs text-error font-medium">Delete task?</span>
            <button class="btn btn-error btn-sm" disabled={deleting} onclick={deleteTask}>
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
  {#if task.description?.replace(/<[^>]+>/g, '').trim()}
    <div class="prose prose-sm dark:prose-invert max-w-none opacity-80">
      {@html task.description}
    </div>
  {/if}

  <!-- Blocked reason -->
  {#if task.status === 'Blocked' && task.blockedReason}
    <aside class="alert alert-error p-3 rounded text-sm flex items-start gap-2">
      <AlertCircle class="size-4 shrink-0 mt-0.5" />
      <span>{task.blockedReason}</span>
    </aside>
  {/if}

  <!-- Metadata grid -->
  <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
      <p class="text-xs font-medium opacity-50 uppercase tracking-wide">Assignee</p>
      {#if task.assignedTo}
        <UserNameLink user={userName(task.assignedTo)} />
      {:else}
        <p class="text-sm opacity-40">Unassigned</p>
      {/if}
    </div>

    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
      <p class="text-xs font-medium opacity-50 uppercase tracking-wide">Due Date</p>
      <p class="text-sm font-medium">{fmtDate(task.dueDate) || '—'}</p>
    </div>

    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
      <p class="text-xs font-medium opacity-50 uppercase tracking-wide">Estimate</p>
      <p class="text-sm font-medium">{fmtEffort(task.estimateHours ?? 0)}</p>
    </div>

    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
      <p class="text-xs font-medium opacity-50 uppercase tracking-wide">Logged</p>
      <p class="text-sm font-medium">{fmtEffort(task.actualHours ?? 0)}</p>
    </div>

    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
      <p class="text-xs font-medium opacity-50 uppercase tracking-wide">Remaining</p>
      <p class="text-sm font-medium">{fmtEffort(task.remainingHours ?? Math.max(0, (task.estimateHours ?? 0) - (task.actualHours ?? 0)))}</p>
    </div>

    {#if job}
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-xs font-medium opacity-50 uppercase tracking-wide">Job</p>
        <button
          type="button"
          class="text-sm font-medium text-primary hover:underline text-left truncate w-full"
          onclick={() => goto(`/agile/jobs/${job.id}`)}
        >{job.title}</button>
      </div>
    {/if}
  </div>

  <!-- Attachments -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Attachments</h2>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <AttachmentPanel
        bind:attachments
        uploadUrl="/api/agile/tasks/{task.id}/attachments"
        deleteUrlFn={(fn) => `/api/agile/tasks/${task.id}/attachments/${encodeURIComponent(fn)}`}
        canDelete={hasPermission(data.user, 'agile_tasks', 'update')}
      />
    </div>
  </section>

  <!-- Discussion -->
  {#if hasPermission(data.user, 'agile_comments', 'read')}
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Discussion</h2>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <CommentFeed taskId={task.id ?? ''} user={data.user} {users} />
      </div>
    </section>
  {/if}

</div>

<!-- ── Edit Task Modal ─────────────────────────────────────────────── -->
{#if editing}
  <Modal size="md" label="Edit task">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">Edit Task</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editing = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if editError}
          <aside class="alert alert-error p-3 rounded text-sm">{editError}</aside>
        {/if}

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-title">Title *</label>
          <input id="et-title" type="text" class="input w-full" bind:value={editForm.title} />
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={editForm.description} placeholder="Optional details…" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Assigned To</label>
            <UserSelect {users} placeholder="Unassigned" clearable bind:value={editForm.assignedTo} />
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
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-est">Estimate (h)</label>
            <input id="et-est" type="number" min="0.5" step="0.5" class="input w-full" bind:value={editForm.estimateHours} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-act">Logged (h)</label>
            <input id="et-act" type="number" min="0" step="0.5" class="input w-full" bind:value={editForm.actualHours} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="et-rem">Remaining (h)</label>
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
        <button type="button" class="btn btn-ghost" onclick={() => (editing = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={editSaving} onclick={saveEdit}>
          {editSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
  </Modal>
{/if}
