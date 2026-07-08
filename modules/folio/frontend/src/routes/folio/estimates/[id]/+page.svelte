<script lang="ts">
  import { Check, CheckCircle, Pencil, Printer, Send, Trash2, X, XCircle } from 'lucide-svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import { slide } from 'svelte/transition';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Estimate = {
    id:             string;
    estimateNumber: string;
    title:          string;
    customerId:     string;
    companyId?:     string;
    lineItems:      Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    subtotal:       number;
    taxRate:        number;
    taxAmount:      number;
    total:          number;
    currency:       string;
    status:         string;
    validUntil?:    string;
    notes?:         string;
    invoiceId?:     string | null;
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string };

  let estimate  = $state<Estimate>(data.estimate as Estimate);
  let customers = data.customers as Customer[];

  let saving    = $state(false);
  let saveError = $state('');
  let editing   = $state(false);
  let editForm  = $state({ ...estimate });
  let converting = $state(false);

  const STATUS_CLASS: Record<string, string> = {
    accepted: 'badge-success',
    declined: 'badge-error',
    sent:     'badge-warning',
    draft:    'badge-ghost',
    expired:  'badge-neutral',
  };

  const customer = $derived(customers.find(c => c.id === estimate.customerId));

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function patchEstimate(patch: Record<string, unknown>) {
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/finance/estimates/${estimate.id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        saveError = (d as { message?: string }).message ?? 'Save failed';
        return false;
      }
      await invalidateAll();
      return true;
    } catch {
      saveError = 'Network error';
      return false;
    } finally {
      saving = false;
    }
  }

  async function markSent() {
    const ok = await patchEstimate({ status: 'sent' });
    if (ok) estimate = { ...estimate, status: 'sent' };
  }

  async function markAccepted() {
    const ok = await patchEstimate({ status: 'accepted' });
    if (ok) estimate = { ...estimate, status: 'accepted' };
  }

  async function markDeclined() {
    const ok = await patchEstimate({ status: 'declined' });
    if (ok) estimate = { ...estimate, status: 'declined' };
  }

  async function saveEdit() {
    const ok = await patchEstimate({
      title:      editForm.title,
      status:     editForm.status,
      validUntil: editForm.validUntil,
      notes:      editForm.notes,
    });
    if (ok) {
      estimate = { ...estimate, title: editForm.title, status: editForm.status, validUntil: editForm.validUntil, notes: editForm.notes };
      editing = false;
    }
  }

  async function convertToInvoice() {
    converting = true; saveError = '';
    try {
      const res = await fetch(`/api/finance/estimates/${estimate.id}/convert`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        saveError = (d as { message?: string }).message ?? 'Conversion failed';
        return;
      }
      goto(`/folio/invoices/${(d as { invoiceId: string }).invoiceId}`);
    } catch {
      saveError = 'Network error';
    } finally {
      converting = false;
    }
  }

  async function deleteEstimate() {
    if (!confirm('Delete this estimate? This cannot be undone.')) return;
    saving = true;
    try {
      const res = await fetch(`/api/finance/estimates/${estimate.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        goto('/folio/estimates');
      } else {
        const d = await res.json().catch(() => ({}));
        saveError = (d as { message?: string }).message ?? 'Delete failed';
      }
    } catch {
      saveError = 'Network error';
    } finally {
      saving = false;
    }
  }

  const canConvert = $derived(
    !estimate.invoiceId &&
    estimate.status !== 'declined' &&
    estimate.status !== 'expired'
  );
</script>

<svelte:head><title>{estimate.estimateNumber} — Folio</title></svelte:head>

<div class="space-y-6 -mt-6">
  <div class="space-y-4">
    <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Estimates', href: '/folio/estimates' }, { label: estimate.estimateNumber }]} />
    <div class="space-y-1 min-w-0">
      <h1 class="text-2xl font-bold font-mono leading-tight">{estimate.estimateNumber}</h1>
      {#if estimate.title}
        <p class="text-base font-medium">{estimate.title}</p>
      {/if}
      {#if customer}
        <p class="text-sm opacity-60">{customer.firstName} {customer.lastName}{customer.companyName ? ` — ${customer.companyName}` : ''}</p>
      {/if}
    </div>
    <div class="flex items-center justify-between gap-4 border-t border-base-300/60 pt-3">
      <div class="flex items-center gap-2">
        <span class="badge {STATUS_CLASS[estimate.status] ?? 'badge-ghost'}">{estimate.status}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <button class="btn btn-ghost btn-sm" onclick={() => window.open(`/estimate/${estimate.id}`, '_blank')} title="Print / Save as PDF">
          <Printer size={16} class="size-4" />
        </button>
        {#if hasPermission(data.user, 'finance_estimates', 'update') && !editing}
          <button class="btn btn-ghost btn-sm" onclick={() => { editForm = { ...estimate }; editing = true; }}>
            <Pencil size={16} class="size-4" /> Edit
          </button>
        {/if}
        {#if estimate.status === 'draft' && hasPermission(data.user, 'finance_estimates', 'update')}
          <button class="btn btn-outline btn-sm" disabled={saving} onclick={markSent}>
            <Send size={16} class="size-4" /> Send to client
          </button>
        {/if}
        {#if estimate.status === 'sent' && hasPermission(data.user, 'finance_estimates', 'update')}
          <button class="btn btn-success btn-sm" disabled={saving} onclick={markAccepted}>
            <CheckCircle size={16} class="size-4" /> Accept
          </button>
          <button class="btn btn-error btn-outline btn-sm" disabled={saving} onclick={markDeclined}>
            <XCircle size={16} class="size-4" /> Decline
          </button>
        {/if}
        {#if canConvert && hasPermission(data.user, 'finance_invoices', 'create')}
          <button class="btn btn-primary btn-sm" disabled={converting} onclick={convertToInvoice}>
            <CheckCircle size={16} class="size-4" />
            {converting ? 'Converting…' : 'Convert to Invoice'}
          </button>
        {/if}
        {#if hasPermission(data.user, 'finance_estimates', 'delete') && !estimate.invoiceId}
          <button class="btn btn-ghost btn-sm text-error" disabled={saving} onclick={deleteEstimate}>
            <Trash2 size={16} class="size-4" />
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if saveError}
    <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
  {/if}

  {#if editing}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4" transition:slide={{ duration: 200 }}>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-title">Title</label>
        <input id="edit-title" type="text" class="input w-full" placeholder="e.g. Website Redesign 2026" bind:value={editForm.title} />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-status">Status</label>
          <select id="edit-status" class="select w-full" bind:value={editForm.status}>
            {#each ['draft', 'sent', 'accepted', 'declined', 'expired'] as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-valid">Valid until</label>
          <input
            id="edit-valid"
            type="date"
            class="input w-full"
            value={editForm.validUntil ? editForm.validUntil.substring(0, 10) : ''}
            oninput={(e) => { editForm = { ...editForm, validUntil: (e.currentTarget as HTMLInputElement).value }; }}
          />
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-notes">Notes</label>
        <textarea id="edit-notes" class="textarea w-full" rows="2" bind:value={editForm.notes}></textarea>
      </div>

      <div class="flex gap-2 justify-end">
        <button class="btn btn-ghost btn-sm" onclick={() => (editing = false)}><X size={16} class="size-4" /> Cancel</button>
        <button class="btn btn-primary btn-sm" disabled={saving} onclick={saveEdit}><Check size={16} class="size-4" /> {saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  {/if}

  <!-- Line items -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
    <h2 class="text-sm font-semibold">Line Items</h2>
    {#each estimate.lineItems ?? [] as item (item.description)}
      <div class="flex items-center justify-between text-sm">
        <span class="flex-1">{item.description}</span>
        <span class="opacity-60 w-24 text-right">{item.quantity} × {fmtCurrency(item.unitPrice)}</span>
        <span class="w-24 text-right font-medium">{fmtCurrency(item.amount)}</span>
      </div>
    {/each}
    <div class="border-t border-base-300 pt-3 space-y-1 text-sm">
      <div class="flex justify-between">
        <span class="opacity-60">Subtotal</span>
        <span>{fmtCurrency(estimate.subtotal)}</span>
      </div>
      {#if estimate.taxRate > 0}
        <div class="flex justify-between">
          <span class="opacity-60">Tax ({estimate.taxRate}%)</span>
          <span>{fmtCurrency(estimate.taxAmount)}</span>
        </div>
      {/if}
      <div class="flex justify-between font-semibold text-base pt-1">
        <span>Total</span>
        <span>{fmtCurrency(estimate.total)}</span>
      </div>
    </div>
  </div>

  <!-- Meta -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2 text-sm">
    <div class="flex justify-between"><span class="opacity-60">Currency</span><span>{estimate.currency}</span></div>
    <div class="flex justify-between"><span class="opacity-60">Valid until</span><span>{fmtDate(estimate.validUntil)}</span></div>
    {#if estimate.invoiceId}
      <div class="flex justify-between">
        <span class="opacity-60">Invoice</span>
        <a href="/folio/invoices/{estimate.invoiceId}" class="link link-primary text-xs">View Invoice →</a>
      </div>
    {/if}
    {#if estimate.notes}
      <div class="pt-2 border-t border-base-300">
        <p class="opacity-60 text-xs mb-1">Notes</p>
        <p>{estimate.notes}</p>
      </div>
    {/if}
  </div>
</div>
