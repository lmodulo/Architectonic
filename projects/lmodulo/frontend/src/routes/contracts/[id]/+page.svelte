<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import { fade, slide } from 'svelte/transition';
  import {
    ArrowLeft, Building2, CalendarDays, DollarSign,
    Send, Ban, Trash2, Edit3, Check, X, UserPlus, Plus, Printer
  } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let c = $derived(data.contract);

  const STATUS_COLORS: Record<string, string> = {
    draft:             'badge-ghost',
    pending_signature: 'badge-warning',
    signed:            'badge-success',
    active:            'badge-primary',
    expired:           'badge-error',
    voided:            'badge-neutral',
  };

  const TYPE_LABELS: Record<string, string> = {
    msa: 'MSA', sow: 'SOW', nda: 'NDA', custom: 'Custom',
  };

  // Edit state
  let editing          = $state(false);
  let editTitle        = $state('');
  let editContent      = $state('');
  let editType         = $state('custom');
  let editCompanyId    = $state('');
  let editValue        = $state('');
  let editCurrency     = $state('USD');
  let editEffDate      = $state('');
  let editExpDate      = $state('');
  let saving           = $state(false);
  let err              = $state('');

  function startEdit() {
    editTitle     = c.title;
    editContent   = c.content ?? '';
    editType      = c.type ?? 'custom';
    editCompanyId = c.companyId ?? '';
    editValue     = c.value != null ? String(c.value) : '';
    editCurrency  = c.currency ?? 'USD';
    editEffDate   = c.effectiveDate ? c.effectiveDate.slice(0, 10) : '';
    editExpDate   = c.expiryDate    ? c.expiryDate.slice(0, 10)    : '';
    editing       = true;
    err           = '';
  }

  async function saveEdit() {
    if (!editTitle.trim()) { err = 'Title is required.'; return; }
    saving = true;
    err = '';
    try {
      const payload: Record<string, unknown> = {
        title:    editTitle.trim(),
        content:  editContent,
        type:     editType,
        currency: editCurrency,
      };
      if (editCompanyId)    payload.companyId     = editCompanyId;
      if (editValue !== '') payload.value         = Number(editValue);
      if (editEffDate)      payload.effectiveDate = editEffDate;
      if (editExpDate)      payload.expiryDate    = editExpDate;

      const res = await fetch(`/api/contracts/${c.id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        err = (d as any).message ?? 'Failed to save.';
        return;
      }
      editing = false;
      await invalidateAll();
    } catch {
      err = 'Network error.';
    } finally {
      saving = false;
    }
  }

  // Send for signature
  let showSendModal  = $state(false);
  let newSignerName  = $state('');
  let newSignerEmail = $state('');
  let newSignerRole  = $state('client');
  let signers: Array<{name: string; email: string; role: string}> = $state([]);
  let sendErr        = $state('');
  let sending        = $state(false);

  function addSigner() {
    if (!newSignerName.trim() || !newSignerEmail.trim()) return;
    signers = [...signers, { name: newSignerName.trim(), email: newSignerEmail.trim().toLowerCase(), role: newSignerRole }];
    newSignerName  = '';
    newSignerEmail = '';
    newSignerRole  = 'client';
  }

  function removeSigner(i: number) {
    signers = signers.filter((_, idx) => idx !== i);
  }

  async function sendForSignature() {
    if (!signers.length) { sendErr = 'Add at least one signer.'; return; }
    sending = true;
    sendErr = '';
    try {
      const res = await fetch(`/api/contracts/${c.id}/send`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ signers }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        sendErr = (d as any).message ?? 'Failed to send.';
        return;
      }
      showSendModal = false;
      signers = [];
      await invalidateAll();
    } catch {
      sendErr = 'Network error.';
    } finally {
      sending = false;
    }
  }

  // Void
  async function voidContract() {
    if (!confirm('Void this contract? This cannot be undone.')) return;
    const res = await fetch(`/api/contracts/${c.id}/void`, { method: 'POST' });
    if (res.ok) await invalidateAll();
  }

  // Delete
  async function deleteContract() {
    if (!confirm('Delete this draft contract?')) return;
    const res = await fetch(`/api/contracts/${c.id}`, { method: 'DELETE' });
    if (res.ok) goto('/contracts');
  }

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtCurrency(v: number | null, currency = 'USD') {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);
  }

  const canEdit = $derived(
    hasPermission(data.user, 'contracts', 'update') &&
    (c.status === 'draft' || c.status === 'active')
  );
  const canSend = $derived(
    hasPermission(data.user, 'contracts', 'update') &&
    (c.status === 'draft' || c.status === 'active')
  );
  const canVoid = $derived(
    hasPermission(data.user, 'contracts', 'update') &&
    !['voided', 'draft'].includes(c.status)
  );
  const canDelete = $derived(
    hasPermission(data.user, 'contracts', 'delete') &&
    c.status === 'draft'
  );
</script>

<div class="flex flex-col gap-6">

  <!-- Header -->
  <div class="flex items-start justify-between gap-3 flex-wrap">
    <div class="flex items-start gap-3">
      <a href="/contracts" class="btn btn-ghost btn-square btn-sm mt-0.5"><ArrowLeft class="size-4" /></a>
      <div class="flex flex-col gap-1.5">
        {#if editing}
          <input transition:fade={{ duration: 150 }} type="text" class="input input-bordered text-xl font-semibold w-full" bind:value={editTitle} />
        {:else}
          <h2 transition:fade={{ duration: 150 }} class="text-xl font-semibold">{c.title}</h2>
        {/if}
        <div class="flex items-center gap-2 flex-wrap">
          {#if editing}
            <select transition:fade={{ duration: 150 }} class="select select-bordered select-sm" bind:value={editType}>
              <option value="msa">MSA</option>
              <option value="sow">SOW</option>
              <option value="nda">NDA</option>
              <option value="custom">Custom</option>
            </select>
          {:else}
            <span transition:fade={{ duration: 150 }} class="badge badge-ghost badge-sm">{TYPE_LABELS[c.type] ?? c.type}</span>
          {/if}
          <span class="badge badge-sm {STATUS_COLORS[c.status] ?? 'badge-ghost'}">
            {c.status.replace(/_/g, ' ')}
          </span>
          {#if editing}
            <select transition:fade={{ duration: 150 }} class="select select-bordered select-sm" bind:value={editCompanyId}>
              <option value="">— No company —</option>
              {#each data.companies as co}
                <option value={co.id ?? co._id}>{co.name}</option>
              {/each}
            </select>
          {:else if c.companyName}
            <span transition:fade={{ duration: 150 }} class="flex items-center gap-1 text-sm text-base-content/60">
              <Building2 class="size-3" />
              {c.companyName}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="relative flex items-center gap-2 flex-wrap">
      {#if editing}
        <div transition:fade={{ duration: 150 }} class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" onclick={() => editing = false}><X class="size-4" /> Cancel</button>
          <button class="btn btn-primary btn-sm" onclick={saveEdit} disabled={saving}>
            <Check class="size-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      {:else}
        <div transition:fade={{ duration: 150 }} class="flex items-center gap-2 flex-wrap">
          <button class="btn btn-ghost btn-sm" onclick={() => window.open(`/contract/${c.id}`, '_blank')} title="Download / Print PDF">
            <Printer class="size-4" />
          </button>
          {#if canEdit}
            <button class="btn btn-ghost btn-sm" onclick={startEdit}>
              <Edit3 class="size-4" /> Edit
            </button>
          {/if}
          {#if canSend}
            <button class="btn btn-primary btn-sm" onclick={() => showSendModal = true}>
              <Send class="size-4" /> Send for Signature
            </button>
          {/if}
          {#if canVoid}
            <button class="btn btn-ghost btn-sm text-warning" onclick={voidContract}>
              <Ban class="size-4" /> Void
            </button>
          {/if}
          {#if canDelete}
            <button class="btn btn-ghost btn-sm text-error" onclick={deleteContract}>
              <Trash2 class="size-4" />
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  {#if err}
    <div class="alert alert-error text-sm">{err}</div>
  {/if}

  <!-- Meta row -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="card bg-base-200 p-3">
      <p class="text-xs text-base-content/50 mb-1">Value</p>
      {#if editing}
        <div transition:fade={{ duration: 150 }} class="flex gap-1">
          <input
            type="number"
            class="input input-bordered input-xs flex-1 min-w-0"
            bind:value={editValue}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <select class="select select-bordered select-xs w-[4.5rem]" bind:value={editCurrency}>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
            <option>AUD</option>
          </select>
        </div>
      {:else}
        <p transition:fade={{ duration: 150 }} class="font-medium text-sm flex items-center gap-1">
          <DollarSign class="size-3 opacity-50" />
          {fmtCurrency(c.value, c.currency)}
        </p>
      {/if}
    </div>
    <div class="card bg-base-200 p-3">
      <p class="text-xs text-base-content/50 mb-1">Effective</p>
      {#if editing}
        <input transition:fade={{ duration: 150 }} type="date" class="input input-bordered input-xs w-full" bind:value={editEffDate} />
      {:else}
        <p transition:fade={{ duration: 150 }} class="font-medium text-sm flex items-center gap-1">
          <CalendarDays class="size-3 opacity-50" />
          {fmtDate(c.effectiveDate)}
        </p>
      {/if}
    </div>
    <div class="card bg-base-200 p-3">
      <p class="text-xs text-base-content/50 mb-1">Expires</p>
      {#if editing}
        <input transition:fade={{ duration: 150 }} type="date" class="input input-bordered input-xs w-full" bind:value={editExpDate} />
      {:else}
        <p transition:fade={{ duration: 150 }} class="font-medium text-sm flex items-center gap-1">
          <CalendarDays class="size-3 opacity-50" />
          {fmtDate(c.expiryDate)}
        </p>
      {/if}
    </div>
    <div class="card bg-base-200 p-3">
      <p class="text-xs text-base-content/50 mb-1">Created</p>
      <p class="font-medium text-sm">{fmtDate(c.createdAt)}</p>
    </div>
  </div>

  <!-- Signers panel -->
  {#if c.signerDetails?.length || c.signers?.length}
    <div class="card card-bordered">
      <div class="card-body p-4">
        <h3 class="font-medium text-sm mb-2">Signers</h3>
        <div class="flex flex-col gap-2">
          {#each (c.signerDetails ?? c.signers) as s}
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-sm font-medium">{s.name}</p>
                <p class="text-xs text-base-content/50">{s.email} · {s.role}</p>
              </div>
              <div class="flex flex-col items-end gap-0.5">
                <span class="badge badge-sm {s.status === 'signed' ? 'badge-success' : s.status === 'declined' ? 'badge-error' : 'badge-warning'}">
                  {s.status}
                </span>
                {#if s.signedAt}
                  <span class="text-xs text-base-content/40">{fmtDate(s.signedAt)}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Contract content -->
  <div class="card card-bordered">
    <div class="card-body p-4 sm:p-8">
      {#if editing}
        <div transition:slide={{ duration: 200 }}>
          <MessageEditor bind:html={editContent} placeholder="Contract content…" />
        </div>
      {:else}
        <!-- print-friendly prose -->
        <div transition:fade={{ duration: 150 }} class="prose prose-sm max-w-none contract-content">
          {@html c.content ?? '<p class="text-base-content/40 italic">No content.</p>'}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Send for signature modal -->
{#if showSendModal}
  <div class="modal modal-open">
    <div class="modal-box max-w-lg">
      <h3 class="font-semibold text-lg mb-4">Send for Signature</h3>

      {#if sendErr}
        <div class="alert alert-error alert-sm text-sm mb-3">{sendErr}</div>
      {/if}

      <!-- Signer list -->
      {#if signers.length}
        <div class="flex flex-col gap-2 mb-4">
          {#each signers as s, i}
            <div class="flex items-center gap-2 text-sm bg-base-200 rounded px-3 py-2">
              <span class="flex-1">{s.name} &lt;{s.email}&gt;</span>
              <span class="badge badge-ghost badge-xs">{s.role}</span>
              <button type="button" class="btn btn-ghost btn-xs" onclick={() => removeSigner(i)}>
                <X class="size-3" />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Add signer form -->
      <div class="flex flex-col gap-2 mb-4">
        <p class="text-sm font-medium">Add signer</p>
        <div class="grid grid-cols-2 gap-2">
          <input type="text" class="input input-bordered input-sm" placeholder="Full name" bind:value={newSignerName} />
          <input type="email" class="input input-bordered input-sm" placeholder="Email address" bind:value={newSignerEmail} />
        </div>
        <div class="flex gap-2">
          <select class="select select-bordered select-sm flex-1" bind:value={newSignerRole}>
            <option value="client">Client</option>
            <option value="provider">Provider</option>
            <option value="witness">Witness</option>
          </select>
          <button type="button" class="btn btn-outline btn-sm" onclick={addSigner}>
            <Plus class="size-4" /> Add
          </button>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" onclick={() => showSendModal = false}>Cancel</button>
        <button class="btn btn-primary" onclick={sendForSignature} disabled={sending || !signers.length}>
          <Send class="size-4" />
          {sending ? 'Sending…' : `Send to ${signers.length} signer${signers.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => showSendModal = false}></div>
  </div>
{/if}

<style>
  @media print {
    :global(aside), :global(header), :global(.modal) { display: none !important; }
    .contract-content { font-size: 11pt; }
  }
</style>
