<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { PackageIcon } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Plus, Archive, X } from 'lucide-svelte';
  import Pagination from '$lib/components/Pagination.svelte';
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
    active:   'badge-success badge-soft',
    draft:    'badge-warning badge-soft',
    archived: 'badge-ghost'
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
  <PageHeader icon={PackageIcon} title="Products" subtitle="Catalog · Variants · Pricing" />

  <div class="flex flex-wrap items-center gap-3">
    <label class="input flex items-center gap-2 flex-1 min-w-48">
      <Search class="size-4 opacity-50" />
      <input type="search" placeholder="Search products…" class="grow" bind:value={query} />
    </label>
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
      <button type="button" class="btn btn-primary shrink-0" onclick={openNew}>
        <Plus class="size-4" /><span>New Product</span>
      </button>
    {/if}
  </div>

  <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-base-300">
          <th class="text-left px-4 py-3 font-semibold opacity-60">Name</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Status</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Category</th>
          <th class="text-right px-4 py-3 font-semibold opacity-60">Price</th>
          <th class="text-right px-4 py-3 font-semibold opacity-60">Stock</th>
          <th class="text-right px-4 py-3 font-semibold opacity-60">Variants</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {#each pageProducts as p}
          <tr
            class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
            onclick={() => goto(`/commerce/products/${p.id}`)}
          >
            <td class="px-4 py-3">
              <div class="font-medium">{p.name}</div>
              <div class="text-xs opacity-60 font-mono">{p.slug}</div>
            </td>
            <td class="px-4 py-3"><span class="badge {STATUS_BADGE[p.status] ?? 'badge-ghost'} text-xs capitalize">{p.status}</span></td>
            <td class="px-4 py-3 opacity-60">{categoryName(p.category)}</td>
            <td class="px-4 py-3 text-right font-medium">{fmt(p.basePrice ?? 0)}</td>
            <td class="px-4 py-3 text-right opacity-60">{totalStock(p)}</td>
            <td class="px-4 py-3 text-right opacity-60">{(p.variants ?? []).length}</td>
            <td class="px-4 py-3">
              {#if hasPermission(data.user, 'commerce_products', 'delete') && p.status !== 'archived'}
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-square hover:text-warning"
                  onclick={(e) => { e.stopPropagation(); openArchive(p); }}
                  aria-label="Archive {p.name}"
                >
                  <Archive class="size-4" />
                </button>
              {/if}
            </td>
          </tr>
        {:else}
          <tr><td colspan="7" class="px-4 py-8 text-center opacity-60">No products found.</td></tr>
        {/each}
      </tbody>
    </table>

    <div class="flex items-center justify-between px-4 py-2 border-t border-base-300">
      <span class="opacity-60 text-xs">
        {filtered.length === 0 ? 'No products' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
      </span>
      <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage} onPageChange={(e) => (currentPage = e.page)} siblingCount={1} />
    </div>
  </div>
</div>

<!-- New Product modal -->
{#if newOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-200 border border-base-300 rounded-box w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300">
        <h2 class="text-lg font-semibold">New Product</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (newOpen = false)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4">
        {#if newError}<aside class="alert alert-error p-3 rounded text-sm">{newError}</aside>{/if}
        <label class="flex flex-col">
          <span class="label-text text-sm font-medium">Name <span class="text-error">*</span></span>
          <input type="text" class="input mt-1 w-full" bind:value={newForm.name} maxlength="200" placeholder="e.g. Classic T-Shirt" />
        </label>
        <label class="flex flex-col">
          <span class="label-text text-sm font-medium">Base Price (USD) <span class="text-error">*</span></span>
          <input type="number" class="input mt-1 w-full" bind:value={newForm.basePriceDollars} min="0" step="0.01" placeholder="29.99" />
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col">
            <span class="label-text text-sm font-medium">Status</span>
            <select class="select mt-1 w-full" bind:value={newForm.status}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </label>
          <label class="flex flex-col">
            <span class="label-text text-sm font-medium">Category</span>
            <select class="select mt-1 w-full" bind:value={newForm.category}>
              <option value="">None</option>
              {#each categories as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </label>
        </div>
        <p class="text-xs opacity-60">Variants, images, and discounts can be added after creation.</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (newOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={creating} onclick={submitNew}>
          {creating ? 'Creating…' : 'Create & Edit'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Archive confirm modal -->
{#if archiveTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-200 border border-base-300 rounded-box w-full max-w-sm shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300">
        <h2 class="text-lg font-semibold">Archive Product</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (archiveTarget = null)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-3">
        {#if archiveError}<aside class="alert alert-error p-3 rounded text-sm">{archiveError}</aside>{/if}
        <p class="text-sm">Archive <span class="font-semibold">{archiveTarget.name}</span>? It will no longer appear in active listings but order history is preserved.</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (archiveTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-warning" disabled={archiving} onclick={confirmArchive}>
          {archiving ? 'Archiving…' : 'Archive'}
        </button>
      </footer>
    </div>
  </div>
{/if}
