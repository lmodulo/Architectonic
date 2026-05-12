<script lang="ts">
  import { goto } from '$app/navigation';
  import { Pencil, Trash2, X, Check, UserPlus, UserCheck } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    CONTACT_STATUSES, CONTACT_ROLES, CONTACT_SOURCES, CRM_LEVEL,
    STAGE_COLOR, fmtCurrency, fmtDate, type CrmContact, type CrmDeal, type CrmActivity,
  } from '$lib/utils/crm';
  import Breadcrumb from '$lib/components/crm/Breadcrumb.svelte';
  import ActivityItem from '$lib/components/crm/ActivityItem.svelte';

  let { data }: { data: PageData } = $props();

  let contact    = $state<CrmContact>(data.contact as CrmContact);
  let deals      = $state<CrmDeal[]>((data.deals ?? []) as CrmDeal[]);
  let activities = $state<CrmActivity[]>((data.activities ?? []) as CrmActivity[]);

  let editing        = $state(false);
  let saving         = $state(false);
  let saveError      = $state('');
  let converting     = $state(false);
  let convertSuccess = $state('');
  let convertError   = $state('');
  let form = $state({ ...contact });

  function startEdit() { form = { ...contact }; editing = true; saveError = ''; }

  async function convertToClient() {
    converting = true; convertError = ''; convertSuccess = '';
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}/convert`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        convertError = (d as { message?: string }).message ?? 'Conversion failed';
        return;
      }
      contact = { ...contact, isUser: true };
      convertSuccess = `Password setup email sent to ${contact.email}`;
    } catch {
      convertError = 'Network error';
    } finally {
      converting = false;
    }
  }

  const canConvert = $derived(
    !!contact.email && !!contact.companyId && !contact.isUser
  );

  async function saveEdit() {
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone,
          role: form.role, status: form.status,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); saveError = (d as any).message ?? 'Save failed'; return; }
      contact = { ...contact, ...form };
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

  const crumbs = $derived([
    contact.companyId
      ? { label: contact.companyName ?? 'Company', href: `/crm/companies/${contact.companyId}`, colorClass: CRM_LEVEL.company.badge }
      : { label: 'Nexus', href: '/crm', colorClass: 'badge-ghost' },
    { label: `${contact.firstName} ${contact.lastName}`, colorClass: CRM_LEVEL.contact.badge },
  ]);
</script>

<svelte:head><title>{contact.firstName} {contact.lastName} — Nexus</title></svelte:head>

<div class="space-y-6">
  <Breadcrumb {crumbs} />

  <div class="flex items-start justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold">{contact.firstName} {contact.lastName}</h2>
      <p class="text-sm opacity-50">{contact.role}{contact.companyName ? ` · ${contact.companyName}` : ''}</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      {#if hasPermission(data.user, 'crm_contacts', 'update') && !editing}
        <button class="btn btn-ghost btn-sm" onclick={startEdit}><Pencil class="size-4" /> Edit</button>
      {/if}
      {#if contact.isUser}
        <span class="badge badge-primary gap-1.5 px-3 py-2.5">
          <UserCheck class="size-3.5" /> Client Portal Active
        </span>
      {:else if hasPermission(data.user, 'crm_contacts', 'update') && canConvert}
        <button class="btn btn-secondary btn-sm" disabled={converting} onclick={convertToClient}>
          <UserPlus class="size-4" />
          {converting ? 'Converting…' : 'Convert to Client'}
        </button>
      {/if}
    </div>
  </div>

  {#if convertSuccess}
    <aside class="alert alert-success p-3 rounded text-sm">{convertSuccess}</aside>
  {/if}
  {#if convertError}
    <aside class="alert alert-error p-3 rounded text-sm">{convertError}</aside>
  {/if}

  <!-- Edit form or detail view -->
  {#if editing}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">First Name</label>
          <input type="text" class="input w-full" bind:value={form.firstName} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Last Name</label>
          <input type="text" class="input w-full" bind:value={form.lastName} />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Email</label>
          <input type="email" class="input w-full" bind:value={form.email} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Phone</label>
          <input type="text" class="input w-full" bind:value={form.phone} />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
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
      </div>
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
    <div class="grid lg:grid-cols-2 gap-4">
      <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="opacity-50">Email</span>
          <span>{contact.email ?? '—'}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="opacity-50">Phone</span>
          <span>{contact.phone ?? '—'}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="opacity-50">Role</span>
          <span class="badge badge-sm badge-ghost">{contact.role}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="opacity-50">Status</span>
          <span class="badge badge-sm badge-secondary badge-soft">{contact.status}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="opacity-50">Source</span>
          <span>{contact.source ?? '—'}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="opacity-50">Added</span>
          <span>{fmtDate(contact.createdAt)}</span>
        </div>

        {#if contact.isUser}
          <div class="border-t border-base-300 pt-3 mt-1 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-40">Portal Account</p>
            <div class="flex items-center justify-between">
              <span class="opacity-50">Username</span>
              <span class="font-mono text-xs">{contact.userUsername}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="opacity-50">Account created</span>
              <span>{fmtDate(contact.userCreatedAt ?? undefined)}</span>
            </div>
            {#if hasPermission(data.user, 'finance_invoices', 'read')}
              <div class="flex items-center justify-between">
                <span class="opacity-50">Invoices</span>
                <a
                  href="/folio/invoices?customerId={contact.userId}"
                  class="link link-primary text-xs"
                  onclick={(e) => e.stopPropagation()}
                >View in Folio →</a>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Deals -->
      <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
        <h3 class="text-sm font-semibold mb-2">Deals ({deals.length})</h3>
        {#if deals.length === 0}
          <p class="text-xs opacity-40">No deals linked.</p>
        {:else}
          {#each deals as deal (deal.id)}
            <button
              type="button"
              class="w-full text-left flex items-center justify-between gap-2 py-1.5 text-sm border-b border-base-300/50 last:border-0 hover:opacity-80"
              onclick={() => goto(`/crm/deals/${deal.id}`)}
            >
              <span class="font-medium truncate">{deal.title}</span>
              <div class="flex items-center gap-2 shrink-0">
                <span class="badge badge-xs {STAGE_COLOR[deal.stage] ?? 'badge-ghost'}">{deal.stage}</span>
                <span class="text-xs text-success">{fmtCurrency(deal.value)}</span>
              </div>
            </button>
          {/each}
        {/if}
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
