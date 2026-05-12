<script lang="ts">
  import { goto } from '$app/navigation';
  import { Plus, Trash2 } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string; companyId?: string };
  type LineItem  = { description: string; quantity: number; unitPrice: number };

  const customers = data.customers as Customer[];

  let lineItems    = $state<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  let saving       = $state(false);
  let saveError    = $state('');
  let form = $state({
    name:              '',
    customerId:        '',
    taxRate:           0,
    currency:          'USD',
    billingCycle:      'monthly',
    startDate:         '',
    endDate:           '',
    dueDateOffsetDays: '',
    notes:             '',
  });

  const selectedCustomer = $derived(customers.find(c => c.id === form.customerId));
  const subtotal = $derived(lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0));

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
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
    if (!form.name)        { saveError = 'Name is required'; return; }
    if (!form.customerId)  { saveError = 'Client is required'; return; }
    if (!form.billingCycle){ saveError = 'Billing cycle is required'; return; }
    if (!form.startDate)   { saveError = 'Start date is required'; return; }
    if (!validLines.length){ saveError = 'At least one line item is required'; return; }

    saving = true; saveError = '';
    try {
      const res = await fetch('/api/finance/subscriptions', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          name:              form.name,
          customerId:        form.customerId,
          companyId:         selectedCustomer?.companyId,
          lineItems:         validLines,
          taxRate:           form.taxRate,
          currency:          form.currency,
          billingCycle:      form.billingCycle,
          startDate:         form.startDate,
          endDate:           form.endDate || undefined,
          dueDateOffsetDays: form.dueDateOffsetDays ? Number(form.dueDateOffsetDays) : undefined,
          notes:             form.notes,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Failed to create subscription'; return; }
      goto(`/folio/subscriptions/${(d as any).id}`);
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>New Subscription — Folio</title></svelte:head>

<div class="space-y-6 max-w-2xl">
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Subscriptions', href: '/folio/subscriptions' }, { label: 'New Subscription' }]} />
    </div>
    <h1 class="text-2xl font-bold">New Subscription</h1>
  </div>

  {#if saveError}
    <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
  {/if}

  <!-- Name + Client -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="text-sm font-semibold">Details</h2>
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-name">Name *</label>
      <input id="sub-name" type="text" class="input w-full" placeholder="e.g. Pro Plan" bind:value={form.name} />
    </div>
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-customer">Client *</label>
      <select id="sub-customer" class="select w-full" bind:value={form.customerId}>
        <option value="">— Choose a client —</option>
        {#each customers as c (c.id)}
          <option value={c.id}>{c.firstName} {c.lastName}{c.companyName ? ` — ${c.companyName}` : ''}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Line items -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="text-sm font-semibold">Line Items</h2>
    <div class="space-y-2">
      {#each lineItems as item, i (i)}
        <div class="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
          <input type="text" class="input input-sm w-full" placeholder="Description" bind:value={item.description} required />
          <input type="number" class="input input-sm w-full" placeholder="Qty" min="0" step="1" bind:value={item.quantity} />
          <input type="number" class="input input-sm w-full" placeholder="Unit price" min="0" step="0.01" bind:value={item.unitPrice} />
          <button type="button" class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100" onclick={() => removeLine(i)} disabled={lineItems.length === 1}>
            <Trash2 class="size-3.5" />
          </button>
        </div>
      {/each}
    </div>
    <div class="flex items-center justify-between pt-1">
      <button type="button" class="btn btn-ghost btn-sm" onclick={addLine}>
        <Plus class="size-4" /> Add line
      </button>
      <span class="text-sm font-semibold">Subtotal: {fmtCurrency(subtotal)}</span>
    </div>
  </div>

  <!-- Billing settings -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="text-sm font-semibold">Billing</h2>
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-cycle">Billing Cycle *</label>
        <select id="sub-cycle" class="select w-full" bind:value={form.billingCycle}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-currency">Currency</label>
        <input id="sub-currency" type="text" class="input w-full" bind:value={form.currency} />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-tax">Tax rate (%)</label>
        <input id="sub-tax" type="number" class="input w-full" min="0" max="100" step="0.1" bind:value={form.taxRate} />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-offset">Due offset (days)</label>
        <input id="sub-offset" type="number" class="input w-full" min="0" step="1" placeholder="e.g. 14" bind:value={form.dueDateOffsetDays} />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-start">Start Date *</label>
        <input id="sub-start" type="date" class="input w-full" bind:value={form.startDate} />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-end">End Date</label>
        <input id="sub-end" type="date" class="input w-full" bind:value={form.endDate} />
      </div>
    </div>
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="sub-notes">Notes</label>
      <textarea id="sub-notes" class="textarea w-full" rows="2" placeholder="Optional notes…" bind:value={form.notes}></textarea>
    </div>
  </div>

  <div class="flex gap-3 justify-end">
    <a href="/folio/subscriptions" class="btn btn-ghost">Cancel</a>
    <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
      {saving ? 'Creating…' : 'Create Subscription'}
    </button>
  </div>
</div>
