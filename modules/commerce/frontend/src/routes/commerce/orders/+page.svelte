<script lang="ts">
  import { Search, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Order = typeof data.orders[0];

  let orders = $state([...data.orders]);
  let query   = $state('');
  let statusFilter = $state('');
  let currentPage  = $state(1);

  const STATUS_OPTIONS = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

  const filtered = $derived((() => {
    let list = orders;
    if (statusFilter) list = list.filter(o => o.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.guestEmail?.toLowerCase().includes(q)
      );
    }
    return list;
  })());

  const PAGE_SIZE = 25;
  const pageOrders = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  $effect(() => { query; statusFilter; currentPage = 1; });

  const STATUS_BADGE: Record<string, string> = {
    pending:    'preset-tonal-warning',
    processing: 'preset-tonal-primary',
    shipped:    'preset-tonal-secondary',
    delivered:  'preset-tonal-success',
    cancelled:  'preset-tonal-error',
    refunded:   'preset-tonal-surface'
  };

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }
</script>

<svelte:head><title>Orders</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Orders</h1>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  <div class="flex items-center gap-3">
    <div class="input-group grid-cols-[auto_1fr] flex-1">
      <div class="ig-cell preset-tonal"><Search class="size-4" /></div>
      <input type="search" placeholder="Search by order number or email…" class="ig-input" bind:value={query} />
    </div>
    <select class="select w-44 shrink-0" bind:value={statusFilter}>
      {#each STATUS_OPTIONS as s}
        <option value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}</option>
      {/each}
    </select>
  </div>

  <div class="card preset-filled-surface-100-900 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-200-800">
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Order #</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Customer</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Status</th>
          <th class="text-right px-4 py-3 font-semibold text-surface-500">Total</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Date</th>
        </tr>
      </thead>
      <tbody>
        {#each pageOrders as order}
          <tr
            class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
            onclick={() => goto(`/commerce/orders/${order.id}`)}
          >
            <td class="px-4 py-3 font-mono font-medium">{order.orderNumber}</td>
            <td class="px-4 py-3 text-surface-400">{order.guestEmail ?? order.userId ?? '—'}</td>
            <td class="px-4 py-3">
              <span class="badge {STATUS_BADGE[order.status] ?? 'preset-tonal'} text-xs capitalize">{order.status}</span>
            </td>
            <td class="px-4 py-3 text-right font-medium">{fmt(order.total ?? 0)}</td>
            <td class="px-4 py-3 text-surface-500">{new Date(order.createdAt).toLocaleDateString()}</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-8 text-center text-surface-500">No orders found.</td></tr>
        {/each}
      </tbody>
    </table>

    <div class="flex items-center justify-between px-4 py-2 border-t border-surface-200-800">
      <span class="text-surface-500 text-xs">
        {filtered.length === 0 ? 'No orders' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
      </span>
      <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage} onPageChange={(e) => (currentPage = e.page)} siblingCount={1}>
        <Pagination.FirstTrigger class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronFirst class="size-4" /></Pagination.FirstTrigger>
        <Pagination.PrevTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLeft  class="size-4" /></Pagination.PrevTrigger>
        <Pagination.Context>
          {#snippet children(pagination)}
            {#each pagination().pages as p (p)}
              {#if p.type === 'page'}
                <Pagination.Item {...p} class="btn-icon btn-sm {p.value === currentPage ? 'preset-tonal-primary' : 'hover:preset-tonal'}">{p.value}</Pagination.Item>
              {:else}
                <Pagination.Ellipsis index={p.index} class="btn-icon btn-sm opacity-50">…</Pagination.Ellipsis>
              {/if}
            {/each}
          {/snippet}
        </Pagination.Context>
        <Pagination.NextTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronRight class="size-4" /></Pagination.NextTrigger>
        <Pagination.LastTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLast  class="size-4" /></Pagination.LastTrigger>
      </Pagination>
    </div>
  </div>
</div>
