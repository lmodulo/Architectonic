<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { ShoppingCartIcon } from 'lucide-svelte';
  import { Search } from 'lucide-svelte';
  import Pagination from '$lib/components/Pagination.svelte';
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
    pending:    'badge-warning badge-soft',
    processing: 'badge-primary badge-soft',
    shipped:    'badge-secondary badge-soft',
    delivered:  'badge-success badge-soft',
    cancelled:  'badge-error badge-soft',
    refunded:   'badge-ghost'
  };

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }
</script>

<svelte:head><title>Orders</title></svelte:head>

<div class="space-y-6">
  <PageHeader icon={ShoppingCartIcon} title="Orders" subtitle="Customer orders and fulfillment" />

  {#if data.error}
    <aside class="alert alert-error p-3 rounded text-sm">{data.error}</aside>
  {/if}

  <div class="flex items-center gap-3">
    <label class="input flex items-center gap-2 flex-1">
      <Search class="size-4 opacity-50" />
      <input type="search" placeholder="Search by order number or email…" class="grow" bind:value={query} />
    </label>
    <select class="select w-44 shrink-0" bind:value={statusFilter}>
      {#each STATUS_OPTIONS as s}
        <option value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}</option>
      {/each}
    </select>
  </div>

  <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-base-300">
          <th class="text-left px-4 py-3 font-semibold opacity-60">Order #</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Customer</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Status</th>
          <th class="text-right px-4 py-3 font-semibold opacity-60">Total</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Date</th>
        </tr>
      </thead>
      <tbody>
        {#each pageOrders as order}
          <tr
            class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
            onclick={() => goto(`/commerce/orders/${order.id}`)}
          >
            <td class="px-4 py-3 font-mono font-medium">{order.orderNumber}</td>
            <td class="px-4 py-3 opacity-50">{order.guestEmail ?? order.userId ?? '—'}</td>
            <td class="px-4 py-3">
              <span class="badge {STATUS_BADGE[order.status] ?? 'badge-ghost'} text-xs capitalize">{order.status}</span>
            </td>
            <td class="px-4 py-3 text-right font-medium">{fmt(order.total ?? 0)}</td>
            <td class="px-4 py-3 opacity-60">{new Date(order.createdAt).toLocaleDateString()}</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-8 text-center opacity-60">No orders found.</td></tr>
        {/each}
      </tbody>
    </table>

    <div class="flex items-center justify-between px-4 py-2 border-t border-base-300">
      <span class="opacity-60 text-xs">
        {filtered.length === 0 ? 'No orders' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
      </span>
      <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage} onPageChange={(e) => (currentPage = e.page)} siblingCount={1} />
    </div>
  </div>
</div>
