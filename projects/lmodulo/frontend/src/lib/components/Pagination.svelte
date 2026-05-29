<script lang="ts">
  import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';

  let { total, pageSize, currentPage, onPage, class: cls = '' }: {
    total: number;
    pageSize: number;
    currentPage: number;
    onPage: (n: number) => void;
    class?: string;
  } = $props();

  const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
  const startItem  = $derived((currentPage - 1) * pageSize + 1);
  const endItem    = $derived(Math.min(currentPage * pageSize, total));

  const pages = $derived.by(() => {
    const last = totalPages;
    const result: Array<{ type: 'page'; value: number } | { type: 'ellipsis'; index: number }> = [];
    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || Math.abs(i - currentPage) <= 1) {
        result.push({ type: 'page', value: i });
      } else if (result[result.length - 1]?.type === 'page') {
        result.push({ type: 'ellipsis', index: result.length });
      }
    }
    return result;
  });
</script>

{#if total > 0}
  <div class="flex items-center justify-between {cls}">
    <span class="text-xs opacity-50">{startItem}–{endItem} of {total}</span>
    {#if totalPages > 1}
      <div class="join">
        <button class="join-item btn btn-xs" disabled={currentPage === 1} onclick={() => onPage(1)}><ChevronFirst class="size-3" /></button>
        <button class="join-item btn btn-xs" disabled={currentPage === 1} onclick={() => onPage(currentPage - 1)}><ChevronLeft class="size-3" /></button>
        {#each pages as p}
          {#if p.type === 'ellipsis'}
            <button class="join-item btn btn-xs btn-disabled">…</button>
          {:else}
            <button class="join-item btn btn-xs {p.value === currentPage ? 'btn-active' : ''}" onclick={() => onPage(p.value)}>{p.value}</button>
          {/if}
        {/each}
        <button class="join-item btn btn-xs" disabled={currentPage === totalPages} onclick={() => onPage(currentPage + 1)}><ChevronRight class="size-3" /></button>
        <button class="join-item btn btn-xs" disabled={currentPage === totalPages} onclick={() => onPage(totalPages)}><ChevronLast class="size-3" /></button>
      </div>
    {/if}
  </div>
{/if}
