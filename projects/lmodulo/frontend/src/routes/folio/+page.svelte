<script lang="ts">
  import { goto } from '$app/navigation';
  import { Users, FileText, Plus, Trash2, X } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Customer = {
    id:          string;
    firstName:   string;
    lastName:    string;
    email:       string;
    companyId?:  string;
    companyName?: string;
  };

  type Invoice = {
    id:            string;
    invoiceNumber: string;
    customerId:    string;
    total:         number;
    status:        string;
  };

  type LineItem = { description: string; quantity: number; unitPrice: number };

  const customers = data.customers as Customer[];
  const invoices  = data.invoices  as Invoice[];

  function customerStats(customerId: string) {
    const invs    = invoices.filter(i => i.customerId === customerId);
    const total   = invs.reduce((s, i) => s + (i.total ?? 0), 0);
    const paid    = invs.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const overdue = invs.filter(i => i.status === 'overdue').length;
    return { count: invs.length, total, paid, overdue };
  }

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  const totalOutstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + (i.total ?? 0), 0);
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  // Modal
  let modalOpen = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let lineItems = $state<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  let form = $state({ customerId: '', taxRate: 0, dueDate: '', status: 'draft', notes: '' });

  const selectedCustomer = $derived(customers.find(c => c.id === form.customerId));
  const subtotal = $derived(lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0));

  function openModal() {
    form      = { customerId: '', taxRate: 0, dueDate: '', status: 'draft', notes: '' };
    lineItems = [{ description: '', quantity: 1, unitPrice: 0 }];
    saveError = '';
    modalOpen = true;
  }

  function addLine() {
    lineItems = [...lineItems, { description: '', quantity: 1, unitPrice: 0 }];
  }

  function removeLine(i: number) {
    if (lineItems.length === 1) return;
    lineItems = lineItems.filter((_, idx) => idx !== i);
  }

  async function save() {
    const validLines = lineItems.filter(i => i.description.trim());
    if (!form.customerId)   { saveError = 'Client is required'; return; }
    if (!validLines.length) { saveError = 'At least one line item is required'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch('/api/finance/invoices', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          customerId: form.customerId,
          companyId:  selectedCustomer?.companyId,
          lineItems:  validLines,
          taxRate:    form.taxRate,
          dueDate:    form.dueDate || undefined,
          notes:      form.notes,
          status:     form.status,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Failed to create invoice'; return; }
      goto(`/folio/invoices/${(d as any).id}`);
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>Folio</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">Folio</h1>
      <p class="text-sm opacity-60 mt-0.5">Finance overview — clients and invoices.</p>
    </div>
    <button type="button" class="btn btn-primary btn-sm" onclick={openModal}>
      <FileText class="size-4" />
      New Invoice
    </button>
  </div>

  <!-- Summary cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Clients</p>
      <p class="text-2xl font-bold mt-1">{customers.length}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Total Paid</p>
      <p class="text-2xl font-bold mt-1 text-success">{fmtCurrency(totalPaid)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Outstanding</p>
      <p class="text-2xl font-bold mt-1">{fmtCurrency(totalOutstanding)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Overdue</p>
      <p class="text-2xl font-bold mt-1 {overdueCount > 0 ? 'text-error' : ''}">{overdueCount}</p>
    </div>
  </div>

  <!-- Client list -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Clients ({customers.length})</h2>
      <a href="/folio/invoices" class="btn btn-ghost btn-sm text-xs opacity-60 hover:opacity-100">
        View all invoices →
      </a>
    </div>

    {#if customers.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
        <Users class="size-8 opacity-20 mx-auto mb-2" />
        <p class="text-sm opacity-40">No clients yet. Convert a CRM contact to create one.</p>
      </div>
    {:else}
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-300/30">
              <th>Client</th>
              <th>Company</th>
              <th class="text-right">Invoices</th>
              <th class="text-right">Total</th>
              <th class="text-right">Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each customers as customer (customer.id)}
              {@const stats = customerStats(customer.id)}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                <td>
                  <div class="font-medium text-sm">{customer.firstName} {customer.lastName}</div>
                  <div class="text-xs opacity-50">{customer.email}</div>
                </td>
                <td class="text-sm">{customer.companyName ?? '—'}</td>
                <td class="text-right text-sm">
                  {stats.count}
                  {#if stats.overdue > 0}
                    <span class="badge badge-error badge-xs ml-1">{stats.overdue} overdue</span>
                  {/if}
                </td>
                <td class="text-right text-sm font-medium">{fmtCurrency(stats.total)}</td>
                <td class="text-right text-sm text-success">{fmtCurrency(stats.paid)}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    onclick={() => goto(`/folio/invoices?customerId=${customer.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if modalOpen}
  <Modal size="lg" label="New Invoice">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Invoice</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}

      <!-- Client -->
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-customer">Client *</label>
        <select id="inv-customer" class="select w-full" bind:value={form.customerId}>
          <option value="">— Choose a client —</option>
          {#each customers as c (c.id)}
            <option value={c.id}>{c.firstName} {c.lastName}{c.companyName ? ` — ${c.companyName}` : ''}</option>
          {/each}
        </select>
      </div>

      <!-- Line items -->
      <div class="space-y-2">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Line Items *</p>
        {#each lineItems as item, i (i)}
          <div class="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="Description"
              bind:value={item.description}
            />
            <input
              type="number"
              class="input input-sm w-full"
              placeholder="Qty"
              min="0"
              step="1"
              bind:value={item.quantity}
            />
            <input
              type="number"
              class="input input-sm w-full"
              placeholder="Unit price"
              min="0"
              step="0.01"
              bind:value={item.unitPrice}
            />
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100"
              onclick={() => removeLine(i)}
              disabled={lineItems.length === 1}
            >
              <Trash2 class="size-3.5" />
            </button>
          </div>
        {/each}
        <div class="flex items-center justify-between pt-1">
          <button type="button" class="btn btn-ghost btn-sm" onclick={addLine}>
            <Plus class="size-4" /> Add line
          </button>
          <span class="text-sm font-semibold">Subtotal: {fmtCurrency(subtotal)}</span>
        </div>
      </div>

      <!-- Settings -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-tax">Tax rate (%)</label>
          <input id="inv-tax" type="number" class="input w-full" min="0" max="100" step="0.1" bind:value={form.taxRate} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-due">Due date</label>
          <input id="inv-due" type="date" class="input w-full" bind:value={form.dueDate} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-status">Status</label>
          <select id="inv-status" class="select w-full" bind:value={form.status}>
            <option value="draft">Draft</option>
            <option value="sent">Send to client</option>
          </select>
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-notes">Notes</label>
        <textarea id="inv-notes" class="textarea w-full" rows="2" placeholder="Optional notes…" bind:value={form.notes}></textarea>
      </div>
    </div>

    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Creating…' : 'Create Invoice'}
      </button>
    </footer>
  </Modal>
{/if}
