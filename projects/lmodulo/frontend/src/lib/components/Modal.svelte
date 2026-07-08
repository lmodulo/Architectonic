<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Snippet } from 'svelte';

  let {
    size = 'md',
    label,
    z = 40,
    children,
  }: {
    size?: 'sm' | 'md' | 'lg';
    label: string;
    z?: number;
    children: Snippet;
  } = $props();

  const widths = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-2xl' };
</script>

<div
  transition:fade={{ duration: 200 }}
  class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  style="z-index: {z};"
  role="dialog"
  aria-modal="true"
  aria-label={label}
>
  <div
    transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
    class="modal-inner card bg-base-200 rounded-box w-full {widths[size]} mx-4 flex flex-col max-h-[90vh]"
    style="box-shadow: 0 0 80px rgba(0,0,0,0.45);"
  >
    {@render children()}
  </div>
</div>

<style>
  .modal-inner :global(header) {
    background-color: var(--color-base-200);
    color: var(--color-base-content);
    border-radius: var(--radius-box, 1rem) var(--radius-box, 1rem) 0 0;
    border-bottom-width: 0px;
  }
  .modal-inner :global(footer) {
    background-color: var(--color-base-200);
    color: var(--color-base-content);
    border-radius: 0 0 var(--radius-box, 1rem) var(--radius-box, 1rem);
    border-top-width: 0px;
  }
</style>
