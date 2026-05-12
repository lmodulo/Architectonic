<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, FileText, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, X } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Invoice = {
    id:              string;
    invoiceNumber:   string;
    customerId:      string;
    total:           number;
    status:          string;
    dueDate?:        string;
    createdAt?:      string;
    lineItems:       Array<{ description: string }>;
    subscriptionId?: string;
    recurrence?: {
      enabled?:          boolean;
      frequency?:        string;
      generatedFromId?:  string;
    };
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string; companyId?: string };
  type LineItem  = { description: string; quantity: number; unitPrice: number };

  let invoices  = $derived(data.invoices  as Invoice[]);
  let customers = $derived(data.customers as Customer[]);
  let total     = $derived(data.total     as number);
  let filters   = $derived(data.filters   as { status: string; customerId: string; skip: number; sort: string; sortDir: string });

  const LIMIT    = 25;
  const STATUSES = ['', 'draft', 'sent', 'paid', 'overdue'];

  const STATUS_CLASS: Record<string, string> = {
    paid:    'badge-success',
    overdue: 'badge-error',
    sent:    'badge-warning',
    draft:   'badge-ghost',
  };

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function customerName(id: string) {
    const c = customers.find(c => c.id === id);
    if (!c) return '—';
    return `${c.firstName} ${c.lastName}${c.companyName ? ` · ${c.companyName}` : ''}`;
  }

  function buildUrl(overrides: Record<string, string | null>) {
    const url = new URL(page.url);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) url.searchParams.delete(k);
      else            url.searchParams.set(k, v);
    }
    return url.toString();
  }

  function applyFilter(status: string) {
    goto(buildUrl({ status: status || null, skip: null }));
  }

  function applySort(field: string) {
    const newDir = filters.sort === field && filters.sortDir === 'asc' ? 'desc' : 'asc';
    goto(buildUrl({ sort: field, sortDir: newDir, skip: null }));
  }

  function pageUrl(newSkip: number) {
    return buildUrl({ skip: String(newSkip) });
  }

  const currentPage = $derived(Math.floor(filters.skip / LIMIT) + 1);
  const totalPages  = $derived(Math.ceil(total / LIMIT));

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

<svelte:head><title>Invoices — Folio</title></svelte:head>

<div class="space-y-6">
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Invoices' }]} />
    </div>
    <div class="space-y-1 min-w-0">
      <h1 class="text-2xl font-bold">Invoices</h1>
      <p class="text-sm opacity-60">{total} invoice{total !== 1 ? 's' : ''}</p>
    </div>
    <div class="flex items-center justify-between gap-4 border-t border-base-300/60 pt-3">
      <div></div>
      <button type="button" class="btn btn-primary btn-sm" onclick={openModal}>
        <Plus class="size-4" />
        New Invoice
      </button>
    </div>
  </div>

  <!-- Status filter -->
  <div class="flex flex-wrap gap-2">
    {#each STATUSES as s}
      <button
        type="button"
        class="btn btn-sm {filters.status === s ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => applyFilter(s)}
      >
        {s || 'All'}
      </button>
    {/each}
  </div>

  {#if invoices.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
      <FileText class="size-8 opacity-20 mx-auto mb-2" />
      <p class="text-sm opacity-40">No invoices found.</p>
      <button type="button" class="btn btn-primary btn-sm mt-4" onclick={openModal}>Create invoice</button>
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <table class="table table-sm">
        <thead>
          <tr class="bg-base-300/30">
            {#snippet sortTh(label: string, field: string)}
              <th>
                <button
                  type="button"
                  class="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  onclick={() => applySort(field)}
                >
                  {label}
                  {#if filters.sort === field}
                    {#if filters.sortDir === 'asc'}
                      <ChevronUp class="size-3 opacity-70" />
                    {:else}
                      <ChevronDown class="size-3 opacity-70" />
                    {/if}
                  {:else}
                    <ChevronsUpDown class="size-3 opacity-30" />
                  {/if}
                </button>
              </th>
            {/snippet}
            {@render sortTh('Invoice', 'invoiceNumber')}
            <th>Client</th>
            <th>Description</th>
            {@render sortTh('Due Date', 'dueDate')}
            {@render sortTh('Total', 'total')}
            {@render sortTh('Status', 'status')}
          </tr>
        </thead>
        <tbody>
          {#each invoices as inv (inv.id)}
            <tr
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
              onclick={() => goto(`/folio/invoices/${inv.id}`)}
            >
              <td class="font-mono text-xs">{inv.invoiceNumber}</td>
              <td class="text-sm">{customerName(inv.customerId)}</td>
              <td class="text-sm opacity-70">
                {#if inv.lineItems?.length > 0}
                  {inv.lineItems[0].description}{inv.lineItems.length > 1 ? ` +${inv.lineItems.length - 1}` : ''}
                {:else}
                  —
                {/if}
              </td>
              <td class="text-sm">{fmtDate(inv.dueDate)}</td>
              <td class="text-right font-semibold text-sm">{fmtCurrency(inv.total)}</td>
              <td>
                <span class="badge badge-sm {STATUS_CLASS[inv.status] ?? 'badge-ghost'}">{inv.status}</span>
                {#if inv.recurrence?.enabled}
                  <span class="badge badge-outline badge-sm ml-1">Recurring</span>
                {/if}
                {#if inv.recurrence?.generatedFromId}
                  <span class="badge badge-ghost badge-sm ml-1">Auto</span>
                {/if}
                {#if inv.subscriptionId}
                  <span class="badge badge-ghost badge-sm ml-1">Auto</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-between gap-4">
        <span class="text-xs opacity-50">
          {filters.skip + 1}–{Math.min(filters.skip + LIMIT, total)} of {total}
        </span>
        <div class="flex items-center gap-1">
          <a
            href={pageUrl(0)}
            class="btn btn-ghost btn-xs {currentPage === 1 ? 'btn-disabled opacity-40' : ''}"
            aria-disabled={currentPage === 1}
          >«</a>
          <a
            href={pageUrl(Math.max(0, filters.skip - LIMIT))}
            class="btn btn-ghost btn-sm {currentPage === 1 ? 'btn-disabled opacity-40' : ''}"
            aria-disabled={currentPage === 1}
          >← Prev</a>

          {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
            {#if totalPages <= 7 || Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages}
              <a
                href={pageUrl((p - 1) * LIMIT)}
                class="btn btn-xs {p === currentPage ? 'btn-primary' : 'btn-ghost'}"
              >{p}</a>
            {:else if Math.abs(p - currentPage) === 3}
              <span class="px-1 opacity-40 text-sm">…</span>
            {/if}
          {/each}

          <a
            href={pageUrl(filters.skip + LIMIT)}
            class="btn btn-ghost btn-sm {currentPage === totalPages ? 'btn-disabled opacity-40' : ''}"
            aria-disabled={currentPage === totalPages}
          >Next →</a>
          <a
            href={pageUrl((totalPages - 1) * LIMIT)}
            class="btn btn-ghost btn-xs {currentPage === totalPages ? 'btn-disabled opacity-40' : ''}"
            aria-disabled={currentPage === totalPages}
          >»</a>
        </div>
      </div>
    {/if}
  {/if}
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
