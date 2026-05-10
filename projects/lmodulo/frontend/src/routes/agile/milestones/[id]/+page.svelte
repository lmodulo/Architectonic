<script lang="ts">
  import { Plus, X, Layers, Calendar, Clock, CheckCircle, Trash2 } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import AttachmentPanel from '$lib/components/agile/AttachmentPanel.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    STATUS_COLOR, PRIORITY_COLOR, SPRINT_STATUSES, MILESTONE_STATUSES, PRIORITIES, LEVEL,
    fmtDateRange, fmtDate, fmtEffort, toDateInput, completionColor,
    type AgileMilestone, type AgileSprint, type AgileAttachment,
  } from '$lib/utils/agile';
  import Breadcrumb from '$lib/components/agile/Breadcrumb.svelte';

  let { data }: { data: PageData } = $props();

  let milestone    = $state<AgileMilestone>(data.milestone);
  let sprints      = $state<AgileSprint[]>(data.sprints ?? []);
  let attachments  = $state<AgileAttachment[]>(data.milestone.attachments ?? []);

  const pct    = $derived(Math.round(milestone.completionPct ?? 0));
  const barClr = $derived(completionColor(pct));

  // ── Sprint modal ───────────────────────────────────────────────────
  let sprintModal = $state(false);
  let savingSprint = $state(false);
  let sprintError  = $state('');
  let sprintForm   = $state({ title: '', description: '', capacity: 0, status: 'Planning', startDate: '', endDate: '' });

  function openSprintModal() {
    sprintForm = { title: '', description: '', capacity: 0, status: 'Planning', startDate: '', endDate: '' };
    sprintError = '';
    sprintModal = true;
  }

  async function saveSprint() {
    if (!sprintForm.title.trim()) { sprintError = 'Title is required'; return; }
    savingSprint = true; sprintError = '';
    try {
      const res = await fetch('/api/agile/sprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...sprintForm, milestoneId: milestone.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { sprintError = (d as any).message ?? 'Save failed'; return; }
      sprints = [...sprints, d as AgileSprint];
      sprintModal = false;
    } catch { sprintError = 'Network error'; }
    finally { savingSprint = false; }
  }

  // ── Inline milestone edit ──────────────────────────────────────────
  let editing     = $state(false);
  let editForm    = $state({ ...milestone, startDate: toDateInput(milestone.startDate), endDate: toDateInput(milestone.endDate) });
  let editSaving  = $state(false);
  let editError   = $state('');

  async function saveEdit() {
    if (!editForm.title?.trim()) { editError = 'Title is required'; return; }
    editSaving = true; editError = '';
    try {
      const res = await fetch(`/api/agile/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { editError = (d as any).message ?? 'Save failed'; return; }
      milestone = { ...milestone, ...editForm };
      editing = false;
    } catch { editError = 'Network error'; }
    finally { editSaving = false; }
  }

  // ── Delete milestone ───────────────────────────────────────────────
  let deleteConfirm = $state(false);
  let deleting      = $state(false);
  let deleteError   = $state('');

  async function deleteMilestone() {
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/agile/milestones/${milestone.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        deleteError = (d as any).message ?? 'Delete failed';
        deleteConfirm = false;
        return;
      }
      goto('/agile');
    } catch { deleteError = 'Network error'; deleteConfirm = false; }
    finally { deleting = false; }
  }
</script>

<svelte:head><title>{milestone.title} — Milestone</title></svelte:head>

<div class="space-y-6">

  <!-- Header -->
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[
        { label: 'Agile', href: '/agile' },
        { label: milestone.title, colorClass: LEVEL.milestone.badge },
      ]} />
    </div>

    <div class="space-y-1 min-w-0">
      <h1 class="text-2xl font-bold leading-tight">{milestone.title}</h1>
      {#if milestone.strategicGoal}
        <p class="text-sm opacity-60">{milestone.strategicGoal}</p>
      {/if}
    </div>

    <div class="flex items-center justify-between gap-4 border-t border-base-300/60 pt-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="badge text-xs {LEVEL.milestone.badge}">{LEVEL.milestone.label}</span>
        <span class="badge text-xs {PRIORITY_COLOR[milestone.priority] ?? 'badge-ghost'}">{milestone.priority}</span>
        <span class="badge text-xs {STATUS_COLOR[milestone.status] ?? 'badge-ghost'}">{milestone.status}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#if hasPermission(data.user, 'agile_milestones', 'update')}
          <button class="btn btn-ghost btn-sm" onclick={() => { editForm = { ...milestone, startDate: toDateInput(milestone.startDate), endDate: toDateInput(milestone.endDate) }; editing = true; }}>
            Edit
          </button>
        {/if}
        {#if hasPermission(data.user, 'agile_milestones', 'delete')}
          {#if deleteConfirm}
            <span class="text-xs text-error font-medium">Delete milestone?</span>
            <button class="btn btn-error btn-sm" disabled={deleting} onclick={deleteMilestone}>
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
  {#if milestone.description?.replace(/<[^>]+>/g, '').trim()}
    <div class="prose prose-sm dark:prose-invert max-w-none opacity-80">
      {@html milestone.description}
    </div>
  {/if}

  <!-- Progress + stats grid -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 col-span-2 space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium">Overall Progress</span>
        <span class="font-bold" style="color:{barClr}">{pct}%</span>
      </div>
      <div class="w-full h-3 rounded-full bg-base-300 overflow-hidden">
        <div class="h-full rounded-full transition-all" style="width:{pct}%;background:{barClr}"></div>
      </div>
      <div class="flex gap-4 text-xs opacity-50">
        <span>{fmtDateRange(milestone.startDate ?? null, milestone.endDate ?? null)}</span>
      </div>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-success/15"><Clock class="size-4 text-success"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Effort</p>
        <p class="text-lg font-bold">{fmtEffort(milestone.totalActualHours ?? 0)}</p>
        <p class="text-xs opacity-40">of {fmtEffort(milestone.totalEstimatedHours ?? 0)} est</p>
      </div>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-primary/15"><Layers class="size-4 text-primary"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Sprints</p>
        <p class="text-lg font-bold">{sprints.length}</p>
        <p class="text-xs opacity-40">{milestone.taskCount ?? 0} tasks total</p>
      </div>
    </div>
  </div>

  <!-- Attachments -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Attachments</h2>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <AttachmentPanel
        bind:attachments
        uploadUrl="/api/agile/milestones/{milestone.id}/attachments"
        deleteUrlFn={(fn) => `/api/agile/milestones/${milestone.id}/attachments/${encodeURIComponent(fn)}`}
        canDelete={hasPermission(data.user, 'agile_milestones', 'update')}
      />
    </div>
  </section>

  <!-- Sprints -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Sprints</h2>
      {#if hasPermission(data.user, 'agile_sprints', 'create')}
        <button class="btn btn-primary btn-sm" onclick={openSprintModal}>
          <Plus class="size-4" /> New Sprint
        </button>
      {/if}
    </div>

    {#if sprints.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center opacity-50">
        <p class="text-sm">No sprints yet.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each sprints as sprint (sprint.id)}
          {@const sprintPct = Math.round(sprint.completionPct ?? 0)}
          {@const sprintClr = completionColor(sprintPct)}
          <div
            class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-3 cursor-pointer hover:bg-base-300/50 transition-colors"
            role="button" tabindex="0"
            onclick={() => goto(`/agile/sprints/${sprint.id}`)}
            onkeydown={e => e.key === 'Enter' && goto(`/agile/sprints/${sprint.id}`)}
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono opacity-50">S{sprint.sprintNumber}</span>
                  <h3 class="font-semibold text-sm truncate">{sprint.title}</h3>
                </div>
                <p class="text-xs opacity-50">{fmtDateRange(sprint.startDate ?? null, sprint.endDate ?? null)}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="badge text-xs {STATUS_COLOR[sprint.status] ?? 'badge-ghost'}">{sprint.status}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="opacity-60">{sprint.taskCount ?? 0} tasks · {fmtEffort(sprint.committedEffort ?? 0)} committed</span>
                <span class="font-semibold" style="color:{sprintClr}">{sprintPct}%</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-base-300 overflow-hidden">
                <div class="h-full rounded-full" style="width:{sprintPct}%;background:{sprintClr}"></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

</div>

<!-- ── New Sprint Modal ───────────────────────────────────────────── -->
{#if sprintModal}
  <Modal size="lg" label="New Sprint">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">New Sprint</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (sprintModal = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if sprintError}
          <aside class="alert alert-error p-3 rounded text-sm">{sprintError}</aside>
        {/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sp-title">Title *</label>
          <input id="sp-title" type="text" class="input w-full" placeholder="Sprint title" bind:value={sprintForm.title} />
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={sprintForm.description} placeholder="Describe this sprint's goals…" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={sprintForm.status}>
              {#each SPRINT_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sp-cap">Capacity (hrs)</label>
            <input id="sp-cap" type="number" min="0" class="input w-full" bind:value={sprintForm.capacity} />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sp-start">Start Date</label>
            <input id="sp-start" type="date" class="input w-full" bind:value={sprintForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sp-end">End Date</label>
            <input id="sp-end" type="date" class="input w-full" bind:value={sprintForm.endDate} min={sprintForm.startDate} />
          </div>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (sprintModal = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={savingSprint} onclick={saveSprint}>
          {savingSprint ? 'Creating…' : 'Create Sprint'}
        </button>
      </footer>
  </Modal>
{/if}

<!-- ── Edit Milestone Modal ──────────────────────────────────────── -->
{#if editing}
  <Modal size="lg" label="Edit Milestone">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">Edit Milestone</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editing = false)}><X class="size-5"/></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if editError}
          <aside class="alert alert-error p-3 rounded text-sm">{editError}</aside>
        {/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="em-title">Title *</label>
          <input id="em-title" type="text" class="input w-full" bind:value={editForm.title} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="em-goal">Strategic Goal</label>
          <input id="em-goal" type="text" class="input w-full" bind:value={editForm.strategicGoal} />
        </div>
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={editForm.description} placeholder="Describe this milestone…" />
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
              {#each MILESTONE_STATUSES as s}<option value={s}>{s}</option>{/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="em-start">Start Date</label>
            <input id="em-start" type="date" class="input w-full" bind:value={editForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="em-end">End Date</label>
            <input id="em-end" type="date" class="input w-full" bind:value={editForm.endDate} />
          </div>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (editing = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={editSaving} onclick={saveEdit}>
          {editSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
  </Modal>
{/if}
