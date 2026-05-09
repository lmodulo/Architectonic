<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Plus, X, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    STATUS_COLOR, PRIORITY_COLOR, CATEGORY_COLOR,
    JOB_STATUSES, JOB_CATEGORIES, PRIORITIES,
    fmtEffort, completionColor,
    type AgileJob,
  } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  const milestones = $derived((data.milestones ?? []) as any[]);
  const sprints    = $derived((data.sprints    ?? []) as any[]);
  let   jobs       = $state<AgileJob[]>((data.jobs ?? []) as AgileJob[]);

  let milestoneId  = $state(data.milestoneId ?? '');
  let sprintId     = $state(data.sprintId    ?? '');

  // Keep jobs in sync when server data refreshes
  $effect(() => { jobs = (data.jobs ?? []) as AgileJob[]; });

  // Derived sprint objects
  const targetSprint  = $derived(sprints.find((s: any) => s.id === sprintId) ?? null);
  const otherSprints  = $derived(sprints.filter((s: any) => s.id !== sprintId));

  // Jobs split: in target sprint vs elsewhere in the milestone
  const sprintJobs  = $derived(jobs.filter(j => j.sprintId === sprintId));
  const backlogJobs = $derived(
    jobs.filter(j =>
      j.sprintId !== sprintId &&
      (j.status === 'Backlog' || j.status === 'Ready')
    )
  );

  // Sprint capacity math
  const committedHours = $derived(sprintJobs.reduce((s, j) => s + ((j as any).estimatedHours ?? 0), 0));
  const capacity       = $derived((targetSprint as any)?.capacity ?? 0);
  const capPct         = $derived(capacity > 0 ? Math.min(100, Math.round(committedHours / capacity * 100)) : 0);
  const capClr         = $derived(completionColor(capPct));

  // Status filter for sprint panel
  let statusFilter = $state('');

  const visibleSprintJobs = $derived(
    statusFilter ? sprintJobs.filter(j => j.status === statusFilter) : sprintJobs
  );

  // Navigate when milestone changes
  function onMilestoneChange(id: string) {
    milestoneId = id;
    sprintId = '';
    goto(`/agile/plan?milestoneId=${id}`, { replaceState: true });
  }

  function onSprintChange(id: string) {
    sprintId = id;
    goto(`/agile/plan?milestoneId=${milestoneId}&sprintId=${id}`, { replaceState: true });
  }

  // ── Move job to target sprint ──────────────────────────────────────
  let moving = $state<string>(''); // job id being moved

  async function moveToSprint(job: AgileJob) {
    if (!sprintId || moving) return;
    moving = job.id ?? '';
    try {
      const res = await fetch(`/api/agile/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sprintId }),
      });
      if (res.ok) {
        jobs = jobs.map(j => j.id === job.id ? { ...j, sprintId } : j);
      }
    } finally { moving = ''; }
  }

  async function removeFromSprint(job: AgileJob) {
    if (!job.sprintId || moving) return;
    // Move to the first other sprint that isn't the current target, or the first sprint
    const dest = otherSprints[0];
    if (!dest) return;
    moving = job.id ?? '';
    try {
      const res = await fetch(`/api/agile/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sprintId: dest.id }),
      });
      if (res.ok) {
        jobs = jobs.map(j => j.id === job.id ? { ...j, sprintId: dest.id } : j);
      }
    } finally { moving = ''; }
  }

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
    if (!sprintId) { jobError = 'Select a sprint first'; return; }
    savingJob = true; jobError = '';
    try {
      const res = await fetch('/api/agile/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...jobForm, sprintId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { jobError = (d as any).message ?? 'Save failed'; return; }
      jobs = [...jobs, d as AgileJob];
      jobModal = false;
    } catch { jobError = 'Network error'; }
    finally { savingJob = false; }
  }
</script>

<svelte:head><title>Sprint Planning</title></svelte:head>

