<script lang="ts">
  import { Plus, X } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    DEAL_STAGES, DEAL_STAGES as ALL_STAGES, COMPANY_TYPES, type CrmDeal,
    fmtCurrency,
  } from '$lib/utils/crm';
  import DealKanban from '$lib/components/crm/DealKanban.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { data }: { data: PageData } = $props();

  let deals = $state<CrmDeal[]>((data.deals ?? []) as CrmDeal[]);

  async function handleStageChange(id: string, stage: string, lostReason?: string) {
    const body: Record<string, unknown> = { stage };
    if (lostReason) body.lostReason = lostReason;

    // Optimistic update
    deals = deals.map(d => d.id === id ? { ...d, stage: stage as CrmDeal['stage'] } : d);

    const res = await fetch(`/api/crm/deals/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Revert on failure — re-fetch
      const fresh = await fetch('/api/crm/deals?limit=500');
      if (fresh.ok) { const d = await fresh.json(); deals = d.deals ?? []; }
    }
  }

  // New deal modal
  let modalOpen = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({
    title: '', value: '', stage: 'Discovery', type: 'New Business',
    expectedCloseDate: '', description: '',
  });

  const DEAL_TYPES = ['New Business', 'Upsell', 'Renewal', 'Partnership'];

  function openModal() {
    form = { title: '', value: '', stage: 'Discovery', type: 'New Business', expectedCloseDate: '', description: '' };
    saveError = '';
    modalOpen = true;
  }

  async function save() {
    if (!form.title.trim()) { saveError = 'Title is required'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, value: Number(form.value) || 0 }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Save failed'; return; }
      deals = [d as CrmDeal, ...deals];
      modalOpen = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }

  const totalPipeline = $derived(
    deals.filter(d => d.stage !== 'Closed Lost').reduce((s, d) => s + (d.value ?? 0), 0)
  );
</script>

<svelte:head><title>Pipeline — Nexus</title></svelte:head>

<div class="space-y-4">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h2 class="text-lg font-semibold">Pipeline</h2>
      <p class="text-xs opacity-40">{fmtCurrency(totalPipeline)} total pipeline value</p>
    </div>
    {#if hasPermission(data.user, 'crm_deals', 'create')}
      <button class="btn btn-primary btn-sm" onclick={openModal}>
        <Plus class="size-4" /> New Deal
      </button>
    {/if}
  </div>

  <DealKanban {deals} onStageChange={handleStageChange} />
</div>

{#if modalOpen}
  <Modal size="md" label="New Deal">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Deal</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>
    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="d-title">Title *</label>
        <input id="d-title" type="text" class="input w-full" placeholder="Deal name" bind:value={form.title} />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="d-value">Value (USD)</label>
          <input id="d-value" type="number" min="0" class="input w-full" bind:value={form.value} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="d-close">Expected Close</label>
          <input id="d-close" type="date" class="input w-full" bind:value={form.expectedCloseDate} />
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
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Type</label>
          <select class="select w-full" bind:value={form.type}>
            {#each DEAL_TYPES as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Creating…' : 'Create Deal'}
      </button>
    </footer>
  </Modal>
{/if}
