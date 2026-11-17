<script lang="ts">
  // An event's photos and MP4 videos as a grid. Videos play in place in the browser's own player; a photo opens
  // full-size in a viewer (a modal <dialog>, so it sits above any page chrome) that steps through all of them.
  // `compact` (a list of events in a block): a single row of small tiles, every tile opening the viewer, with "+N"
  // on the last when there are more.
  // Used by the Calendar page (EventCard) and the public website's events (EventsComponent), so it imports nothing
  // from other modules.
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { ChevronLeft, ChevronRight, Play, X } from 'lucide-svelte';
  import type { EventMedia } from '$lib/utils/calendarEvents';

  let { media, title, compact = false }: { media: EventMedia[]; title: string; compact?: boolean } = $props();

  const COMPACT_TILES = 4;
  const shown = $derived(compact ? media.slice(0, COMPACT_TILES) : media);
  const more = $derived(media.length - shown.length);

  let index = $state<number | null>(null);
  const current = $derived(index === null ? null : media[index] ?? null);
  /** The element that had focus before the viewer opened, to return to */
  let opener: HTMLElement | null = null;

  const noun = (m: EventMedia) => (m.kind === 'video' ? 'Video' : 'Photo');
  const describe = (i: number) => `${noun(media[i])} ${i + 1} of ${media.length}, ${title}`;

  function show(i: number) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    index = i;
  }

  function close() {
    index = null;
  }

  function step(by: number) {
    if (index === null || media.length < 2) return;
    index = (index + by + media.length) % media.length;
  }

  function keys(e: KeyboardEvent) {
    // A focused video keeps the arrow keys for seeking
    if (e.target instanceof HTMLVideoElement) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  }

  /**
   * Shows the dialog modally once it's in the page (which focuses its first button, Close). Removing it, after the
   * fade, takes it out of the top layer; only then can the page behind take focus back, as it's inert until then.
   */
  function modal(node: HTMLDialogElement) {
    node.showModal();
    return {
      destroy() {
        const back = opener;
        opener = null;
        setTimeout(() => back?.focus());
      },
    };
  }
</script>

{#if shown.length}
  <ul class="grid gap-2 {compact ? 'grid-cols-4 max-w-sm' : 'grid-cols-2 sm:grid-cols-3'}">
    {#each shown as m, i (m.id)}
      <li class="relative overflow-hidden rounded-box bg-base-300 {compact ? 'aspect-square' : 'aspect-[4/3]'}">
        {#if m.kind === 'video' && !compact}
          <!-- The browser's own player. #t=0.1 shows a first frame (iOS draws nothing until played otherwise).
               Uploaded clips come without caption files, so there's no <track> to give. -->
          <!-- svelte-ignore a11y_media_has_caption -->
          <video class="size-full object-contain bg-black" src="{m.url}#t=0.1" controls preload="metadata" playsinline
            aria-label={describe(i)}></video>
        {:else}
          {@const overflow = more > 0 && i === shown.length - 1}
          <button type="button" class="group block size-full cursor-zoom-in" aria-label="Open {describe(i).toLowerCase()}" onclick={() => show(i)}>
            {#if m.kind === 'video'}
              <video class="size-full object-cover bg-black" src="{m.url}#t=0.1" preload="metadata" muted playsinline
                tabindex="-1" aria-hidden="true"></video>
              {#if !overflow}
                <span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span class="flex items-center justify-center size-8 rounded-full bg-black/60 text-white"><Play class="size-4 fill-current" /></span>
                </span>
              {/if}
            {:else}
              <img class="size-full object-cover transition-transform duration-300 group-hover:scale-105" src={m.url} alt=""
                loading="lazy" decoding="async" />
            {/if}
            {#if overflow}
              <span class="absolute inset-0 flex items-center justify-center bg-black/55 text-white font-semibold" aria-hidden="true">+{more}</span>
            {/if}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

{#if current && index !== null}
  <dialog
    use:modal
    class="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none border-0 bg-black/90 text-white backdrop:bg-transparent overscroll-contain"
    aria-label={describe(index)}
    oncancel={(e) => { e.preventDefault(); close(); }}
    onkeydown={keys}
    transition:fade={{ duration: 200 }}
  >
    <div class="flex flex-col h-full">
      <header class="flex items-center justify-between gap-4 px-4 py-3 shrink-0">
        <p class="text-sm opacity-80 truncate">{title}{#if media.length > 1}<span class="opacity-70">{` · ${index + 1} / ${media.length}`}</span>{/if}</p>
        <button type="button" class="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" aria-label="Close" onclick={close}>
          <X class="size-5" />
        </button>
      </header>

      <div class="relative flex-1 min-h-0 flex items-center justify-center px-2 pb-4 sm:px-16">
        {#key index}
          <div class="size-full flex items-center justify-center" in:scale={{ duration: 200, start: 0.97, easing: cubicOut }}>
            {#if current.kind === 'video'}
              <!-- svelte-ignore a11y_media_has_caption -->
              <video class="max-w-full max-h-full" src={current.url} controls autoplay playsinline aria-label={describe(index)}></video>
            {:else}
              <img class="max-w-full max-h-full object-contain" src={current.url} alt={describe(index)} />
            {/if}
          </div>
        {/key}

        {#if media.length > 1}
          <button type="button" class="btn btn-circle absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 border-0 text-white hover:bg-black/80"
            aria-label="Previous" onclick={() => step(-1)}><ChevronLeft class="size-6" /></button>
          <button type="button" class="btn btn-circle absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 border-0 text-white hover:bg-black/80"
            aria-label="Next" onclick={() => step(1)}><ChevronRight class="size-6" /></button>
        {/if}
      </div>
    </div>
  </dialog>
{/if}
