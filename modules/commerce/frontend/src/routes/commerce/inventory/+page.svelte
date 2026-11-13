<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { BarChart2 } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function stockColor(stock: number, threshold: number) {
    if (stock === 0) return 'text-error font-bold';
    if (stock <= threshold) return 'text-warning font-semibold';
    return '';
  }
</script>

<svelte:head><title>Inventory</title></svelte:head>

<div class="space-y-6">
  <PageHeader icon={BarChart2} title="Inventory">Low stock · {data.total} product{data.total === 1 ? '' : 's'}</PageHeader>

  {#if data.error}
    <aside class="alert alert-error p-3 rounded text-sm">{data.error}</aside>
  {/if}

  {#if data.products.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box px-6 py-12 text-center opacity-60">
      All variants are above their low-stock thresholds.
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.products as product}
        <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
          <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
            <div>
              <a href="/commerce/products/{product.id}" class="font-semibold hover:underline">{product.name}</a>
              <span class="ml-2 font-mono text-xs opacity-60">{product.slug}</span>
            </div>
            {#if product.category}
              <span class="badge badge-ghost text-xs">{product.category}</span>
            {/if}
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-base-300">
                <th class="text-left px-4 py-2 font-semibold opacity-60">SKU</th>
                <th class="text-left px-4 py-2 font-semibold opacity-60">Variant</th>
                <th class="text-right px-4 py-2 font-semibold opacity-60">Stock</th>
                <th class="text-right px-4 py-2 font-semibold opacity-60">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {#each product.lowStockVariants as v}
                {@const threshold = v.lowStockThreshold ?? 5}
                <tr class="border-b border-base-300 last:border-0 odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
                  <td class="px-4 py-2 font-mono text-xs">{v.sku}</td>
                  <td class="px-4 py-2 opacity-60">
                    {Object.entries(v.combination ?? {}).map(([k, val]) => `${k}: ${val}`).join(', ') || '—'}
                  </td>
                  <td class="px-4 py-2 text-right {stockColor(v.stock, threshold)}">{v.stock}</td>
                  <td class="px-4 py-2 text-right opacity-60">{threshold}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    </div>
  {/if}
</div>
