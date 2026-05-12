<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import { Pencil, X, Check, Trash2, Plus } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Subscription = {
    id:              string;
    name:            string;
    customerId:      string;
    lineItems:       Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    taxRate:         number;
    currency:        string;
    billingCycle:    string;
    startDate:       string;
    nextBillingDate: string;
    endDate?:        string;
    dueDateOffsetDays?: number;
    status:          string;
    notes?:          string;
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string };
  type Invoice  = { id: string; invoiceNumber: string; total: number; status: string; createdAt?: string };

  let sub       = $state<Subscription>(data.subscription as Subscription);
  const customers = data.customers as Customer[];
  const invoices  = $derived(data.invoices as Invoice[]);

  let saving    = $state(false);
  let saveError = $state('');
  let editing   = $state(false);
  let editForm  = $state({
    name:              sub.name,
    taxRate:           sub.taxRate,
    currency:          sub.currency,
    billingCycle:      sub.billingCycle,
    endDate:           sub.endDate ? sub.endDate.substring(0, 10) : '',
    dueDateOffsetDays: sub.dueDateOffsetDays?.toString() ?? '',
    notes:             sub.notes ?? '',
  });
  let editLines = $state(sub.lineItems.map(i => ({ ...i })));

  const customer = $derived(customers.find(c => c.id === sub.customerId));

  const STATUS_CLASS: Record<string, string> = {
    active:    'badge-success',
    paused:    'badge-warning',
    cancelled: 'badge-ghost',
  };

  const INV_STATUS_CLASS: Record<string, string> = {
    paid:    'badge-success',
    overdue: 'badge-error',
    sent:    'badge-warning',
    draft:   'badge-ghost',
  };

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: sub.currency }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const subtotal  = $derived(sub.lineItems.reduce((s, i) => s + i.amount, 0));
  const taxAmount = $derived(subtotal * (sub.taxRate / 100));
  const total     = $derived(subtotal + taxAmount);

  async function patch(body: Record<string, unknown>) {
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/finance/subscriptions/${sub.id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        saveError = (d as { message?: string }).message ?? 'Save failed';
        return false;
      }
      await invalidateAll();
      return true;
    } catch { saveError = 'Network error'; return false; }
    finally { saving = false; }
  }

  async function saveEdit() {
    const validLines = editLines.filter(i => i.description.trim());
    if (!validLines.length) { saveError = 'At least one line item is required'; return; }
    const ok = await patch({
      name:              editForm.name,
      taxRate:           editForm.taxRate,
      currency:          editForm.currency,
      billingCycle:      editForm.billingCycle,
      endDate:           editForm.endDate || null,
      dueDateOffsetDays: editForm.dueDateOffsetDays ? Number(editForm.dueDateOffsetDays) : null,
      notes:             editForm.notes,
      lineItems:         validLines,
    });
    if (ok) editing = false;
  }

  async function setStatus(status: string) {
    const ok = await patch({ status });
    if (ok) sub = { ...sub, status };
  }

  function addLine() { editLines = [...editLines, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]; }
  function removeLine(i: number) { if (editLines.length > 1) editLines = editLines.filter((_, idx) => idx !== i); }
</script>

<svelte:head><title>{sub.name} — Folio</title></svelte:head>

