<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { CreditCard, FileText, CheckCircle, AlertCircle, Clock, Circle } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Invoice = {
    id:            string;
    invoiceNumber: string;
    lineItems:     Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    subtotal:      number;
    taxRate:       number;
    taxAmount:     number;
    total:         number;
    currency:      string;
    status:        'draft' | 'sent' | 'paid' | 'overdue';
    dueDate?:      string;
    notes?:        string;
  };

  let invoices      = $state<Invoice[]>(data.invoices as Invoice[]);
  let activeTab     = $state<'invoices' | 'pay'>('invoices');
  let selectedInv   = $state<Invoice | null>(null);
  let clientSecret  = $state('');
  let payError      = $state('');
  let paySuccess    = $state(false);
  let loadingSecret = $state(false);
  let paySubmitting = $state(false);

  // Stripe Elements
  let stripeEl: HTMLDivElement;
  let cardElement: any = null;
  let stripeInstance: any = null;

  const stripePk = env.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

  const STATUS_ICON: Record<string, typeof CheckCircle> = {
    paid:    CheckCircle,
    overdue: AlertCircle,
    sent:    Clock,
    draft:   Circle,
  };

  const STATUS_CLASS: Record<string, string> = {
    paid:    'badge-success',
    overdue: 'badge-error',
    sent:    'badge-warning',
    draft:   'badge-ghost',
  };

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function selectInvoice(inv: Invoice) {
    selectedInv  = inv;
    activeTab    = 'pay';
    clientSecret = '';
    payError     = '';
    paySuccess   = false;

    if (inv.status === 'paid') return;

    loadingSecret = true;
    try {
      const res = await fetch(`/api/finance/invoices/${inv.id}/pay`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        payError = (d as { message?: string }).message ?? 'Could not initiate payment';
        return;
      }
      const d = await res.json();
      clientSecret = d.clientSecret ?? '';
      await mountCard();
    } catch {
      payError = 'Network error';
    } finally {
      loadingSecret = false;
    }
  }

  async function mountCard() {
    if (!stripePk || !clientSecret) return;
    const { loadStripe } = await import('@stripe/stripe-js');
    stripeInstance = await loadStripe(stripePk);
    if (!stripeInstance) return;
    const elements = stripeInstance.elements({ clientSecret });
    cardElement    = elements.create('payment');
    await new Promise(r => setTimeout(r, 50));
    if (stripeEl) cardElement.mount(stripeEl);
  }

  async function pay() {
    if (!stripeInstance || !cardElement || !clientSecret) return;
    paySubmitting = true; payError = '';
    const { error } = await stripeInstance.confirmPayment({
      elements: cardElement._elements ?? cardElement,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    if (error) {
      payError = error.message ?? 'Payment failed';
    } else {
      paySuccess = true;
      await invalidateAll();
      invoices = (await fetch('/api/finance/invoices').then(r => r.json()).catch(() => ({ invoices: [] }))).invoices ?? invoices;
    }
    paySubmitting = false;
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_intent_client_secret')) {
      paySuccess = true;
      invalidateAll();
    }
  });
</script>

