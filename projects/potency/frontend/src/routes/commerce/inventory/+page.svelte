<script lang="ts">
  import { BarChart2 } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function stockColor(stock: number, threshold: number) {
    if (stock === 0) return 'text-error-500 font-bold';
    if (stock <= threshold) return 'text-warning-500 font-semibold';
    return '';
  }
</script>

<svelte:head><title>Inventory</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <BarChart2 class="size-6 text-surface-500" />
    <h1 class="text-2xl font-bold">Inventory — Low Stock</h1>
    <span class="badge preset-tonal-warning text-xs">{data.total} product{data.total === 1 ? '' : 's'}</span>
  </div>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  {#if data.products.length === 0}
    <div class="card preset-filled-surface-100-900 px-6 py-12 text-center text-surface-500">
      All variants are above their low-stock thresholds.
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.products as product}
        <div class="card preset-filled-surface-100-900 overflow-hidden">
          <div class="card-header px-4 py-3 border-b border-surface-200-800 flex items-center justify-between">
            <div>
              <a href="/commerce/products/{product.id}" class="font-semibold hover:underline">{product.name}</a>
              <span class="ml-2 font-mono text-xs text-surface-500">{product.slug}</span>
            </div>
            {#if product.category}
              <span class="badge preset-tonal text-xs">{product.category}</span>
            {/if}
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200-800">
                <th class="text-left px-4 py-2 font-semibold text-surface-500">SKU</th>
                <th class="text-left px-4 py-2 font-semibold text-surface-500">Variant</th>
                <th class="text-right px-4 py-2 font-semibold text-surface-500">Stock</th>
                <th class="text-right px-4 py-2 font-semibold text-surface-500">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {#each product.lowStockVariants as v}
                {@const threshold = v.lowStockThreshold ?? 5}
                <tr class="border-b border-surface-200-800 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
                  <td class="px-4 py-2 font-mono text-xs">{v.sku}</td>
                  <td class="px-4 py-2 text-surface-500">
                    {Object.entries(v.combination ?? {}).map(([k, val]) => `${k}: ${val}`).join(', ') || '—'}
                  </td>
                  <td class="px-4 py-2 text-right {stockColor(v.stock, threshold)}">{v.stock}</td>
                  <td class="px-4 py-2 text-right text-surface-500">{threshold}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    </div>
  {/if}
</div>
