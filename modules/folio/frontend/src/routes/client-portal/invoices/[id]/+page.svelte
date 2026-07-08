<script lang="ts">
  import { ArrowLeft, Printer } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type LineItem = { description: string; quantity: number; unitPrice: number; amount: number };
  type Invoice = {
    id:            string;
    invoiceNumber: string;
    lineItems:     LineItem[];
    subtotal:      number;
    taxRate:       number;
    taxAmount:     number;
    total:         number;
    currency:      string;
    status:        string;
    dueDate?:      string;
    paidAt?:       string;
    notes?:        string;
  };

  const inv = data.invoice as Invoice;

  const STATUS_BADGE: Record<string, string> = {
    paid:     'badge-success',
    overdue:  'badge-error',
    sent:     'badge-warning',
    draft:    'badge-ghost',
    proposal: 'badge-info',
  };

  function fmtCurrency(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="p-6 max-w-3xl mx-auto">
  <!-- Actions bar (hidden when printing) -->
  <div class="flex items-center justify-between mb-6 print:hidden">
    <a href="/client-portal/invoices" class="btn btn-sm btn-ghost gap-1">
      <ArrowLeft size={16} class="w-4 h-4" /> Back
    </a>
    <button class="btn btn-sm btn-ghost gap-1" onclick={() => window.open(`/invoice/${inv.id}`, '_blank')}>
      <Printer size={16} class="w-4 h-4" /> Print / Save as PDF
    </button>
  </div>

  <div class="card bg-base-100 border border-base-200 shadow-sm">
    <div class="card-body p-8">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p class="text-xs opacity-40 uppercase tracking-widest mb-1">Invoice</p>
          <h1 class="text-2xl font-mono font-semibold">{inv.invoiceNumber}</h1>
        </div>
        <span class="badge badge-md {STATUS_BADGE[inv.status] ?? 'badge-ghost'}">{inv.status}</span>
      </div>

      <!-- Dates -->
      <div class="flex flex-wrap gap-6 text-sm mb-8">
        <div>
          <p class="opacity-40 text-xs uppercase tracking-wide mb-0.5">Due Date</p>
          <p>{fmtDate(inv.dueDate)}</p>
        </div>
        {#if inv.paidAt}
          <div>
            <p class="opacity-40 text-xs uppercase tracking-wide mb-0.5">Paid On</p>
            <p class="text-success">{fmtDate(inv.paidAt)}</p>
          </div>
        {/if}
      </div>

      <!-- Line items -->
      <div class="overflow-x-auto mb-6">
        <table class="table table-sm w-full">
          <thead>
            <tr class="bg-base-200/50">
              <th class="w-full">Description</th>
              <th class="text-right whitespace-nowrap">Qty</th>
              <th class="text-right whitespace-nowrap">Unit Price</th>
              <th class="text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody>
            {#each inv.lineItems as item}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
                <td>{item.description}</td>
                <td class="text-right">{item.quantity}</td>
                <td class="text-right">{fmtCurrency(item.unitPrice, inv.currency)}</td>
                <td class="text-right font-medium">{fmtCurrency(item.amount, inv.currency)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="flex justify-end">
        <div class="w-64 text-sm">
          <div class="flex justify-between py-1">
            <span class="opacity-60">Subtotal</span>
            <span>{fmtCurrency(inv.subtotal, inv.currency)}</span>
          </div>
          {#if inv.taxRate > 0}
            <div class="flex justify-between py-1">
              <span class="opacity-60">Tax ({inv.taxRate}%)</span>
              <span>{fmtCurrency(inv.taxAmount, inv.currency)}</span>
            </div>
          {/if}
          <div class="flex justify-between py-2 border-t border-base-300 font-semibold text-base mt-1">
            <span>Total</span>
            <span>{fmtCurrency(inv.total, inv.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      {#if inv.notes}
        <div class="mt-6 pt-6 border-t border-base-200">
          <p class="text-xs opacity-40 uppercase tracking-wide mb-1">Notes</p>
          <p class="text-sm opacity-80 whitespace-pre-line">{inv.notes}</p>
        </div>
      {/if}
    </div>
  </div>
</div>
