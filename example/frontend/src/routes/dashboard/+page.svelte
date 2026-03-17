<script lang="ts">
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { Search, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight,
           TrendingUp, ShoppingCart, DollarSign, MapPin, ChevronUp, ChevronDown,
           Plus, X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { PageData } from './$types';
  import { dashboardWidgets } from '$lib/config/dashboard-widgets';
  import { hasPermission } from '$lib/permissions';
  import MessageEditor from '$lib/components/MessageEditor.svelte';

  let { data }: { data: PageData } = $props();

  // ── Seeded RNG (deterministic data on every load) ──────────────────
  function makeRng(seed: number) {
    let s = (seed >>> 0) || 1;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
  }
  const rng = makeRng(8675309);

  // ── Generate 90 sales records ──────────────────────────────────────
  const PRODUCTS = ['Software License', 'Consulting', 'Support Plan', 'Training', 'Hardware'];
  const REGIONS  = ['North', 'South', 'East', 'West', 'International'];
  const STATUSES = ['Completed', 'Completed', 'Completed', 'Pending', 'Refunded'] as const;

  type Sale = { id: string; date: Date; product: string; region: string; revenue: number; units: number; status: string };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const allSales: Sale[] = Array.from({ length: 90 }, (_, i) => {
    const daysAgo = Math.floor(rng() * 90);
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    return {
      id: `ORD-${1000 + i}`,
      date: d,
      product: PRODUCTS[Math.floor(rng() * PRODUCTS.length)],
      region:  REGIONS[Math.floor(rng()  * REGIONS.length)],
      revenue: Math.round((rng() * 8500 + 500) * 100) / 100,
      units:   Math.floor(rng() * 20) + 1,
      status:  STATUSES[Math.floor(rng() * STATUSES.length)],
    };
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  // ── KPIs ───────────────────────────────────────────────────────────
  const totalRevenue = allSales.reduce((s, r) => s + r.revenue, 0);
  const totalOrders  = allSales.length;
  const avgOrder     = totalRevenue / totalOrders;
  const topRegion    = [...REGIONS].sort((a, b) =>
    allSales.filter(s => s.region === b).length - allSales.filter(s => s.region === a).length
  )[0];

  const fmt = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  // ── Chart datasets ─────────────────────────────────────────────────
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (29 - i));
    return { label: `${d.getMonth()+1}/${d.getDate()}`, value: allSales.filter(s => s.date.toDateString() === d.toDateString()).reduce((a, s) => a + s.revenue, 0) };
  });

  const productData = PRODUCTS.map(p => ({
    label: p, value: allSales.filter(s => s.product === p).reduce((a, s) => a + s.revenue, 0)
  })).sort((a, b) => b.value - a.value);

  const regionData = REGIONS.map(r => ({
    label: r, value: allSales.filter(s => s.region === r).length
  }));

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
    return { label: d.toLocaleString('en-US', { month: 'short' }), value: allSales.filter(s => s.date.getFullYear() === d.getFullYear() && s.date.getMonth() === d.getMonth()).reduce((a, s) => a + s.revenue, 0) };
  });

  // ── SVG chart helpers ──────────────────────────────────────────────
  function linePoints(pts: {value:number}[], w=480, h=140, p=16): string {
    const mx = Math.max(...pts.map(d => d.value), 1);
    return pts.map((d, i) => `${(p + (i/(pts.length-1))*(w-p*2)).toFixed(1)},${(h-p-(d.value/mx)*(h-p*2)).toFixed(1)}`).join(' ');
  }

  function areaPath(pts: {value:number}[], w=480, h=140, p=16): string {
    const mx = Math.max(...pts.map(d => d.value), 1);
    const coords = pts.map((d, i) => ({ x: p + (i/(pts.length-1))*(w-p*2), y: h-p-(d.value/mx)*(h-p*2) }));
    const line = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ');
    return `M${coords[0].x.toFixed(1)},${(h-p).toFixed(1)} L ${line} L${coords[coords.length-1].x.toFixed(1)},${(h-p).toFixed(1)}Z`;
  }

  function hBars(pts: {label:string;value:number}[], w=460, h=165, lblW=118, p=10) {
    const mx = Math.max(...pts.map(d => d.value), 1);
    const rowH = (h - p*2) / pts.length;
    return pts.map((d, i) => ({
      ...d,
      x: lblW, y: p + i*rowH + rowH*0.12,
      w: (d.value/mx)*(w-lblW-p), bh: rowH*0.76,
      midY: p + i*rowH + rowH/2,
    }));
  }

  const DONUT_COLORS = ['primary','secondary','success','warning','error'] as const;
  function donutSegs(pts: {label:string;value:number}[], cx=90, cy=90, r=78, ir=48) {
    const total = pts.reduce((s, d) => s + d.value, 0) || 1;
    let a = -Math.PI/2;
    return pts.map((d, i) => {
      const sw = (d.value/total)*Math.PI*2;
      const [x1,y1] = [cx+r*Math.cos(a), cy+r*Math.sin(a)];
      const [x2,y2] = [cx+r*Math.cos(a+sw), cy+r*Math.sin(a+sw)];
      const [xi1,yi1] = [cx+ir*Math.cos(a+sw), cy+ir*Math.sin(a+sw)];
      const [xi2,yi2] = [cx+ir*Math.cos(a), cy+ir*Math.sin(a)];
      const lg = sw > Math.PI ? 1 : 0;
      const path = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi1.toFixed(2)},${yi1.toFixed(2)} A${ir},${ir} 0 ${lg} 0 ${xi2.toFixed(2)},${yi2.toFixed(2)}Z`;
      a += sw;
      return { path, color: `var(--color-${DONUT_COLORS[i%5]}-500)`, label: d.label, pct: Math.round(d.value/total*100), value: d.value };
    });
  }

  const bars = hBars(productData);
  const segs = donutSegs(regionData);

  // ── Table ──────────────────────────────────────────────────────────
  let query       = $state('');
  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const filtered = $derived(query.trim()
    ? allSales.filter(s =>
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.product.toLowerCase().includes(query.toLowerCase()) ||
        s.region.toLowerCase().includes(query.toLowerCase()) ||
        s.status.toLowerCase().includes(query.toLowerCase()))
    : allSales);

  const pageRows = $derived(filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE));
  $effect(() => { query; currentPage = 1; });

  const STATUS_CLS: Record<string,string> = {
    Completed: 'preset-filled-success-500',
    Pending:   'preset-filled-warning-500',
    Refunded:  'preset-filled-error-500',
  };

  // ── Calendar ───────────────────────────────────────────────────────
  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const d = new Date(year, month, day);
      const ds = allSales.filter(s => s.date.toDateString() === d.toDateString());
      return { day, isToday: d.toDateString() === today.toDateString(), count: ds.length, revenue: ds.reduce((a,s) => a+s.revenue, 0) };
    });
  }

  const calDays  = $derived(buildCal(calYear, calMonth));
  const calLabel = $derived(new Date(calYear, calMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  function prevMonth() { calMonth === 0 ? (calMonth=11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth=0, calYear++) : calMonth++; }

  // max revenue day for calendar heat intensity
  const maxDayRevenue = $derived(
    Math.max(...calDays.filter(Boolean).map(d => d!.revenue), 1)
  );

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

  // Keep endDate in sync when singleDay is on
  $effect(() => {
    if (eventForm.singleDay) eventForm.endDate = eventForm.startDate;
  });

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

    eventLoading = true;
    eventError   = '';

    const body = {
      title:     eventForm.title.trim(),
      content:   eventForm.content,
      startDate: eventForm.startDate,
      endDate:   eventForm.singleDay ? eventForm.startDate : (eventForm.endDate || eventForm.startDate),
      singleDay: eventForm.singleDay,
    };

    try {
      let res: Response;
      if (editingEventId) {
        res = await fetch(`/api/events/${editingEventId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        eventError = (d as { message?: string }).message ?? 'Save failed';
        return;
      }

      const saved = await res.json();
      const normalized: CalEvent = {
        id:        editingEventId ?? String(saved.id ?? saved._id ?? ''),
        title:     String(saved.title ?? body.title),
        content:   String(saved.content ?? body.content),
        startDate: toDateStr(saved.startDate) || body.startDate,
        endDate:   toDateStr(saved.endDate)   || body.endDate,
        singleDay: Boolean(saved.singleDay ?? body.singleDay),
      };

      if (editingEventId) {
        events = events.map(e => e.id === editingEventId ? normalized : e);
      } else {
        events = [...events, normalized];
      }

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

  function fmtEventDate(ev: CalEvent): string {
    const start = new Date(ev.startDate + 'T00:00:00');
    if (ev.singleDay) return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(ev.endDate + 'T00:00:00');
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  // ── Dashboard widgets (injected by modules) ────────────────────────
  const sortedWidgets = $derived([...dashboardWidgets].sort((a, b) => a.order - b.order));
</script>

<svelte:head><title>Dashboard</title></svelte:head>

<div class="space-y-8">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="text-sm opacity-60 mt-0.5">Welcome back, <strong>{data.user?.firstName ?? data.user?.username}</strong> — last 90 days of sales activity</p>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-primary"><DollarSign class="size-5 text-primary-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Revenue</p>
        <p class="text-2xl font-bold mt-0.5">{fmt(totalRevenue)}</p>
        <p class="text-xs opacity-50 mt-0.5">90-day period</p>
      </div>
    </div>
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-secondary"><ShoppingCart class="size-5 text-secondary-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Total Orders</p>
        <p class="text-2xl font-bold mt-0.5">{totalOrders}</p>
        <p class="text-xs opacity-50 mt-0.5">across all regions</p>
      </div>
    </div>
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-success"><TrendingUp class="size-5 text-success-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Avg Order Value</p>
        <p class="text-2xl font-bold mt-0.5">{fmt(avgOrder)}</p>
        <p class="text-xs opacity-50 mt-0.5">per transaction</p>
      </div>
    </div>
    <div class="card preset-filled-surface-100-900 p-5 flex items-start gap-4">
      <div class="p-2 rounded-lg preset-tonal-warning"><MapPin class="size-5 text-warning-500" /></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Top Region</p>
        <p class="text-2xl font-bold mt-0.5">{topRegion}</p>
        <p class="text-xs opacity-50 mt-0.5">by order volume</p>
      </div>
    </div>
  </div>

  <!-- Charts 2×2 -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

    <!-- Line: Daily Revenue -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Daily Revenue — Last 30 Days</h2>
      <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
        <!-- grid lines -->
        {#each [0.25, 0.5, 0.75, 1] as frac}
          <line x1="16" x2="464" y1={140-16-(frac*(140-32)).toFixed(1)} y2={140-16-(frac*(140-32)).toFixed(1)}
            stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
        {/each}
        <!-- area fill -->
        <path d={areaPath(dailyData)} fill="var(--color-primary-500)" fill-opacity="0.15"/>
        <!-- line -->
        <polyline points={linePoints(dailyData)} fill="none" stroke="var(--color-primary-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <!-- x-axis labels every 5 days -->
        {#each dailyData as d, i}
          {#if i % 5 === 0}
            <text x={(16 + (i/29)*(480-32)).toFixed(1)} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{d.label}</text>
          {/if}
        {/each}
      </svg>
    </div>

    <!-- Bar: Revenue by Product -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Revenue by Product</h2>
      <svg viewBox="0 0 460 165" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
        {#each bars as b, i}
          <text x={b.x - 5} y={b.midY + 3.5} font-size="9.5" text-anchor="end" fill="currentColor" fill-opacity="0.6">{b.label}</text>
          <rect x={b.x} y={b.y} width={b.w} height={b.bh} rx="3"
            fill="var(--color-{DONUT_COLORS[i%5]}-500)" fill-opacity="0.85"/>
          <text x={b.x + b.w + 5} y={b.midY + 3.5} font-size="9" fill="currentColor" fill-opacity="0.5">{fmt(b.value)}</text>
        {/each}
      </svg>
    </div>

    <!-- Donut: Orders by Region -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Orders by Region</h2>
      <div class="flex items-center gap-6">
        <svg viewBox="0 0 180 180" width="180" height="180" class="shrink-0" aria-hidden="true">
          {#each segs as seg}
            <path d={seg.path} fill={seg.color} fill-opacity="0.9"/>
          {/each}
          <text x="90" y="85" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">{totalOrders}</text>
          <text x="90" y="100" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.5">orders</text>
        </svg>
        <ul class="space-y-2 text-sm flex-1">
          {#each segs as seg, i}
            <li class="flex items-center justify-between gap-2">
              <span class="flex items-center gap-2">
                <span class="size-2.5 rounded-full shrink-0" style="background:{seg.color}"></span>
                <span class="opacity-70">{seg.label}</span>
              </span>
              <span class="font-semibold">{seg.pct}%</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- Area: Monthly Revenue -->
    <div class="card preset-filled-surface-100-900 p-5 space-y-3">
      <h2 class="text-sm font-semibold opacity-70">Monthly Revenue — Last 12 Months</h2>
      <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true">
        {#each [0.25, 0.5, 0.75, 1] as frac}
          <line x1="16" x2="464" y1={140-16-(frac*(140-32)).toFixed(1)} y2={140-16-(frac*(140-32)).toFixed(1)}
            stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
        {/each}
        <path d={areaPath(monthlyData)} fill="var(--color-secondary-500)" fill-opacity="0.18"/>
        <polyline points={linePoints(monthlyData)} fill="none" stroke="var(--color-secondary-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        {#each monthlyData as d, i}
          <text x={(16 + (i/11)*(480-32)).toFixed(1)} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">{d.label}</text>
        {/each}
      </svg>
    </div>

  </div>

  <!-- Sales Table -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Sales Records</h2>

    <div class="input-group grid-cols-[auto_1fr]">
      <div class="ig-cell preset-tonal"><Search class="size-4" /></div>
      <input type="search" class="ig-input" placeholder="Search by ID, product, region, or status…" bind:value={query} />
    </div>

    <div class="card preset-filled-surface-100-900 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-200-800">
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Order</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Date</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Product</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Region</th>
            <th class="text-right px-4 py-3 font-semibold text-surface-500">Units</th>
            <th class="text-right px-4 py-3 font-semibold text-surface-500">Revenue</th>
            <th class="text-left px-4 py-3 font-semibold text-surface-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each pageRows as row}
            <tr class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td class="px-4 py-3 font-mono text-xs opacity-60">{row.id}</td>
              <td class="px-4 py-3 text-surface-500">{row.date.toLocaleDateString()}</td>
              <td class="px-4 py-3">{row.product}</td>
              <td class="px-4 py-3 text-surface-500">{row.region}</td>
              <td class="px-4 py-3 text-right">{row.units}</td>
              <td class="px-4 py-3 text-right font-semibold">{fmt(row.revenue)}</td>
              <td class="px-4 py-3">
                <span class="badge text-xs {STATUS_CLS[row.status] ?? ''}">{row.status}</span>
              </td>
            </tr>
          {:else}
            <tr><td colspan="7" class="px-4 py-8 text-center text-surface-500">No records found.</td></tr>
          {/each}
        </tbody>
      </table>

      <div class="flex items-center justify-between px-4 py-2 border-t border-surface-200-800">
        <span class="text-xs text-surface-500">
          {filtered.length === 0 ? 'No records' : `${(currentPage-1)*PAGE_SIZE+1}–${Math.min(currentPage*PAGE_SIZE,filtered.length)} of ${filtered.length}`}
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

      <!-- Nav -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-surface-200-800">
        <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={prevMonth} aria-label="Previous month">
          <ChevronLeft class="size-4"/>
        </button>
        <span class="font-semibold text-sm">{calLabel}</span>
        <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={nextMonth} aria-label="Next month">
          <ChevronRight class="size-4"/>
        </button>
      </div>

      <!-- DOW header -->
      <div class="grid grid-cols-7 border-b border-surface-200-800">
        {#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as dow}
          <div class="px-2 py-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wide">{dow}</div>
        {/each}
      </div>

      <!-- Day cells -->
      <div class="grid grid-cols-7">
        {#each calDays as cell, i}
          {@const borderR = (i+1) % 7 !== 0 ? 'border-r' : ''}
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
                      style="width:{Math.round((cell.revenue/maxDayRevenue)*100)}%"></div>
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

        <!-- Title -->
        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-title">Title</label>
          <input id="ev-title" type="text" class="input w-full" placeholder="Event title" bind:value={eventForm.title} maxlength="200" />
        </div>

        <!-- Dates -->
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

        <!-- Single day toggle -->
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" class="checkbox" bind:checked={eventForm.singleDay} />
          <span class="text-sm">Single-day event</span>
        </label>

        <!-- Content -->
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={eventForm.content} placeholder="Event description…" />
        </div>
      </div>

      <footer class="flex items-center justify-between px-6 pb-5 pt-3 border-t border-surface-200-800 shrink-0">
        <div>
          {#if editingEventId && hasPermission(data.user, 'events', 'delete')}
            <button
              type="button"
              class="btn preset-tonal-error"
              disabled={eventLoading}
              onclick={() => (eventDeleteConfirm = true)}
            >Delete this event</button>
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
        <p class="text-sm opacity-70">
          "<strong>{eventForm.title}</strong>" will be permanently removed. This cannot be undone.
        </p>
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
