<script lang="ts">
  type Crumb = { label: string; href?: string; colorClass?: string };
  let { crumbs }: { crumbs: Crumb[] } = $props();
</script>

<nav aria-label="Breadcrumb" class="flex items-center gap-1 text-xs">
  {#each crumbs as crumb, i}
    {#if i > 0}
      <span class="opacity-30 select-none">›</span>
    {/if}
    {#if i === crumbs.length - 1}
      <span class="badge badge-sm {crumb.colorClass ?? 'badge-ghost'}">{crumb.label}</span>
    {:else if crumb.href}
      <a href={crumb.href} class="badge badge-sm opacity-50 hover:opacity-100 transition-opacity {crumb.colorClass ?? 'badge-ghost'}">{crumb.label}</a>
    {:else}
      <span class="badge badge-sm opacity-50 {crumb.colorClass ?? 'badge-ghost'}">{crumb.label}</span>
    {/if}
  {/each}
</nav>
