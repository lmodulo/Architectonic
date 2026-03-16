<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Plus, Archive, X, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { goto } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Product = typeof data.products[0];

  let products = $state([...data.products]);
  let categories = $state([...data.categories]);
  let query         = $state('');
  let statusFilter  = $state('');
  let categoryFilter = $state('');
  let currentPage   = $state(1);

  const STATUS_OPTIONS = ['', 'active', 'draft', 'archived'];

  const filtered = $derived((() => {
    let list = products;
    if (statusFilter) list = list.filter(p => p.status === statusFilter);
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return list;
  })());

  const PAGE_SIZE = 25;
  const pageProducts = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  $effect(() => { query; statusFilter; categoryFilter; currentPage = 1; });

  const STATUS_BADGE: Record<string, string> = {
    active:   'preset-tonal-success',
    draft:    'preset-tonal-warning',
    archived: 'preset-tonal-surface'
  };

  function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
  function categoryName(id: string) { return categories.find(c => c.id === id)?.name ?? id ?? '—'; }
  function totalStock(p: Product) { return (p.variants ?? []).reduce((sum: number, v: any) => sum + (v.stock ?? 0), 0); }

  // --- Quick-create modal ---
  let newOpen  = $state(false);
  let newForm  = $state({ name: '', basePriceDollars: '', status: 'draft', category: '' });
  let creating = $state(false);
  let newError = $state('');

  function openNew() { newForm = { name: '', basePriceDollars: '', status: 'draft', category: '' }; newError = ''; newOpen = true; }

  async function submitNew() {
    if (!newForm.name.trim()) { newError = 'Name is required'; return; }
    const basePrice = Math.round(parseFloat(newForm.basePriceDollars) * 100);
    if (isNaN(basePrice) || basePrice < 0) { newError = 'Enter a valid price'; return; }
    creating = true; newError = '';
    try {
      const res = await fetch('/api/commerce/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newForm.name.trim(), basePrice, status: newForm.status, category: newForm.category || undefined })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); newError = b.message ?? 'Create failed'; return; }
      const created = await res.json();
      newOpen = false;
      goto(`/commerce/products/${created.id}`);
    } catch { newError = 'Network error'; }
    finally { creating = false; }
  }

  // --- Archive modal ---
  let archiveTarget = $state<Product | null>(null);
  let archiving     = $state(false);
  let archiveError  = $state('');

  function openArchive(p: Product) { archiveError = ''; archiveTarget = p; }

  async function confirmArchive() {
    if (!archiveTarget) return;
    archiving = true; archiveError = '';
    try {
      const res = await fetch(`/api/commerce/products/${archiveTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); archiveError = b.message ?? 'Archive failed'; return; }
      products = products.map(p => p.id === archiveTarget!.id ? { ...p, status: 'archived' } : p);
      archiveTarget = null;
    } catch { archiveError = 'Network error'; }
    finally { archiving = false; }
  }
</script>

<svelte:head><title>Products</title></svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Products</h1>

  <div class="flex flex-wrap items-center gap-3">
    <div class="input-group grid-cols-[auto_1fr] flex-1 min-w-48">
      <div class="ig-cell preset-tonal"><Search class="size-4" /></div>
      <input type="search" placeholder="Search products…" class="ig-input" bind:value={query} />
    </div>
    <select class="select w-36 shrink-0" bind:value={statusFilter}>
      {#each STATUS_OPTIONS as s}
        <option value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}</option>
      {/each}
    </select>
    <select class="select w-40 shrink-0" bind:value={categoryFilter}>
      <option value="">All categories</option>
      {#each categories as c}
        <option value={c.id}>{c.name}</option>
      {/each}
    </select>
    {#if hasPermission(data.user, 'commerce_products', 'create')}
      <button type="button" class="btn preset-filled-primary-500 shrink-0" onclick={openNew}>
        <Plus class="size-4" /><span>New Product</span>
      </button>
    {/if}
  </div>

  <div class="card preset-filled-surface-100-900 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-200-800">
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Name</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Status</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Category</th>
          <th class="text-right px-4 py-3 font-semibold text-surface-500">Price</th>
          <th class="text-right px-4 py-3 font-semibold text-surface-500">Stock</th>
          <th class="text-right px-4 py-3 font-semibold text-surface-500">Variants</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {#each pageProducts as p}
          <tr
            class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
            onclick={() => goto(`/commerce/products/${p.id}`)}
          >
            <td class="px-4 py-3">
              <div class="font-medium">{p.name}</div>
              <div class="text-xs text-surface-500 font-mono">{p.slug}</div>
            </td>
            <td class="px-4 py-3"><span class="badge {STATUS_BADGE[p.status] ?? 'preset-tonal'} text-xs capitalize">{p.status}</span></td>
            <td class="px-4 py-3 text-surface-500">{categoryName(p.category)}</td>
            <td class="px-4 py-3 text-right font-medium">{fmt(p.basePrice ?? 0)}</td>
            <td class="px-4 py-3 text-right text-surface-500">{totalStock(p)}</td>
            <td class="px-4 py-3 text-right text-surface-500">{(p.variants ?? []).length}</td>
            <td class="px-4 py-3">
              {#if hasPermission(data.user, 'commerce_products', 'delete') && p.status !== 'archived'}
                <button
                  type="button"
                  class="btn-icon btn-sm hover:preset-tonal-warning"
                  onclick={(e) => { e.stopPropagation(); openArchive(p); }}
                  aria-label="Archive {p.name}"
                >
                  <Archive class="size-4" />
                </button>
              {/if}
            </td>
          </tr>
        {:else}
          <tr><td colspan="7" class="px-4 py-8 text-center text-surface-500">No products found.</td></tr>
        {/each}
      </tbody>
    </table>

    <div class="flex items-center justify-between px-4 py-2 border-t border-surface-200-800">
      <span class="text-surface-500 text-xs">
        {filtered.length === 0 ? 'No products' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
      </span>
      <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage} onPageChange={(e) => (currentPage = e.page)} siblingCount={1}>
        <Pagination.FirstTrigger class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronFirst class="size-4" /></Pagination.FirstTrigger>
        <Pagination.PrevTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLeft  class="size-4" /></Pagination.PrevTrigger>
        <Pagination.Context>
          {#snippet children(pagination)}
            {#each pagination().pages as p (p)}
              {#if p.type === 'page'}
                <Pagination.Item {...p} class="btn-icon btn-sm {p.value === currentPage ? 'preset-tonal-primary' : 'hover:preset-tonal'}">{p.value}</Pagination.Item>
              {:else}
                <Pagination.Ellipsis index={p.index} class="btn-icon btn-sm opacity-50">…</Pagination.Ellipsis>
              {/if}
            {/each}
          {/snippet}
        </Pagination.Context>
        <Pagination.NextTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronRight class="size-4" /></Pagination.NextTrigger>
        <Pagination.LastTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLast  class="size-4" /></Pagination.LastTrigger>
      </Pagination>
    </div>
  </div>
</div>

<!-- New Product modal -->
{#if newOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card preset-filled-surface-100-900 w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">New Product</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (newOpen = false)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4">
        {#if newError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{newError}</aside>{/if}
        <label class="label">
          <span class="label-text text-sm font-medium">Name <span class="text-error-500">*</span></span>
          <input type="text" class="input mt-1" bind:value={newForm.name} maxlength="200" placeholder="e.g. Classic T-Shirt" />
        </label>
        <label class="label">
          <span class="label-text text-sm font-medium">Base Price (USD) <span class="text-error-500">*</span></span>
          <input type="number" class="input mt-1" bind:value={newForm.basePriceDollars} min="0" step="0.01" placeholder="29.99" />
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span class="label-text text-sm font-medium">Status</span>
            <select class="select mt-1" bind:value={newForm.status}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </label>
          <label class="label">
            <span class="label-text text-sm font-medium">Category</span>
            <select class="select mt-1" bind:value={newForm.category}>
              <option value="">None</option>
              {#each categories as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </label>
        </div>
        <p class="text-xs text-surface-500">Variants, images, and discounts can be added after creation.</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (newOpen = false)}>Cancel</button>
        <button type="button" class="btn preset-filled-primary-500" disabled={creating} onclick={submitNew}>
          {creating ? 'Creating…' : 'Create & Edit'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Archive confirm modal -->
{#if archiveTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card preset-filled-surface-100-900 w-full max-w-sm shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">Archive Product</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (archiveTarget = null)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-3">
        {#if archiveError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{archiveError}</aside>{/if}
        <p class="text-sm">Archive <span class="font-semibold">{archiveTarget.name}</span>? It will no longer appear in active listings but order history is preserved.</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (archiveTarget = null)}>Cancel</button>
        <button type="button" class="btn preset-filled-warning-500" disabled={archiving} onclick={confirmArchive}>
          {archiving ? 'Archiving…' : 'Archive'}
        </button>
      </footer>
    </div>
  </div>
{/if}
