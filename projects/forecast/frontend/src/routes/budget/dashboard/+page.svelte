<script lang="ts">
  import { CreditCard, ArrowLeftRight, TrendingUp, Plus } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import PlaidLink from '$lib/components/PlaidLink.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // ── Derived totals ──────────────────────────────────────────────────
  let checking = $derived(
    data.institutions.flatMap((i: Record<string, unknown[]>) => i.accounts as Record<string, unknown>[])
      .filter((a: Record<string, unknown>) => a.type === 'depository' && (a.subtype === 'checking' || a.subtype === 'savings'))
      .reduce((s: number, a: Record<string, unknown>) => s + ((a.current as number) ?? 0), 0)
  );

  let totalBalance = $derived(
    data.institutions.flatMap((i: Record<string, unknown[]>) => i.accounts as Record<string, unknown>[])
      .reduce((s: number, a: Record<string, unknown>) => s + ((a.current as number) ?? 0), 0)
  );

  let hasAccounts = $derived(data.institutions.length > 0);

  // ── Monthly spending chart (last 6 months, from transactions) ───────
  const now = new Date();

  function makeRng(seed: number) {
    let s = (seed >>> 0) || 1;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
  }

  // Group real transactions by month, fall back to seeded dummy data
  function buildMonthlySpend() {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const mStr  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = (data.recentTx as Record<string, unknown>[])
        .filter((tx: Record<string, unknown>) => {
          const txDate = new Date(tx.date as string);
          return `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}` === mStr
            && (tx.amount as number) < 0;
        })
        .reduce((s: number, tx: Record<string, unknown>) => s + Math.abs(tx.amount as number), 0);
      months.push({ label, value: total });
    }
    return months;
  }

  const rng      = makeRng(20240101);
  const rawMonths = buildMonthlySpend();
  // If all zeros (no data), show seeded dummy
  const monthlySpend = rawMonths.every(m => m.value === 0)
    ? rawMonths.map(m => ({ ...m, value: Math.round((rng() * 3000 + 500) * 100) / 100 }))
    : rawMonths;

  // ── SVG bar chart ───────────────────────────────────────────────────
  const CW = 480; const CH = 140; const PAD = 24;
  const maxSpend = Math.max(...monthlySpend.map(m => m.value), 1);

  function barX(i: number, n: number) {
    const slot = (CW - PAD * 2) / n;
    return PAD + i * slot + slot * 0.15;
  }
  function barW(n: number) { return ((CW - PAD * 2) / n) * 0.7; }
  function barY(v: number) { return PAD + (1 - v / maxSpend) * (CH - PAD * 2); }
  function barH(v: number) { return (v / maxSpend) * (CH - PAD * 2); }

  // ── Formatting ──────────────────────────────────────────────────────
  function fmtCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function fmtAmount(n: number) {
    const sign = n >= 0 ? '+' : '';
    return sign + n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function onPlaidSuccess() {
    goto('/budget/accounts');
  }
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold">Finance Dashboard</h1>
    {#if hasPermission(data.user, 'budget_accounts', 'create')}
      <PlaidLink
        label="Connect Bank"
        onSuccess={onPlaidSuccess}
        class="btn preset-filled-primary-500 flex items-center gap-2"
      />
    {/if}
  </div>

  {#if !hasAccounts}
    <!-- Empty state -->
    <div class="card p-12 text-center space-y-4">
      <CreditCard class="mx-auto opacity-30" size={48} />
      <p class="text-lg font-medium">No accounts connected</p>
      <p class="text-sm opacity-60">Connect your bank to see balances and transactions.</p>
      {#if hasPermission(data.user, 'budget_accounts', 'create')}
        <PlaidLink
          label="Connect Bank Account"
          onSuccess={onPlaidSuccess}
          class="btn preset-filled-primary-500"
        />
      {/if}
    </div>
  {:else}
    <!-- KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card p-5 space-y-1">
        <p class="text-sm opacity-60 flex items-center gap-1"><CreditCard size={14} /> Total Balance</p>
        <p class="text-2xl font-bold">{fmtCurrency(totalBalance)}</p>
      </div>
      <div class="card p-5 space-y-1">
        <p class="text-sm opacity-60 flex items-center gap-1"><TrendingUp size={14} /> Checking &amp; Savings</p>
        <p class="text-2xl font-bold">{fmtCurrency(checking)}</p>
      </div>
      <div class="card p-5 space-y-1">
        <p class="text-sm opacity-60 flex items-center gap-1"><ArrowLeftRight size={14} /> Recent Transactions</p>
        <p class="text-2xl font-bold">{(data.recentTx as unknown[]).length}</p>
      </div>
    </div>

    <!-- Spending chart + recent transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Monthly spending bar chart -->
      <div class="card p-5 space-y-3">
        <h2 class="font-semibold text-sm opacity-70 uppercase tracking-wide">Monthly Spending (6 mo)</h2>
        <svg viewBox="0 0 {CW} {CH}" class="w-full h-auto">
          <!-- Grid lines -->
          {#each [0.25, 0.5, 0.75, 1] as frac}
            <line
              x1={PAD} y1={PAD + (1 - frac) * (CH - PAD * 2)}
              x2={CW - PAD} y2={PAD + (1 - frac) * (CH - PAD * 2)}
              stroke="currentColor" stroke-opacity="0.08" stroke-width="1"
            />
          {/each}

          <!-- Bars -->
          {#each monthlySpend as m, i}
            <rect
              x={barX(i, monthlySpend.length)}
              y={barY(m.value)}
              width={barW(monthlySpend.length)}
              height={barH(m.value)}
              rx="3"
              class="fill-primary-500 opacity-80"
            />
            <!-- Month label -->
            <text
              x={barX(i, monthlySpend.length) + barW(monthlySpend.length) / 2}
              y={CH - 4}
              text-anchor="middle"
              font-size="10"
              fill="currentColor"
              opacity="0.6"
            >{m.label}</text>
          {/each}
        </svg>
      </div>

      <!-- Recent transactions -->
      <div class="card p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm opacity-70 uppercase tracking-wide">Recent Transactions</h2>
          <a href="/budget/transactions" class="text-xs text-primary-500 hover:underline">View all</a>
        </div>
        {#if (data.recentTx as unknown[]).length === 0}
          <p class="text-sm opacity-50 text-center py-6">No transactions yet</p>
        {:else}
          <div class="divide-y divide-surface-200 dark:divide-surface-700">
            {#each data.recentTx as tx (tx.id)}
              <a
                href="/budget/transactions/{tx.id}"
                class="flex items-center justify-between py-2 hover:opacity-70 transition-opacity"
              >
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate">{tx.merchant || tx.description}</p>
                  <p class="text-xs opacity-50">{fmtDate(tx.date)} · {tx.category}</p>
                </div>
                <span class="text-sm font-mono ml-3 shrink-0 {tx.amount >= 0 ? 'text-success-600' : ''}">
                  {fmtAmount(tx.amount)}
                </span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
