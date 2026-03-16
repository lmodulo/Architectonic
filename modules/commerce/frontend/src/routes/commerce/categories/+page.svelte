<script lang="ts">
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
  <h1 class="text-2xl font-bold">Categories</h1>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  <div class="flex items-center gap-3">
    <div class="input-group grid-cols-[auto_1fr] flex-1">
      <div class="ig-cell preset-tonal"><Search class="size-4" /></div>
      <input type="search" placeholder="Search categories…" class="ig-input" bind:value={query} />
    </div>
    {#if hasPermission(data.user, 'commerce_categories', 'create')}
      <button type="button" class="btn preset-filled-primary-500 shrink-0" onclick={openNew}>
        <Plus class="size-4" /><span>New Category</span>
      </button>
    {/if}
  </div>

  <div class="card preset-filled-surface-100-900 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-200-800">
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Name</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Slug</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Parent</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Order</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as cat}
          <tr class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
            <td class="px-4 py-3 font-medium">{cat.name}</td>
            <td class="px-4 py-3 text-surface-500 font-mono text-xs">{cat.slug}</td>
            <td class="px-4 py-3 text-surface-500">{parentName(cat.parentId)}</td>
            <td class="px-4 py-3 text-surface-500">{cat.order ?? 0}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                {#if hasPermission(data.user, 'commerce_categories', 'update')}
                  <button type="button" class="btn-icon btn-sm hover:preset-tonal-primary" onclick={() => openEdit(cat)} aria-label="Edit {cat.name}">
                    <Pencil class="size-4" />
                  </button>
                {/if}
                {#if hasPermission(data.user, 'commerce_categories', 'delete')}
                  <button type="button" class="btn-icon btn-sm hover:preset-tonal-error" onclick={() => openDelete(cat)} aria-label="Delete {cat.name}">
                    <Trash2 class="size-4" />
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-8 text-center text-surface-500">No categories found.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- New modal -->
{#if newOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card preset-filled-surface-100-900 w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">New Category</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (newOpen = false)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4">
        {#if newError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{newError}</aside>{/if}
        <label class="label">
          <span class="label-text text-sm font-medium">Name <span class="text-error-500">*</span></span>
          <input type="text" class="input mt-1" bind:value={newForm.name} maxlength="100" placeholder="e.g. Apparel" />
        </label>
        <label class="label">
          <span class="label-text text-sm font-medium">Description</span>
          <textarea class="textarea mt-1" bind:value={newForm.description} rows="2" maxlength="500"></textarea>
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span class="label-text text-sm font-medium">Parent</span>
            <select class="select mt-1" bind:value={newForm.parentId}>
              <option value="">None</option>
              {#each categories as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </label>
          <label class="label">
            <span class="label-text text-sm font-medium">Order</span>
            <input type="number" class="input mt-1" bind:value={newForm.order} min="0" />
          </label>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (newOpen = false)}>Cancel</button>
        <button type="button" class="btn preset-filled-primary-500" disabled={creating} onclick={submitNew}>
          {creating ? 'Creating…' : 'Create'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Edit modal -->
{#if editTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card preset-filled-surface-100-900 w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">Edit Category</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (editTarget = null)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4">
        {#if editError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{editError}</aside>{/if}
        <label class="label">
          <span class="label-text text-sm font-medium">Name <span class="text-error-500">*</span></span>
          <input type="text" class="input mt-1" bind:value={editForm.name} maxlength="100" />
        </label>
        <label class="label">
          <span class="label-text text-sm font-medium">Description</span>
          <textarea class="textarea mt-1" bind:value={editForm.description} rows="2" maxlength="500"></textarea>
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span class="label-text text-sm font-medium">Parent</span>
            <select class="select mt-1" bind:value={editForm.parentId}>
              <option value="">None</option>
              {#each categories.filter(c => c.id !== editTarget?.id) as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </label>
          <label class="label">
            <span class="label-text text-sm font-medium">Order</span>
            <input type="number" class="input mt-1" bind:value={editForm.order} min="0" />
          </label>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (editTarget = null)}>Cancel</button>
        <button type="button" class="btn preset-filled-primary-500" disabled={saving} onclick={submitEdit}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Delete modal -->
{#if deleteTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card preset-filled-surface-100-900 w-full max-w-sm shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">Delete Category</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (deleteTarget = null)}><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-3">
        {#if deleteError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{deleteError}</aside>{/if}
        <p class="text-sm">Delete <span class="font-semibold">{deleteTarget.name}</span>? This will fail if any active products use this category.</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (deleteTarget = null)}>Cancel</button>
        <button type="button" class="btn preset-filled-error-500" disabled={deleting} onclick={confirmDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