<div class="space-y-6 max-w-2xl">
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Subscriptions', href: '/folio/subscriptions' }, { label: sub.name }]} />
    </div>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{sub.name}</h1>
        {#if customer}
          <p class="text-sm opacity-60">{customer.firstName} {customer.lastName}{customer.companyName ? ` — ${customer.companyName}` : ''}</p>
        {/if}
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="badge {STATUS_CLASS[sub.status] ?? 'badge-ghost'}">{sub.status}</span>
        {#if hasPermission(data.user, 'finance_subscriptions', 'update') && !editing}
          <button class="btn btn-ghost btn-sm" onclick={() => { editForm = { name: sub.name, taxRate: sub.taxRate, currency: sub.currency, billingCycle: sub.billingCycle, endDate: sub.endDate ? sub.endDate.substring(0, 10) : '', dueDateOffsetDays: sub.dueDateOffsetDays?.toString() ?? '', notes: sub.notes ?? '' }; editLines = sub.lineItems.map(i => ({ ...i })); editing = true; }}>
            <Pencil class="size-4" /> Edit
          </button>
          {#if sub.status === 'active'}
            <button class="btn btn-warning btn-sm" disabled={saving} onclick={() => setStatus('paused')}>Pause</button>
          {:else if sub.status === 'paused'}
            <button class="btn btn-success btn-sm" disabled={saving} onclick={() => setStatus('active')}>Resume</button>
          {/if}
          {#if sub.status !== 'cancelled'}
            <button class="btn btn-error btn-sm" disabled={saving} onclick={() => setStatus('cancelled')}>Cancel</button>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  {#if saveError}
    <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
  {/if}

  {#if editing}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Name</label>
        <input type="text" class="input w-full" bind:value={editForm.name} />
      </div>

      <!-- Edit line items -->
      <div class="space-y-2">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Line Items</p>
        {#each editLines as item, i (i)}
          <div class="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
            <input type="text" class="input input-sm w-full" placeholder="Description" bind:value={item.description} />
            <input type="number" class="input input-sm w-full" placeholder="Qty" min="0" step="1" bind:value={item.quantity} oninput={() => { item.amount = item.quantity * item.unitPrice; }} />
            <input type="number" class="input input-sm w-full" placeholder="Unit price" min="0" step="0.01" bind:value={item.unitPrice} oninput={() => { item.amount = item.quantity * item.unitPrice; }} />
            <button type="button" class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100" onclick={() => removeLine(i)} disabled={editLines.length === 1}><Trash2 class="size-3.5" /></button>
          </div>
        {/each}
        <button type="button" class="btn btn-ghost btn-sm" onclick={addLine}><Plus class="size-4" /> Add line</button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Billing Cycle</label>
          <select class="select w-full" bind:value={editForm.billingCycle}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Currency</label>
          <input type="text" class="input w-full" bind:value={editForm.currency} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Tax Rate (%)</label>
          <input type="number" class="input w-full" min="0" max="100" step="0.1" bind:value={editForm.taxRate} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Due Offset (days)</label>
          <input type="number" class="input w-full" min="0" step="1" bind:value={editForm.dueDateOffsetDays} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">End Date</label>
          <input type="date" class="input w-full" bind:value={editForm.endDate} />
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Notes</label>
        <textarea class="textarea w-full" rows="2" bind:value={editForm.notes}></textarea>
      </div>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-ghost btn-sm" onclick={() => (editing = false)}><X class="size-4" /> Cancel</button>
        <button class="btn btn-primary btn-sm" disabled={saving} onclick={saveEdit}><Check class="size-4" /> {saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  {/if}

  <!-- Line items & totals -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
    <h2 class="text-sm font-semibold">Line Items</h2>
    {#each sub.lineItems as item (item.description)}
      <div class="flex items-center justify-between text-sm">
        <span class="flex-1">{item.description}</span>
        <span class="opacity-60 w-24 text-right">{item.quantity} × {fmtCurrency(item.unitPrice)}</span>
        <span class="w-24 text-right font-medium">{fmtCurrency(item.amount)}</span>
      </div>
    {/each}
    <div class="border-t border-base-300 pt-3 space-y-1 text-sm">
      <div class="flex justify-between"><span class="opacity-60">Subtotal</span><span>{fmtCurrency(subtotal)}</span></div>
      {#if sub.taxRate > 0}
        <div class="flex justify-between"><span class="opacity-60">Tax ({sub.taxRate}%)</span><span>{fmtCurrency(taxAmount)}</span></div>
      {/if}
      <div class="flex justify-between font-semibold text-base pt-1"><span>Per {sub.billingCycle}</span><span>{fmtCurrency(total)}</span></div>
    </div>
  </div>

  <!-- Meta -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2 text-sm">
    <div class="flex justify-between"><span class="opacity-60">Billing cycle</span><span class="capitalize">{sub.billingCycle}</span></div>
    <div class="flex justify-between"><span class="opacity-60">Start date</span><span>{fmtDate(sub.startDate)}</span></div>
    <div class="flex justify-between"><span class="opacity-60">Next billing</span><span>{fmtDate(sub.nextBillingDate)}</span></div>
    {#if sub.endDate}
      <div class="flex justify-between"><span class="opacity-60">End date</span><span>{fmtDate(sub.endDate)}</span></div>
    {/if}
    {#if sub.dueDateOffsetDays != null}
      <div class="flex justify-between"><span class="opacity-60">Invoice due offset</span><span>{sub.dueDateOffsetDays} day{sub.dueDateOffsetDays !== 1 ? 's' : ''}</span></div>
    {/if}
    {#if sub.notes}
      <div class="pt-2 border-t border-base-300">
        <p class="opacity-60 text-xs mb-1">Notes</p>
        <p>{sub.notes}</p>
      </div>
    {/if}
  </div>

  <!-- Generated invoices -->
  {#if invoices.length > 0}
    <div class="space-y-2">
      <h2 class="text-sm font-semibold">Generated Invoices ({invoices.length})</h2>
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-300/30">
              <th>Invoice</th>
              <th class="text-right">Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {#each invoices as inv (inv.id)}
              <tr
                class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
                onclick={() => goto(`/folio/invoices/${inv.id}`)}
              >
                <td class="font-mono text-xs">{inv.invoiceNumber}</td>
                <td class="text-right font-semibold text-sm">{fmtCurrency(inv.total)}</td>
                <td><span class="badge badge-sm {INV_STATUS_CLASS[inv.status] ?? 'badge-ghost'}">{inv.status}</span></td>
                <td class="text-sm opacity-60">{fmtDate(inv.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
