<script lang="ts">
  import { AlertCircle, CheckCircle, Clock, Flag, Plus, TrendingUp, X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import MilestoneCard from '$lib/components/agile/MilestoneCard.svelte';
  import RoleQuickView from '$lib/components/agile/RoleQuickView.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    STATUS_COLOR, PRIORITY_COLOR, MILESTONE_STATUSES, PRIORITIES,
    fmtEffort, completionColor,
    type AgileMilestone,
  } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  let milestones = $state<AgileMilestone[]>(data.milestones ?? []);
  const tasks    = $derived(data.tasks ?? []);

  // ── Role-aware KPIs ────────────────────────────────────────────────
  const role     = $derived(data.user?.role ?? '');
  const isAdmin  = $derived(['owner', 'admin'].includes(role));
  const isLead   = $derived(role === 'lead');
  const isContrib= $derived(role === 'contributor');

  const myTasks      = $derived(tasks.filter((t: any) => t.assignedTo === data.user?.id));
  const blockedCount = $derived(tasks.filter((t: any) => t.status === 'Blocked').length);
  const doneCount    = $derived(tasks.filter((t: any) => t.status === 'Done').length);
  const totalEst     = $derived(tasks.reduce((s: number, t: any) => s + (t.estimateHours ?? 0), 0));
  const totalAct     = $derived(tasks.reduce((s: number, t: any) => s + (t.actualHours ?? 0), 0));
  const overdueTasks = $derived(tasks.filter((t: any) =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
  ).length);

  const avgCompletion = $derived(
    milestones.length
      ? Math.round(milestones.reduce((s, m) => s + (m.completionPct ?? 0), 0) / milestones.length)
      : 0
  );

  // ── Modal: create milestone ────────────────────────────────────────
  let modalOpen  = $state(false);
  let saving     = $state(false);
  let saveError  = $state('');
  let form = $state({
    title: '', strategicGoal: '', description: '',
    priority: 'Medium', status: 'Planning',
    startDate: '', endDate: '',
    clientId: '' as string, clientName: '' as string,
  });

  // ── Company typeahead ──────────────────────────────────────────────
  let clientQuery   = $state('');
  let clientResults = $state<{ id: string; name: string }[]>([]);
  let clientTimer   = $state<ReturnType<typeof setTimeout> | null>(null);

  function onClientInput() {
    if (clientTimer) clearTimeout(clientTimer);
    if (!clientQuery.trim()) { clientResults = []; return; }
    clientTimer = setTimeout(async () => {
      const res = await fetch(`/api/crm/companies?search=${encodeURIComponent(clientQuery)}&limit=8`).catch(() => null);
      if (res?.ok) {
        const d = await res.json();
        clientResults = (d.companies ?? []).map((c: any) => ({ id: c.id, name: c.name }));
      } else {
        console.error('[client search] status:', res?.status, await res?.text().catch(() => ''));
      }
    }, 250);
  }

  function selectCompany(c: { id: string; name: string }) {
    form.clientId   = c.id;
    form.clientName = c.name;
    clientQuery     = '';
    clientResults   = [];
  }

  function clearClient() {
    form.clientId   = '';
    form.clientName = '';
    clientQuery     = '';
    clientResults   = [];
  }

  function openModal() {
    form = { title: '', strategicGoal: '', description: '', priority: 'Medium', status: 'Planning', startDate: '', endDate: '', clientId: '', clientName: '' };
    clientQuery = ''; clientResults = [];
    saveError = '';
    modalOpen = true;
  }

  async function saveMilestone() {
    if (!form.title.trim()) { saveError = 'Title is required'; return; }
    saving = true; saveError = '';
    try {
      const body: Record<string, unknown> = { ...form };
      if (!body.clientId) delete body.clientId;
      delete body.clientName;
      const res = await fetch('/api/agile/milestones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Save failed'; return; }
      milestones = [d as AgileMilestone, ...milestones];
      modalOpen = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }

  // ── Filter ─────────────────────────────────────────────────────────
  let filterStatus   = $state('');
  let filterPriority = $state('');

  const visible = $derived(milestones.filter(m =>
    (!filterStatus   || m.status   === filterStatus)   &&
    (!filterPriority || m.priority === filterPriority)
  ));
</script>

<svelte:head><title>Agile Overview</title></svelte:head>

<div class="space-y-8">

  <!-- ── Role-aware KPI row ─────────────────────────────────────────── -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#if isAdmin}
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-primary/15"><TrendingUp size={16} class="size-4 text-primary"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Avg Completion</p>
          <p class="text-2xl font-bold">{avgCompletion}%</p>
          <p class="text-xs opacity-40">{milestones.length} milestones</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-error/15"><AlertCircle size={16} class="size-4 text-error"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Blocked Tasks</p>
          <p class="text-2xl font-bold">{blockedCount}</p>
          <p class="text-xs opacity-40">{overdueTasks} overdue</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-success/15"><CheckCircle size={16} class="size-4 text-success"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Tasks Done</p>
          <p class="text-2xl font-bold">{doneCount}</p>
          <p class="text-xs opacity-40">of {tasks.length} total</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-warning/15"><Clock size={16} class="size-4 text-warning"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Effort</p>
          <p class="text-2xl font-bold">{fmtEffort(totalAct)}</p>
          <p class="text-xs opacity-40">of {fmtEffort(totalEst)} estimated</p>
        </div>
      </div>
    {:else if isLead}
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-primary/15"><TrendingUp size={16} class="size-4 text-primary"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Active Milestones</p>
          <p class="text-2xl font-bold">{milestones.filter(m => m.status === 'Active').length}</p>
          <p class="text-xs opacity-40">{milestones.length} total</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-error/15"><AlertCircle size={16} class="size-4 text-error"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Blocked</p>
          <p class="text-2xl font-bold">{blockedCount}</p>
          <p class="text-xs opacity-40">tasks need attention</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-success/15"><CheckCircle size={16} class="size-4 text-success"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Completed</p>
          <p class="text-2xl font-bold">{doneCount}</p>
          <p class="text-xs opacity-40">tasks done</p>
        </div>
      </div>
      <RoleQuickView user={data.user} />
    {:else}
      <!-- Contributor / Viewer: personal dashboard -->
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-primary/15"><Clock size={16} class="size-4 text-primary"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">My Tasks</p>
          <p class="text-2xl font-bold">{myTasks.length}</p>
          <p class="text-xs opacity-40">assigned to me</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-success/15"><CheckCircle size={16} class="size-4 text-success"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Done</p>
          <p class="text-2xl font-bold">{myTasks.filter((t: any) => t.status === 'Done').length}</p>
          <p class="text-xs opacity-40">of my tasks</p>
        </div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
        <div class="p-2 rounded-lg bg-error/15"><AlertCircle size={16} class="size-4 text-error"/></div>
        <div>
          <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Blocked</p>
          <p class="text-2xl font-bold">{myTasks.filter((t: any) => t.status === 'Blocked').length}</p>
          <p class="text-xs opacity-40">of my tasks</p>
        </div>
      </div>
      <RoleQuickView user={data.user} />
    {/if}
  </div>

  <!-- ── Milestones section ─────────────────────────────────────────── -->
  <section class="space-y-4">
    <div class="flex items-start justify-between gap-4">
      <h2 class="text-lg font-semibold">Milestones</h2>
      <div class="flex flex-col items-end gap-2">
        <!-- Filters -->
        <select class="select text-xs h-8 px-2" bind:value={filterStatus}>
          <option value="">All statuses</option>
          {#each MILESTONE_STATUSES as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
        <select class="select text-xs h-8 px-2" bind:value={filterPriority}>
          <option value="">All priorities</option>
          {#each PRIORITIES as p}
            <option value={p}>{p}</option>
          {/each}
        </select>
        {#if hasPermission(data.user, 'agile_milestones', 'create')}
          <button class="btn btn-primary btn-sm" onclick={openModal}>
            <Plus size={16} class="size-4" /> New Milestone
          </button>
        {/if}
      </div>
    </div>

    {#if visible.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center opacity-50">
        <Flag size={24} class="size-8 opacity-40 mx-auto mb-2" />
        <p class="text-sm">No milestones yet.{#if hasPermission(data.user, 'agile_milestones', 'create')} Create one to get started.{/if}</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each visible as milestone (milestone.id)}
          <MilestoneCard
            {milestone}
            onclick={() => goto(`/agile/milestones/${milestone.id}`)}
          />
        {/each}
      </div>
    {/if}
  </section>

</div>

<!-- ── New Milestone Modal ─────────────────────────────────────────── -->
{#if modalOpen}
  <Modal size="lg" label="New Milestone">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">New Milestone</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
          <X size={20} class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if saveError}
          <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
        {/if}

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ms-title">Title *</label>
          <input id="ms-title" type="text" class="input w-full" placeholder="Milestone title" bind:value={form.title} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ms-goal">Strategic Goal</label>
          <input id="ms-goal" type="text" class="input w-full" placeholder="What business outcome does this achieve?" bind:value={form.strategicGoal} />
        </div>

        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={form.description} placeholder="Describe this milestone…" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Priority</label>
            <select class="select w-full" bind:value={form.priority}>
              {#each PRIORITIES as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
            <select class="select w-full" bind:value={form.status}>
              {#each MILESTONE_STATUSES as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ms-start">Start Date</label>
            <input id="ms-start" type="date" class="input w-full" bind:value={form.startDate} />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="ms-end">End Date</label>
            <input id="ms-end" type="date" class="input w-full" bind:value={form.endDate} min={form.startDate} />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Client (optional)</label>
          {#if form.clientId}
            <div class="flex items-center gap-2">
              <span class="badge badge-outline text-sm px-3 py-1">{form.clientName}</span>
              <button type="button" class="btn btn-ghost btn-xs" onclick={clearClient}><X size={12} class="size-3" /></button>
            </div>
          {:else}
            <div class="relative">
              <input
                type="text"
                class="input w-full"
                placeholder="Search companies…"
                bind:value={clientQuery}
                oninput={onClientInput}
                autocomplete="off"
              />
              {#if clientResults.length > 0}
                <ul class="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-box shadow-lg overflow-hidden">
                  {#each clientResults as c (c.id)}
                    <li>
                      <button
                        type="button"
                        class="w-full text-left px-4 py-2 text-sm hover:bg-base-200 transition-colors"
                        onclick={() => selectCompany(c)}
                      >{c.name}</button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={saving} onclick={saveMilestone}>
          {saving ? 'Creating…' : 'Create Milestone'}
        </button>
      </footer>
  </Modal>
{/if}