<div class="space-y-5">

  <!-- ── Controls ──────────────────────────────────────────────────── -->
  <div class="flex items-center gap-3 flex-wrap">
    <select
      class="select text-sm h-9"
      value={milestoneId}
      onchange={e => onMilestoneChange((e.target as HTMLSelectElement).value)}
    >
      <option value="">— Select milestone —</option>
      {#each milestones as m}
        <option value={m.id}>{m.title}</option>
      {/each}
    </select>

    {#if milestoneId && sprints.length > 0}
      <select
        class="select text-sm h-9"
        value={sprintId}
        onchange={e => onSprintChange((e.target as HTMLSelectElement).value)}
      >
        <option value="">— Select sprint to plan —</option>
        {#each sprints as s}
          <option value={s.id}>S{s.sprintNumber}: {s.title}</option>
        {/each}
      </select>
    {/if}

    {#if sprintId && hasPermission(data.user, 'agile_jobs', 'create')}
      <button class="btn btn-primary btn-sm ml-auto" onclick={openJobModal}>
        <Plus class="size-4" /> New Job in Sprint
      </button>
    {/if}
  </div>

  {#if !milestoneId}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center opacity-40">
      <p class="text-sm">Select a milestone to begin planning.</p>
    </div>
  {:else if sprints.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center opacity-40">
      <p class="text-sm">No sprints in this milestone yet.</p>
    </div>
  {:else if !sprintId}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center opacity-40">
      <p class="text-sm">Select a sprint to plan.</p>
    </div>
  {:else}

    <!-- ── Capacity bar ───────────────────────────────────────────── -->
    {#if capacity > 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium">Sprint Capacity</span>
          <span class="text-xs opacity-60">{fmtEffort(committedHours)} committed of {fmtEffort(capacity)} available</span>
          <span class="font-bold text-xs" style="color:{capClr}">{capPct}%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-base-300 overflow-hidden">
          <div class="h-full rounded-full transition-all" style="width:{capPct}%;background:{capClr}"></div>
        </div>
      </div>
    {/if}

    <!-- ── Two-panel layout ───────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 items-start">

      <!-- LEFT: Available backlog ──────────────────────────────────── -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">
            Available Backlog
            {#if backlogJobs.length > 0}
              <span class="badge badge-ghost badge-sm ml-1">{backlogJobs.length}</span>
            {/if}
          </h2>
          <span class="text-xs opacity-40">Backlog/Ready in other sprints</span>
        </div>

        {#if backlogJobs.length === 0}
          <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center opacity-40">
            <p class="text-xs">No backlog items in other sprints.</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each backlogJobs as job (job.id)}
              {@const srcSprint = sprints.find((s: any) => s.id === job.sprintId)}
              <div class="card bg-base-200 border border-base-300 rounded-box p-3 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 space-y-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="badge text-[10px] {PRIORITY_COLOR[job.priority] ?? 'badge-ghost'}">{job.priority}</span>
                      <span class="badge badge-ghost text-[10px] {CATEGORY_COLOR[job.category] ?? ''}">{job.category}</span>
                      {#if srcSprint}
                        <span class="text-[10px] opacity-40 font-mono">S{srcSprint.sprintNumber}</span>
                      {/if}
                    </div>
                    <p class="text-sm font-medium leading-snug truncate">{job.title}</p>
                    {#if (job as any).estimatedHours}
                      <p class="text-[10px] opacity-50">{fmtEffort((job as any).estimatedHours)} estimated</p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <a href="/agile/jobs/{job.id}" class="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100" title="Open job">
                      <ExternalLink class="size-3" />
                    </a>
                    {#if hasPermission(data.user, 'agile_jobs', 'update')}
                      <button
                        type="button"
                        class="btn btn-primary btn-xs gap-1"
                        disabled={moving === job.id}
                        onclick={() => moveToSprint(job)}
                        title="Move to selected sprint"
                      >
                        {moving === job.id ? '…' : ''}
                        <ArrowRight class="size-3" />
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- RIGHT: Sprint jobs ───────────────────────────────────────── -->
      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h2 class="text-base font-semibold">
            {#if targetSprint}
              S{targetSprint.sprintNumber}: {targetSprint.title}
            {:else}
              Sprint
            {/if}
            <span class="badge badge-ghost badge-sm ml-1">{sprintJobs.length} jobs</span>
          </h2>
          <select class="select text-xs h-7 px-2" bind:value={statusFilter}>
            <option value="">All statuses</option>
            {#each JOB_STATUSES as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </div>

        {#if sprintJobs.length === 0}
          <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center opacity-40 border-dashed">
            <ArrowLeft class="size-5 mx-auto mb-1" />
            <p class="text-xs">Move backlog items here to commit them to this sprint.</p>
          </div>
        {:else}
          <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-base-300">
                  <th class="text-left px-3 py-2 text-xs font-semibold opacity-50">Job</th>
                  <th class="text-left px-3 py-2 text-xs font-semibold opacity-50">Status</th>
                  <th class="text-right px-3 py-2 text-xs font-semibold opacity-50">Est</th>
                  <th class="w-16 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {#each visibleSprintJobs as job (job.id)}
                  {@const pct = Math.round((job as any).completionPct ?? 0)}
                  <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                    <td class="px-3 py-2">
                      <div class="space-y-0.5">
                        <div class="flex items-center gap-1.5">
                          <span class="badge text-[10px] {CATEGORY_COLOR[job.category] ?? 'badge-ghost'}">{job.category}</span>
                          <a href="/agile/jobs/{job.id}" class="font-medium text-sm hover:text-primary hover:underline truncate max-w-[200px]">{job.title}</a>
                        </div>
                        {#if pct > 0}
                          <div class="flex items-center gap-1.5">
                            <div class="w-16 h-1 rounded-full bg-base-300 overflow-hidden">
                              <div class="h-full rounded-full" style="width:{pct}%;background:{completionColor(pct)}"></div>
                            </div>
                            <span class="text-[10px] opacity-40">{pct}%</span>
                          </div>
                        {/if}
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <span class="badge text-xs {STATUS_COLOR[job.status] ?? 'badge-ghost'}">{job.status}</span>
                    </td>
                    <td class="px-3 py-2 text-right text-xs opacity-60">{fmtEffort((job as any).estimatedHours ?? 0)}</td>
                    <td class="px-2 py-2 text-center">
                      {#if hasPermission(data.user, 'agile_jobs', 'update') && otherSprints.length > 0 && job.status === 'Backlog'}
                        <button
                          type="button"
                          class="btn btn-ghost btn-xs opacity-40 hover:opacity-100"
                          disabled={moving === job.id}
                          onclick={() => removeFromSprint(job)}
                          title="Move to {otherSprints[0]?.title ?? 'other sprint'}"
                        >
                          <ArrowLeft class="size-3" />
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>

    </div>

  {/if}
</div>

<!-- ── New Job Modal ──────────────────────────────────────────────── -->
{#if jobModal}
  <Modal size="lg" label="New Job">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">New Job in Sprint</h2>
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
