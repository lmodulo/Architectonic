<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, RefreshCw } from 'lucide-svelte';
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
  const filters       = $derived(data.filters       as { status: string });

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

  function applyFilter(status: string) {
    const url = new URL(page.url);
    if (status) url.searchParams.set('status', status);
    else        url.searchParams.delete('status');
    goto(url.toString());
  }
</script>

<svelte:head><title>Subscriptions — Folio</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm opacity-60">{subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</p>
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
      <table class="table table-sm">
        <thead>
          <tr class="bg-base-300/30">
            <th>Name</th>
            <th>Customer</th>
            <th>Billing Cycle</th>
            <th>Next Billing</th>
            <th class="text-right">Total</th>
            <th>Status</th>
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
  {/if}
</div>
