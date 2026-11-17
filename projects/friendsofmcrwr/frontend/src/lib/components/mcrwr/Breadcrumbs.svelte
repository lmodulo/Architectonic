<script lang="ts">
  // Home › section › … › this page. Long titles are cut short with an ellipsis (full title on hover); a long
  // trail wraps onto more lines rather than scrolling.
  import { ChevronRight } from 'lucide-svelte';
  import type { PageView } from '$lib/cms/types';

  let { crumbs, tone = 'dark' }: { crumbs: PageView['breadcrumbs']; tone?: 'dark' | 'light' } = $props();

  const linkClass = $derived(tone === 'light' ? 'text-white/85 hover:text-white' : 'opacity-75 hover:opacity-100');
</script>

<nav aria-label="Breadcrumb">
  <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm {tone === 'light' ? 'text-white' : ''}">
    <li class="inline-flex items-center">
      <a href="/" class="{linkClass} underline-offset-4 hover:underline transition-colors">Home</a>
    </li>
    {#each crumbs as crumb, i (crumb.id)}
      {@const last = i === crumbs.length - 1}
      <li class="inline-flex items-center gap-1.5 min-w-0">
        <ChevronRight class="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
        {#if last || !crumb.path}
          <span class="truncate max-w-[16rem] {last ? 'font-medium' : 'opacity-75'}" title={crumb.title} aria-current={last ? 'page' : undefined}>{crumb.title}</span>
        {:else}
          <a href={crumb.path} class="truncate max-w-[12rem] {linkClass} underline-offset-4 hover:underline transition-colors" title={crumb.title}>{crumb.title}</a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
