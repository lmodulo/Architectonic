<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): real sales figures from /api/analytics.
  // Spans the full widget row (col-span-full). Amounts are in cents.
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { DollarSign, ShoppingCart, TrendingUp, Trophy, ArrowRight } from 'lucide-svelte';

  type Point = { label: string; revenue: number };
  type Analytics = {
    kpis: { totalRevenue: number; totalOrders: number; avgOrderValue: number; topProduct: string };
    dailyRevenue: Point[];
    monthlyRevenue: Point[];
    revenueByProduct: { label: string; value: number; units: number }[];
    recentOrders: { id: string; orderNumber: string; guestEmail?: string; status: string; total: number; createdAt: string }[];
  };

  let data = $state<Analytics | null>(null);
  let failed = $state(false);

  onMount(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) data = await res.json(); else failed = true;
    } catch { failed = true; }
  });

  const money = (cents: number) => '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const date  = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // ── Pure-SVG chart helpers ───────────────────────────────────────────
  function linePoints(pts: { value: number }[], w = 480, h = 140, p = 16): string {
    const mx = Math.max(...pts.map(d => d.value), 1);
    return pts.map((d, i) => `${(p + (i / (pts.length - 1)) * (w - p * 2)).toFixed(1)},${(h - p - (d.value / mx) * (h - p * 2)).toFixed(1)}`).join(' ');
  }
  function areaPath(pts: { value: number }[], w = 480, h = 140, p = 16): string {
    const mx = Math.max(...pts.map(d => d.value), 1);
    const c = pts.map((d, i) => ({ x: p + (i / (pts.length - 1)) * (w - p * 2), y: h - p - (d.value / mx) * (h - p * 2) }));
    return `M${c[0].x.toFixed(1)},${(h - p).toFixed(1)} L ${c.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' L ')} L${c[c.length - 1].x.toFixed(1)},${(h - p).toFixed(1)}Z`;
  }
  function hBars(pts: { label: string; value: number }[], w = 460, h = 165, lblW = 118, p = 10) {
    const mx = Math.max(...pts.map(d => d.value), 1);
    const rowH = (h - p * 2) / Math.max(pts.length, 1);
    return pts.map((d, i) => ({ ...d, x: lblW, y: p + i * rowH + rowH * 0.12, w: (d.value / mx) * (w - lblW - p - 56), bh: rowH * 0.76, midY: p + i * rowH + rowH / 2 }));
  }
  const COLORS = ['primary', 'secondary', 'accent', 'success', 'warning', 'info'] as const;
  const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-warning badge-soft', processing: 'badge-primary badge-soft', shipped: 'badge-secondary badge-soft',
    delivered: 'badge-success badge-soft', cancelled: 'badge-error badge-soft', refunded: 'badge-ghost',
  };

  const daily   = $derived((data?.dailyRevenue ?? []).map(d => ({ label: d.label, value: d.revenue })));
  const monthly = $derived((data?.monthlyRevenue ?? []).map(d => ({ label: d.label, value: d.revenue })));
  const bars    = $derived(hBars((data?.revenueByProduct ?? []).slice(0, 6)));
  const kpis    = $derived(data ? [
    // Literal class strings so Tailwind generates them (it can't see classes built at runtime)
    { label: 'Total Revenue',   value: money(data.kpis.totalRevenue),  sub: 'all time · processing, shipped, delivered', icon: DollarSign,   tone: 'bg-success/10 text-success' },
    { label: 'Orders',          value: String(data.kpis.totalOrders),  sub: 'processing, shipped, delivered',            icon: ShoppingCart, tone: 'bg-primary/10 text-primary' },
    { label: 'Avg Order Value', value: money(data.kpis.avgOrderValue), sub: 'per order',                                 icon: TrendingUp,   tone: 'bg-secondary/10 text-secondary' },
    { label: 'Top Product',     value: data.kpis.topProduct,           sub: 'by revenue',                                icon: Trophy,       tone: 'bg-warning/10 text-warning' },
  ] : []);
</script>

