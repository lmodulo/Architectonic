<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus, Trash2 } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type Customer = { id: string; firstName: string; lastName: string; companyName?: string; companyId?: string };
  const customers = data.customers as Customer[];

  type LineItem = { description: string; quantity: number; unitPrice: number };

  let lineItems    = $state<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  let selectedCust = $state('');
  let submitting   = $state(false);
  let recurrenceEnabled   = $state(false);
  let recurrenceFrequency = $state('monthly');
  let recurrenceUntil     = $state('');

  const selectedCustomer = $derived(customers.find(c => c.id === selectedCust));

  function addLine() {
    lineItems = [...lineItems, { description: '', quantity: 1, unitPrice: 0 }];
  }

  function removeLine(i: number) {
    if (lineItems.length === 1) return;
    lineItems = lineItems.filter((_, idx) => idx !== i);
  }

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  const subtotal = $derived(lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
</script>

<svelte:head><title>New Invoice — Folio</title></svelte:head>

<div class="space-y-6 max-w-2xl">
  <div class="space-y-4">
    <div class="pb-3 border-b border-base-300/60">
      <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Invoices', href: '/folio/invoices' }, { label: 'New Invoice' }]} />
    </div>
    <div class="space-y-1 min-w-0">
      <h1 class="text-2xl font-bold">New Invoice</h1>
    </div>
  </div>

  {#if form?.error}
    <aside class="alert alert-error p-3 rounded text-sm">{form.error}</aside>
  {/if}

  <form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>

    <!-- Client -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4 mb-4">
      <h2 class="text-sm font-semibold">Client</h2>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="customerId">Select client</label>
        <select id="customerId" name="customerId" class="select w-full" required bind:value={selectedCust}>
          <option value="">— Choose a client —</option>
          {#each customers as c (c.id)}
            <option value={c.id}>{c.firstName} {c.lastName}{c.companyName ? ` — ${c.companyName}` : ''}</option>
          {/each}
        </select>
      </div>
      {#if selectedCustomer?.companyId}
        <input type="hidden" name="companyId" value={selectedCustomer.companyId} />
      {/if}
    </div>

    <!-- Line items -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4 mb-4">
      <h2 class="text-sm font-semibold">Line Items</h2>

      <div class="space-y-2">
        {#each lineItems as item, i (i)}
          <div class="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
            <input
              type="text"
              name="description"
              class="input input-sm w-full"
              placeholder="Description"
              bind:value={item.description}
              required
            />
            <input
              type="number"
              name="quantity"
              class="input input-sm w-full"
              placeholder="Qty"
              min="0"
              step="1"
              bind:value={item.quantity}
              required
            />
            <input
              type="number"
              name="unitPrice"
              class="input input-sm w-full"
              placeholder="Unit price"
              min="0"
              step="0.01"
              bind:value={item.unitPrice}
              required
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
      </div>

      <button type="button" class="btn btn-ghost btn-sm" onclick={addLine}>
        <Plus class="size-4" />
        Add line
      </button>

      <div class="text-right text-sm font-semibold border-t border-base-300 pt-3">
        Subtotal: {fmtCurrency(subtotal)}
      </div>
    </div>

    <!-- Recurrence -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4 mb-4">
      <h2 class="text-sm font-semibold">Schedule</h2>
      <div class="space-y-3 border-l-2 border-base-300 pl-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" name="recurrenceEnabled" class="checkbox" bind:checked={recurrenceEnabled} value="true" />
          <span class="text-sm font-medium">Repeat invoice</span>
        </label>
        {#if recurrenceEnabled}
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="recFreq">Frequency</label>
              <select id="recFreq" name="recurrenceFrequency" class="select w-full" bind:value={recurrenceFrequency}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="recUntil">Until</label>
              <input id="recUntil" name="recurrenceUntil" type="date" class="input w-full" bind:value={recurrenceUntil} />
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Settings -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4 mb-6">
      <h2 class="text-sm font-semibold">Settings</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="taxRate">Tax rate (%)</label>
          <input id="taxRate" name="taxRate" type="number" class="input w-full" min="0" max="100" step="0.1" value="0" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="dueDate">Due date</label>
          <input id="dueDate" name="dueDate" type="date" class="input w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="status">Status</label>
          <select id="status" name="status" class="select w-full">
            <option value="draft">Draft</option>
            <option value="sent">Send to client</option>
          </select>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="notes">Notes</label>
        <textarea id="notes" name="notes" class="textarea w-full" rows="2" placeholder="Optional notes…"></textarea>
      </div>
    </div>

    <div class="flex gap-3 justify-end">
      <a href="/folio/invoices" class="btn btn-ghost">Cancel</a>
      <button type="submit" class="btn btn-primary" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Invoice'}
      </button>
    </div>
  </form>
</div>
