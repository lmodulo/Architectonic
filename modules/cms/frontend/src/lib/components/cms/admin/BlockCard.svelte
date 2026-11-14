<script lang="ts">
  // One block on the editor canvas. It renders with the public site's components (text is edited in
  // place); selecting it shows its settings underneath. The toolbar (drag, up, down, duplicate,
  // delete) appears on hover, on focus, and while the block is selected.
  import { slide } from 'svelte/transition';
  import { GripVertical, ArrowUp, ArrowDown, Copy, Trash2, CircleAlert, TriangleAlert } from 'lucide-svelte';
  import { BLOCK_LABELS, blockProblems, type BlockAction } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import HeroBlock from '../render/HeroBlock.svelte';
  import ButtonsBlock from '../render/ButtonsBlock.svelte';
  import DividerBlock from '../render/DividerBlock.svelte';
  import GalleryBlock from '../render/GalleryBlock.svelte';
  import GalleryEditor from './GalleryEditor.svelte';
  import { getMediaContext } from '$lib/cms/media.svelte';
  import RichTextEditor from './RichTextEditor.svelte';
  import HeroEditor from './HeroEditor.svelte';
  import ButtonsEditor from './ButtonsEditor.svelte';
  import ComponentEditor from './ComponentEditor.svelte';
  import ComponentPreview from './ComponentPreview.svelte';
  import type { Block, CmsNode } from '$lib/cms/types';

  let {
    block = $bindable(), index, total, active, readonly, nodes, links, pagePaths, toolbarTop,
    dropZone, dragging, onselect, onaction, ondragstart, ondragend, ondragover, ondrop,
  }: {
    block: Block;
    index: number;
    total: number;
    active: boolean;
    readonly: boolean;
    nodes: CmsNode[];
    /** nodeId → URL for every item, so the canvas shows links to drafts too */
    links: Record<string, string>;
    pagePaths: { path: string; title: string }[];
    toolbarTop: string;
    dropZone: 'before' | 'after' | null;
    dragging: boolean;
    onselect: () => void;
    onaction: (action: BlockAction) => void;
    ondragstart: (e: DragEvent, card: HTMLElement) => void;
    ondragend: () => void;
    ondragover: (e: DragEvent, card: HTMLElement) => void;
    ondrop: (e: DragEvent) => void;
  } = $props();

  let card: HTMLElement | undefined = $state();
  const label = $derived(BLOCK_LABELS[block.type]);
  const media = getMediaContext();
  // Images the editor can show: the page's resolved media plus anything picked since
  const known = $derived(media?.known ?? {});
  const problems = $derived(blockProblems(block, nodes, media?.known));
</script>

<!-- Selecting a block: a click anywhere on it, or focus entering it (keyboard), so the click handler
     needs no key handler of its own -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
<div
  bind:this={card}
  class="group relative rounded-box outline-offset-4 transition-[outline-color,opacity] duration-150
    outline {active ? 'outline-2 outline-primary' : 'outline-1 outline-transparent hover:outline-base-300'}
    {dragging ? 'opacity-40' : ''}"
  role="group"
  aria-label="{label} block, {index + 1} of {total}"
  data-block-id={block.id}
  onclick={onselect}
  onfocusin={onselect}
  ondragover={e => card && ondragover(e, card)}
  ondrop={ondrop}
