<script lang="ts">
  import { ChevronDown, ChevronUp, ChevronsUpDown, ClipboardList, Plus } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { dragScroll } from '$lib/actions/dragScroll';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Estimate = {
    id:             string;
    estimateNumber: string;
    title:          string;
    customerId:     string;
    total:          number;
    status:         string;
    validUntil?:    string;
    createdAt?:     string;
    invoiceId?:     string | null;
    lineItems:      Array<{ description: string }>;
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string };

  let estimates = $derived(data.estimates as Estimate[]);
  let customers = $derived(data.customers as Customer[]);
  let total     = $derived(data.total     as number);
  let filters   = $derived(data.filters   as { status: string; skip: number; sort: string; sortDir: string });

  const LIMIT    = 25;
  const STATUSES = ['', 'draft', 'sent', 'accepted', 'declined', 'expired'];

  const STATUS_CLASS: Record<string, string> = {
    accepted: 'badge-success',
    declined: 'badge-error',
    sent:     'badge-warning',
    draft:    'badge-ghost',
    expired:  'badge-neutral',
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
</script>

<svelte:head><title>Estimates — Folio</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm opacity-60">{total} estimate{total !== 1 ? 's' : ''}</p>
    <a href="/folio/estimates/new" class="btn btn-primary btn-sm">
      <Plus size={16} class="size-4" />
      New Estimate
    </a>
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

  {#if estimates.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
      <ClipboardList size={32} class="size-8 opacity-20 mx-auto mb-2" />
      <p class="text-sm opacity-40">No estimates found.</p>
      <a href="/folio/estimates/new" class="btn btn-primary btn-sm mt-4">Create estimate</a>
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <div use:dragScroll class="table-scroll">
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
                      <ChevronUp size={12} class="size-3 opacity-70" />
                    {:else}
                      <ChevronDown size={12} class="size-3 opacity-70" />
                    {/if}
                  {:else}
                    <ChevronsUpDown size={12} class="size-3 opacity-30" />
                  {/if}
                </button>
              </th>
            {/snippet}
            {@render sortTh('Estimate', 'estimateNumber')}
            <th>Client</th>
            <th>Title</th>
            {@render sortTh('Valid Until', 'validUntil')}
            {@render sortTh('Total', 'total')}
            {@render sortTh('Status', 'status')}
          </tr>
        </thead>
        <tbody>
          {#each estimates as est (est.id)}
            <tr
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
              onclick={() => goto(`/folio/estimates/${est.id}`)}
            >
              <td class="font-mono text-xs">{est.estimateNumber}</td>
              <td class="text-sm">{customerName(est.customerId)}</td>
              <td class="text-sm opacity-70">
                {est.title || (est.lineItems?.[0]?.description ?? '—')}
              </td>
              <td class="text-sm">{fmtDate(est.validUntil)}</td>
              <td class="text-right font-semibold text-sm">{fmtCurrency(est.total)}</td>
              <td>
                <span class="badge badge-sm {STATUS_CLASS[est.status] ?? 'badge-ghost'}">{est.status}</span>
                {#if est.invoiceId}
                  <a
                    href="/folio/invoices/{est.invoiceId}"
                    class="link link-primary text-xs ml-1"
                    onclick={(e) => e.stopPropagation()}
                  >Invoice →</a>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>

      {#if total > 0}
        <div class="border-t border-base-300 px-4 py-2 flex items-center justify-between gap-4">
          <span class="text-xs opacity-50">
            {filters.skip + 1}–{Math.min(filters.skip + LIMIT, total)} of {total}
          </span>
          {#if totalPages > 1}
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
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
