<script lang="ts">
  import { goto } from '$app/navigation';
  import { Users, FileText, DollarSign, AlertCircle } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Customer = {
    id:          string;
    firstName:   string;
    lastName:    string;
    email:       string;
    companyId?:  string;
    companyName?: string;
  };

  type Invoice = {
    id:            string;
    invoiceNumber: string;
    customerId:    string;
    total:         number;
    status:        string;
  };

  const customers = data.customers as Customer[];
  const invoices  = data.invoices  as Invoice[];

  function customerStats(customerId: string) {
    const invs = invoices.filter(i => i.customerId === customerId);
    const total  = invs.reduce((s, i) => s + (i.total ?? 0), 0);
    const paid   = invs.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const open   = invs.filter(i => i.status === 'sent' || i.status === 'overdue').length;
    const overdue = invs.filter(i => i.status === 'overdue').length;
    return { count: invs.length, total, paid, open, overdue };
  }

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  // Summary totals
  const totalOutstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + (i.total ?? 0), 0);
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + (i.total ?? 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
</script>

<svelte:head><title>Folio</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">Folio</h1>
      <p class="text-sm opacity-60 mt-0.5">Finance overview — clients and invoices.</p>
    </div>
    <a href="/folio/invoices/new" class="btn btn-primary btn-sm">
      <FileText class="size-4" />
      New Invoice
    </a>
  </div>

  <!-- Summary cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Clients</p>
      <p class="text-2xl font-bold mt-1">{customers.length}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Total Paid</p>
      <p class="text-2xl font-bold mt-1 text-success">{fmtCurrency(totalPaid)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Outstanding</p>
      <p class="text-2xl font-bold mt-1">{fmtCurrency(totalOutstanding)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Overdue</p>
      <p class="text-2xl font-bold mt-1 {overdueCount > 0 ? 'text-error' : ''}">{overdueCount}</p>
    </div>
  </div>

  <!-- Client list -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Clients ({customers.length})</h2>
      <a href="/folio/invoices" class="btn btn-ghost btn-sm text-xs opacity-60 hover:opacity-100">
        View all invoices →
      </a>
    </div>

    {#if customers.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
        <Users class="size-8 opacity-20 mx-auto mb-2" />
        <p class="text-sm opacity-40">No clients yet. Convert a CRM contact to create one.</p>
      </div>
    {:else}
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-300/30">
              <th>Client</th>
              <th>Company</th>
              <th class="text-right">Invoices</th>
              <th class="text-right">Total</th>
              <th class="text-right">Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each customers as customer (customer.id)}
              {@const stats = customerStats(customer.id)}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                <td>
                  <div class="font-medium text-sm">{customer.firstName} {customer.lastName}</div>
                  <div class="text-xs opacity-50">{customer.email}</div>
                </td>
                <td class="text-sm">{customer.companyName ?? '—'}</td>
                <td class="text-right text-sm">
                  {stats.count}
                  {#if stats.overdue > 0}
                    <span class="badge badge-error badge-xs ml-1">{stats.overdue} overdue</span>
                  {/if}
                </td>
                <td class="text-right text-sm font-medium">{fmtCurrency(stats.total)}</td>
                <td class="text-right text-sm text-success">{fmtCurrency(stats.paid)}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    onclick={() => goto(`/folio/invoices?customerId=${customer.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
