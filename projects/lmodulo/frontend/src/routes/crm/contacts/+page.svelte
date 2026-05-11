<script lang="ts">
  import { goto } from '$app/navigation';
  import { Plus, X, Search } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    CONTACT_STATUSES, CONTACT_ROLES, CONTACT_SOURCES, COMPANY_INDUSTRIES,
    type CrmContact,
  } from '$lib/utils/crm';
  import ContactCard from '$lib/components/crm/ContactCard.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { data }: { data: PageData } = $props();

  let contacts = $state<CrmContact[]>((data.contacts ?? []) as CrmContact[]);
  let total    = $state(data.total ?? 0);

  // Filters
  let search      = $state('');
  let filterStatus = $state('');
  let filterRole   = $state('');

  let searchTimer: ReturnType<typeof setTimeout>;
  async function doSearch() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filterStatus)  params.set('status', filterStatus);
    if (filterRole)    params.set('role',   filterRole);
    const res = await fetch(`/api/crm/contacts?${params}`);
    if (res.ok) { const d = await res.json(); contacts = d.contacts ?? []; total = d.total ?? 0; }
  }

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 300);
  }

  // Modal
  let modalOpen = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'Other', status: 'Prospect', source: 'Other',
  });

  function openModal() {
    form = { firstName: '', lastName: '', email: '', phone: '', role: 'Other', status: 'Prospect', source: 'Other' };
    saveError = '';
    modalOpen = true;
  }

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) { saveError = 'First and last name are required'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Save failed'; return; }
      contacts = [d as CrmContact, ...contacts];
      total++;
      modalOpen = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>Contacts — Nexus</title></svelte:head>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h2 class="text-lg font-semibold">Contacts <span class="text-sm opacity-40 font-normal">({total})</span></h2>
    <div class="flex items-center gap-2 flex-wrap">
      <div class="relative">
        <Search class="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="search" placeholder="Search…" class="input input-sm pl-7 w-44"
          bind:value={search} oninput={onSearchInput}
        />
      </div>
      <select class="select select-sm" bind:value={filterStatus} onchange={doSearch}>
        <option value="">All statuses</option>
        {#each CONTACT_STATUSES as s}<option value={s}>{s}</option>{/each}
      </select>
      <select class="select select-sm" bind:value={filterRole} onchange={doSearch}>
        <option value="">All roles</option>
        {#each CONTACT_ROLES as r}<option value={r}>{r}</option>{/each}
      </select>
      {#if hasPermission(data.user, 'crm_contacts', 'create')}
        <button class="btn btn-primary btn-sm" onclick={openModal}>
          <Plus class="size-4" /> New Contact
        </button>
      {/if}
    </div>
  </div>

  {#if contacts.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center opacity-50">
      <p class="text-sm">No contacts yet.{#if hasPermission(data.user, 'crm_contacts', 'create')} Add one to get started.{/if}</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each contacts as contact (contact.id)}
        <ContactCard {contact} onclick={() => goto(`/crm/contacts/${contact.id}`)} />
      {/each}
    </div>
  {/if}
</div>

{#if modalOpen}
  <Modal size="md" label="New Contact">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Contact</h2>
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
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="c-first">First Name *</label>
          <input id="c-first" type="text" class="input w-full" bind:value={form.firstName} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="c-last">Last Name *</label>
          <input id="c-last" type="text" class="input w-full" bind:value={form.lastName} />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="c-email">Email</label>
          <input id="c-email" type="email" class="input w-full" bind:value={form.email} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="c-phone">Phone</label>
          <input id="c-phone" type="text" class="input w-full" bind:value={form.phone} />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Role</label>
          <select class="select w-full" bind:value={form.role}>
            {#each CONTACT_ROLES as r}<option value={r}>{r}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Status</label>
          <select class="select w-full" bind:value={form.status}>
            {#each CONTACT_STATUSES as s}<option value={s}>{s}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Source</label>
          <select class="select w-full" bind:value={form.source}>
            {#each CONTACT_SOURCES as s}<option value={s}>{s}</option>{/each}
          </select>
        </div>
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Creating…' : 'Create Contact'}
      </button>
    </footer>
  </Modal>
{/if}
