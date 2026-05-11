<script lang="ts">
  import { Pencil, X, Check } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    DEAL_STAGES, STAGE_COLOR, CRM_LEVEL, fmtCurrency, fmtDate, toDateInput,
    type CrmDeal, type CrmActivity,
  } from '$lib/utils/crm';
  import Breadcrumb from '$lib/components/crm/Breadcrumb.svelte';
  import ActivityItem from '$lib/components/crm/ActivityItem.svelte';

  const DEAL_TYPES = ['New Business', 'Upsell', 'Renewal', 'Partnership'];

  let { data }: { data: PageData } = $props();

  let deal       = $state<CrmDeal>(data.deal as CrmDeal);
  let activities = $state<CrmActivity[]>((data.activities ?? []) as CrmActivity[]);

  let editing   = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({
    title: deal.title,
    value: deal.value,
    stage: deal.stage,
    type: deal.type,
    probability: deal.probability,
    expectedCloseDate: toDateInput(deal.expectedCloseDate),
    description: deal.description ?? '',
    lostReason: deal.lostReason ?? '',
  });

  function startEdit() {
    form = {
      title: deal.title, value: deal.value, stage: deal.stage, type: deal.type,
      probability: deal.probability,
      expectedCloseDate: toDateInput(deal.expectedCloseDate),
      description: deal.description ?? '',
      lostReason: deal.lostReason ?? '',
    };
    editing = true; saveError = '';
  }

  async function saveEdit() {
    if (form.stage === 'Closed Lost' && !form.lostReason.trim()) {
      saveError = 'Lost reason is required when stage is Closed Lost';
      return;
    }
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: form.title, value: form.value, stage: form.stage, type: form.type,
          probability: form.probability,
          expectedCloseDate: form.expectedCloseDate || null,
          description: form.description, lostReason: form.lostReason,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); saveError = (d as any).message ?? 'Save failed'; return; }
      deal = { ...deal, ...form, stage: form.stage as CrmDeal['stage'] };
      editing = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }

  async function markActivityComplete(id: string) {
    const res = await fetch(`/api/crm/activities/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      activities = activities.map(a => a.id === id ? { ...a, completedAt: new Date().toISOString() } : a);
    }
  }

  const stageIdx  = $derived(DEAL_STAGES.indexOf(deal.stage));
  const crumbs = $derived([
    deal.companyId
      ? { label: deal.companyName ?? 'Company', href: `/crm/companies/${deal.companyId}`, colorClass: CRM_LEVEL.company.badge }
      : { label: 'Nexus', href: '/crm', colorClass: 'badge-ghost' },
    { label: deal.title, colorClass: CRM_LEVEL.deal.badge },
  ]);
</script>

<svelte:head><title>{deal.title} — Nexus</title></svelte:head>

<div class="space-y-6">
  <Breadcrumb {crumbs} />

  <div class="flex items-start justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold">{deal.title}</h2>
      <div class="flex items-center gap-2 mt-1">
        <span class="badge badge-sm {STAGE_COLOR[deal.stage] ?? 'badge-ghost'}">{deal.stage}</span>
        <span class="text-sm font-medium text-success">{fmtCurrency(deal.value, deal.currency)}</span>
        <span class="text-xs opacity-40">{deal.probability}% probability</span>
      </div>
    </div>
    {#if hasPermission(data.user, 'crm_deals', 'update') && !editing}
      <button class="btn btn-ghost btn-sm" onclick={startEdit}><Pencil class="size-4" /> Edit</button>
    {/if}
  </div>

  <!-- Stage progression bar -->
  {#if !['Closed Won', 'Closed Lost'].includes(deal.stage)}
    <div class="flex gap-1">
      {#each DEAL_STAGES.slice(0, 4) as s, i}
        <div class="flex-1 h-1.5 rounded-full {i <= stageIdx ? 'bg-primary' : 'bg-base-300'}"></div>
      {/each}
    </div>
  {/if}

  {#if editing}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Title</label>
        <input type="text" class="input w-full" bind:value={form.title} />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Value (USD)</label>
          <input type="number" min="0" class="input w-full" bind:value={form.value} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Probability %</label>
          <input type="number" min="0" max="100" class="input w-full" bind:value={form.probability} />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Stage</label>
          <select class="select w-full" bind:value={form.stage}>
            {#each DEAL_STAGES as s}<option value={s}>{s}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Expected Close</label>
          <input type="date" class="input w-full" bind:value={form.expectedCloseDate} />
        </div>
      </div>
      {#if form.stage === 'Closed Lost'}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Lost Reason *</label>
          <input type="text" class="input w-full" placeholder="Why was this deal lost?" bind:value={form.lostReason} />
        </div>
      {/if}
      <div class="flex gap-2 justify-end">
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = false)}>
          <X class="size-4" /> Cancel
        </button>
        <button type="button" class="btn btn-primary btn-sm" disabled={saving} onclick={saveEdit}>
          <Check class="size-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  {:else}
    <div class="grid lg:grid-cols-2 gap-4 text-sm">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center justify-between"><span class="opacity-50">Type</span><span>{deal.type}</span></div>
        <div class="flex items-center justify-between"><span class="opacity-50">Expected Close</span><span>{fmtDate(deal.expectedCloseDate)}</span></div>
        {#if deal.lostReason}
          <div class="flex items-center justify-between"><span class="opacity-50">Lost Reason</span><span class="text-error">{deal.lostReason}</span></div>
        {/if}
        {#if deal.description}
          <div class="pt-1 border-t border-base-300/50">
            <p class="opacity-50 mb-1">Description</p>
            <p>{deal.description}</p>
          </div>
        {/if}
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center justify-between"><span class="opacity-50">Added</span><span>{fmtDate(deal.createdAt)}</span></div>
        <div class="flex items-center justify-between"><span class="opacity-50">Company</span>
          {#if deal.companyId}
            <a href="/crm/companies/{deal.companyId}" class="text-primary hover:underline">{deal.companyName ?? 'View'}</a>
          {:else}
            <span class="opacity-40">—</span>
          {/if}
        </div>
        <div class="flex items-center justify-between"><span class="opacity-50">Contacts</span><span>{deal.contactIds?.length ?? 0}</span></div>
      </div>
    </div>
  {/if}

  <!-- Activities -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-1">
    <h3 class="text-sm font-semibold mb-2">Activities ({activities.length})</h3>
    {#if activities.length === 0}
      <p class="text-xs opacity-40">No activities logged.</p>
    {:else}
      {#each activities as activity (activity.id)}
        <ActivityItem
          {activity}
          onComplete={hasPermission(data.user, 'crm_activities', 'update') ? markActivityComplete : undefined}
        />
      {/each}
    {/if}
  </section>
</div>
