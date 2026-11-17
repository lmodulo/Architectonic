<script lang="ts">
  // A photo slot. With `src` it shows the photo (cover-cropped); without it, a big-sky placeholder with a small
  // label saying which photo goes there. `fill` makes it cover its positioned parent instead of keeping `ratio`.
  // To use real photos on the landing page, put the files in static/images/ and set `src` there.
  import { Camera } from 'lucide-svelte';
  import Ridge from './Ridge.svelte';
  import type { Snippet } from 'svelte';

  let {
    src = '',
    alt,
    label = 'Landscape photo',
    sky = 'day',
    ratio,
    fill = false,
    decorative = false,
    eager = false,
    labelClass = 'bottom-3 right-3',
    class: cls = '',
    children,
  }: {
    src?: string;
    /** describes the photo; also the placeholder's accessible name */
    alt: string;
    /** what the placeholder asks for, e.g. "Columbia NWR, basalt cliffs" */
    label?: string;
    sky?: 'dawn' | 'day' | 'dusk' | 'storm' | 'sage';
    /** CSS aspect-ratio, e.g. '16/9' (ignored with `fill`) */
    ratio?: string;
    fill?: boolean;
    /** no label and no accessible name: the slot is background only */
    decorative?: boolean;
    /** above the fold: load the photo right away */
    eager?: boolean;
    /** where the placeholder label sits */
    labelClass?: string;
    class?: string;
    children?: Snippet;
  } = $props();

  const named = $derived(!src && !decorative);
</script>

<div
  class="mw-sky mw-sky--{sky} {fill ? 'absolute inset-0' : 'relative'} {cls}"
  style={!fill && ratio ? `aspect-ratio: ${ratio}` : undefined}
  role={named ? 'img' : undefined}
  aria-label={named ? alt : undefined}
>
  {#if src}
    <img {src} alt={decorative ? '' : alt} loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : undefined} decoding="async" class="absolute inset-0 -z-10 size-full object-cover" />
  {:else}
    <span class="mw-sky__clouds" aria-hidden="true"></span>
    <Ridge class="mw-sky__ridge" />
    {#if !decorative}
      <span class="mw-sky__label {labelClass}" aria-hidden="true">
        <Camera class="size-3.5" />{label}{ratio && !fill ? ` · ${ratio.replace('/', ':')}` : ''}
      </span>
    {/if}
  {/if}
  {@render children?.()}
</div>
