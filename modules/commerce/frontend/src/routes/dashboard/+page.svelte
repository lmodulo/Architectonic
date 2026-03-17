<script lang="ts">
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { Search, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight,
           TrendingUp, ShoppingCart, DollarSign, Package, ChevronUp, ChevronDown } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { dashboardWidgets } from '$lib/config/dashboard-widgets';
  import { hasPermission } from '$lib/permissions';

  let { data }: { data: PageData } = $props();

  const analytics = $derived(data.analytics);

  // ── Format helpers ─────────────────────────────────────────────────
  function fmt(cents: number): string {
    return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  // ── KPIs ───────────────────────────────────────────────────────────
  const kpis = $derived(analytics?.kpis ?? { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, topProduct: '—' });

  // ── Chart datasets ─────────────────────────────────────────────────
  const dailyData  = $derived((analytics?.dailyRevenue ?? []) as { label: string; date: string; revenue: number }[]);
  const monthlyData = $derived((analytics?.monthlyRevenue ?? []) as { label: string; revenue: number }[]);
  const productData = $derived((analytics?.revenueByProduct ?? []) as { label: string; value: number }[]);
  const stockData   = $derived((analytics?.stockByProduct ?? []) as { label: string; value: number }[]);

  // ── SVG chart helpers ──────────────────────────────────────────────
  function linePoints(pts: { revenue?: number; value?: number }[], w = 480, h = 140, p = 16): string {
    const vals = pts.map(d => d.revenue ?? d.value ?? 0);
    const mx = Math.max(...vals, 1);
    return vals.map((v, i) =>
      `${(p + (i / (vals.length - 1 || 1)) * (w - p * 2)).toFixed(1)},${(h - p - (v / mx) * (h - p * 2)).toFixed(1)}`
    ).join(' ');
  }

  function areaPath(pts: { revenue?: number; value?: number }[], w = 480, h = 140, p = 16): string {
    const vals = pts.map(d => d.revenue ?? d.value ?? 0);
    const mx = Math.max(...vals, 1);
    const coords = vals.map((v, i) => ({
      x: p + (i / (vals.length - 1 || 1)) * (w - p * 2),
      y: h - p - (v / mx) * (h - p * 2)
    }));
    const line = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ');
    return `M${coords[0].x.toFixed(1)},${(h - p).toFixed(1)} L ${line} L${coords[coords.length - 1].x.toFixed(1)},${(h - p).toFixed(1)}Z`;
  }

  function hBars(pts: { label: string; value: number }[], w = 460, h = 200, lblW = 130, p = 10) {
    const mx = Math.max(...pts.map(d => d.value), 1);
    const rowH = (h - p * 2) / (pts.length || 1);
    return pts.map((d, i) => ({
      ...d,
      x: lblW, y: p + i * rowH + rowH * 0.12,
      w: (d.value / mx) * (w - lblW - p), bh: rowH * 0.76,
      midY: p + i * rowH + rowH / 2,
    }));
  }

  const productBars = $derived(hBars(productData, 460, Math.max(productData.length * 32 + 20, 140)));
  const stockBars   = $derived(hBars(stockData, 460, Math.max(stockData.length * 32 + 20, 140)));

  // ── Table ──────────────────────────────────────────────────────────
  type Order = { id: string; orderNumber: string; createdAt: string; itemCount: number; total: number; status: string; guestEmail: string };
  const allOrders = $derived((analytics?.recentOrders ?? []) as Order[]);

  let query       = $state('');
  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const filtered = $derived(query.trim()
    ? allOrders.filter(o =>
        o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
        (o.guestEmail ?? '').toLowerCase().includes(query.toLowerCase()) ||
        o.status.toLowerCase().includes(query.toLowerCase()))
    : allOrders);

  const pageRows = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  $effect(() => { query; currentPage = 1; });

  const STATUS_CLS: Record<string, string> = {
    delivered:  'preset-filled-success-500',
    shipped:    'preset-filled-primary-500',
    processing: 'preset-filled-secondary-500',
    pending:    'preset-filled-warning-500',
    cancelled:  'preset-filled-surface-500',
    refunded:   'preset-filled-error-500',
  };

  // ── Calendar ───────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  const calMap = $derived(analytics?.calendarData ?? {});

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const d = new Date(year, month, day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = (calMap as Record<string, { count: number; revenue: number }>)[key];
      return { day, isToday: d.toDateString() === today.toDateString(), count: entry?.count ?? 0, revenue: entry?.revenue ?? 0 };
    });
  }

  const calDays  = $derived(buildCal(calYear, calMonth));
  const calLabel = $derived(new Date(calYear, calMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  function prevMonth() { calMonth === 0 ? (calMonth = 11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth = 0, calYear++) : calMonth++; }

  const maxDayRevenue = $derived(Math.max(...calDays.filter(Boolean).map(d => d!.revenue), 1));

  // ── Dashboard widgets ──────────────────────────────────────────────
  const sortedWidgets = $derived([...dashboardWidgets].sort((a, b) => a.order - b.order));
</script>

<svelte:head><title>Dashboard</title></svelte:head>

<div class="space-y-8">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="text-sm opacity-60 mt-0.5">Welcome back, <strong>{data.user?.firstName ?? data.user?.username}</strong></p>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-primary"><DollarSign class="size-5 text-primary-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Revenue</p>
        <p class="text-2xl font-bold mt-0.5">{fmt(kpis.totalRevenue)}</p>
        <p class="text-xs opacity-50 mt-0.5">completed orders</p>
      </div>
    </div>
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-secondary"><ShoppingCart class="size-5 text-secondary-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Orders</p>
        <p class="text-2xl font-bold mt-0.5">{kpis.totalOrders}</p>
        <p class="text-xs opacity-50 mt-0.5">all time</p>
      </div>
    </div>
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-success"><TrendingUp class="size-5 text-success-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Avg Order Value</p>
        <p class="text-2xl font-bold mt-0.5">{fmt(kpis.avgOrderValue)}</p>
        <p class="text-xs opacity-50 mt-0.5">per transaction</p>
      </div>
    </div>
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-warning"><Package class="size-5 text-warning-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Top Product</p>
        <p class="text-xl font-bold mt-0.5 leading-tight">{kpis.topProduct}</p>
        <p class="text-xs opacity-50 mt-0.5">by revenue</p>
      </div>
    </div>
  </div>

  <!-- Charts 2×2 -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

    <!-- Line/Area: Daily Revenue -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Daily Revenue — Last 30 Days</h2>
      {#if dailyData.length > 1}
        <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
          {#each [0.25, 0.5, 0.75, 1] as frac}
            <line x1="16" x2="464"
              y1={(140 - 16 - frac * (140 - 32)).toFixed(1)}
              y2={(140 - 16 - frac * (140 - 32)).toFixed(1)}
              stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
          {/each}
          <path d={areaPath(dailyData.map(d => ({ value: d.revenue })))} fill="var(--color-primary-500)" fill-opacity="0.15"/>
          <polyline points={linePoints(dailyData.map(d => ({ value: d.revenue })))} fill="none" stroke="var(--color-primary-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          {#each dailyData as d, i}
            {#if i % 5 === 0}
              <text x={(16 + (i / 29) * (480 - 32)).toFixed(1)} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{d.label}</text>
            {/if}
          {/each}
        </svg>
      {:else}
        <p class="text-sm opacity-40 py-8 text-center">No data yet</p>
      {/if}
    </div>

    <!-- HBar: Revenue by Product -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Revenue by Product</h2>
      {#if productBars.length > 0}
        {@const chartH = Math.max(productBars.length * 32 + 20, 140)}
        <svg viewBox="0 0 460 {chartH}" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
          {#each productBars as b, i}
            <text x={b.x - 5} y={b.midY + 3.5} font-size="9.5" text-anchor="end" fill="currentColor" fill-opacity="0.6">{b.label}</text>
            <rect x={b.x} y={b.y} width={b.w} height={b.bh} rx="3" fill="var(--color-primary-500)" fill-opacity="0.8"/>
            <text x={b.x + b.w + 5} y={b.midY + 3.5} font-size="9" fill="currentColor" fill-opacity="0.5">{fmt(b.value)}</text>
          {/each}
        </svg>
      {:else}
        <p class="text-sm opacity-40 py-8 text-center">No data yet</p>
      {/if}
    </div>

    <!-- HBar: Inventory Stock -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Inventory Stock by Product</h2>
      {#if stockBars.length > 0}
        {@const chartH = Math.max(stockBars.length * 32 + 20, 140)}
        <svg viewBox="0 0 460 {chartH}" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
          {#each stockBars as b, i}
            <text x={b.x - 5} y={b.midY + 3.5} font-size="9.5" text-anchor="end" fill="currentColor" fill-opacity="0.6">{b.label}</text>
            <rect x={b.x} y={b.y} width={b.w} height={b.bh} rx="3" fill="var(--color-secondary-500)" fill-opacity="0.8"/>
            <text x={b.x + b.w + 5} y={b.midY + 3.5} font-size="9" fill="currentColor" fill-opacity="0.5">{b.value} units</text>
          {/each}
        </svg>
      {:else}
        <p class="text-sm opacity-40 py-8 text-center">No data yet</p>
      {/if}
    </div>

    <!-- Area: Monthly Revenue -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Monthly Revenue — Last 12 Months</h2>
      {#if monthlyData.length > 1}
        <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
          {#each [0.25, 0.5, 0.75, 1] as frac}
            <line x1="16" x2="464"
              y1={(140 - 16 - frac * (140 - 32)).toFixed(1)}
              y2={(140 - 16 - frac * (140 - 32)).toFixed(1)}
              stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
          {/each}
          <path d={areaPath(monthlyData.map(d => ({ value: d.revenue })))} fill="var(--color-success-500)" fill-opacity="0.18"/>
          <polyline points={linePoints(monthlyData.map(d => ({ value: d.revenue })))} fill="none" stroke="var(--color-success-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          {#each monthlyData as d, i}
            <text x={(16 + (i / 11) * (480 - 32)).toFixed(1)} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{d.label}</text>
          {/each}
        </svg>
      {:else}
        <p class="text-sm opacity-40 py-8 text-center">No data yet</p>
      {/if}
    </div>

  </div>

  <!-- Orders Table -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Recent Orders</h2>

    <div class="input-group grid-cols-[auto_1fr]">
      <div class="ig-cell preset-tonal"><Search class="size-4" /></div>
      <input type="search" class="ig-input" placeholder="Search by order #, email, or status…" bind:value={query} />
    </div>

    <div class="card preset-filled-surface-100-900 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-200-800">
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Order #</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Date</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Customer</th>
            <th class="text-right px-4 py-3 font-semibold text-surface-500">Items</th>
            <th class="text-right px-4 py-3 font-semibold text-surface-500">Total</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each pageRows as row}
            <tr class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td class="px-4 py-3 font-mono text-xs opacity-60">{row.orderNumber}</td>
              <td class="px-4 py-3 text-surface-500">{new Date(row.createdAt).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-surface-500">{row.guestEmail ?? '—'}</td>
              <td class="px-4 py-3 text-right">{row.itemCount}</td>
              <td class="px-4 py-3 text-right font-semibold">{fmt(row.total)}</td>
              <td class="px-4 py-3">
                <span class="badge text-xs {STATUS_CLS[row.status] ?? ''}">{row.status}</span>
              </td>
            </tr>
          {:else}
            <tr><td colspan="6" class="px-4 py-8 text-center text-surface-500">No records found.</td></tr>
          {/each}
        </tbody>
      </table>

      <div class="flex items-center justify-between px-4 py-2 border-t border-surface-200-800">
        <span class="text-xs text-surface-500">
          {filtered.length === 0 ? 'No records' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage} onPageChange={e => (currentPage = e.page)} siblingCount={1}>
          <Pagination.FirstTrigger class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronFirst class="size-4"/></Pagination.FirstTrigger>
          <Pagination.PrevTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLeft  class="size-4"/></Pagination.PrevTrigger>
          <Pagination.Context>
            {#snippet children(pagination)}
              {#each pagination().pages as p (p)}
                {#if p.type === 'page'}
                  <Pagination.Item {...p} class="btn-icon btn-sm {p.value === currentPage ? 'preset-tonal-primary' : 'hover:preset-tonal'}">{p.value}</Pagination.Item>
                {:else}
                  <Pagination.Ellipsis index={p.index} class="btn-icon btn-sm opacity-40">…</Pagination.Ellipsis>
                {/if}
              {/each}
            {/snippet}
          </Pagination.Context>
          <Pagination.NextTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronRight class="size-4"/></Pagination.NextTrigger>
          <Pagination.LastTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLast  class="size-4"/></Pagination.LastTrigger>
        </Pagination>
      </div>
    </div>
  </div>

  <!-- Calendar -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Order Calendar</h2>
    <div class="card preset-filled-surface-100-900 overflow-hidden">

      <div class="flex items-center justify-between px-5 py-3 border-b border-surface-200-800">
        <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={prevMonth} aria-label="Previous month">
          <ChevronLeft class="size-4"/>
        </button>
        <span class="font-semibold text-sm">{calLabel}</span>
        <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={nextMonth} aria-label="Next month">
          <ChevronRight class="size-4"/>
        </button>
      </div>

      <div class="grid grid-cols-7 border-b border-surface-200-800">
        {#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as dow}
          <div class="px-2 py-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wide">{dow}</div>
        {/each}
      </div>

      <div class="grid grid-cols-7">
        {#each calDays as cell, i}
          {@const borderR = (i + 1) % 7 !== 0 ? 'border-r' : ''}
          {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
          <div class="min-h-[5.5rem] p-2 border-surface-200-800 {borderR} {borderB} relative
            {cell?.isToday ? 'bg-primary-500/5' : ''}">
            {#if cell}
              <span class="text-xs font-semibold
                {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full preset-filled-primary-500 text-white' : 'opacity-70'}">
                {cell.day}
              </span>
              {#if cell.count > 0}
                <div class="mt-1.5 space-y-0.5">
                  <div class="w-full rounded-sm h-1.5 overflow-hidden bg-surface-200-800">
                    <div class="h-full rounded-sm bg-primary-500"
                      style="width:{Math.round((cell.revenue / maxDayRevenue) * 100)}%"></div>
                  </div>
                  <p class="text-[10px] text-primary-500 font-semibold">{fmt(cell.revenue)}</p>
                  <p class="text-[10px] opacity-40">{cell.count} order{cell.count !== 1 ? 's' : ''}</p>
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>

    </div>
  </div>

  <!-- Module Widgets -->
  {#each sortedWidgets as w}
    {#if hasPermission(data.user, w.permission.resource, w.permission.action)}
      <w.component />
    {/if}
  {/each}

</div>
