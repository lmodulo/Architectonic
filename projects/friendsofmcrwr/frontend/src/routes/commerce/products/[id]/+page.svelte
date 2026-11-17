<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import RichTextView from '$lib/components/commerce/RichTextView.svelte';
  import { isRichTextEmpty, toEditorHtml } from '$lib/utils/richText';
  import { PackageIcon } from 'lucide-svelte';
  import { ArrowLeft, Plus, Trash2, Minus, X } from 'lucide-svelte';
  import { fade, scale, slide } from 'svelte/transition';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const canEdit = $derived(hasPermission(data.user, 'commerce_products', 'update'));

  // ---- Basic info ----
  let name        = $state(data.product.name ?? '');
  // Rich text from the base editor; descriptions saved before it had one were plain text, and open as paragraphs
  let description = $state(toEditorHtml(data.product.description));
  let basePriceDollars = $state(((data.product.basePrice ?? 0) / 100).toFixed(2));
  let status      = $state(data.product.status ?? 'draft');
  let category    = $state(data.product.category ?? '');
  let tagsRaw     = $state((data.product.tags ?? []).join(', '));
  // Missing on older products, which all kept stock
  let trackInventory = $state(data.product.trackInventory !== false);

  // ---- Images ----
  let images = $state([...(data.product.images ?? [])]);
  let imageFiles = $state<FileList | null>(null);
  let uploading = $state(false);
  let imageError = $state('');

  async function uploadImages() {
    if (!imageFiles || imageFiles.length === 0) return;
    uploading = true; imageError = '';
    const fd = new FormData();
    for (const f of imageFiles) fd.append('file', f);
    try {
      const res = await fetch(`/api/commerce/products/${data.product.id}/images`, { method: 'POST', body: fd });
      if (!res.ok) { const b = await res.json().catch(() => ({})); imageError = b.message ?? 'Upload failed'; return; }
      const { urls } = await res.json();
      images = [...images, ...urls];
      imageFiles = null;
    } catch { imageError = 'Network error'; }
    finally { uploading = false; }
  }

  async function removeImage(url: string) {
    const res = await fetch(`/api/commerce/products/${data.product.id}/images`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) images = images.filter(u => u !== url);
  }

  // ---- Variant options (axes) ----
  type VariantOption = { name: string; values: string[] };
  // `draft` is what's typed in the option's value box and not yet a value; `key` keeps each row's transitions
  // with the right row. Neither is saved. Values are the keys of their own list, so exact repeats (which the old
  // form allowed, and which would only make duplicate variants) are dropped on load.
  type OptionRow = VariantOption & { draft: string; key: number };
  let nextKey = 0;
  let variantOptions = $state<OptionRow[]>(
    (data.product.variantOptions ?? []).map((o: any) => ({ name: o.name, values: [...new Set<string>(o.values ?? [])], draft: '', key: nextKey++ }))
  );

  function addOption() { variantOptions = [...variantOptions, { name: '', values: [], draft: '', key: nextKey++ }]; }
  function removeOption(i: number) { variantOptions = variantOptions.filter((_, idx) => idx !== i); }
  /** Turn what's typed in an option's value box into values: commas separate them, blanks and repeats are skipped */
  function commitDraft(i: number) {
    const o = variantOptions[i];
    if (!o?.draft.trim()) return;
    const values = [...o.values];
    for (const v of o.draft.split(',').map(t => t.trim()).filter(Boolean)) {
      if (!values.some(x => x.toLowerCase() === v.toLowerCase())) values.push(v);
    }
    o.values = values;
    o.draft = '';
  }
  // Saving and generating take anything still in a value box, so a value typed without Enter isn't lost
  function commitAllDrafts() { variantOptions.forEach((_, i) => commitDraft(i)); }
  function removeValue(i: number, vi: number) {
    variantOptions[i].values = variantOptions[i].values.filter((_, idx) => idx !== vi);
  }

  // ---- Variants (generated grid) ----
  type Variant = { sku: string; combination: Record<string, string>; price?: number; stock: number; lowStockThreshold?: number };
  let variants = $state<Variant[]>(
    (data.product.variants ?? []).map((v: any) => ({
      sku: v.sku,
      combination: { ...v.combination },
      price: v.price,
      stock: v.stock ?? 0,
      lowStockThreshold: v.lowStockThreshold
    }))
  );

  function cartesian(opts: VariantOption[]): Record<string, string>[] {
    if (opts.length === 0) return [{}];
    const [first, ...rest] = opts;
    const restCombos = cartesian(rest);
    return first.values.flatMap(v =>
      restCombos.map(combo => ({ [first.name]: v, ...combo }))
    );
  }

  function generateVariants() {
    commitAllDrafts();
    const combos = cartesian(variantOptions.filter(o => o.name && o.values.length > 0));
    const existingBySku = new Map(variants.map(v => [v.sku, v]));

    variants = combos.map(combination => {
      // Try to find existing variant by matching combination
      const existing = variants.find(v =>
        JSON.stringify(v.combination) === JSON.stringify(combination)
      );
      if (existing) return existing;
      const skuParts = Object.values(combination).map(s => s.toUpperCase().slice(0, 3));
      const sku = `${name.slice(0, 4).toUpperCase()}-${skuParts.join('-')}`;
      return { sku, combination, stock: 0 };
    });

    void existingBySku; // suppress unused warning
  }

  function removeVariant(i: number) { variants = variants.filter((_, idx) => idx !== i); }

  async function adjustStock(i: number, delta: number) {
    const v = variants[i];
    const res = await fetch(`/api/commerce/products/${data.product.id}/variants/${encodeURIComponent(v.sku)}/stock`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ adjustment: delta })
    });
    if (res.ok) {
      variants = variants.map((vr, idx) => idx === i ? { ...vr, stock: vr.stock + delta } : vr);
    }
  }

  // ---- Discounts ----
  type Discount = { id?: string; type: string; value: number; minQuantity?: number; label: string; startDate?: string; endDate?: string; active: boolean };
  let discounts = $state<Discount[]>((data.product.discounts ?? []).map((d: any) => ({ ...d })));

  function addDiscount() {
    discounts = [...discounts, { type: 'percentage', value: 0, label: '', active: true }];
  }
  function removeDiscount(i: number) { discounts = discounts.filter((_, idx) => idx !== i); }

  // ---- Save ----
  let saving = $state(false);
  let saveError = $state('');
  let saveSuccess = $state(false);

  async function save() {
    commitAllDrafts();
    saving = true; saveError = ''; saveSuccess = false;
    const basePrice = Math.round(parseFloat(basePriceDollars) * 100);
    if (isNaN(basePrice)) { saveError = 'Invalid price'; saving = false; return; }
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/commerce/products/${data.product.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description: isRichTextEmpty(description) ? '' : description, basePrice, status, category: category || undefined, tags, trackInventory, variantOptions: variantOptions.map(({ name, values }) => ({ name, values })), variants, discounts })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); saveError = b.message ?? 'Save failed'; return; }
      saveSuccess = true;
      setTimeout(() => (saveSuccess = false), 3000);
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>{data.product.name} — Edit</title></svelte:head>

