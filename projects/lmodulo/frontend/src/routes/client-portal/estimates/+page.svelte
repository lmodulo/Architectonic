<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ClipboardList, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type LineItem = { description: string; quantity: number; unitPrice: number; amount: number };
  type Estimate = {
    id:           string;
    estimateNumber: string;
    title:        string;
    lineItems:    LineItem[];
    validUntil?:  string;
    total:        number;
    currency:     string;
    status:       string;
    invoiceId?:   string | null;
  };

  const estimates = $state<Estimate[]>(data.estimates as Estimate[]);
  const PAGE_SIZE = 25;

  let actionError  = $state('');
  let actingId     = $state('');

  const STATUS_BADGE: Record<string, string> = {
    accepted: 'badge-success',
    declined: 'badge-error',
    sent:     'badge-warning',
    draft:    'badge-ghost',
    expired:  'badge-neutral',
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

  async function respond(id: string, action: 'accept' | 'decline') {
    actingId    = id;
    actionError = '';
    try {
      const res = await fetch(`/api/finance/estimates/${id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        actionError = d.message ?? 'Something went wrong';
      } else {
        await invalidateAll();
      }
    } catch {
      actionError = 'Network error';
    } finally {
      actingId = '';
    }
  }

  function setStatus(s: string) {
    const u = new URL($page.url);
    if (s) u.searchParams.set('status', s);
    else   u.searchParams.delete('status');
    u.searchParams.delete('skip');
    goto(u.toString());
  }

  function goPage(delta: number) {
    const u   = new URL($page.url);
    const cur = Number(u.searchParams.get('skip') ?? 0);
    u.searchParams.set('skip', String(Math.max(0, cur + delta * PAGE_SIZE)));
    goto(u.toString());
  }

  const statuses = ['', 'sent', 'accepted', 'declined', 'expired'];
  const statusLabels: Record<string, string> = {
    '': 'All', sent: 'Pending', accepted: 'Accepted', declined: 'Declined', expired: 'Expired',
  };
</script>

<div class="p-6 max-w-5xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <ClipboardList class="w-6 h-6 opacity-60" />
    <div>
      <h1 class="text-xl font-semibold">Estimates</h1>
      <p class="text-sm opacity-60">Review and sign off on proposals</p>
    </div>
  </div>

  {#if actionError}
    <div class="alert alert-error mb-4">
      <XCircle class="w-4 h-4" />
      <span>{actionError}</span>
    </div>
  {/if}

  <!-- Status filter -->
  <div class="flex flex-wrap gap-2 mb-4">
    {#each statuses as s}
      <button
        class="btn btn-sm {data.status === s ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => setStatus(s)}
      >{statusLabels[s]}</button>
    {/each}
  </div>

  {#if estimates.length === 0}
    <div class="text-center py-16 opacity-40">
      <ClipboardList class="w-10 h-10 mx-auto mb-3" />
      <p>No estimates found</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-box border border-base-200">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200/50">
            <th>Estimate</th>
            <th>Description</th>
            <th>Valid Until</th>
            <th class="text-right">Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each estimates as est (est.id)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td><span class="font-mono text-xs">{est.estimateNumber}</span></td>
              <td class="max-w-xs truncate text-sm">{est.title || lineItemSummary(est.lineItems)}</td>
              <td class="text-sm">{fmtDate(est.validUntil)}</td>
              <td class="text-right font-semibold">{fmtCurrency(est.total, est.currency)}</td>
              <td>
                <span class="badge badge-sm {STATUS_BADGE[est.status] ?? 'badge-ghost'}">{est.status}</span>
              </td>
              <td>
                {#if est.status === 'sent'}
                  <div class="flex gap-1 justify-end">
                    <button
                      class="btn btn-xs btn-success gap-1"
                      disabled={actingId === est.id}
                      onclick={() => respond(est.id, 'accept')}
                    >
                      <CheckCircle class="w-3 h-3" /> Accept
                    </button>
                    <button
                      class="btn btn-xs btn-error btn-outline gap-1"
                      disabled={actingId === est.id}
                      onclick={() => respond(est.id, 'decline')}
                    >
                      <XCircle class="w-3 h-3" /> Decline
                    </button>
                  </div>
                {/if}
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
