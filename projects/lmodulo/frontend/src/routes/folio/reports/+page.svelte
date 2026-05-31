<script lang="ts">
  import { goto } from '$app/navigation';
  import { dragScroll } from '$lib/actions/dragScroll';
  import { hasPermission } from '$lib/permissions';
  import PLBarChart      from '$lib/components/folio/PLBarChart.svelte';
  import ExpensePieChart from '$lib/components/folio/ExpensePieChart.svelte';
  import { BarChart2 } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const { report, filters } = $derived(data);
  const s = $derived(report.summary);

  // Filter form state
  let from    = $state(filters.from);
  let to      = $state(filters.to);
  let groupBy = $state(filters.groupBy);

  function applyFilters() {
    const qs = new URLSearchParams({ from, to, groupBy });
    goto(`/folio/reports?${qs}`);
  }

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtPct(n: number) {
    return `${n.toFixed(1)}%`;
  }

  // Tax summary: collapse periods into quarters regardless of groupBy
  type TaxRow = { label: string; revenue: number; taxCollected: number; effectiveRate: number };

  const taxRows = $derived.by((): TaxRow[] => {
    if (groupBy !== 'month') return report.periods.map(p => ({
      label:         p.label,
      revenue:       p.revenue,
      taxCollected:  p.taxCollected,
      effectiveRate: p.revenue > 0 ? (p.taxCollected / p.revenue) * 100 : 0,
    }));

    // Collapse months into quarters
    const qMap = new Map<string, { revenue: number; taxCollected: number }>();
    for (const p of report.periods) {
      const [y, m] = p.key.split('-');
      const q = Math.ceil(Number(m) / 3);
      const key = `${y} Q${q}`;
      const existing = qMap.get(key) ?? { revenue: 0, taxCollected: 0 };
      qMap.set(key, {
        revenue:      existing.revenue      + p.revenue,
        taxCollected: existing.taxCollected + p.taxCollected,
      });
    }
    return Array.from(qMap.entries()).map(([label, v]) => ({
      label,
      revenue:       v.revenue,
      taxCollected:  v.taxCollected,
      effectiveRate: v.revenue > 0 ? (v.taxCollected / v.revenue) * 100 : 0,
    }));
  });

  function downloadCSV() {
    const rows: (string | number)[][] = [
      ['Period', 'Revenue', 'Expenses', 'Net Profit', 'Tax Collected'],
      ...report.periods.map(p => [p.label, p.revenue, p.expenses, p.net, p.taxCollected]),
      [],
      ['Summary', '', '', '', ''],
      ['Total Revenue',      s.revenue,      '', '', ''],
      ['Total Expenses',     s.expenses,     '', '', ''],
      ['Net Profit',         s.netProfit,    '', '', ''],
      ['Profit Margin (%)',  s.profitMargin, '', '', ''],
      ['Tax Collected',      s.taxCollected, '', '', ''],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pl-report-${filters.from}-${filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head><title>Reports — Folio</title></svelte:head>

<style>
  @media print {
    .no-print { display: none !important; }
  }
</style>

<div class="space-y-6">

  <!-- Filter bar -->
  <div class="no-print flex flex-wrap items-end gap-3">
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="rep-from">From</label>
      <input id="rep-from" type="date" class="input input-sm" bind:value={from} />
    </div>
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="rep-to">To</label>
      <input id="rep-to" type="date" class="input input-sm" bind:value={to} />
    </div>
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="rep-group">Group by</label>
      <select id="rep-group" class="select select-sm" bind:value={groupBy}>
        <option value="month">Month</option>
        <option value="quarter">Quarter</option>
        <option value="year">Year</option>
      </select>
    </div>
    <button type="button" class="btn btn-primary btn-sm" onclick={applyFilters}>Apply</button>

    {#if hasPermission(data.user, 'finance_reports', 'read')}
      <div class="ml-auto flex gap-2">
        <button type="button" class="btn btn-ghost btn-sm" onclick={downloadCSV}>
          Download CSV
        </button>
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => window.print()}>
          Print / PDF
        </button>
      </div>
    {/if}
  </div>

  <!-- Summary cards -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Revenue</p>
      <p class="text-xl font-bold mt-1 text-success">{fmtCurrency(s.revenue)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Expenses</p>
      <p class="text-xl font-bold mt-1 text-error">{fmtCurrency(s.expenses)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Net Profit</p>
      <p class="text-xl font-bold mt-1 {s.netProfit >= 0 ? 'text-success' : 'text-error'}">
        {fmtCurrency(s.netProfit)}
      </p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Profit Margin</p>
      <p class="text-xl font-bold mt-1">{fmtPct(s.profitMargin)}</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs opacity-50 uppercase tracking-wide">Tax Collected</p>
      <p class="text-xl font-bold mt-1">{fmtCurrency(s.taxCollected)}</p>
    </div>
  </div>

  {#if report.periods.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center">
      <BarChart2 class="size-8 opacity-20 mx-auto mb-2" />
      <p class="text-sm opacity-40">No paid invoices or expenses in this date range.</p>
    </div>
  {:else}

    <!-- Revenue vs Expenses chart -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-4">
      <p class="text-xs font-semibold opacity-50 uppercase tracking-wide mb-3">Revenue vs Expenses</p>
      <PLBarChart periods={report.periods} />
    </div>

    <!-- Charts row -->
    {#if report.expensesByCategory.length > 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-4">
        <p class="text-xs font-semibold opacity-50 uppercase tracking-wide mb-3">Expenses by Category</p>
        <ExpensePieChart categories={report.expensesByCategory} />
      </div>
    {/if}

    <!-- Period table -->
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <div class="p-4 pb-2">
        <p class="text-xs font-semibold opacity-50 uppercase tracking-wide">Period Detail</p>
      </div>
      <div use:dragScroll class="table-scroll">
      <table class="table table-sm">
        <thead>
          <tr class="bg-base-300/30">
            <th>Period</th>
            <th class="text-right">Revenue</th>
            <th class="text-right">Expenses</th>
            <th class="text-right">Net</th>
            <th class="text-right">Tax Collected</th>
          </tr>
        </thead>
        <tbody>
          {#each report.periods as p (p.key)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td class="font-medium text-sm">{p.label}</td>
              <td class="text-right text-sm text-success">{fmtCurrency(p.revenue)}</td>
              <td class="text-right text-sm text-error">{fmtCurrency(p.expenses)}</td>
              <td class="text-right text-sm font-semibold {p.net >= 0 ? 'text-success' : 'text-error'}">
                {fmtCurrency(p.net)}
              </td>
              <td class="text-right text-sm opacity-70">{fmtCurrency(p.taxCollected)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="bg-base-300/40 font-semibold">
            <td class="text-sm">Total</td>
            <td class="text-right text-sm text-success">{fmtCurrency(s.revenue)}</td>
            <td class="text-right text-sm text-error">{fmtCurrency(s.expenses)}</td>
            <td class="text-right text-sm {s.netProfit >= 0 ? 'text-success' : 'text-error'}">
              {fmtCurrency(s.netProfit)}
            </td>
            <td class="text-right text-sm">{fmtCurrency(s.taxCollected)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>

    <!-- Tax summary table -->
    {#if taxRows.some(r => r.taxCollected > 0)}
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <div class="p-4 pb-2">
          <p class="text-xs font-semibold opacity-50 uppercase tracking-wide">Tax Period Summary</p>
        </div>
        <div use:dragScroll class="table-scroll">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-300/30">
              <th>Period</th>
              <th class="text-right">Revenue</th>
              <th class="text-right">Tax Collected</th>
              <th class="text-right">Effective Rate</th>
            </tr>
          </thead>
          <tbody>
            {#each taxRows as row (row.label)}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                <td class="font-medium text-sm">{row.label}</td>
                <td class="text-right text-sm">{fmtCurrency(row.revenue)}</td>
                <td class="text-right text-sm">{fmtCurrency(row.taxCollected)}</td>
                <td class="text-right text-sm opacity-70">{fmtPct(row.effectiveRate)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
      </div>
    {/if}

  {/if}

  <!-- Outstanding note -->
  {#if s.outstanding > 0}
    <p class="text-xs opacity-50 text-right">
      Outstanding (sent + overdue): {fmtCurrency(s.outstanding)} — not included in revenue above.
    </p>
  {/if}

</div>