<section class="col-span-full space-y-4">
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span class="w-0.5 h-4 rounded-full bg-primary"></span>
      <h2 class="text-sm font-semibold">Sales</h2>
    </div>
    <a href="/commerce/orders" class="text-xs opacity-60 hover:opacity-100 flex items-center gap-1">All orders <ArrowRight class="size-3" /></a>
  </div>

  {#if failed}
    <div class="card bg-base-100 border border-base-200 px-6 py-8 text-center text-sm opacity-60">Sales figures are unavailable right now.</div>
  {:else if !data}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {#each Array(4) as _}<div class="card bg-base-100 border border-base-200 h-24 animate-pulse"></div>{/each}
    </div>
  {:else if data.recentOrders.length === 0}
    <div in:fade={{ duration: 150 }} class="card bg-base-100 border border-base-200 border-dashed px-6 py-10 text-center space-y-2">
      <ShoppingCart class="size-6 mx-auto opacity-40" />
      <p class="text-sm font-medium">No orders yet</p>
      <p class="text-xs opacity-60">Revenue, charts and recent orders appear here once orders come in.</p>
    </div>
  {:else}
    <div in:fade={{ duration: 150 }} class="space-y-4">
      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each kpis as k}
          <div class="card bg-base-100 border border-base-200 p-5 flex items-start gap-4">
            <div class="p-2 rounded-lg {k.tone}"><k.icon class="size-5" /></div>
            <div class="min-w-0">
              <p class="text-xs opacity-60 uppercase tracking-wide font-medium">{k.label}</p>
              <p class="text-2xl font-bold mt-0.5 truncate" title={k.value}>{k.value}</p>
              <p class="text-xs opacity-50 mt-0.5">{k.sub}</p>
            </div>
          </div>
        {/each}
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card bg-base-100 border border-base-200 p-5 space-y-3">
          <h3 class="text-sm font-semibold opacity-70">Daily Revenue — Last 30 Days</h3>
          <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
            {#each [0.25, 0.5, 0.75, 1] as frac}
              <line x1="16" x2="464" y1={140 - 16 - frac * 108} y2={140 - 16 - frac * 108} stroke="currentColor" stroke-opacity="0.08" stroke-width="1" />
            {/each}
            <path d={areaPath(daily)} fill="var(--color-primary)" fill-opacity="0.15" />
            <polyline points={linePoints(daily)} fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
            {#each daily as d, i}
              {#if i % 5 === 0}<text x={(16 + (i / 29) * 448).toFixed(1)} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{d.label}</text>{/if}
            {/each}
          </svg>
        </div>

        <div class="card bg-base-100 border border-base-200 p-5 space-y-3">
          <h3 class="text-sm font-semibold opacity-70">Revenue by Product</h3>
          <svg viewBox="0 0 460 165" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
            {#each bars as b, i}
              <text x={b.x - 5} y={b.midY + 3.5} font-size="9.5" text-anchor="end" fill="currentColor" fill-opacity="0.6">{b.label}</text>
              <rect x={b.x} y={b.y} width={b.w} height={b.bh} rx="3" fill="var(--color-{COLORS[i % COLORS.length]})" fill-opacity="0.85" />
              <text x={b.x + b.w + 5} y={b.midY + 3.5} font-size="9" fill="currentColor" fill-opacity="0.5">{money(b.value)}</text>
            {/each}
          </svg>
        </div>

        <div class="card bg-base-100 border border-base-200 p-5 space-y-3">
          <h3 class="text-sm font-semibold opacity-70">Monthly Revenue — Last 12 Months</h3>
          <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
            {#each [0.25, 0.5, 0.75, 1] as frac}
              <line x1="16" x2="464" y1={140 - 16 - frac * 108} y2={140 - 16 - frac * 108} stroke="currentColor" stroke-opacity="0.08" stroke-width="1" />
            {/each}
            <path d={areaPath(monthly)} fill="var(--color-secondary)" fill-opacity="0.18" />
            <polyline points={linePoints(monthly)} fill="none" stroke="var(--color-secondary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
            {#each monthly as d, i}
              <text x={(16 + (i / 11) * 448).toFixed(1)} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{d.label}</text>
            {/each}
          </svg>
        </div>

        <!-- Recent orders -->
        <div class="card bg-base-100 border border-base-200 p-5 space-y-3">
          <h3 class="text-sm font-semibold opacity-70">Recent Orders</h3>
          <ul class="divide-y divide-base-200 text-sm">
            {#each data.recentOrders.slice(0, 6) as o (o.id)}
              <li>
                <a href="/commerce/orders/{o.id}" class="flex items-center justify-between gap-3 py-2 hover:opacity-80">
                  <span class="min-w-0">
                    <span class="font-mono text-xs">{o.orderNumber}</span>
                    <span class="block text-xs opacity-50 truncate">{o.guestEmail ?? '—'} · {date(o.createdAt)}</span>
                  </span>
                  <span class="flex items-center gap-2 shrink-0">
                    <span class="badge badge-sm capitalize {STATUS_BADGE[o.status] ?? 'badge-ghost'}">{o.status}</span>
                    <span class="font-semibold tabular-nums">{money(o.total)}</span>
                  </span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}
</section>
