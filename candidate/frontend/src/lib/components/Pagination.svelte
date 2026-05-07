<script lang="ts">
  import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';

  let {
    count,
    pageSize,
    page,
    onPageChange,
    siblingCount = 1,
  }: {
    count: number;
    pageSize: number;
    page: number;
    onPageChange: (e: { page: number }) => void;
    siblingCount?: number;
  } = $props();

  const totalPages = $derived(Math.ceil(count / pageSize));

  const pages = $derived(getPages(page, totalPages, siblingCount));

  function getPages(current: number, total: number, siblings: number) {
    if (total <= 1) return [];

    type Page = { type: 'page'; value: number; key: string } | { type: 'ellipsis'; key: string };
    const out: Page[] = [];

    if (total <= siblings * 2 + 5) {
      for (let i = 1; i <= total; i++) out.push({ type: 'page', value: i, key: `p${i}` });
      return out;
    }

    const left  = Math.max(current - siblings, 2);
    const right = Math.min(current + siblings, total - 1);

    out.push({ type: 'page', value: 1, key: 'p1' });
    if (left > 2)        out.push({ type: 'ellipsis', key: 'el' });
    for (let i = left; i <= right; i++) out.push({ type: 'page', value: i, key: `p${i}` });
    if (right < total - 1) out.push({ type: 'ellipsis', key: 'er' });
    out.push({ type: 'page', value: total, key: `p${total}` });

    return out;
  }

  function go(n: number) {
    if (n >= 1 && n <= totalPages && n !== page) onPageChange({ page: n });
  }
</script>

<div class="join">
  <button
    type="button"
    class="join-item btn btn-sm btn-ghost"
    disabled={page <= 1}
    onclick={() => go(1)}
    aria-label="First page"
  ><ChevronFirst class="size-4" /></button>

  <button
    type="button"
    class="join-item btn btn-sm btn-ghost"
    disabled={page <= 1}
    onclick={() => go(page - 1)}
    aria-label="Previous page"
  ><ChevronLeft class="size-4" /></button>

  {#each pages as p (p.key)}
    {#if p.type === 'page'}
      <button
        type="button"
        class="join-item btn btn-sm {p.value === page ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => go(p.value)}
      >{p.value}</button>
    {:else}
      <button type="button" class="join-item btn btn-sm btn-ghost btn-disabled" aria-hidden="true">…</button>
    {/if}
  {/each}

  <button
    type="button"
    class="join-item btn btn-sm btn-ghost"
    disabled={page >= totalPages}
    onclick={() => go(page + 1)}
    aria-label="Next page"
  ><ChevronRight class="size-4" /></button>

  <button
    type="button"
    class="join-item btn btn-sm btn-ghost"
    disabled={page >= totalPages}
    onclick={() => go(totalPages)}
    aria-label="Last page"
  ><ChevronLast class="size-4" /></button>
</div>
