<script lang="ts">
  // A grid of Vault images (or CSS columns for natural aspect ratios). Each tile is a button that
  // opens the lightbox; images the page's media map doesn't have (deleted, admin-only…) are left out.
  import Lightbox from './Lightbox.svelte';
  import type { GalleryData, MediaMap } from '$lib/cms/types';

  let { data, media = {} }: { data: GalleryData; media?: MediaMap } = $props();

  const images = $derived(
    data.images.flatMap(im => {
      const url = media[im.vaultId]?.url;
      return url ? [{ url, alt: im.alt, caption: im.caption, w: im.w, h: im.h }] : [];
    }),
  );

  // Phones show at most two columns, small screens three
  const GRID: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
  };
  const COLUMNS: Record<number, string> = {
    2: 'columns-2',
    3: 'columns-2 sm:columns-3',
    4: 'columns-2 sm:columns-3 md:columns-4',
    5: 'columns-2 sm:columns-3 md:columns-5',
    6: 'columns-2 sm:columns-3 md:columns-6',
  };
  const GAP = { sm: 'gap-1.5', md: 'gap-3', lg: 'gap-5' } as const;
  const SPACE = { sm: 'mb-1.5', md: 'mb-3', lg: 'mb-5' } as const;
  const natural = $derived(data.aspect === 'natural');
  const ratio = $derived(data.aspect === '4:3' ? 'aspect-[4/3]' : 'aspect-square');

  let open = $state<number | null>(null);
  let opener: HTMLElement | null = null;

  function show(i: number, e: MouseEvent) {
    opener = e.currentTarget as HTMLElement;
    open = i;
  }
  function close() {
    open = null;
    opener?.focus();
  }
  const label = (i: number, alt: string) => `Open image ${i + 1} of ${images.length}${alt ? `: ${alt}` : ''}`;
</script>

{#if images.length}
  {#if natural}
    <ul class="cms-gallery {COLUMNS[data.columns] ?? COLUMNS[3]} {GAP[data.gap] ?? GAP.md}">
      {#each images as im, i (i)}
        <li class="break-inside-avoid {SPACE[data.gap] ?? SPACE.md}">
          <button type="button" class="block w-full overflow-hidden rounded-box focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={label(i, im.alt)} onclick={e => show(i, e)}>
            <img src={im.url} alt={im.alt} width={im.w} height={im.h} loading="lazy" decoding="async" class="block w-full h-auto transition-transform duration-300 hover:scale-[1.03]" />
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <ul class="cms-gallery grid {GRID[data.columns] ?? GRID[3]} {GAP[data.gap] ?? GAP.md}">
      {#each images as im, i (i)}
        <li>
          <button type="button" class="block w-full overflow-hidden rounded-box focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={label(i, im.alt)} onclick={e => show(i, e)}>
            <img src={im.url} alt={im.alt} width={im.w} height={im.h} loading="lazy" decoding="async" class="block w-full h-auto {ratio} object-cover transition-transform duration-300 hover:scale-[1.03]" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <Lightbox {images} bind:index={open} onclose={close} />
{/if}
