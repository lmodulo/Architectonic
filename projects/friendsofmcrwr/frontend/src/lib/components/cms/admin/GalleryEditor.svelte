<script lang="ts">
  // Settings for a gallery block: its images (add from the picker, drag or arrow to reorder, alt text
  // and caption each, remove) and the layout (columns, shape, spacing). Missing images and missing
  // alt text are listed under the block (blockProblems).
  import { slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { ArrowLeft, ArrowRight, Trash2, Plus, GripVertical } from 'lucide-svelte';
  import { getMediaContext } from '$lib/cms/media.svelte';
  import { ms } from '$lib/cms/motion';
  import type { GalleryData } from '$lib/cms/types';

  let { data = $bindable(), readonly = false }: { data: GalleryData; readonly?: boolean } = $props();

  const media = getMediaContext();
  const uid = $props.id();
  const MAX = 100;
  const columns = [2, 3, 4, 5, 6] as const;
  const aspects = [{ v: 'square', l: 'Square' }, { v: '4:3', l: '4:3' }, { v: 'natural', l: 'As uploaded' }] as const;
  const gaps = [{ v: 'sm', l: 'Tight' }, { v: 'md', l: 'Normal' }, { v: 'lg', l: 'Wide' }] as const;

  async function add() {
    const picked = await media?.pick({ multiple: true, title: 'Add images to the gallery' });
    if (picked) data.images.push(...picked.slice(0, MAX - data.images.length));
  }
  function move(i: number, d: -1 | 1) {
    const [im] = data.images.splice(i, 1);
    data.images.splice(i + d, 0, im);
  }

  // Drag to reorder (by the grip): dropping on a tile puts the dragged image in its place
  let dragIndex = $state<number | null>(null);
  let overIndex = $state<number | null>(null);
  const DRAG_TYPE = 'application/x-cms-gallery-image';
  function onDragStart(e: DragEvent, i: number) {
    if (!e.dataTransfer) return;
    dragIndex = i;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_TYPE, String(i));
  }
  function onDragOver(e: DragEvent, i: number) {
    if (dragIndex === null || !e.dataTransfer?.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    overIndex = i;
  }
  function onDrop(e: DragEvent, i: number) {
    if (dragIndex === null) return;
    e.preventDefault();
    if (dragIndex !== i) {
      const [im] = data.images.splice(dragIndex, 1);
      data.images.splice(i, 0, im);
    }
    dragIndex = overIndex = null;
  }
</script>

<div class="flex flex-col gap-4">
  {#if data.images.length}
    <ul class="grid gap-3 sm:grid-cols-2">
      {#each data.images as im, i (im)}
        {@const url = media?.known[im.vaultId]?.url}
        <li
          class="rounded-box border bg-base-100 p-2.5 flex gap-3 transition-colors {overIndex === i && dragIndex !== i ? 'border-primary' : 'border-base-300'} {dragIndex === i ? 'opacity-40' : ''}"
          animate:flip={{ duration: ms(200) }}
          transition:slide={{ duration: ms(200) }}
          ondragover={e => onDragOver(e, i)}
          ondrop={e => onDrop(e, i)}
          data-gallery-index={i}
        >
          <div class="flex flex-col items-center gap-1 shrink-0">
            <img src={url ?? im.src} alt="" class="size-20 rounded-field object-cover bg-base-300 {url ? '' : 'opacity-40'}" />
            {#if !readonly}
              <div class="flex items-center">
                <span class="p-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100" draggable="true" role="presentation" title="Drag to move" ondragstart={e => onDragStart(e, i)} ondragend={() => (dragIndex = overIndex = null)}><GripVertical class="size-3.5" /></span>
                <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move image {i + 1} earlier" disabled={i === 0} onclick={() => move(i, -1)}><ArrowLeft class="size-3.5" /></button>
                <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move image {i + 1} later" disabled={i === data.images.length - 1} onclick={() => move(i, 1)}><ArrowRight class="size-3.5" /></button>
                <button type="button" class="btn btn-ghost btn-xs btn-square text-error" aria-label="Remove image {i + 1}" onclick={() => data.images.splice(i, 1)}><Trash2 class="size-3.5" /></button>
              </div>
            {/if}
          </div>
          <div class="flex-1 min-w-0 flex flex-col gap-2">
            {#if !url}<p class="text-xs text-warning">No longer available in Vault; not shown on the site.</p>{/if}
            <label class="flex flex-col gap-0.5" for="{uid}-alt-{i}">
              <span class="text-xs font-medium">Alt text</span>
              <input id="{uid}-alt-{i}" class="input input-xs w-full" bind:value={im.alt} maxlength="500" disabled={readonly} placeholder="Describe the image" />
            </label>
            <label class="flex flex-col gap-0.5" for="{uid}-cap-{i}">
              <span class="text-xs font-medium">Caption <span class="font-normal opacity-60">(in the viewer)</span></span>
              <input id="{uid}-cap-{i}" class="input input-xs w-full" value={im.caption ?? ''} maxlength="500" disabled={readonly} oninput={e => (im.caption = e.currentTarget.value || undefined)} />
            </label>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-sm opacity-60">No images yet.</p>
  {/if}

  <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
    {#if !readonly && media?.access.canPick}
      <button type="button" class="btn btn-sm btn-outline" disabled={data.images.length >= MAX} onclick={add}><Plus class="size-4" />Add images</button>
    {:else if !media?.access.canPick}
      <span class="text-xs opacity-60">{media?.access.reason ?? 'Install the Vault module to add images.'}</span>
    {/if}
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium" id="{uid}-cols">Columns</span>
      <div class="join" role="group" aria-labelledby="{uid}-cols">
        {#each columns as c (c)}
          <button type="button" class="btn btn-xs join-item {data.columns === c ? 'btn-neutral' : ''}" aria-pressed={data.columns === c} disabled={readonly} onclick={() => (data.columns = c)}>{c}</button>
        {/each}
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium" id="{uid}-aspect">Shape</span>
      <div class="join" role="group" aria-labelledby="{uid}-aspect">
        {#each aspects as a (a.v)}
          <button type="button" class="btn btn-xs join-item {data.aspect === a.v ? 'btn-neutral' : ''}" aria-pressed={data.aspect === a.v} disabled={readonly} onclick={() => (data.aspect = a.v)}>{a.l}</button>
        {/each}
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium" id="{uid}-gap">Spacing</span>
      <div class="join" role="group" aria-labelledby="{uid}-gap">
        {#each gaps as g (g.v)}
          <button type="button" class="btn btn-xs join-item {data.gap === g.v ? 'btn-neutral' : ''}" aria-pressed={data.gap === g.v} disabled={readonly} onclick={() => (data.gap = g.v)}>{g.l}</button>
        {/each}
      </div>
    </div>
  </div>
</div>