>
  {#if dropZone}
    <span class="absolute inset-x-0 h-1 rounded-full bg-primary pointer-events-none z-20 {dropZone === 'before' ? '-top-5' : '-bottom-5'}" aria-hidden="true"></span>
  {/if}

  {#if !readonly}
    <div
      class="absolute -top-4 right-2 z-20 flex items-center gap-0.5 rounded-field border border-base-300 bg-base-100 px-1 py-0.5 shadow-sm transition-opacity duration-150
        {active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}"
      role="toolbar"
      aria-label="{label} block actions"
    >
      <span class="px-1 text-[10px] font-semibold uppercase tracking-widest opacity-50">{label}</span>
      <span
        class="p-1 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100"
        draggable="true"
        role="presentation"
        title="Drag to move"
        ondragstart={e => card && ondragstart(e, card)}
        ondragend={ondragend}
      ><GripVertical class="size-3.5" /></span>
      <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move up" title="Move up" disabled={index === 0} onclick={e => { e.stopPropagation(); onaction('up'); }}><ArrowUp class="size-3.5" /></button>
      <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move down" title="Move down" disabled={index === total - 1} onclick={e => { e.stopPropagation(); onaction('down'); }}><ArrowDown class="size-3.5" /></button>
      <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Duplicate" title="Duplicate" onclick={e => { e.stopPropagation(); onaction('duplicate'); }}><Copy class="size-3.5" /></button>
      <button type="button" class="btn btn-ghost btn-xs btn-square text-error" aria-label="Delete block" title="Delete" onclick={e => { e.stopPropagation(); onaction('remove'); }}><Trash2 class="size-3.5" /></button>
    </div>
  {/if}

  <!-- Same widths as the public page (BlockRenderer): heroes full width, the rest in a column -->
  {#if block.type === 'richText'}
    <div class="cms-block w-full max-w-3xl mx-auto px-4 py-2">
      <RichTextEditor doc={block.data.doc} onchange={d => { if (block.type === 'richText') block.data.doc = d; }} {active} {readonly} {pagePaths} {toolbarTop} />
    </div>
  {:else if block.type === 'hero'}
    <div class="cms-block overflow-hidden rounded-box" inert>
      <!-- Always an h2 here: the admin's page header holds the h1 -->
      <HeroBlock data={block.data} {links} media={known} heading="h2" />
    </div>
  {:else if block.type === 'buttons'}
    <div class="cms-block w-full max-w-3xl mx-auto px-4 py-2" inert>
      {#if block.data.items.length}
        <ButtonsBlock data={block.data} {links} />
      {:else}
        <p class="text-sm opacity-50">No buttons yet.</p>
      {/if}
    </div>
  {:else if block.type === 'divider'}
    <div class="cms-block w-full max-w-3xl mx-auto px-4 {block.data.style === 'space' ? 'rounded-box border border-dashed border-base-content/15' : ''}" inert>
      <DividerBlock data={block.data} />
    </div>
  {:else if block.type === 'component'}
    <div class="cms-block w-full max-w-5xl mx-auto px-4 py-2" inert>
      <ComponentPreview componentKey={block.data.key} props={block.data.props} />
    </div>
  {:else if block.type === 'gallery'}
    <div class="cms-block w-full max-w-5xl mx-auto px-4 py-2" inert>
      {#if block.data.images.some(im => known[im.vaultId])}
        <GalleryBlock data={block.data} media={known} />
      {:else}
        <p class="rounded-box border border-dashed border-base-300 p-6 text-sm text-center opacity-70">Gallery: no images yet.</p>
      {/if}
    </div>
  {/if}

  {#if problems.errors.length || problems.warnings.length}
    <ul class="mx-4 mt-2 flex flex-col gap-1 text-xs" transition:slide={{ duration: ms(200) }}>
      {#each problems.errors as p}<li class="flex items-start gap-1.5 text-error"><CircleAlert class="size-3.5 shrink-0 mt-px" />{p} It won't be saved until it's fixed.</li>{/each}
      {#each problems.warnings as p}<li class="flex items-start gap-1.5 text-warning"><TriangleAlert class="size-3.5 shrink-0 mt-px" />{p}</li>{/each}
    </ul>
  {/if}

  {#if active && !readonly && block.type !== 'richText'}
    <div class="mx-2 mt-4 mb-2 rounded-box border border-base-300 bg-base-200/50 p-4" transition:slide={{ duration: ms(200) }}>
      {#if block.type === 'hero'}
        <HeroEditor bind:data={block.data} {nodes} />
      {:else if block.type === 'buttons'}
        <ButtonsEditor bind:data={block.data} {nodes} />
      {:else if block.type === 'component'}
        <ComponentEditor bind:data={block.data} />
      {:else if block.type === 'gallery'}
        <GalleryEditor bind:data={block.data} />
      {:else if block.type === 'divider'}
        {@const d = block.data}
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium" id="{block.id}-style">Style</span>
            <div class="join" role="group" aria-labelledby="{block.id}-style">
              <button type="button" class="btn btn-xs join-item {d.style === 'line' ? 'btn-neutral' : ''}" aria-pressed={d.style === 'line'} onclick={() => (d.style = 'line')}>Line</button>
              <button type="button" class="btn btn-xs join-item {d.style === 'space' ? 'btn-neutral' : ''}" aria-pressed={d.style === 'space'} onclick={() => (d.style = 'space')}>Space</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium" id="{block.id}-size">Size</span>
            <div class="join" role="group" aria-labelledby="{block.id}-size">
              {#each [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] as [v, l] (v)}
                <button type="button" class="btn btn-xs join-item {d.size === v ? 'btn-neutral' : ''}" aria-pressed={d.size === v} onclick={() => (d.size = v as 'sm' | 'md' | 'lg')}>{l}</button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
