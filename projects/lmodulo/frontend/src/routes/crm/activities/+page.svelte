<script lang="ts">
  import { Plus, X, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';
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

  // Pagination
  const PAGE_SIZE = 20;
  let currentPage = $state(1);
  const totalPages = $derived(Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const startItem  = $derived((currentPage - 1) * PAGE_SIZE + 1);
  const endItem    = $derived(Math.min(currentPage * PAGE_SIZE, total));

  function paginationPages(tot: number, cur: number) {
    const last = Math.max(1, Math.ceil(tot / PAGE_SIZE));
    const pages: Array<{ type: 'page'; value: number } | { type: 'ellipsis'; index: number }> = [];
    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || Math.abs(i - cur) <= 1) {
        pages.push({ type: 'page', value: i });
      } else if (pages[pages.length - 1]?.type === 'page') {
        pages.push({ type: 'ellipsis', index: pages.length });
      }
    }
    return pages;
  }
  const pages = $derived(paginationPages(total, currentPage));

  async function doSearch() {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    params.set('limit', String(PAGE_SIZE));
    params.set('skip',  String((currentPage - 1) * PAGE_SIZE));
    const res = await fetch(`/api/crm/activities?${params}`);
    if (res.ok) { const d = await res.json(); activities = d.activities ?? []; total = d.total ?? 0; }
  }

  function gotoPage(n: number) { currentPage = n; doSearch(); }

  function onFilterChange() { currentPage = 1; doSearch(); }

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
  <div class="flex items-start justify-between gap-4">
    <h2 class="text-lg font-semibold">Activities <span class="text-sm opacity-40 font-normal">({total})</span></h2>
    <div class="flex flex-col items-end gap-2">
      <select class="select select-sm" bind:value={filterType} onchange={onFilterChange}>
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

  {#if activities.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center opacity-50">
      <p class="text-sm">No activities yet.{#if hasPermission(data.user, 'crm_activities', 'create')} Log one to get started.{/if}</p>
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box px-4 py-2">
      {#each activities as activity (activity.id)}
        <ActivityItem
          {activity}
          onComplete={hasPermission(data.user, 'crm_activities', 'update') ? markComplete : undefined}
        />
      {/each}
    </div>
    {#if totalPages > 1}
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs opacity-50">{startItem}–{endItem} of {total}</span>
        <div class="join">
          <button class="join-item btn btn-xs" disabled={currentPage === 1} onclick={() => gotoPage(1)}><ChevronFirst class="size-3" /></button>
          <button class="join-item btn btn-xs" disabled={currentPage === 1} onclick={() => gotoPage(currentPage - 1)}><ChevronLeft class="size-3" /></button>
          {#each pages as p}
            {#if p.type === 'ellipsis'}
              <button class="join-item btn btn-xs btn-disabled">…</button>
            {:else}
              <button class="join-item btn btn-xs {p.value === currentPage ? 'btn-active' : ''}" onclick={() => gotoPage(p.value)}>{p.value}</button>
            {/if}
          {/each}
          <button class="join-item btn btn-xs" disabled={currentPage === totalPages} onclick={() => gotoPage(currentPage + 1)}><ChevronRight class="size-3" /></button>
          <button class="join-item btn btn-xs" disabled={currentPage === totalPages} onclick={() => gotoPage(totalPages)}><ChevronLast class="size-3" /></button>
        </div>
      </div>
    {/if}
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
