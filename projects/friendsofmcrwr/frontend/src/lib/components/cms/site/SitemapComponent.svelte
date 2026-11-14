<script lang="ts">
  // Registry component `sitemap`: the published site as a nested list. Pages hidden from the menu
  // are left out unless the `includeHidden` prop is on. Labels show as group headings.
  import type { CmsComponentProps, SiteTreeItem } from '$lib/cms/types';

  let { props, data }: CmsComponentProps = $props();

  const includeHidden = $derived(props.includeHidden === true);
  const loaded = $derived(data as { items?: SiteTreeItem[]; unavailable?: boolean } | undefined);

  function visible(items: SiteTreeItem[]): SiteTreeItem[] {
    return items.filter(i => includeHidden || i.showInMenu);
  }
</script>

{#snippet list(items: SiteTreeItem[], depth: number)}
  <ul class="flex flex-col gap-1.5 {depth ? 'mt-1.5 ml-5 pl-3 border-l border-base-300' : ''}">
    {#each visible(items) as item (item.id)}
      <li>
        {#if item.type === 'label'}
          <span class="font-semibold">{item.title}</span>
        {:else}
          <a href={item.href} class="underline underline-offset-4 decoration-base-content/30 hover:decoration-base-content">{item.title}</a>
        {/if}
        {#if item.children.length}{@render list(item.children, depth + 1)}{/if}
      </li>
    {/each}
  </ul>
{/snippet}

{#if loaded?.unavailable || !loaded?.items}
  <p class="text-sm opacity-60">The sitemap is unavailable right now.</p>
{:else if visible(loaded.items).length === 0}
  <p class="text-sm opacity-60">No pages are published yet.</p>
{:else}
  <div class="text-base">{@render list(loaded.items, 0)}</div>
{/if}
