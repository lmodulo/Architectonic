<script lang="ts">
  import { Plus, X } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    ACTIVITY_TYPES, ACTIVITY_OUTCOMES, type CrmActivity,
  } from '$lib/utils/crm';
  import ActivityItem from '$lib/components/crm/ActivityItem.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { data }: { data: PageData } = $props();

  let activities = $state<CrmActivity[]>((data.activities ?? []) as CrmActivity[]);
  let total      = $state(data.total ?? 0);

  let filterType = $state('');

  const visible = $derived(
    filterType ? activities.filter(a => a.type === filterType) : activities
  );

  async function markComplete(id: string) {
    const res = await fetch(`/api/crm/activities/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      activities = activities.map(a =>
        a.id === id ? { ...a, completedAt: new Date().toISOString() } : a
      );
    }
  }

  let modalOpen = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({
    type: 'Call', title: '', body: '', scheduledAt: '', outcome: 'N/A',
  });

  function openModal() {
    form = { type: 'Call', title: '', body: '', scheduledAt: '', outcome: 'N/A' };
    saveError = '';
    modalOpen = true;
  }

  async function save() {
    if (!form.title.trim()) { saveError = 'Title is required'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Save failed'; return; }
      activities = [d as CrmActivity, ...activities];
      total++;
      modalOpen = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>Activities — Nexus</title></svelte:head>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h2 class="text-lg font-semibold">Activities <span class="text-sm opacity-40 font-normal">({total})</span></h2>
    <div class="flex items-center gap-2">
      <select class="select select-sm" bind:value={filterType}>
        <option value="">All types</option>
        {#each ACTIVITY_TYPES as t}<option value={t}>{t}</option>{/each}
      </select>
      {#if hasPermission(data.user, 'crm_activities', 'create')}
        <button class="btn btn-primary btn-sm" onclick={openModal}>
          <Plus class="size-4" /> Log Activity
        </button>
      {/if}
    </div>
  </div>

  {#if visible.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center opacity-50">
      <p class="text-sm">No activities yet.{#if hasPermission(data.user, 'crm_activities', 'create')} Log one to get started.{/if}</p>
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box px-4 py-2">
      {#each visible as activity (activity.id)}
        <ActivityItem
          {activity}
          onComplete={hasPermission(data.user, 'crm_activities', 'update') ? markComplete : undefined}
        />
      {/each}
    </div>
  {/if}
</div>

{#if modalOpen}
  <Modal size="md" label="Log Activity">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Log Activity</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>
    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Type</label>
          <select class="select w-full" bind:value={form.type}>
            {#each ACTIVITY_TYPES as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Outcome</label>
          <select class="select w-full" bind:value={form.outcome}>
            {#each ACTIVITY_OUTCOMES as o}<option value={o}>{o}</option>{/each}
          </select>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="a-title">Title *</label>
        <input id="a-title" type="text" class="input w-full" placeholder="Subject or brief description" bind:value={form.title} />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="a-body">Notes</label>
        <textarea id="a-body" class="textarea w-full" rows={3} bind:value={form.body}></textarea>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="a-sched">Scheduled At</label>
        <input id="a-sched" type="datetime-local" class="input w-full" bind:value={form.scheduledAt} />
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Saving…' : 'Log Activity'}
      </button>
    </footer>
  </Modal>
{/if}
