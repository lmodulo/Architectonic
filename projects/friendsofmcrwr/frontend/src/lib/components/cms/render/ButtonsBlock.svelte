<script lang="ts">
  // A row of call-to-action buttons. Buttons whose link isn't public (an unpublished page) are left out.
  import { isExternal, linkHref } from '$lib/cms/links';
  import type { ButtonsData } from '$lib/cms/types';

  let { data, links }: { data: ButtonsData; links: Record<string, string> } = $props();

  const items = $derived(
    data.items.flatMap(item => {
      const href = linkHref(item.link, links);
      return href ? [{ ...item, href }] : [];
    }),
  );
  const justify = $derived({ left: 'justify-start', center: 'justify-center', right: 'justify-end' }[data.align] ?? 'justify-start');
</script>

{#if items.length}
  <div class="flex flex-wrap gap-3 {justify}">
    {#each items as item}
      <a
        href={item.href}
        class="btn {item.style === 'outline' ? 'btn-outline btn-primary' : 'btn-primary'}"
        target={isExternal(item.href) ? '_blank' : undefined}
        rel={isExternal(item.href) ? 'noopener noreferrer' : undefined}
      >{item.label}</a>
    {/each}
  </div>
{/if}
