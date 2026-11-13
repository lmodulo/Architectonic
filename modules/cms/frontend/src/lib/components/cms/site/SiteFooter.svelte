<script lang="ts">
  // Footer from Content → Settings: links (unpublished pages already left out by the API) and text.
  import { isExternal, safeHref } from '$lib/cms/links';
  import type { SiteMenu } from '$lib/cms/types';
  import type { Snippet } from 'svelte';

  let { footer, brand }: { footer: SiteMenu['footer']; brand: Snippet } = $props();

  const links = $derived(footer.links.flatMap(l => {
    const href = safeHref(l.href);
    return href ? [{ ...l, href }] : [];
  }));
</script>

<footer class="border-t border-base-300 bg-base-200/60 mt-auto">
  <div class="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
    <div class="flex flex-col gap-3 max-w-md">
      {@render brand()}
      {#if footer.text}<p class="text-sm opacity-70 whitespace-pre-line">{footer.text}</p>{/if}
    </div>
    {#if links.length}
      <nav aria-label="Footer">
        <ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {#each links as link}
            <li>
              <a
                href={link.href}
                class="opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                target={link.newTab ? '_blank' : undefined}
                rel={link.newTab || isExternal(link.href) ? 'noopener noreferrer' : undefined}
              >{link.label}</a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
  </div>
</footer>
