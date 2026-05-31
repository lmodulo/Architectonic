<script lang="ts">
  import BrandedDocument from '$lib/components/BrandedDocument.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type LineItem = { description: string; quantity: number; unitPrice: number; amount: number };
  type Invoice = {
    invoiceNumber: string;
    lineItems:     LineItem[];
    subtotal:      number;
    taxRate:       number;
    taxAmount:     number;
    total:         number;
    currency:      string;
    status:        string;
    issuedAt?:     string;
    dueDate?:      string;
    paidAt?:       string;
    notes?:        string;
    customerName?: string;
    companyName?:  string;
  };

  const inv = data.invoice as Invoice;

  function fmtCurrency(n: number, currency = inv.currency ?? 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const brandName = (data as any).brandName ?? '';
  const brandLogo = (data as any).brandLogo ?? '';
</script>

<BrandedDocument {brandName} {brandLogo} title="Invoice {inv.invoiceNumber}">
  <!-- Invoice header -->
  <div class="flex flex-wrap items-start justify-between gap-4 mb-10">
    <div>
      <p class="text-xs text-black uppercase tracking-widest mb-1">Invoice</p>
      <h1 class="text-3xl font-mono font-semibold text-gray-800">{inv.invoiceNumber}</h1>
    </div>
    <div class="text-right text-sm text-gray-500">
      {#if inv.issuedAt}
        <p><span class="text-black">Issued:</span> {fmtDate(inv.issuedAt)}</p>
      {/if}
      {#if inv.dueDate}
        <p><span class="text-black">Due:</span> {fmtDate(inv.dueDate)}</p>
      {/if}
      {#if inv.paidAt}
        <p class="text-green-600 font-medium">Paid {fmtDate(inv.paidAt)}</p>
      {/if}
    </div>
  </div>

  <!-- Bill to -->
  {#if inv.customerName || inv.companyName}
    <div class="mb-8">
      <p class="text-xs text-black uppercase tracking-widest mb-1">Bill To</p>
      {#if inv.companyName}<p class="font-medium text-gray-800">{inv.companyName}</p>{/if}
      {#if inv.customerName}<p class="text-sm text-gray-600">{inv.customerName}</p>{/if}
    </div>
  {/if}

  <!-- Line items -->
  <table class="w-full text-sm mb-6">
    <thead>
      <tr class="border-b-2 border-gray-200">
        <th class="text-left py-2 pr-4 text-gray-500 font-medium">Description</th>
        <th class="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">Qty</th>
        <th class="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">Unit Price</th>
        <th class="text-right py-2 pl-4 text-gray-500 font-medium whitespace-nowrap">Amount</th>
      </tr>
    </thead>
    <tbody>
      {#each inv.lineItems as item}
        <tr class="border-b border-gray-100">
          <td class="py-3 pr-4 text-gray-800">{item.description}</td>
          <td class="py-3 px-2 text-right text-gray-600">{item.quantity}</td>
          <td class="py-3 px-2 text-right text-gray-600">{fmtCurrency(item.unitPrice)}</td>
          <td class="py-3 pl-4 text-right text-gray-800 font-medium">{fmtCurrency(item.amount)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="flex justify-end mb-8">
    <div class="w-64 text-sm">
      <div class="flex justify-between py-1.5 text-gray-600">
        <span>Subtotal</span>
        <span>{fmtCurrency(inv.subtotal)}</span>
      </div>
      {#if inv.taxRate > 0}
        <div class="flex justify-between py-1.5 text-gray-600">
          <span>Tax ({inv.taxRate}%)</span>
          <span>{fmtCurrency(inv.taxAmount)}</span>
        </div>
      {/if}
      <div class="flex justify-between py-2 border-t-2 border-gray-800 font-semibold text-base text-gray-900 mt-1">
        <span>Total</span>
        <span>{fmtCurrency(inv.total)}</span>
      </div>
    </div>
  </div>

  <!-- Notes -->
  {#if inv.notes}
    <div class="border-t border-gray-100 pt-6">
      <p class="text-xs text-black uppercase tracking-widest mb-2">Notes</p>
      <p class="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{inv.notes}</p>
    </div>
  {/if}

  {#snippet footer()}
    Invoice {inv.invoiceNumber} &mdash; {brandName || 'Confidential'}
  {/snippet}
</BrandedDocument>
