<script lang="ts">
  import { ArrowLeft, Plus, Trash2, Minus } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const canEdit = $derived(hasPermission(data.user, 'commerce_products', 'update'));

  // ---- Basic info ----
  let name        = $state(data.product.name ?? '');
  let description = $state(data.product.description ?? '');
  let basePriceDollars = $state(((data.product.basePrice ?? 0) / 100).toFixed(2));
  let status      = $state(data.product.status ?? 'draft');
  let category    = $state(data.product.category ?? '');
  let tagsRaw     = $state((data.product.tags ?? []).join(', '));

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
  let variantOptions = $state<VariantOption[]>(
    (data.product.variantOptions ?? []).map((o: any) => ({ name: o.name, values: [...o.values] }))
  );

  function addOption() { variantOptions = [...variantOptions, { name: '', values: [] }]; }
  function removeOption(i: number) { variantOptions = variantOptions.filter((_, idx) => idx !== i); }
  function addValue(i: number, val: string) {
    if (!val.trim()) return;
    variantOptions = variantOptions.map((o, idx) =>
      idx === i ? { ...o, values: [...o.values, val.trim()] } : o
    );
  }
  function removeValue(i: number, vi: number) {
    variantOptions = variantOptions.map((o, idx) =>
      idx === i ? { ...o, values: o.values.filter((_, vidx) => vidx !== vi) } : o
    );
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

  let newValue = $state<string[]>([]);

  function cartesian(opts: VariantOption[]): Record<string, string>[] {
    if (opts.length === 0) return [{}];
    const [first, ...rest] = opts;
    const restCombos = cartesian(rest);
    return first.values.flatMap(v =>
      restCombos.map(combo => ({ [first.name]: v, ...combo }))
    );
  }

  function generateVariants() {
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
    saving = true; saveError = ''; saveSuccess = false;
    const basePrice = Math.round(parseFloat(basePriceDollars) * 100);
    if (isNaN(basePrice)) { saveError = 'Invalid price'; saving = false; return; }
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/commerce/products/${data.product.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, basePrice, status, category: category || undefined, tags, variantOptions, variants, discounts })
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
  <div class="flex items-center gap-3">
    <a href="/commerce/products" class="btn-icon hover:preset-tonal"><ArrowLeft class="size-4" /></a>
    <h1 class="text-2xl font-bold">{data.product.name}</h1>
    <span class="badge preset-tonal text-xs font-mono">{data.product.slug}</span>
  </div>

  {#if saveError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{saveError}</aside>{/if}
  {#if saveSuccess}<aside class="alert preset-tonal-success p-3 rounded-base text-sm">Saved successfully.</aside>{/if}

  <!-- Basic Info -->
  <section class="card preset-filled-surface-100-900 p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-surface-200-800 pb-2">Basic Info</h2>
    <div class="grid grid-cols-2 gap-4">
      <label class="label col-span-2">
        <span class="label-text text-sm font-medium">Name</span>
        <input type="text" class="input mt-1" bind:value={name} maxlength="200" disabled={!canEdit} />
      </label>
      <label class="label">
        <span class="label-text text-sm font-medium">Base Price (USD)</span>
        <input type="number" class="input mt-1" bind:value={basePriceDollars} min="0" step="0.01" disabled={!canEdit} />
      </label>
      <label class="label">
        <span class="label-text text-sm font-medium">Status</span>
        <select class="select mt-1" bind:value={status} disabled={!canEdit}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label class="label">
        <span class="label-text text-sm font-medium">Category</span>
        <select class="select mt-1" bind:value={category} disabled={!canEdit}>
          <option value="">None</option>
          {#each data.categories as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>
      <label class="label">
        <span class="label-text text-sm font-medium">Tags (comma-separated)</span>
        <input type="text" class="input mt-1" bind:value={tagsRaw} placeholder="e.g. apparel, summer" disabled={!canEdit} />
      </label>
      <label class="label col-span-2">
        <span class="label-text text-sm font-medium">Description</span>
        <textarea class="textarea mt-1" bind:value={description} rows="3" maxlength="5000" disabled={!canEdit}></textarea>
      </label>
    </div>
  </section>

  <!-- Images -->
  <section class="card preset-filled-surface-100-900 p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-surface-200-800 pb-2">Images</h2>
    {#if imageError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{imageError}</aside>{/if}
    <div class="flex flex-wrap gap-3">
      {#each images as url}
        <div class="relative group w-24 h-24 rounded overflow-hidden border border-surface-200-800">
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
        <button type="button" class="btn preset-tonal shrink-0" disabled={uploading || !imageFiles?.length} onclick={uploadImages}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    {/if}
  </section>

  <!-- Variant Options -->
  <section class="card preset-filled-surface-100-900 p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-surface-200-800 pb-2">Variant Options</h2>
    <p class="text-sm text-surface-500">Define option axes (e.g. Size, Color), then generate the variant grid below.</p>

    {#each variantOptions as opt, i}
      <div class="border border-surface-200-800 rounded-base p-3 space-y-2">
        <div class="flex items-center gap-2">
          <input type="text" class="input flex-1" placeholder="Option name (e.g. Size)" bind:value={opt.name} disabled={!canEdit} />
          {#if canEdit}
            <button type="button" class="btn-icon btn-sm hover:preset-tonal-error" onclick={() => removeOption(i)}>
              <Trash2 class="size-4" />
            </button>
          {/if}
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          {#each opt.values as val, vi}
            <span class="badge preset-tonal text-sm flex items-center gap-1">
              {val}
              {#if canEdit}
                <button type="button" onclick={() => removeValue(i, vi)} class="ml-1 opacity-60 hover:opacity-100">×</button>
              {/if}
            </span>
          {/each}
          {#if canEdit}
            <input
              type="text"
              class="input w-28 text-sm"
              placeholder="Add value…"
              value={newValue[i] ?? ''}
              oninput={(e) => { newValue[i] = (e.target as HTMLInputElement).value; }}
              onkeydown={(e) => { if (e.key === 'Enter') { addValue(i, newValue[i] ?? ''); newValue[i] = ''; } }}
            />
          {/if}
        </div>
      </div>
    {/each}

    {#if canEdit}
      <div class="flex gap-3">
        <button type="button" class="btn preset-tonal" onclick={addOption}>
          <Plus class="size-4" /><span>Add Option Axis</span>
        </button>
        {#if variantOptions.some(o => o.name && o.values.length > 0)}
          <button type="button" class="btn preset-filled-secondary-500" onclick={generateVariants}>
            Generate Variants
          </button>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Variants grid -->
  {#if variants.length > 0}
    <section class="card preset-filled-surface-100-900 overflow-hidden">
      <div class="px-4 py-3 border-b border-surface-200-800 font-semibold">Variants ({variants.length})</div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-surface-200-800">
              <th class="text-left px-3 py-2 font-semibold text-surface-500">SKU</th>
              {#each variantOptions.filter(o => o.name) as opt}
                <th class="text-left px-3 py-2 font-semibold text-surface-500">{opt.name}</th>
              {/each}
              <th class="text-right px-3 py-2 font-semibold text-surface-500">Price Override</th>
              <th class="text-right px-3 py-2 font-semibold text-surface-500">Stock</th>
              <th class="text-right px-3 py-2 font-semibold text-surface-500">Low Stock At</th>
              {#if canEdit}<th class="px-3 py-2"></th>{/if}
            </tr>
          </thead>
          <tbody>
            {#each variants as v, i}
              <tr class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
                <td class="px-3 py-2">
                  <input type="text" class="input text-xs font-mono w-32" bind:value={v.sku} disabled={!canEdit} />
                </td>
                {#each variantOptions.filter(o => o.name) as opt}
                  <td class="px-3 py-2 text-surface-500">{v.combination[opt.name] ?? '—'}</td>
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
                <td class="px-3 py-2 text-right">
                  <div class="flex items-center justify-end gap-1">
                    {#if canEdit}
                      <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={() => adjustStock(i, -1)} disabled={v.stock <= 0}><Minus class="size-3" /></button>
                    {/if}
                    <input type="number" class="input text-xs w-16 text-center" bind:value={v.stock} min="0" disabled={!canEdit} />
                    {#if canEdit}
                      <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={() => adjustStock(i, 1)}><Plus class="size-3" /></button>
                    {/if}
                  </div>
                </td>
                <td class="px-3 py-2 text-right">
                  <input type="number" class="input text-xs w-16 text-right" bind:value={v.lowStockThreshold} min="0" placeholder="5" disabled={!canEdit} />
                </td>
                {#if canEdit}
                  <td class="px-3 py-2">
                    <button type="button" class="btn-icon btn-sm hover:preset-tonal-error" onclick={() => removeVariant(i)}>
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
  <section class="card preset-filled-surface-100-900 p-5 space-y-4">
    <h2 class="font-semibold text-lg border-b border-surface-200-800 pb-2">Discounts</h2>

    {#each discounts as d, i}
      <div class="border border-surface-200-800 rounded-base p-3 space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <label class="label w-36">
            <span class="label-text text-xs font-medium">Type</span>
            <select class="select mt-1 text-sm" bind:value={d.type} disabled={!canEdit}>
              <option value="percentage">Percentage %</option>
              <option value="fixed">Fixed $</option>
              <option value="quantity_tier">Quantity Tier</option>
            </select>
          </label>
          <label class="label w-28">
            <span class="label-text text-xs font-medium">{d.type === 'percentage' ? 'Percent (%)' : 'Amount ($)'}</span>
            <input type="number" class="input mt-1 text-sm" bind:value={d.value} min="0" step={d.type === 'percentage' ? '1' : '0.01'} disabled={!canEdit} />
          </label>
          {#if d.type === 'quantity_tier'}
            <label class="label w-28">
              <span class="label-text text-xs font-medium">Min Qty</span>
              <input type="number" class="input mt-1 text-sm" bind:value={d.minQuantity} min="1" disabled={!canEdit} />
            </label>
          {/if}
          <label class="label flex-1 min-w-32">
            <span class="label-text text-xs font-medium">Label</span>
            <input type="text" class="input mt-1 text-sm" bind:value={d.label} placeholder="e.g. 10% off" disabled={!canEdit} />
          </label>
          <label class="label flex items-center gap-2 mt-4">
            <input type="checkbox" class="checkbox" bind:checked={d.active} disabled={!canEdit} />
            <span class="text-sm">Active</span>
          </label>
          {#if canEdit}
            <button type="button" class="btn-icon btn-sm hover:preset-tonal-error mt-4" onclick={() => removeDiscount(i)}>
              <Trash2 class="size-4" />
            </button>
          {/if}
        </div>
        <div class="flex gap-4">
          <label class="label flex-1">
            <span class="label-text text-xs font-medium">Start Date</span>
            <input type="date" class="input mt-1 text-sm" bind:value={d.startDate} disabled={!canEdit} />
          </label>
          <label class="label flex-1">
            <span class="label-text text-xs font-medium">End Date</span>
            <input type="date" class="input mt-1 text-sm" bind:value={d.endDate} disabled={!canEdit} />
          </label>
        </div>
      </div>
    {/each}

    {#if canEdit}
      <button type="button" class="btn preset-tonal" onclick={addDiscount}>
        <Plus class="size-4" /><span>Add Discount</span>
      </button>
    {/if}
  </section>

  <!-- Save -->
  {#if canEdit}
    <div class="flex justify-end gap-3 pb-8">
      <a href="/commerce/products" class="btn preset-tonal">Cancel</a>
      <button type="button" class="btn preset-filled-primary-500" disabled={saving} onclick={save}>
        {saving ? 'Saving…' : 'Save Product'}
      </button>
    </div>
  {/if}
</div>