<svelte:head><title>Payments</title></svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Payments</h1>
    <p class="text-sm opacity-60 mt-0.5">View your invoices and make payments.</p>
  </div>

  <!-- Tabs -->
  <div class="tabs tabs-box border border-base-300 rounded-box bg-base-200 p-1 w-fit">
    <button
      type="button"
      class="tab {activeTab === 'invoices' ? 'tab-active' : ''}"
      onclick={() => (activeTab = 'invoices')}
    >
      <FileText class="size-4 mr-1.5" />
      Invoices
    </button>
    <button
      type="button"
      class="tab {activeTab === 'pay' ? 'tab-active' : ''}"
      onclick={() => (activeTab = 'pay')}
    >
      <CreditCard class="size-4 mr-1.5" />
      Pay
    </button>
  </div>

  {#if activeTab === 'invoices'}
    <!-- Invoice table -->
    {#if invoices.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
        <FileText class="size-8 opacity-20 mx-auto mb-2" />
        <p class="text-sm opacity-40">No invoices yet.</p>
      </div>
    {:else}
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-300/30">
              <th>Invoice</th>
              <th>Description</th>
              <th>Due Date</th>
              <th class="text-right">Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each invoices as inv (inv.id)}
              {@const StatusIcon = STATUS_ICON[inv.status] ?? Circle}
              <tr
                class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
                onclick={() => selectInvoice(inv)}
              >
                <td class="font-mono text-xs">{inv.invoiceNumber}</td>
                <td class="text-sm">
                  {#if inv.lineItems?.length > 0}
                    {inv.lineItems[0].description}{inv.lineItems.length > 1 ? ` +${inv.lineItems.length - 1} more` : ''}
                  {:else}
                    —
                  {/if}
                </td>
                <td class="text-sm">{fmtDate(inv.dueDate)}</td>
                <td class="text-right font-semibold text-sm">{fmtCurrency(inv.total)}</td>
                <td>
                  <span class="badge badge-sm {STATUS_CLASS[inv.status] ?? 'badge-ghost'} gap-1">
                    <StatusIcon class="size-3" />
                    {inv.status}
                  </span>
                </td>
                <td>
                  {#if inv.status !== 'paid' && inv.status !== 'draft'}
                    <button
                      type="button"
                      class="btn btn-primary btn-xs"
                      onclick={(e) => { e.stopPropagation(); selectInvoice(inv); }}
                    >
                      Pay
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

  {:else}
    <!-- Pay tab -->
    {#if !selectedInv}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
        <CreditCard class="size-8 opacity-20 mx-auto mb-2" />
        <p class="text-sm opacity-40">Select an invoice from the Invoices tab to pay.</p>
      </div>
    {:else}
      <div class="space-y-4 max-w-lg">
        <!-- Invoice summary -->
        <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-sm font-semibold">{selectedInv.invoiceNumber}</span>
            <span class="badge badge-sm {STATUS_CLASS[selectedInv.status] ?? 'badge-ghost'}">{selectedInv.status}</span>
          </div>
          {#each selectedInv.lineItems ?? [] as item (item.description)}
            <div class="flex items-center justify-between text-sm">
              <span>{item.description} × {item.quantity}</span>
              <span>{fmtCurrency(item.amount)}</span>
            </div>
          {/each}
          <div class="border-t border-base-300 pt-2 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="opacity-60">Subtotal</span>
              <span>{fmtCurrency(selectedInv.subtotal)}</span>
            </div>
            {#if selectedInv.taxRate > 0}
              <div class="flex justify-between">
                <span class="opacity-60">Tax ({selectedInv.taxRate}%)</span>
                <span>{fmtCurrency(selectedInv.taxAmount)}</span>
              </div>
            {/if}
            <div class="flex justify-between font-semibold text-base pt-1">
              <span>Total</span>
              <span>{fmtCurrency(selectedInv.total)}</span>
            </div>
          </div>
          {#if selectedInv.dueDate}
            <p class="text-xs opacity-50">Due {fmtDate(selectedInv.dueDate)}</p>
          {/if}
        </div>

        {#if selectedInv.status === 'paid'}
          <div class="alert alert-success">
            <CheckCircle class="size-4" />
            <span>This invoice has been paid.</span>
          </div>
        {:else if paySuccess}
          <div class="alert alert-success">
            <CheckCircle class="size-4" />
            <span>Payment successful! Thank you.</span>
          </div>
        {:else}
          {#if payError}
            <aside class="alert alert-error p-3 rounded text-sm">{payError}</aside>
          {/if}

          {#if loadingSecret}
            <p class="text-sm opacity-50">Preparing payment…</p>
          {:else if !stripePk}
            <aside class="alert alert-warning p-3 rounded text-sm">
              Stripe is not configured. Set <code>PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable payments.
            </aside>
          {:else if clientSecret}
            <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
              <h3 class="text-sm font-semibold">Card details</h3>
              <div bind:this={stripeEl} class="p-3 border border-base-300 rounded bg-base-100"></div>
              <button
                type="button"
                class="btn btn-primary w-full"
                disabled={paySubmitting}
                onclick={pay}
              >
                <CreditCard class="size-4" />
                {paySubmitting ? 'Processing…' : `Pay ${fmtCurrency(selectedInv.total)}`}
              </button>
            </div>
          {/if}
        {/if}

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          onclick={() => { activeTab = 'invoices'; selectedInv = null; }}
        >
          ← Back to invoices
        </button>
      </div>
    {/if}
  {/if}
</div>
