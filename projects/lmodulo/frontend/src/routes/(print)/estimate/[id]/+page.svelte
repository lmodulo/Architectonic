<script lang="ts">
  import BrandedDocument from '$lib/components/BrandedDocument.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type LineItem = { description: string; quantity: number; unitPrice: number; amount: number };
  type Estimate = {
    estimateNumber: string;
    title:          string;
    lineItems:      LineItem[];
    subtotal:       number;
    taxRate:        number;
    taxAmount:      number;
    total:          number;
    currency:       string;
    status:         string;
    validUntil?:    string;
    notes?:         string;
    customerName?:  string;
    companyName?:   string;
  };

  const est = data.estimate as Estimate;

  function fmtCurrency(n: number, currency = est.currency ?? 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const STATUS_LABEL: Record<string, string> = {
    accepted: 'Accepted',
    declined: 'Declined',
    sent:     'Sent',
    draft:    'Draft',
    expired:  'Expired',
  };

  const brandName = (data as any).brandName ?? '';
  const brandLogo = (data as any).brandLogo ?? '';
</script>

<BrandedDocument {brandName} {brandLogo} title="Estimate {est.estimateNumber ?? est.title}">
  <!-- Estimate header -->
  <div class="flex flex-wrap items-start justify-between gap-4 mb-10">
    <div>
      <p class="text-xs text-black uppercase tracking-widest mb-1">Estimate</p>
      <h1 class="text-2xl font-semibold text-gray-800">{est.title}</h1>
      {#if est.estimateNumber}
        <p class="text-sm text-black font-mono mt-0.5">{est.estimateNumber}</p>
      {/if}
    </div>
    <div class="text-right text-sm text-gray-500">
      {#if est.validUntil}
        <p><span class="text-black">Valid until:</span> {fmtDate(est.validUntil)}</p>
      {/if}
      {#if est.status}
        <p class="mt-1 font-medium">{STATUS_LABEL[est.status] ?? est.status}</p>
      {/if}
    </div>
  </div>

  <!-- Prepared for -->
  {#if est.customerName || est.companyName}
    <div class="mb-8">
      <p class="text-xs text-black uppercase tracking-widest mb-1">Prepared For</p>
      {#if est.companyName}<p class="font-medium text-gray-800">{est.companyName}</p>{/if}
      {#if est.customerName}<p class="text-sm text-gray-600">{est.customerName}</p>{/if}
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
      {#each est.lineItems as item}
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
        <span>{fmtCurrency(est.subtotal)}</span>
      </div>
      {#if est.taxRate > 0}
        <div class="flex justify-between py-1.5 text-gray-600">
          <span>Tax ({est.taxRate}%)</span>
          <span>{fmtCurrency(est.taxAmount)}</span>
        </div>
      {/if}
      <div class="flex justify-between py-2 border-t-2 border-gray-800 font-semibold text-base text-gray-900 mt-1">
        <span>Total</span>
        <span>{fmtCurrency(est.total)}</span>
      </div>
    </div>
  </div>

  <!-- Notes -->
  {#if est.notes}
    <div class="border-t border-gray-100 pt-6">
      <p class="text-xs text-black uppercase tracking-widest mb-2">Notes</p>
      <p class="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{est.notes}</p>
    </div>
  {/if}

  {#snippet footer()}
    Estimate &mdash; {brandName || 'Confidential'}
  {/snippet}
</BrandedDocument>
