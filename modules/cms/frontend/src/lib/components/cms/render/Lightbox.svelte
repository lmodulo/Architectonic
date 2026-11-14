<script lang="ts">
  // Full-screen image viewer for galleries (hand-rolled: no library). A modal dialog with a fading
  // backdrop and scaled content. Esc closes; ← and → (or a swipe) move between images; Tab stays
  // inside; the page behind doesn't scroll; the neighbouring images are preloaded. The opener gets
  // focus back (the gallery handles that in `onclose`).
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { tick } from 'svelte';
  import { X, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { ms } from '$lib/cms/motion';

  let { images, index = $bindable(), onclose }: {
    images: { url: string; alt: string; caption?: string; w?: number; h?: number }[];
    /** the open image, or null when closed */
    index: number | null;
    onclose: () => void;
  } = $props();

  let dialog: HTMLElement | undefined = $state();
  let closeButton: HTMLButtonElement | undefined = $state();
  const count = $derived(images.length);
  const current = $derived(index !== null ? images[index] : undefined);

  const go = (d: 1 | -1) => { if (index !== null && count > 1) index = (index + d + count) % count; };

  $effect(() => {
    if (index === null) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    tick().then(() => closeButton?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onclose(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  });

  // Preload the neighbours so moving on is instant
  $effect(() => {
    if (index === null || count < 2) return;
    for (const d of [1, -1]) new Image().src = images[(index + d + count) % count].url;
  });

  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !dialog) return;
    const f = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled])')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  // Swipe with any pointer (touch, pen, mouse drag)
  let startX: number | null = null;
  let startY = 0;
  let swiped = false;
  function onPointerDown(e: PointerEvent) { startX = e.clientX; startY = e.clientY; swiped = false; }
  function onPointerUp(e: PointerEvent) {
    if (startX === null) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(dx < 0 ? 1 : -1); }
  }
  // A click on the dark area (not on the image or a control) closes; the click ending a mouse swipe doesn't
  function onBackdropClick(e: MouseEvent) {
    if (swiped) { swiped = false; return; }
    if (e.target === e.currentTarget) onclose();
  }
</script>

{#if index !== null && current}
  <div class="fixed inset-0 z-[70] bg-black/90" transition:fade={{ duration: ms(200) }} aria-hidden="true"></div>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={dialog}
    class="fixed inset-0 z-[71] flex flex-col text-white select-none touch-pan-y"
    role="dialog"
    aria-modal="true"
    aria-label="Image viewer"
    tabindex="-1"
    transition:scale={{ duration: ms(250), start: 0.95, easing: cubicOut }}
    onkeydown={trapFocus}
    onpointerdown={onPointerDown}
    onpointerup={onPointerUp}
    onclick={onBackdropClick}
  >
    <div class="flex items-center justify-between gap-4 p-3 shrink-0">
      <span class="text-sm tabular-nums opacity-80" aria-live="polite">{index + 1} / {count}</span>
      <button bind:this={closeButton} type="button" class="btn btn-ghost btn-circle text-white hover:bg-white/10" aria-label="Close" onclick={onclose}>
        <X class="size-6" />
      </button>
    </div>

    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="relative flex-1 min-h-0 grid place-items-center px-2 sm:px-16" onclick={onBackdropClick}>
      <!-- Cross-fade: the outgoing image fades out on top of the incoming one (grid stacking) -->
      {#key index}
        <figure class="col-start-1 row-start-1 max-h-full max-w-full flex flex-col items-center gap-3" transition:fade={{ duration: ms(180) }}>
          <img
            src={current.url}
            alt={current.alt}
            width={current.w}
            height={current.h}
            class="max-h-[calc(100dvh-9rem)] max-w-full w-auto h-auto object-contain rounded"
            draggable="false"
          />
          {#if current.caption}
            <figcaption class="text-sm opacity-85 text-center max-w-2xl px-2">{current.caption}</figcaption>
          {/if}
        </figure>
      {/key}

      {#if count > 1}
        <button type="button" class="btn btn-circle absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 bg-black/50 border-0 text-white hover:bg-black/70" aria-label="Previous image" onclick={() => go(-1)}>
          <ChevronLeft class="size-6" />
        </button>
        <button type="button" class="btn btn-circle absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 bg-black/50 border-0 text-white hover:bg-black/70" aria-label="Next image" onclick={() => go(1)}>
          <ChevronRight class="size-6" />
        </button>
      {/if}
    </div>
    <div class="h-4 shrink-0"></div>
  </div>
{/if}
