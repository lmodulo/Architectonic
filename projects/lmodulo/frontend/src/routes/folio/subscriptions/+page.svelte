<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { dragScroll } from '$lib/actions/dragScroll';
  import { Plus, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Subscription = {
    id:              string;
    name:            string;
    customerId:      string;
    billingCycle:    string;
    nextBillingDate: string;
    status:          string;
    lineItems:       Array<{ amount: number }>;
    taxRate:         number;
    currency:        string;
  };

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string };

  const subscriptions = $derived(data.subscriptions as Subscription[]);
  const customers     = $derived(data.customers     as Customer[]);
  const total         = $derived(data.total         as number);
  const filters       = $derived(data.filters       as { status: string; skip: number; sort: string; sortDir: string });

  const LIMIT    = 25;
  const STATUSES = ['', 'active', 'paused', 'cancelled'];

  const STATUS_CLASS: Record<string, string> = {
    active:    'badge-success',
    paused:    'badge-warning',
    cancelled: 'badge-ghost',
  };

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtCurrency(n: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  }

  function customerName(id: string) {
    const c = customers.find(c => c.id === id);
    if (!c) return '—';
    return `${c.firstName} ${c.lastName}${c.companyName ? ` · ${c.companyName}` : ''}`;
  }

  function subTotal(sub: Subscription) {
    const subtotal  = sub.lineItems.reduce((s, i) => s + i.amount, 0);
    const taxAmount = subtotal * (sub.taxRate / 100);
    return subtotal + taxAmount;
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

<svelte:head><title>Subscriptions — Folio</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm opacity-60">{total} subscription{total !== 1 ? 's' : ''}</p>
    {#if hasPermission(data.user, 'finance_subscriptions', 'create')}
      <a href="/folio/subscriptions/new" class="btn btn-primary btn-sm">
        <Plus class="size-4" />
        New Subscription
      </a>
    {/if}
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

  {#if subscriptions.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
      <RefreshCw class="size-8 opacity-20 mx-auto mb-2" />
      <p class="text-sm opacity-40">No subscriptions found.</p>
      {#if hasPermission(data.user, 'finance_subscriptions', 'create')}
        <a href="/folio/subscriptions/new" class="btn btn-primary btn-sm mt-4">Create subscription</a>
      {/if}
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <div use:dragScroll class="table-scroll">
      <table class="table table-sm">
        <thead>
          <tr class="bg-base-300/30">
            {#snippet sortTh(label: string, field: string, cls = '')}
              <th class={cls}>
                <button type="button" class="flex items-center gap-1 hover:opacity-80 transition-opacity" onclick={() => applySort(field)}>
                  {label}
                  {#if filters.sort === field}
                    {#if filters.sortDir === 'asc'}<ChevronUp class="size-3 opacity-70" />{:else}<ChevronDown class="size-3 opacity-70" />{/if}
                  {:else}
                    <ChevronsUpDown class="size-3 opacity-30" />
                  {/if}
                </button>
              </th>
            {/snippet}
            {@render sortTh('Name', 'name')}
            <th>Customer</th>
            {@render sortTh('Billing Cycle', 'billingCycle')}
            {@render sortTh('Next Billing', 'nextBillingDate')}
            <th class="text-right">Total</th>
            {@render sortTh('Status', 'status')}
          </tr>
        </thead>
        <tbody>
          {#each subscriptions as sub (sub.id)}
            <tr
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
              onclick={() => goto(`/folio/subscriptions/${sub.id}`)}
            >
              <td class="font-medium text-sm">{sub.name}</td>
              <td class="text-sm">{customerName(sub.customerId)}</td>
              <td class="text-sm capitalize">{sub.billingCycle}</td>
              <td class="text-sm">{fmtDate(sub.nextBillingDate)}</td>
              <td class="text-right font-semibold text-sm">{fmtCurrency(subTotal(sub), sub.currency)}</td>
              <td>
                <span class="badge badge-sm {STATUS_CLASS[sub.status] ?? 'badge-ghost'}">{sub.status}</span>
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
