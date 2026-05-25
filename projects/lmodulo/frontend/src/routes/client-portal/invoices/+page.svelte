<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { FileText, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type LineItem = { description: string; quantity: number; unitPrice: number; amount: number };
  type Invoice = {
    id:          string;
    invoiceNumber: string;
    lineItems:   LineItem[];
    dueDate?:    string;
    total:       number;
    currency:    string;
    status:      string;
    paidAt?:     string;
  };

  const invoices = data.invoices as Invoice[];
  const PAGE_SIZE = 25;

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

  function lineItemSummary(items: LineItem[]) {
    if (!items?.length) return '—';
    const first = items[0].description;
    return items.length > 1 ? `${first} +${items.length - 1} more` : first;
  }

  function setStatus(s: string) {
    const u = new URL(page.url);
    if (s) u.searchParams.set('status', s);
    else   u.searchParams.delete('status');
    u.searchParams.delete('skip');
    goto(u.toString());
  }

  function goPage(delta: number) {
    const u   = new URL(page.url);
    const cur = Number(u.searchParams.get('skip') ?? 0);
    u.searchParams.set('skip', String(Math.max(0, cur + delta * PAGE_SIZE)));
    goto(u.toString());
  }

  const statuses = ['', 'draft', 'sent', 'paid', 'overdue'];
  const statusLabels: Record<string, string> = { '': 'All', draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' };
</script>

<div class="p-6 max-w-5xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <FileText class="w-6 h-6 opacity-60" />
    <div>
      <h1 class="text-xl font-semibold">Invoices</h1>
      <p class="text-sm opacity-60">Your billing history</p>
    </div>
  </div>

  <!-- Status filter -->
  <div class="flex flex-wrap gap-2 mb-4">
    {#each statuses as s}
      <button
        class="btn btn-sm {data.status === s ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => setStatus(s)}
      >{statusLabels[s]}</button>
    {/each}
  </div>

  {#if invoices.length === 0}
    <div class="text-center py-16 opacity-40">
      <FileText class="w-10 h-10 mx-auto mb-3" />
      <p>No invoices found</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-box border border-base-200">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200/50">
            <th>Invoice</th>
            <th>Description</th>
            <th>Due</th>
            <th class="text-right">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each invoices as inv (inv.id)}
            <tr
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
              onclick={() => goto(`/client-portal/invoices/${inv.id}`)}
            >
              <td><span class="font-mono text-xs">{inv.invoiceNumber}</span></td>
              <td class="max-w-xs truncate text-sm">{lineItemSummary(inv.lineItems)}</td>
              <td class="text-sm">{fmtDate(inv.dueDate)}</td>
              <td class="text-right font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
              <td>
                <span class="badge badge-sm {STATUS_BADGE[inv.status] ?? 'badge-ghost'}">{inv.status}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if data.total > PAGE_SIZE}
      <div class="flex items-center justify-end gap-2 mt-4 text-sm">
        <span class="opacity-60">{data.skip + 1}–{Math.min(data.skip + PAGE_SIZE, data.total)} of {data.total}</span>
        <button class="btn btn-sm btn-ghost" disabled={data.skip === 0} onclick={() => goPage(-1)}>
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button class="btn btn-sm btn-ghost" disabled={data.skip + PAGE_SIZE >= data.total} onclick={() => goPage(1)}>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    {/if}
  {/if}
</div>
