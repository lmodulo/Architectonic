<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import { Send, CheckCircle, AlertCircle, Clock, Circle, Pencil, X, Check, Trash2 } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Invoice = {
    id:            string;
    invoiceNumber: string;
    customerId:    string;
    companyId?:    string;
    lineItems:     Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    subtotal:      number;
    taxRate:       number;
    taxAmount:     number;
    total:         number;
    currency:      string;
    status:        string;
    dueDate?:      string;
    notes?:        string;
    paidAt?:       string;
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string };

  let invoice   = $state<Invoice>(data.invoice as Invoice);
  let customers = data.customers as Customer[];

  let saving    = $state(false);
  let saveError = $state('');
  let editing   = $state(false);
  let editForm  = $state({ ...invoice });

  const STATUS_CLASS: Record<string, string> = {
    paid:    'badge-success',
    overdue: 'badge-error',
    sent:    'badge-warning',
    draft:   'badge-ghost',
  };

  const customer = $derived(customers.find(c => c.id === invoice.customerId));

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function patchInvoice(patch: Record<string, unknown>) {
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/finance/invoices/${invoice.id}`, {
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
    const ok = await patchInvoice({ status: 'sent' });
    if (ok) invoice = { ...invoice, status: 'sent' };
  }

  async function saveEdit() {
    const ok = await patchInvoice({
      status:  editForm.status,
      dueDate: editForm.dueDate,
      notes:   editForm.notes,
    });
    if (ok) {
      invoice = { ...invoice, status: editForm.status, dueDate: editForm.dueDate, notes: editForm.notes };
      editing = false;
    }
  }
</script>

<svelte:head><title>{invoice.invoiceNumber} — Folio</title></svelte:head>

<div class="space-y-6 max-w-2xl">
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Invoices', href: '/folio/invoices' }, { label: invoice.invoiceNumber }]} />
    </div>
    <div class="space-y-1 min-w-0">
      <h1 class="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
      {#if customer}
        <p class="text-sm opacity-60">{customer.firstName} {customer.lastName}{customer.companyName ? ` — ${customer.companyName}` : ''}</p>
      {/if}
    </div>
    <div class="flex items-center justify-between gap-4 border-t border-base-300/60 pt-3">
      <div class="flex items-center gap-2">
        <span class="badge {STATUS_CLASS[invoice.status] ?? 'badge-ghost'}">{invoice.status}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#if hasPermission(data.user, 'finance_invoices', 'update') && !editing}
          <button class="btn btn-ghost btn-sm" onclick={() => { editForm = { ...invoice }; editing = true; }}>
            <Pencil class="size-4" /> Edit
          </button>
        {/if}
        {#if invoice.status === 'draft' && hasPermission(data.user, 'finance_invoices', 'update')}
          <button class="btn btn-primary btn-sm" disabled={saving} onclick={markSent}>
            <Send class="size-4" /> Send to client
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if saveError}
    <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
  {/if}

  {#if editing}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-status">Status</label>
          <select id="edit-status" class="select w-full" bind:value={editForm.status}>
            {#each ['draft','sent','paid','overdue'] as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-due">Due date</label>
          <input
            id="edit-due"
            type="date"
            class="input w-full"
            value={editForm.dueDate ? editForm.dueDate.substring(0, 10) : ''}
            oninput={(e) => { editForm = { ...editForm, dueDate: (e.currentTarget as HTMLInputElement).value }; }}
          />
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-notes">Notes</label>
        <textarea id="edit-notes" class="textarea w-full" rows="2" bind:value={editForm.notes}></textarea>
      </div>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-ghost btn-sm" onclick={() => (editing = false)}><X class="size-4" /> Cancel</button>
        <button class="btn btn-primary btn-sm" disabled={saving} onclick={saveEdit}><Check class="size-4" /> {saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  {/if}

  <!-- Line items -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
    <h2 class="text-sm font-semibold">Line Items</h2>
    {#each invoice.lineItems ?? [] as item (item.description)}
      <div class="flex items-center justify-between text-sm">
        <span class="flex-1">{item.description}</span>
        <span class="opacity-60 w-24 text-right">{item.quantity} × {fmtCurrency(item.unitPrice)}</span>
        <span class="w-24 text-right font-medium">{fmtCurrency(item.amount)}</span>
      </div>
    {/each}
    <div class="border-t border-base-300 pt-3 space-y-1 text-sm">
      <div class="flex justify-between">
        <span class="opacity-60">Subtotal</span>
        <span>{fmtCurrency(invoice.subtotal)}</span>
      </div>
      {#if invoice.taxRate > 0}
        <div class="flex justify-between">
          <span class="opacity-60">Tax ({invoice.taxRate}%)</span>
          <span>{fmtCurrency(invoice.taxAmount)}</span>
        </div>
      {/if}
      <div class="flex justify-between font-semibold text-base pt-1">
        <span>Total</span>
        <span>{fmtCurrency(invoice.total)}</span>
      </div>
    </div>
  </div>

  <!-- Meta -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2 text-sm">
    <div class="flex justify-between"><span class="opacity-60">Due date</span><span>{fmtDate(invoice.dueDate)}</span></div>
    {#if invoice.paidAt}
      <div class="flex justify-between"><span class="opacity-60">Paid on</span><span class="text-success">{fmtDate(invoice.paidAt)}</span></div>
    {/if}
    {#if invoice.notes}
      <div class="pt-2 border-t border-base-300">
        <p class="opacity-60 text-xs mb-1">Notes</p>
        <p>{invoice.notes}</p>
      </div>
    {/if}
  </div>
</div>
