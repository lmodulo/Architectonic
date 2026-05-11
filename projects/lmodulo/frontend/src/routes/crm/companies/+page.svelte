<script lang="ts">
  import { goto } from '$app/navigation';
  import { Plus, X, Search } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    COMPANY_TYPES, COMPANY_INDUSTRIES, COMPANY_SIZES, type CrmCompany,
  } from '$lib/utils/crm';
  import CompanyCard from '$lib/components/crm/CompanyCard.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { data }: { data: PageData } = $props();

  let companies    = $state<CrmCompany[]>((data.companies ?? []) as CrmCompany[]);
  let total        = $state(data.total ?? 0);

  let search          = $state('');
  let filterType      = $state('');
  let filterIndustry  = $state('');

  let searchTimer: ReturnType<typeof setTimeout>;
  async function doSearch() {
    const params = new URLSearchParams();
    if (search.trim())    params.set('search',   search.trim());
    if (filterType)       params.set('type',      filterType);
    if (filterIndustry)   params.set('industry',  filterIndustry);
    const res = await fetch(`/api/crm/companies?${params}`);
    if (res.ok) { const d = await res.json(); companies = d.companies ?? []; total = d.total ?? 0; }
  }

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 300);
  }

  let modalOpen = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({
    name: '', domain: '', website: '', description: '',
    industry: 'Other', size: '1-10', type: 'Prospect',
  });

  function openModal() {
    form = { name: '', domain: '', website: '', description: '', industry: 'Other', size: '1-10', type: 'Prospect' };
    saveError = '';
    modalOpen = true;
  }

  async function save() {
    if (!form.name.trim()) { saveError = 'Company name is required'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch('/api/crm/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Save failed'; return; }
      companies = [d as CrmCompany, ...companies];
      total++;
      modalOpen = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>Companies — Nexus</title></svelte:head>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h2 class="text-lg font-semibold">Companies <span class="text-sm opacity-40 font-normal">({total})</span></h2>
    <div class="flex items-center gap-2 flex-wrap">
      <div class="relative">
        <Search class="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="search" placeholder="Search…" class="input input-sm pl-7 w-44"
          bind:value={search} oninput={onSearchInput}
        />
      </div>
      <select class="select select-sm" bind:value={filterType} onchange={doSearch}>
        <option value="">All types</option>
        {#each COMPANY_TYPES as t}<option value={t}>{t}</option>{/each}
      </select>
      <select class="select select-sm" bind:value={filterIndustry} onchange={doSearch}>
        <option value="">All industries</option>
        {#each COMPANY_INDUSTRIES as i}<option value={i}>{i}</option>{/each}
      </select>
      {#if hasPermission(data.user, 'crm_companies', 'create')}
        <button class="btn btn-primary btn-sm" onclick={openModal}>
          <Plus class="size-4" /> New Company
        </button>
      {/if}
    </div>
  </div>

  {#if companies.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center opacity-50">
      <p class="text-sm">No companies yet.{#if hasPermission(data.user, 'crm_companies', 'create')} Add one to get started.{/if}</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each companies as company (company.id)}
        <CompanyCard {company} onclick={() => goto(`/crm/companies/${company.id}`)} />
      {/each}
    </div>
  {/if}
</div>

{#if modalOpen}
  <Modal size="md" label="New Company">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Company</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>
    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="co-name">Company Name *</label>
        <input id="co-name" type="text" class="input w-full" bind:value={form.name} />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="co-domain">Domain</label>
          <input id="co-domain" type="text" class="input w-full" placeholder="acme.com" bind:value={form.domain} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="co-site">Website</label>
          <input id="co-site" type="text" class="input w-full" placeholder="https://…" bind:value={form.website} />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Industry</label>
          <select class="select w-full" bind:value={form.industry}>
            {#each COMPANY_INDUSTRIES as i}<option value={i}>{i}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Size</label>
          <select class="select w-full" bind:value={form.size}>
            {#each COMPANY_SIZES as s}<option value={s}>{s}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Type</label>
          <select class="select w-full" bind:value={form.type}>
            {#each COMPANY_TYPES as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Creating…' : 'Create Company'}
      </button>
    </footer>
  </Modal>
{/if}