<div class="space-y-8 max-w-4xl">
  <PageHeader icon={PackageIcon} title={data.product.name}>
    <span class="font-mono">{data.product.slug}</span>
    {#snippet actions()}
      <a href="/commerce/products" class="btn btn-ghost btn-sm"><ArrowLeft class="size-4" /> Products</a>
    {/snippet}
  </PageHeader>

  {#if saveError}<aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>{/if}
  {#if saveSuccess}<aside class="alert alert-success p-3 rounded text-sm">Saved successfully.</aside>{/if}

  <!-- Basic Info -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-base-300 pb-2">Basic Info</h2>
    <div class="grid grid-cols-2 gap-4">
      <label class="flex flex-col col-span-2">
        <span class="label-text text-sm font-medium">Name</span>
        <input type="text" class="input mt-1 w-full" bind:value={name} maxlength="200" disabled={!canEdit} />
      </label>
      <label class="flex flex-col">
        <span class="label-text text-sm font-medium">Base Price (USD)</span>
        <input type="number" class="input mt-1 w-full" bind:value={basePriceDollars} min="0" step="0.01" disabled={!canEdit} />
      </label>
      <label class="flex flex-col">
        <span class="label-text text-sm font-medium">Status</span>
        <select class="select mt-1 w-full" bind:value={status} disabled={!canEdit}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label class="flex flex-col">
        <span class="label-text text-sm font-medium">Category</span>
        <select class="select mt-1 w-full" bind:value={category} disabled={!canEdit}>
          <option value="">None</option>
          {#each data.categories as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>
      <label class="flex flex-col">
        <span class="label-text text-sm font-medium">Tags (comma-separated)</span>
        <input type="text" class="input mt-1 w-full" bind:value={tagsRaw} placeholder="e.g. apparel, summer" disabled={!canEdit} />
      </label>
      <label class="col-span-2 flex items-start gap-3 cursor-pointer">
        <input type="checkbox" class="toggle toggle-primary toggle-sm mt-0.5 shrink-0" bind:checked={trackInventory} disabled={!canEdit} />
        <span class="flex flex-col gap-0.5">
          <span class="label-text text-sm font-medium">Track inventory</span>
          <span class="text-xs opacity-60">Turn off for donations, memberships and anything else that can't run out. It's then always in stock and stays out of the low-stock report.</span>
        </span>
      </label>
      <div class="flex flex-col col-span-2">
        <span class="label-text text-sm font-medium">Description</span>
        <div class="mt-1">
          {#if canEdit}
            <MessageEditor bind:html={description} placeholder="Describe the product…" />
          {:else if isRichTextEmpty(description)}
            <p class="text-sm opacity-60">No description.</p>
          {:else}
            <RichTextView html={description} class="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-base-300 p-3" />
          {/if}
        </div>
      </div>
    </div>
  </section>

  <!-- Images -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-base-300 pb-2">Images</h2>
    {#if imageError}<aside class="alert alert-error p-3 rounded text-sm">{imageError}</aside>{/if}
    <div class="flex flex-wrap gap-3">
      {#each images as url}
        <div class="relative group w-24 h-24 rounded overflow-hidden border border-base-300">
          <img src={url} alt="" class="w-full h-full object-cover" />
          {#if canEdit}
            <button
              type="button"
              class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              onclick={() => removeImage(url)}
            >
              <Trash2 class="size-4 text-white" />
            </button>
          {/if}
        </div>
      {/each}
    </div>
    {#if canEdit}
      <div class="flex items-center gap-3">
        <input type="file" class="input flex-1" accept="image/*" multiple bind:files={imageFiles} />
        <button type="button" class="btn btn-ghost shrink-0" disabled={uploading || !imageFiles?.length} onclick={uploadImages}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    {/if}
  </section>

  <!-- Variant Options -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-base-300 pb-2">Variant Options</h2>
    <p class="text-sm opacity-60">
      Each option (e.g. Size) has a list of values (e.g. Small, Medium, Large). Generate Variants makes one variant
      for every combination of values.
    </p>

    {#each variantOptions as opt, i (opt.key)}
      <div class="border border-base-300 rounded-box p-3 space-y-3" transition:slide={{ duration: 200 }}>
        <div class="flex items-end gap-2">
          <label class="flex flex-col flex-1 min-w-0">
            <span class="label-text text-xs font-medium">Option name</span>
            <input type="text" class="input mt-1 text-sm w-full" placeholder="e.g. Size" bind:value={opt.name} disabled={!canEdit} />
          </label>
          {#if canEdit}
            <button type="button" class="btn btn-ghost btn-square hover:text-error shrink-0" aria-label="Remove option" title="Remove option" onclick={() => removeOption(i)}>
              <Trash2 class="size-4" />
            </button>
          {/if}
        </div>

        <div>
          <span class="label-text text-xs font-medium" id="option-values-{opt.key}">Values</span>
          <!-- Always present (no height while empty), so the first value added animates in like the rest -->
          <ul class="flex flex-wrap gap-x-2" aria-labelledby="option-values-{opt.key}">
            {#each opt.values as val, vi (val)}
              <li class="badge badge-ghost h-auto min-h-7 py-1 gap-1 text-sm max-w-full mt-1.5" transition:scale={{ duration: 150, start: 0.85 }}>
                <span class="break-all">{val}</span>
                {#if canEdit}
                  <button type="button" class="btn btn-ghost btn-circle btn-xs -mr-1 opacity-60 hover:opacity-100" aria-label="Remove {val}" title="Remove {val}" onclick={() => removeValue(i, vi)}>
                    <X class="size-3" />
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
          {#if !canEdit && !opt.values.length}
            <p class="text-sm opacity-60 mt-1">No values</p>
          {/if}
          {#if canEdit}
            <div class="flex gap-2 mt-2">
              <input
                type="text"
                class="input text-sm flex-1 min-w-0"
                placeholder="e.g. Small, Medium, Large"
                aria-labelledby="option-values-{opt.key}"
                aria-describedby="option-values-hint-{opt.key}"
                bind:value={opt.draft}
                onkeydown={(e) => { if ((e.key === 'Enter' || e.key === ',') && !e.isComposing) { e.preventDefault(); commitDraft(i); } }}
                onblur={() => commitDraft(i)}
              />
              <button type="button" class="btn btn-ghost shrink-0" disabled={!opt.draft.trim()} onclick={() => commitDraft(i)}>
                <Plus class="size-4" /><span>Add</span>
              </button>
            </div>
            <p class="text-xs opacity-60 mt-1" id="option-values-hint-{opt.key}">Separate values with commas, or press Enter after each.</p>
          {/if}
        </div>
      </div>
    {/each}

    {#if canEdit}
      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn btn-ghost" onclick={addOption}>
          <Plus class="size-4" /><span>Add Option Axis</span>
        </button>
        {#if variantOptions.some(o => o.name && (o.values.length > 0 || o.draft.trim()))}
          <button type="button" class="btn btn-secondary" onclick={generateVariants} transition:fade={{ duration: 150 }}>
            Generate Variants
          </button>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Variants grid -->
  {#if variants.length > 0}
    <section class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <div class="px-4 py-3 border-b border-base-300 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span class="font-semibold">Variants ({variants.length})</span>
        {#if !trackInventory}
          <span class="text-xs opacity-60" transition:fade={{ duration: 150 }}>Inventory isn't tracked: every variant is always in stock.</span>
        {/if}
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-base-300">
              <th class="text-left px-3 py-2 font-semibold opacity-60">SKU</th>
              {#each variantOptions.filter(o => o.name) as opt}
                <th class="text-left px-3 py-2 font-semibold opacity-60">{opt.name}</th>
              {/each}
              <th class="text-right px-3 py-2 font-semibold opacity-60">Price Override</th>
              {#if trackInventory}
                <th class="text-right px-3 py-2 font-semibold opacity-60" transition:fade={{ duration: 150 }}>Stock</th>
                <th class="text-right px-3 py-2 font-semibold opacity-60" transition:fade={{ duration: 150 }}>Low Stock At</th>
              {/if}
              {#if canEdit}<th class="px-3 py-2"></th>{/if}
            </tr>
          </thead>
          <tbody>
            {#each variants as v, i}
              <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
                <td class="px-3 py-2">
                  <input type="text" class="input text-xs font-mono w-32" bind:value={v.sku} disabled={!canEdit} />
                </td>
                {#each variantOptions.filter(o => o.name) as opt}
                  <td class="px-3 py-2 opacity-60">{v.combination[opt.name] ?? '—'}</td>
                {/each}
                <td class="px-3 py-2 text-right">
                  <input
                    type="number"
                    class="input text-xs w-24 text-right"
                    placeholder="(base)"
                    min="0"
                    step="0.01"
                    value={v.price !== undefined ? (v.price / 100).toFixed(2) : ''}
                    oninput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      v.price = isNaN(val) ? undefined : Math.round(val * 100);
                    }}
                    disabled={!canEdit}
                  />
                </td>
                {#if trackInventory}
                <td class="px-3 py-2 text-right" transition:fade={{ duration: 150 }}>
                  <div class="flex items-center justify-end gap-1">
                    {#if canEdit}
                      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => adjustStock(i, -1)} disabled={v.stock <= 0}><Minus class="size-3" /></button>
                    {/if}
                    <input type="number" class="input text-xs w-16 text-center" bind:value={v.stock} min="0" disabled={!canEdit} />
                    {#if canEdit}
                      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => adjustStock(i, 1)}><Plus class="size-3" /></button>
                    {/if}
                  </div>
                </td>
                <td class="px-3 py-2 text-right" transition:fade={{ duration: 150 }}>
                  <input type="number" class="input text-xs w-16 text-right" bind:value={v.lowStockThreshold} min="0" placeholder="5" disabled={!canEdit} />
                </td>
                {/if}
                {#if canEdit}
                  <td class="px-3 py-2">
                    <button type="button" class="btn btn-ghost btn-sm btn-square hover:text-error" onclick={() => removeVariant(i)}>
                      <Trash2 class="size-4" />
                    </button>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}

  <!-- Discounts -->
  <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-base-300 pb-2">Discounts</h2>

    {#each discounts as d, i}
      <div class="border border-base-300 rounded-box p-3 space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <label class="flex flex-col w-36">
            <span class="label-text text-xs font-medium">Type</span>
            <select class="select mt-1 text-sm w-full" bind:value={d.type} disabled={!canEdit}>
              <option value="percentage">Percentage %</option>
              <option value="fixed">Fixed $</option>
              <option value="quantity_tier">Quantity Tier</option>
            </select>
          </label>
          <label class="flex flex-col w-28">
            <span class="label-text text-xs font-medium">{d.type === 'percentage' ? 'Percent (%)' : 'Amount ($)'}</span>
            <input type="number" class="input mt-1 text-sm w-full" bind:value={d.value} min="0" step={d.type === 'percentage' ? '1' : '0.01'} disabled={!canEdit} />
          </label>
          {#if d.type === 'quantity_tier'}
            <label class="flex flex-col w-28">
              <span class="label-text text-xs font-medium">Min Qty</span>
              <input type="number" class="input mt-1 text-sm w-full" bind:value={d.minQuantity} min="1" disabled={!canEdit} />
            </label>
          {/if}
          <label class="flex flex-col flex-1 min-w-32">
            <span class="label-text text-xs font-medium">Label</span>
            <input type="text" class="input mt-1 text-sm w-full" bind:value={d.label} placeholder="e.g. 10% off" disabled={!canEdit} />
          </label>
          <label class="flex items-center gap-2 mt-4">
            <input type="checkbox" class="checkbox" bind:checked={d.active} disabled={!canEdit} />
            <span class="text-sm">Active</span>
          </label>
          {#if canEdit}
            <button type="button" class="btn btn-ghost btn-sm btn-square hover:text-error mt-4" onclick={() => removeDiscount(i)}>
              <Trash2 class="size-4" />
            </button>
          {/if}
        </div>
        <div class="flex gap-4">
          <label class="flex flex-col flex-1">
            <span class="label-text text-xs font-medium">Start Date</span>
            <input type="date" class="input mt-1 text-sm w-full" bind:value={d.startDate} disabled={!canEdit} />
          </label>
          <label class="flex flex-col flex-1">
            <span class="label-text text-xs font-medium">End Date</span>
            <input type="date" class="input mt-1 text-sm w-full" bind:value={d.endDate} disabled={!canEdit} />
          </label>
        </div>
      </div>
    {/each}

    {#if canEdit}
      <button type="button" class="btn btn-ghost" onclick={addDiscount}>
        <Plus class="size-4" /><span>Add Discount</span>
      </button>
    {/if}
  </section>

  <!-- Save -->
  {#if canEdit}
    <div class="flex justify-end gap-3 pb-8">
      <a href="/commerce/products" class="btn btn-ghost">Cancel</a>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Saving…' : 'Save Product'}
      </button>
    </div>
  {/if}
</div>
