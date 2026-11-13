<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { LayersIcon } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Plus, Pencil, Trash2, X } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Category = typeof data.categories[0];

  let categories = $state([...data.categories]);
  let query = $state('');

  const filtered = $derived(
    query.trim()
      ? categories.filter(c =>
          c.name?.toLowerCase().includes(query.toLowerCase()) ||
          c.slug?.toLowerCase().includes(query.toLowerCase())
        )
      : categories
  );

  $effect(() => { query; });

  // --- New modal ---
  let newOpen  = $state(false);
  let newForm  = $state({ name: '', description: '', parentId: '', order: 0 });
  let creating = $state(false);
  let newError = $state('');

  function openNew() {
    newForm  = { name: '', description: '', parentId: '', order: 0 };
    newError = '';
    newOpen  = true;
  }

  async function submitNew() {
    if (!newForm.name.trim()) { newError = 'Name is required'; return; }
    creating = true; newError = '';
    try {
      const res = await fetch('/api/commerce/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: newForm.name.trim(),
          description: newForm.description.trim() || undefined,
          parentId: newForm.parentId || undefined,
          order: newForm.order
        })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); newError = b.message ?? 'Create failed'; return; }
      const created = await res.json();
      categories = [...categories, { ...newForm, id: created.id, slug: created.slug }];
      newOpen = false;
    } catch { newError = 'Network error'; }
    finally { creating = false; }
  }

  // --- Edit modal ---
  let editTarget = $state<Category | null>(null);
  let editForm   = $state({ name: '', description: '', parentId: '', order: 0 });
  let saving     = $state(false);
  let editError  = $state('');

  function openEdit(cat: Category) {
    editForm  = { name: cat.name, description: cat.description ?? '', parentId: cat.parentId?.toString() ?? '', order: cat.order ?? 0 };
    editError = '';
    editTarget = cat;
  }

  async function submitEdit() {
    if (!editTarget) return;
    saving = true; editError = '';
    try {
      const res = await fetch(`/api/commerce/categories/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
          parentId: editForm.parentId || null,
          order: editForm.order
        })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); editError = b.message ?? 'Update failed'; return; }
      categories = categories.map(c => c.id === editTarget!.id ? { ...c, ...editForm, slug: c.slug } : c);
      editTarget = null;
    } catch { editError = 'Network error'; }
    finally { saving = false; }
  }

  // --- Delete modal ---
  let deleteTarget = $state<Category | null>(null);
  let deleting     = $state(false);
  let deleteError  = $state('');

  function openDelete(cat: Category) { deleteError = ''; deleteTarget = cat; }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/commerce/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); deleteError = b.message ?? 'Delete failed'; return; }
      categories = categories.filter(c => c.id !== deleteTarget!.id);
      deleteTarget = null;
    } catch { deleteError = 'Network error'; }
    finally { deleting = false; }
  }

  function parentName(id: string | null | undefined) {
    if (!id) return '—';
    return categories.find(c => c.id === id)?.name ?? id;
  }
</script>

<svelte:head><title>Categories</title></svelte:head>

<div class="space-y-6">
  <PageHeader icon={LayersIcon} title="Categories" subtitle="Organize products for the storefront" />

  {#if data.error}
    <aside class="alert alert-error p-3 rounded text-sm">{data.error}</aside>
  {/if}

  <div class="flex items-center gap-3">
    <label class="input flex items-center gap-2 flex-1">
      <Search class="size-4 opacity-50" />
      <input type="search" placeholder="Search categories…" class="grow" bind:value={query} />
    </label>
    {#if hasPermission(data.user, 'commerce_categories', 'create')}
      <button type="button" class="btn btn-primary shrink-0" onclick={openNew}>
        <Plus class="size-4" /><span>New Category</span>
      </button>
    {/if}
  </div>

  <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-base-300">
          <th class="text-left px-4 py-3 font-semibold opacity-60">Name</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Slug</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Parent</th>
          <th class="text-left px-4 py-3 font-semibold opacity-60">Order</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as cat}
          <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
            <td class="px-4 py-3 font-medium">{cat.name}</td>
            <td class="px-4 py-3 opacity-60 font-mono text-xs">{cat.slug}</td>
            <td class="px-4 py-3 opacity-60">{parentName(cat.parentId)}</td>
            <td class="px-4 py-3 opacity-60">{cat.order ?? 0}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                {#if hasPermission(data.user, 'commerce_categories', 'update')}
                  <button type="button" class="btn btn-ghost btn-sm btn-square hover:text-primary" onclick={() => openEdit(cat)} aria-label="Edit {cat.name}">
                    <Pencil class="size-4" />
                  </button>
                {/if}
                {#if hasPermission(data.user, 'commerce_categories', 'delete')}
                  <button type="button" class="btn btn-ghost btn-sm btn-square hover:text-error" onclick={() => openDelete(cat)} aria-label="Delete {cat.name}">
                    <Trash2 class="size-4" />
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-8 text-center opacity-60">No categories found.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- New modal -->
{#if newOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-200 border border-base-300 rounded-box w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300">
        <h2 class="text-lg font-semibold">New Category</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (newOpen = false)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4">
        {#if newError}<aside class="alert alert-error p-3 rounded text-sm">{newError}</aside>{/if}
        <label class="flex flex-col">
          <span class="label-text text-sm font-medium">Name <span class="text-error">*</span></span>
          <input type="text" class="input mt-1 w-full" bind:value={newForm.name} maxlength="100" placeholder="e.g. Apparel" />
        </label>
        <label class="flex flex-col">
          <span class="label-text text-sm font-medium">Description</span>
          <textarea class="textarea mt-1 w-full" bind:value={newForm.description} rows="2" maxlength="500"></textarea>
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col">
            <span class="label-text text-sm font-medium">Parent</span>
            <select class="select mt-1 w-full" bind:value={newForm.parentId}>
              <option value="">None</option>
              {#each categories as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </label>
          <label class="flex flex-col">
            <span class="label-text text-sm font-medium">Order</span>
            <input type="number" class="input mt-1 w-full" bind:value={newForm.order} min="0" />
          </label>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (newOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={creating} onclick={submitNew}>
          {creating ? 'Creating…' : 'Create'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Edit modal -->
{#if editTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-200 border border-base-300 rounded-box w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300">
        <h2 class="text-lg font-semibold">Edit Category</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editTarget = null)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4">
        {#if editError}<aside class="alert alert-error p-3 rounded text-sm">{editError}</aside>{/if}
        <label class="flex flex-col">
          <span class="label-text text-sm font-medium">Name <span class="text-error">*</span></span>
          <input type="text" class="input mt-1 w-full" bind:value={editForm.name} maxlength="100" />
        </label>
        <label class="flex flex-col">
          <span class="label-text text-sm font-medium">Description</span>
          <textarea class="textarea mt-1 w-full" bind:value={editForm.description} rows="2" maxlength="500"></textarea>
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col">
            <span class="label-text text-sm font-medium">Parent</span>
            <select class="select mt-1 w-full" bind:value={editForm.parentId}>
              <option value="">None</option>
              {#each categories.filter(c => c.id !== editTarget?.id) as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </label>
          <label class="flex flex-col">
            <span class="label-text text-sm font-medium">Order</span>
            <input type="number" class="input mt-1 w-full" bind:value={editForm.order} min="0" />
          </label>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (editTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={saving} onclick={submitEdit}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Delete modal -->
{#if deleteTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-200 border border-base-300 rounded-box w-full max-w-sm shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300">
        <h2 class="text-lg font-semibold">Delete Category</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteTarget = null)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-3">
        {#if deleteError}<aside class="alert alert-error p-3 rounded text-sm">{deleteError}</aside>{/if}
        <p class="text-sm">Delete <span class="font-semibold">{deleteTarget.name}</span>? This will fail if any active products use this category.</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-error" disabled={deleting} onclick={confirmDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
