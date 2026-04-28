<script lang="ts">
  import { Search, ChevronLeft, ChevronRight, ArrowLeftRight, Tag } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // ── Filters (bound to URL params) ──────────────────────────────────
  let search     = $state($page.url.searchParams.get('search')    ?? '');
  let category   = $state($page.url.searchParams.get('category')  ?? '');
  let accountId  = $state($page.url.searchParams.get('accountId') ?? '');
  let dateFrom   = $state($page.url.searchParams.get('dateFrom')  ?? '');
  let dateTo     = $state($page.url.searchParams.get('dateTo')    ?? '');
  let currentPage = $state(data.page ?? 1);

  // Build flat account list for filter dropdown
  let accounts = $derived(
    (data.institutions as Record<string, unknown>[])
      .flatMap((i: Record<string, unknown>) => (i.accounts as Record<string, unknown>[]) ?? [])
  );

  function applyFilters(pg = 1) {
    const params = new URLSearchParams();
    if (search)    params.set('search',    search.trim());
    if (category)  params.set('category',  category);
    if (accountId) params.set('accountId', accountId);
    if (dateFrom)  params.set('dateFrom',  dateFrom);
    if (dateTo)    params.set('dateTo',    dateTo);
    if (pg > 1)    params.set('page',      String(pg));
    goto(`/budget/transactions?${params.toString()}`, { replaceState: true });
  }

  function clearFilters() {
    search = ''; category = ''; accountId = ''; dateFrom = ''; dateTo = '';
    goto('/budget/transactions');
  }

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }

  function fmtAmount(n: number) {
    const fmt = Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return n >= 0 ? `+${fmt}` : `-${fmt.slice(1)}`;
  }

  // All categories from loaded transactions for filter dropdown
  let categories = $derived(
    [...new Set(
      (data.transactions as Record<string, unknown>[])
        .map((tx: Record<string, unknown>) => (tx.userCategory ?? tx.category) as string)
        .filter(Boolean)
    )].sort()
  );
</script>

<div class="p-6 space-y-5">
  <h1 class="text-2xl font-semibold">Transactions</h1>

  <!-- Filter bar -->
  <div class="card p-4 space-y-3">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Search -->
      <div class="relative">
        <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="text"
          placeholder="Search merchant, note…"
          bind:value={search}
          onkeydown={(e) => e.key === 'Enter' && applyFilters()}
          class="input pl-8 text-sm w-full"
        />
      </div>

      <!-- Account -->
      <select bind:value={accountId} class="select text-sm">
        <option value="">All accounts</option>
        {#each accounts as acct (acct.accountId)}
          <option value={acct.accountId}>{acct.name}</option>
        {/each}
      </select>

      <!-- Category -->
      <select bind:value={category} class="select text-sm">
        <option value="">All categories</option>
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>

      <!-- Date range -->
      <div class="flex gap-2">
        <input type="date" bind:value={dateFrom} class="input text-sm flex-1" />
        <input type="date" bind:value={dateTo}   class="input text-sm flex-1" />
      </div>
    </div>

    <div class="flex gap-2">
      <button type="button" onclick={() => applyFilters()} class="btn preset-filled-primary-500 btn-sm">
        Apply
      </button>
      <button type="button" onclick={clearFilters} class="btn preset-outlined btn-sm">
        Clear
      </button>
    </div>
  </div>

  <!-- Results -->
  {#if (data.transactions as unknown[]).length === 0}
    <div class="card p-12 text-center">
      <ArrowLeftRight class="mx-auto opacity-30 mb-3" size={36} />
      <p class="font-medium">No transactions found</p>
      <p class="text-sm opacity-50 mt-1">Try adjusting your filters or connect a bank account.</p>
    </div>
  {:else}
    <div class="card p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-xs opacity-50 uppercase tracking-wide border-b border-surface-200 dark:border-surface-700">
            <th class="text-left px-5 py-3 font-medium">Date</th>
            <th class="text-left px-4 py-3 font-medium">Merchant</th>
            <th class="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
            <th class="text-right px-5 py-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {#each data.transactions as tx (tx.id)}
            <tr
              role="button"
              tabindex="0"
              onclick={() => goto(`/budget/transactions/${tx.id}`)}
              onkeydown={(e) => e.key === 'Enter' && goto(`/budget/transactions/${tx.id}`)}
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
            >
              <td class="px-5 py-3 whitespace-nowrap opacity-70">{fmtDate(tx.date as string)}</td>
              <td class="px-4 py-3">
                <p class="font-medium">{tx.merchant || tx.description}</p>
                {#if (tx.userTags as string[]).length > 0}
                  <p class="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                    <Tag size={10} />
                    {(tx.userTags as string[]).join(', ')}
                  </p>
                {/if}
              </td>
              <td class="px-4 py-3 hidden md:table-cell">
                <span class="badge preset-tonal-surface text-xs">
                  {tx.userCategory ?? tx.category ?? '—'}
                </span>
              </td>
              <td class="px-5 py-3 text-right font-mono {(tx.amount as number) >= 0 ? 'text-success-600 dark:text-success-400' : ''}">
                {fmtAmount(tx.amount as number)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if (data.pages as number) > 1}
      <div class="flex items-center justify-between text-sm">
        <span class="opacity-50">
          Page {data.page} of {data.pages} · {data.total} transactions
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            disabled={(data.page as number) <= 1}
            onclick={() => applyFilters((data.page as number) - 1)}
            class="btn btn-sm preset-outlined flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            type="button"
            disabled={(data.page as number) >= (data.pages as number)}
            onclick={() => applyFilters((data.page as number) + 1)}
            class="btn btn-sm preset-outlined flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
