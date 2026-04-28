<script lang="ts">
  import { ArrowLeft, TrendingUp } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface Bucket {
    month:             string;
    projectedIncome:   number;
    projectedExpenses: number;
    projectedBalance:  number;
    runningBalance:    number;
  }

  // ── Seeded dummy data when no real data ────────────────────────────
  function makeRng(seed: number) {
    let s = (seed >>> 0) || 1;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
  }

  let buckets = $derived<Bucket[]>(() => {
    const real = data.buckets as Bucket[];
    if (real.length > 0) return real;

    // Seed with today's year+month for determinism
    const rng = makeRng(20240101);
    const now = new Date();
    let running = 8000;
    return Array.from({ length: 12 }, (_, i) => {
      const d       = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const income  = Math.round((rng() * 2000 + 4000) * 100) / 100;
      const expense = Math.round((rng() * 1500 + 2000) * 100) / 100;
      running += income - expense;
      return {
        month:             `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        projectedIncome:   income,
        projectedExpenses: expense,
        projectedBalance:  Math.round((income - expense) * 100) / 100,
        runningBalance:    Math.round(running * 100) / 100,
      };
    });
  });

  // ── SVG area chart ─────────────────────────────────────────────────
  const CW = 560; const CH = 180; const PAD = 28;

  function pts(field: keyof Bucket, w = CW, h = CH, p = PAD): string {
    const vals  = buckets().map(b => b[field] as number);
    const mx    = Math.max(...vals, 1);
    const mn    = Math.min(...vals, 0);
    const range = mx - mn || 1;
    return buckets().map((b, i) => {
      const x = p + (i / (buckets().length - 1)) * (w - p * 2);
      const y = h - p - ((b[field] as number - mn) / range) * (h - p * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  function areaPath(field: keyof Bucket): string {
    const vals  = buckets().map(b => b[field] as number);
    const mx    = Math.max(...vals, 1);
    const mn    = Math.min(...vals, 0);
    const range = mx - mn || 1;
    const n     = buckets().length;
    const polyPts = buckets().map((b, i) => {
      const x = PAD + (i / (n - 1)) * (CW - PAD * 2);
      const y = CH - PAD - ((b[field] as number - mn) / range) * (CH - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const firstX = PAD;
    const lastX  = CW - PAD;
    return `M${firstX},${CH - PAD} L${polyPts} L${lastX},${CH - PAD} Z`;
  }

  // ── Formatting ──────────────────────────────────────────────────────
  function fmtCurrency(n: number) {
    const sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function fmtMonth(m: string) {
    const [y, mo] = m.split('-');
    const d = new Date(Number(y), Number(mo) - 1, 1);
    return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  }

  let isDummy = $derived(!(data.buckets as Bucket[]).length);
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center gap-3">
    <a href="/budget/planning" class="opacity-60 hover:opacity-100"><ArrowLeft size={18} /></a>
    <h1 class="text-2xl font-semibold">12-Month Cash Flow</h1>
  </div>

  {#if isDummy}
    <div class="alert preset-tonal-warning text-sm">
      No transaction history yet — showing a sample projection. Connect a bank account to see your real forecast.
    </div>
  {/if}

  <!-- Chart -->
  <div class="card p-5 space-y-3">
    <h2 class="font-semibold text-sm opacity-70 uppercase tracking-wide flex items-center gap-2">
      <TrendingUp size={14} /> Projected Running Balance
    </h2>
    <svg viewBox="0 0 {CW} {CH}" class="w-full h-auto">
      <!-- Fill areas -->
      <path d={areaPath('runningBalance')} class="fill-primary-500" opacity="0.12" />
      <!-- Line -->
      <polyline points={pts('runningBalance')} fill="none" class="stroke-primary-500" stroke-width="2" stroke-linejoin="round" />
      <!-- Dots -->
      {#each buckets() as b, i}
        {@const x = PAD + (i / (buckets().length - 1)) * (CW - PAD * 2)}
        {@const vals  = buckets().map(bk => bk.runningBalance)}
        {@const mx    = Math.max(...vals, 1)}
        {@const mn    = Math.min(...vals, 0)}
        {@const range = mx - mn || 1}
        {@const y     = CH - PAD - ((b.runningBalance - mn) / range) * (CH - PAD * 2)}
        <circle cx={x} cy={y} r="3" class="fill-primary-500" />
        <!-- Month label (every other) -->
        {#if i % 2 === 0}
          <text x={x} y={CH - 4} text-anchor="middle" font-size="9" fill="currentColor" opacity="0.5">
            {fmtMonth(b.month)}
          </text>
        {/if}
      {/each}
    </svg>
  </div>

  <!-- Breakdown table -->
  <div class="card p-0 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-xs opacity-50 uppercase tracking-wide border-b border-surface-200 dark:border-surface-700">
          <th class="text-left px-5 py-3 font-medium">Month</th>
          <th class="text-right px-4 py-3 font-medium">Income</th>
          <th class="text-right px-4 py-3 font-medium">Expenses</th>
          <th class="text-right px-4 py-3 font-medium">Net</th>
          <th class="text-right px-5 py-3 font-medium">Balance</th>
        </tr>
      </thead>
      <tbody>
        {#each buckets() as b (b.month)}
          <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
            <td class="px-5 py-3 font-medium">{fmtMonth(b.month)}</td>
            <td class="px-4 py-3 text-right text-success-600 dark:text-success-400 font-mono">
              {fmtCurrency(b.projectedIncome)}
            </td>
            <td class="px-4 py-3 text-right font-mono opacity-80">
              {fmtCurrency(b.projectedExpenses)}
            </td>
            <td class="px-4 py-3 text-right font-mono {b.projectedBalance >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-500'}">
              {fmtCurrency(b.projectedBalance)}
            </td>
            <td class="px-5 py-3 text-right font-mono font-medium {b.runningBalance < 0 ? 'text-error-500' : ''}">
              {fmtCurrency(b.runningBalance)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
