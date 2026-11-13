<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { ShoppingCartIcon } from 'lucide-svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let order = $state({ ...data.order });
  let statusValue = $state(order.status ?? '');
  let notes = $state(order.notes ?? '');
  let updating = $state(false);
  let updateError = $state('');
  let updateSuccess = $state(false);

  const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

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

  async function updateStatus() {
    updating = true; updateError = ''; updateSuccess = false;
    try {
      const res = await fetch(`/api/commerce/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: statusValue, notes: notes || undefined })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); updateError = b.message ?? 'Update failed'; return; }
      order = { ...order, status: statusValue, notes };
      updateSuccess = true;
      setTimeout(() => (updateSuccess = false), 3000);
    } catch { updateError = 'Network error'; }
    finally { updating = false; }
  }

  const canUpdate = $derived(hasPermission(data.user, 'commerce_orders', 'update'));
  const statusChanged = $derived(statusValue !== order.status || notes !== (order.notes ?? ''));
</script>

<svelte:head><title>Order {order.orderNumber}</title></svelte:head>

<div class="space-y-6 max-w-4xl">
  <PageHeader icon={ShoppingCartIcon} title={order.orderNumber}>
    {new Date(order.createdAt).toLocaleString()} · <span class="badge badge-sm {STATUS_BADGE[order.status] ?? 'badge-ghost'} capitalize">{order.status}</span>
    {#snippet actions()}
      <a href="/commerce/orders" class="btn btn-ghost btn-sm"><ArrowLeft class="size-4" /> Orders</a>
    {/snippet}
  </PageHeader>

  <!-- Status update -->
  {#if canUpdate}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
      <h2 class="font-semibold">Update Status</h2>
      {#if updateError}<aside class="alert alert-error p-3 rounded text-sm">{updateError}</aside>{/if}
      {#if updateSuccess}<aside class="alert alert-success p-3 rounded text-sm">Status updated.</aside>{/if}
      <div class="flex items-end gap-4">
        <label class="flex flex-col flex-1">
          <span class="label-text text-sm font-medium">Status</span>
          <select class="select mt-1 w-full" bind:value={statusValue}>
            {#each STATUS_OPTIONS as s}
              <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            {/each}
          </select>
        </label>
        <label class="flex flex-col flex-[2]">
          <span class="label-text text-sm font-medium">Notes</span>
          <input type="text" class="input mt-1 w-full" bind:value={notes} placeholder="Optional note…" />
        </label>
        <button type="button" class="btn btn-primary shrink-0" disabled={updating || !statusChanged} onclick={updateStatus}>
          {updating ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  {/if}

  <!-- Customer -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
    <h2 class="font-semibold">Customer</h2>
    <p class="text-sm opacity-60">{order.guestEmail ?? order.userId ?? 'Unknown'}</p>
  </div>

  <!-- Line items -->
  <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
    <div class="px-4 py-3 border-b border-base-300 font-semibold">Items</div>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-base-300">
          <th class="text-left px-4 py-2 font-semibold opacity-60">Product</th>
          <th class="text-left px-4 py-2 font-semibold opacity-60">SKU</th>
          <th class="text-right px-4 py-2 font-semibold opacity-60">Qty</th>
          <th class="text-right px-4 py-2 font-semibold opacity-60">Unit</th>
          <th class="text-right px-4 py-2 font-semibold opacity-60">Discount</th>
          <th class="text-right px-4 py-2 font-semibold opacity-60">Line Total</th>
        </tr>
      </thead>
      <tbody>
        {#each order.items ?? [] as item}
          <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
            <td class="px-4 py-2">
              <div class="font-medium">{item.productName}</div>
              {#if item.variantLabel}<div class="text-xs opacity-60">{item.variantLabel}</div>{/if}
            </td>
            <td class="px-4 py-2 font-mono text-xs opacity-60">{item.sku}</td>
            <td class="px-4 py-2 text-right">{item.quantity}</td>
            <td class="px-4 py-2 text-right">{fmt(item.unitPrice)}</td>
            <td class="px-4 py-2 text-right opacity-60">{item.discountApplied ? fmt(item.discountApplied) : '—'}</td>
            <td class="px-4 py-2 text-right font-medium">{fmt(item.lineTotal)}</td>
          </tr>
        {:else}
          <tr><td colspan="6" class="px-4 py-4 text-center opacity-60">No items.</td></tr>
        {/each}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="border-t border-base-300 px-4 py-3 space-y-1 text-sm">
      <div class="flex justify-between opacity-60"><span>Subtotal</span><span>{fmt(order.subtotal ?? 0)}</span></div>
      {#if order.discountTotal}<div class="flex justify-between opacity-60"><span>Discount</span><span>−{fmt(order.discountTotal)}</span></div>{/if}
      <div class="flex justify-between font-semibold text-base pt-1 border-t border-base-300 mt-1"><span>Total</span><span>{fmt(order.total ?? 0)}</span></div>
    </div>
  </div>
</div>
