<script lang="ts">
  // The photos and videos section of the event form (EventModal). The list and its uploads live in
  // EventMediaUploads ($lib/utils/eventMediaUploads.svelte.ts); nothing on the event changes until the form saves.
  import { flip } from 'svelte/animate';
  import { fade, scale, slide } from 'svelte/transition';
  import { ChevronLeft, ChevronRight, ImagePlus, Play, X } from 'lucide-svelte';
  import { MEDIA_ACCEPT, MAX_MEDIA, type EventMediaUploads } from '$lib/utils/eventMediaUploads.svelte';

  let { uploads }: { uploads: EventMediaUploads } = $props();

  let input = $state<HTMLInputElement | null>(null);
  let dragging = $state(false);

  function pick(e: Event & { currentTarget: HTMLInputElement }) {
    if (e.currentTarget.files) uploads.add(e.currentTarget.files);
    e.currentTarget.value = ''; // so the same file can be picked again after removing it
  }

  function drop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files.length) uploads.add(e.dataTransfer.files);
  }

  const label = (kind: 'image' | 'video') => (kind === 'video' ? 'video' : 'photo');
</script>

<div class="space-y-2">
  <p class="text-xs font-medium opacity-60 uppercase tracking-wide" id="ev-media-label">Photos &amp; videos</p>

  <div
    role="group"
    aria-labelledby="ev-media-label"
    aria-describedby="ev-media-hint"
    class="rounded-box border border-dashed p-2 transition-colors {dragging ? 'border-primary bg-primary/5' : 'border-base-300'}"
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) dragging = false; }}
    ondrop={drop}
  >
    <ul class="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {#each uploads.entries as entry, i (entry.key)}
        {@const src = entry.item?.url ?? entry.preview}
        <li
          class="relative aspect-square overflow-hidden rounded-box bg-base-300"
          animate:flip={{ duration: 200 }}
          in:scale={{ duration: 200, start: 0.9 }}
          out:fade={{ duration: 150 }}
        >
          {#if src && entry.kind === 'video'}
            <video class="size-full object-cover bg-black" src="{src}#t=0.1" preload="metadata" muted playsinline tabindex="-1" aria-hidden="true"></video>
            <span class="absolute left-1.5 bottom-1.5 flex items-center justify-center size-6 rounded-full bg-black/60 text-white" aria-hidden="true">
              <Play class="size-3.5 fill-current" />
            </span>
          {:else if src}
            <img class="size-full object-cover" {src} alt="" />
          {/if}

          {#if entry.error}
            <div class="absolute inset-0 flex flex-col justify-end gap-1 p-2 bg-error text-error-content text-xs leading-snug" role="alert">
              <span class="font-medium truncate" title={entry.name}>{entry.name}</span>
              <span>{entry.error}</span>
            </div>
          {:else if !entry.item}
            <div class="absolute inset-x-0 bottom-0 p-1.5 bg-black/50" transition:fade={{ duration: 150 }}>
              <progress class="progress progress-primary w-full h-1.5 block" value={entry.progress} max="1"
                aria-label="Uploading {entry.name}"></progress>
            </div>
          {/if}

          <button
            type="button"
            class="btn btn-xs btn-circle absolute top-1.5 right-1.5 bg-black/60 border-0 text-white hover:bg-black/80"
            aria-label={entry.item || entry.error ? `Remove ${label(entry.kind)} ${i + 1}` : `Cancel uploading ${entry.name}`}
            onclick={() => uploads.remove(entry.key)}
          ><X class="size-3.5" /></button>

          <!-- Reorder: only the moves there's room for -->
          {#if entry.item && uploads.entries.length > 1}
            <div class="absolute right-1.5 bottom-1.5 flex gap-1">
              {#if i > 0}
                <button type="button" class="btn btn-xs btn-circle bg-black/60 border-0 text-white hover:bg-black/80"
                  aria-label="Move {label(entry.kind)} {i + 1} earlier"
                  onclick={() => uploads.move(entry.key, -1)}><ChevronLeft class="size-3.5" /></button>
              {/if}
              {#if i < uploads.entries.length - 1}
                <button type="button" class="btn btn-xs btn-circle bg-black/60 border-0 text-white hover:bg-black/80"
                  aria-label="Move {label(entry.kind)} {i + 1} later"
                  onclick={() => uploads.move(entry.key, 1)}><ChevronRight class="size-3.5" /></button>
              {/if}
            </div>
          {/if}
        </li>
      {/each}

      {#if !uploads.full}
        <li class="aspect-square" transition:fade={{ duration: 150 }}>
          <button
            type="button"
            class="size-full flex flex-col items-center justify-center gap-1 rounded-box border border-base-300 bg-base-100 hover:bg-base-300/60 transition-colors text-xs opacity-80 hover:opacity-100 p-2 text-center"
            onclick={() => input?.click()}
          >
            <ImagePlus class="size-6" />
            <span>Add photos or videos</span>
          </button>
        </li>
      {/if}
    </ul>

    <input bind:this={input} type="file" class="hidden" multiple accept={MEDIA_ACCEPT} onchange={pick} />
  </div>

  <p id="ev-media-hint" class="text-xs opacity-60">
    Photos (JPEG, PNG, WebP, GIF or AVIF, up to 20 MB) and MP4 videos (up to 250 MB), {MAX_MEDIA} at most. Drop files here
    or use Add. They're added to the event when you save.
  </p>
  {#if uploads.busy}
    <p class="text-xs opacity-60" transition:slide={{ duration: 150 }}>Uploading… Save is available when it's done.</p>
  {/if}
</div>
