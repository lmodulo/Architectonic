<script lang="ts">
  // The page builder canvas: the page title (unless a hero comes first, as on the public page), the
  // block stack with a "+" inserter between blocks, drag to reorder, and an undo for deletes.
  import { tick } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { duplicateBlock, newBlock, type BlockAction, type PageLink } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import BlockCard from './BlockCard.svelte';
  import BlockInserter from './BlockInserter.svelte';
  import type { Block, BlockType, CmsNode } from '$lib/cms/types';

  let { blocks = $bindable(), activeId = $bindable(), readonly, nodes, links, pagePaths, toolbarTop, pageTitle }: {
    blocks: Block[];
    activeId: string | null;
    readonly: boolean;
    nodes: CmsNode[];
    links: Record<string, string>;
    pagePaths: PageLink[];
    toolbarTop: string;
    pageTitle: string;
  } = $props();

  const heroFirst = $derived(blocks[0]?.type === 'hero');
  let dragId = $state<string | null>(null);
  let drop = $state<{ id: string; zone: 'before' | 'after' } | null>(null);
  let undo = $state<{ block: Block; index: number } | null>(null);
  let undoTimer: ReturnType<typeof setTimeout> | undefined;
  let announcement = $state('');

  async function focusBlock(id: string) {
    await tick();
    const card = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    // Text blocks: put the caret in the editor; other blocks: the first field of their settings
    await tick();
    const target = card?.querySelector<HTMLElement>('[contenteditable="true"]') ?? card?.querySelector<HTMLElement>('input, textarea, select');
    target?.focus();
  }

  function insert(type: BlockType, at: number) {
    const b = newBlock(type);
    blocks.splice(at, 0, b);
    activeId = b.id;
    announcement = `Added a block at position ${at + 1}.`;
    focusBlock(b.id);
  }

  function act(i: number, action: BlockAction) {
    const b = blocks[i];
    if (action === 'up' && i > 0) { blocks.splice(i - 1, 0, blocks.splice(i, 1)[0]); announcement = `Moved to position ${i}.`; }
    if (action === 'down' && i < blocks.length - 1) { blocks.splice(i + 1, 0, blocks.splice(i, 1)[0]); announcement = `Moved to position ${i + 2}.`; }
    if (action === 'duplicate') {
      const copy = duplicateBlock(b);
      blocks.splice(i + 1, 0, copy);
      activeId = copy.id;
      announcement = 'Block duplicated.';
    }
    if (action === 'remove') {
      const [removed] = blocks.splice(i, 1);
      if (activeId === removed.id) activeId = null;
      undo = { block: $state.snapshot(removed) as Block, index: i };
      clearTimeout(undoTimer);
      undoTimer = setTimeout(() => (undo = null), 8000);
      announcement = 'Block deleted.';
    }
    // Keep focus on the moved block's toolbar
    if (action === 'up' || action === 'down') tick().then(() => document.querySelector<HTMLElement>(`[data-block-id="${b.id}"] [aria-label="${action === 'up' ? 'Move up' : 'Move down'}"]`)?.focus());
  }

  function restore() {
    if (!undo) return;
    blocks.splice(Math.min(undo.index, blocks.length), 0, undo.block);
    activeId = undo.block.id;
    undo = null;
    clearTimeout(undoTimer);
    announcement = 'Block restored.';
  }

  // ── Drag and drop (by the grip in each block's toolbar) ─────────────────────────────────
  const DRAG_TYPE = 'application/x-cms-block';

  function onDragStart(e: DragEvent, id: string, card: HTMLElement) {
    if (!e.dataTransfer) return;
    dragId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_TYPE, id);
    e.dataTransfer.setDragImage(card, 24, 24);
  }
  function onDragOver(e: DragEvent, id: string, card: HTMLElement) {
    if (!dragId || !e.dataTransfer?.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const r = card.getBoundingClientRect();
    const zone = e.clientY < r.top + r.height / 2 ? 'before' : 'after';
    if (drop?.id !== id || drop.zone !== zone) drop = id === dragId ? null : { id, zone };
  }
  function onDrop(e: DragEvent) {
    if (!dragId) return;
    e.preventDefault();
    const from = blocks.findIndex(b => b.id === dragId);
    if (drop && from >= 0) {
      const [moved] = blocks.splice(from, 1);
      const target = blocks.findIndex(b => b.id === drop!.id);
      const to = drop.zone === 'before' ? target : target + 1;
      blocks.splice(to, 0, moved);
      announcement = `Moved to position ${to + 1}.`;
    }
    dragId = null;
    drop = null;
  }
  function onDragEnd() {
    dragId = null;
    drop = null;
  }
</script>

<div class="cms-canvas rounded-box border border-base-300 bg-base-100 pt-4 pb-2">
  {#if !heroFirst}
    <div class="w-full max-w-3xl mx-auto px-4 pt-6 pb-2" transition:slide={{ duration: ms(200) }}>
      <h2 class="text-4xl font-bold tracking-tight leading-tight text-balance" title="The page title comes from the item's title in the site tree">{pageTitle}</h2>
    </div>
  {/if}

  {#if !readonly}
    <BlockInserter onpick={t => insert(t, 0)} label="Add a block at the top" />
  {:else}
    <div class="h-6"></div>
  {/if}

  {#each blocks as block, i (block.id)}
    <div animate:flip={{ duration: ms(200) }} transition:slide={{ duration: ms(200) }}>
      <BlockCard
        bind:block={blocks[i]}
        index={i}
        total={blocks.length}
        active={activeId === block.id}
        {readonly}
        {nodes}
        {links}
        {pagePaths}
        {toolbarTop}
        dropZone={drop?.id === block.id ? drop.zone : null}
        dragging={dragId === block.id}
        onselect={() => (activeId = block.id)}
        onaction={a => act(i, a)}
        ondragstart={(e, card) => onDragStart(e, block.id, card)}
        ondragend={onDragEnd}
        ondragover={(e, card) => onDragOver(e, block.id, card)}
        ondrop={onDrop}
      />
      {#if !readonly && i < blocks.length - 1}
        <BlockInserter onpick={t => insert(t, i + 1)} />
      {:else}
        <div class="h-10"></div>
      {/if}
    </div>
  {/each}

  {#if blocks.length === 0}
    <p class="text-center text-sm opacity-60 py-6" transition:slide={{ duration: ms(200) }}>
      {readonly ? 'This page has no content yet.' : 'This page is empty. Add a block to start.'}
    </p>
  {/if}

  {#if !readonly}
    <BlockInserter prominent onpick={t => insert(t, blocks.length)} />
  {/if}

  {#if undo}
    <div class="mx-4 mb-2 alert text-sm py-2" role="status" transition:fade={{ duration: ms(150) }}>
      <span class="flex-1">Block deleted.</span>
      <button type="button" class="btn btn-sm btn-ghost" onclick={restore}>Undo</button>
    </div>
  {/if}

  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
