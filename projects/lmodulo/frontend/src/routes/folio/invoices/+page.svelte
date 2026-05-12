<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, FileText, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Invoice = {
    id:            string;
    invoiceNumber: string;
    customerId:    string;
    total:         number;
    status:        string;
    dueDate?:      string;
    createdAt?:    string;
    lineItems:     Array<{ description: string }>;
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string };

  let invoices  = $derived(data.invoices  as Invoice[]);
  let customers = $derived(data.customers as Customer[]);
  let total     = $derived(data.total     as number);
  let filters   = $derived(data.filters   as { status: string; customerId: string; skip: number; sort: string; sortDir: string });

  const LIMIT   = 25;
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

  const currentPage  = $derived(Math.floor(filters.skip / LIMIT) + 1);
  const totalPages   = $derived(Math.ceil(total / LIMIT));
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
      <a href="/folio/invoices/new" class="btn btn-primary btn-sm">
        <Plus class="size-4" />
        New Invoice
      </a>
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
      <a href="/folio/invoices/new" class="btn btn-primary btn-sm mt-4">Create invoice</a>
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
