<script lang="ts">
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { Search, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight,
           TrendingUp, ShoppingCart, DollarSign, Package, ChevronUp, ChevronDown,
           LayoutDashboard, Plus, X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { PageData } from './$types';
  import { dashboardWidgets } from '$lib/config/dashboard-widgets';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';

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

  // ── Events ────────────────────────────────────────────────────────
  type CalEvent = {
    id: string;
    title: string;
    content: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    singleDay: boolean;
  };

  function toDateStr(val: unknown): string {
    if (!val) return '';
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  let events = $state<CalEvent[]>(
    ((data.events ?? []) as Record<string, unknown>[]).map(e => ({
      id:        String(e.id ?? ''),
      title:     String(e.title ?? ''),
      content:   String(e.content ?? ''),
      startDate: toDateStr(e.startDate),
      endDate:   toDateStr(e.endDate),
      singleDay: Boolean(e.singleDay),
    }))
  );

  let eventQuery         = $state('');
  let eventSearchOpen    = $state(false);
  let eventModalOpen     = $state(false);
  let eventDeleteConfirm = $state(false);
  let editingEventId     = $state<string | null>(null);
  let eventForm = $state({ title: '', content: '', startDate: '', endDate: '', singleDay: true });
  let eventLoading  = $state(false);
  let eventError    = $state('');

  const eventMatches = $derived(
    eventQuery.trim().length > 0
      ? events.filter(e => e.title.toLowerCase().includes(eventQuery.toLowerCase()))
      : []
  );

  $effect(() => { if (eventForm.singleDay) eventForm.endDate = eventForm.startDate; });

  function eventsForDay(year: number, month: number, day: number): CalEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startDate <= dateStr && dateStr <= e.endDate);
  }

  function selectEventFromSearch(ev: CalEvent) {
    eventQuery = '';
    eventSearchOpen = false;
    openEditEvent(ev);
  }

  function openNewEvent() {
    editingEventId = null;
    const todayStr = today.toISOString().slice(0, 10);
    eventForm = { title: '', content: '', startDate: todayStr, endDate: todayStr, singleDay: true };
    eventError = '';
    eventModalOpen = true;
  }

  function openEditEvent(ev: CalEvent) {
    editingEventId = ev.id;
    eventForm = { title: ev.title, content: ev.content, startDate: ev.startDate, endDate: ev.endDate, singleDay: ev.singleDay };
    eventError = '';
    eventModalOpen = true;
  }

  async function saveEvent() {
    if (!eventForm.title.trim()) { eventError = 'Title is required'; return; }
    if (!eventForm.startDate)    { eventError = 'Start date is required'; return; }

    eventLoading = true; eventError = '';

    const body = {
      title:     eventForm.title.trim(),
      content:   eventForm.content,
      startDate: eventForm.startDate,
      endDate:   eventForm.singleDay ? eventForm.startDate : (eventForm.endDate || eventForm.startDate),
      singleDay: eventForm.singleDay,
    };

    try {
      const res = await fetch(editingEventId ? `/api/events/${editingEventId}` : '/api/events', {
        method: editingEventId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        eventError = (d as { message?: string }).message ?? 'Save failed';
        return;
      }

      const saved = await res.json();
      const normalized: CalEvent = {
        id:        editingEventId ?? String(saved.id ?? ''),
        title:     String(saved.title ?? body.title),
        content:   String(saved.content ?? body.content),
        startDate: toDateStr(saved.startDate) || body.startDate,
        endDate:   toDateStr(saved.endDate)   || body.endDate,
        singleDay: Boolean(saved.singleDay ?? body.singleDay),
      };

      events = editingEventId
        ? events.map(e => e.id === editingEventId ? normalized : e)
        : [...events, normalized];

      eventModalOpen = false;
    } catch {
      eventError = 'Network error';
    } finally {
      eventLoading = false;
    }
  }

  async function confirmDeleteEvent() {
    if (!editingEventId) return;
    eventLoading = true;
    try {
      const res = await fetch(`/api/events/${editingEventId}`, { method: 'DELETE' });
      if (res.status !== 204 && !res.ok) {
        const d = await res.json().catch(() => ({}));
        eventError = (d as { message?: string }).message ?? 'Delete failed';
        return;
      }
      events = events.filter(e => e.id !== editingEventId);
      eventDeleteConfirm = false;
      eventModalOpen     = false;
    } catch {
      eventError = 'Network error';
    } finally {
      eventLoading = false;
    }
  }

  // ── Dashboard widgets ──────────────────────────────────────────────
  const sortedWidgets = $derived([...dashboardWidgets].sort((a, b) => a.order - b.order));
</script>

<svelte:head><title>Dashboard</title></svelte:head>

<div class="space-y-8">

  <!-- Header -->
  <div>
    <div class="flex items-center gap-2">
      <LayoutDashboard class="size-5 text-primary-500" />
      <h1 class="text-2xl font-bold">Dashboard</h1>
    </div>
    <p class="text-sm opacity-60 mt-0.5">Welcome back, <strong>{data.user?.firstName ?? data.user?.username}</strong></p>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-5 flex items-start gap-4" style="background: color-mix(in oklch, var(--color-primary-500) 12%, transparent)">
      <div class="p-2 rounded-lg preset-tonal-primary"><DollarSign class="size-5 text-primary-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Revenue</p>
        <p class="text-2xl font-bold mt-0.5">{fmt(kpis.totalRevenue)}</p>
        <p class="text-xs opacity-50 mt-0.5">completed orders</p>
      </div>
    </div>
    <div class="card p-5 flex items-start gap-4" style="background: color-mix(in oklch, var(--color-secondary-500) 12%, transparent)">
      <div class="p-2 rounded-lg preset-tonal-secondary"><ShoppingCart class="size-5 text-secondary-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Orders</p>
        <p class="text-2xl font-bold mt-0.5">{kpis.totalOrders}</p>
        <p class="text-xs opacity-50 mt-0.5">all time</p>
      </div>
    </div>
    <div class="card p-5 flex items-start gap-4" style="background: color-mix(in oklch, var(--color-success-500) 12%, transparent)">
      <div class="p-2 rounded-lg preset-tonal-success"><TrendingUp class="size-5 text-success-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Avg Order Value</p>
        <p class="text-2xl font-bold mt-0.5">{fmt(kpis.avgOrderValue)}</p>
        <p class="text-xs opacity-50 mt-0.5">per transaction</p>
      </div>
    </div>
    <div class="card p-5 flex items-start gap-4" style="background: color-mix(in oklch, var(--color-warning-500) 12%, transparent)">
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
    <div class="card preset-filled-surface-100-900 overflow-hidden">
      <div class="card-header px-5 py-3 border-b border-surface-200-800">
        <h2 class="text-sm font-semibold">Daily Revenue — Last 30 Days</h2>
      </div>
      <div class="p-5">
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
    </div>

    <!-- HBar: Revenue by Product -->
    <div class="card preset-filled-surface-100-900 overflow-hidden">
      <div class="card-header px-5 py-3 border-b border-surface-200-800">
        <h2 class="text-sm font-semibold">Revenue by Product</h2>
      </div>
      <div class="p-5">
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
    </div>

    <!-- HBar: Inventory Stock -->
    <div class="card preset-filled-surface-100-900 overflow-hidden">
      <div class="card-header px-5 py-3 border-b border-surface-200-800">
        <h2 class="text-sm font-semibold">Inventory Stock by Product</h2>
      </div>
      <div class="p-5">
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
    </div>

    <!-- Area: Monthly Revenue -->
    <div class="card preset-filled-surface-100-900 overflow-hidden">
      <div class="card-header px-5 py-3 border-b border-surface-200-800">
        <h2 class="text-sm font-semibold">Monthly Revenue — Last 12 Months</h2>
      </div>
      <div class="p-5">
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
              <td class="px-4 py-3 font-mono text-xs opacity-60">
                <a href="/commerce/orders/{row.id}" class="hover:text-primary-500 hover:underline transition-colors">{row.orderNumber}</a>
              </td>
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

  <!-- Order Calendar -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Order Calendar</h2>

    <!-- Event search + New Event -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <div class="input-group grid-cols-[auto_1fr]">
          <div class="ig-cell preset-tonal"><Search class="size-4" /></div>
          <input
            type="search"
            class="ig-input"
            placeholder="Search events by title…"
            autocomplete="off"
            bind:value={eventQuery}
            onfocus={() => (eventSearchOpen = true)}
            onblur={() => setTimeout(() => (eventSearchOpen = false), 150)}
          />
        </div>
        {#if eventSearchOpen && eventMatches.length > 0}
          <div class="absolute top-full left-0 right-0 z-30 mt-1 card preset-filled-surface-100-900 shadow-xl overflow-hidden border border-surface-200-800">
            {#each eventMatches as ev}
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-sm hover:preset-tonal transition-colors border-b border-surface-200-800 last:border-0"
                onmousedown={() => selectEventFromSearch(ev)}
              >
                <span class="font-medium">{ev.title}</span>
                <span class="text-xs opacity-50 ml-2">
                  {new Date(ev.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      {#if hasPermission(data.user, 'events', 'create')}
        <button type="button" class="btn preset-filled-primary-500 whitespace-nowrap" onclick={openNewEvent}>
          <Plus class="size-4" /> New Event
        </button>
      {/if}
    </div>

    <div class="card preset-filled-surface-100-900 overflow-hidden">

      <div class="card-header flex items-center justify-between px-5 py-3 border-b border-surface-200-800">
        <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={prevMonth} aria-label="Previous month">
          <ChevronLeft class="size-4"/>
        </button>
        <span class="font-semibold text-sm">{calLabel}</span>
        <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={nextMonth} aria-label="Next month">
          <ChevronRight class="size-4"/>
        </button>
      </div>

      <div class="card-header grid grid-cols-7 border-b border-surface-200-800">
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
              <!-- Event pills -->
              {#each eventsForDay(calYear, calMonth, cell.day) as ev}
                <button
                  type="button"
                  class="mt-1 w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate
                    bg-tertiary-500 text-white hover:bg-tertiary-600 transition-colors"
                  onclick={() => openEditEvent(ev)}
                  title={ev.title}
                >{ev.title}</button>
              {/each}
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

<!-- ── Event Modal ──────────────────────────────────────────────────── -->
{#if eventModalOpen}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="{editingEventId ? 'Edit Event' : 'New Event'}"
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-2xl shadow-xl mx-4 flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800 shrink-0">
        <h2 class="text-lg font-semibold">{editingEventId ? 'Edit Event' : 'New Event'}</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (eventModalOpen = false)} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if eventError}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{eventError}</aside>
        {/if}

        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-title">Title</label>
          <input id="ev-title" type="text" class="input w-full" placeholder="Event title" bind:value={eventForm.title} maxlength="200" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-start">Start Date</label>
            <input id="ev-start" type="date" class="input w-full" bind:value={eventForm.startDate} />
          </div>
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-end">End Date</label>
            <input id="ev-end" type="date" class="input w-full" bind:value={eventForm.endDate}
              disabled={eventForm.singleDay} min={eventForm.startDate} />
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" class="checkbox" bind:checked={eventForm.singleDay} />
          <span class="text-sm">Single-day event</span>
        </label>

        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={eventForm.content} placeholder="Event description…" />
        </div>
      </div>

      <footer class="flex items-center justify-between px-6 pb-5 pt-3 border-t border-surface-200-800 shrink-0">
        <div>
          {#if editingEventId && hasPermission(data.user, 'events', 'delete')}
            <button type="button" class="btn preset-tonal-error" disabled={eventLoading}
              onclick={() => (eventDeleteConfirm = true)}>Delete this event</button>
          {/if}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn preset-tonal" onclick={() => (eventModalOpen = false)}>Cancel</button>
          <button type="button" class="btn preset-filled-primary-500" disabled={eventLoading} onclick={saveEvent}>
            {eventLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<!-- ── Delete Confirm Modal ─────────────────────────────────────────── -->
{#if eventDeleteConfirm}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="Confirm delete"
  >
    <div
      transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-sm shadow-xl mx-4"
    >
      <div class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">Delete event?</h2>
        <p class="text-sm opacity-70">"<strong>{eventForm.title}</strong>" will be permanently removed. This cannot be undone.</p>
        {#if eventError}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{eventError}</aside>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (eventDeleteConfirm = false)}>Cancel</button>
        <button type="button" class="btn preset-filled-error-500" disabled={eventLoading} onclick={confirmDeleteEvent}>
          {eventLoading ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
