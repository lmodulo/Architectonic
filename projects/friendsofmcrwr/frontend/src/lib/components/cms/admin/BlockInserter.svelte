<script lang="ts">
  // The "+" between blocks (and the "Add block" button at the end): opens the block palette.
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { tick } from 'svelte';
  import { Plus, Type, RectangleHorizontal, MousePointerClick, SeparatorHorizontal, Puzzle, LayoutGrid } from 'lucide-svelte';
  import { blockComponents } from '$lib/cms/admin';
  import { getMediaContext } from '$lib/cms/media.svelte';
  import { ms } from '$lib/cms/motion';
  import type { BlockType } from '$lib/cms/types';

  let { onpick, prominent = false, label = 'Add a block here' }: {
    onpick: (type: BlockType) => void;
    /** the always-visible button at the end of the page */
    prominent?: boolean;
    label?: string;
  } = $props();

  // Galleries need Vault: without it (or without access) the entry stays, disabled, saying why
  const media = getMediaContext();
  const types: { type: BlockType; label: string; description: string; icon: typeof Plus; disabled?: boolean }[] = [
    { type: 'richText', label: 'Text', description: 'Paragraphs, headings, lists, quotes, links and images', icon: Type },
    { type: 'hero', label: 'Hero', description: 'A large banner heading with an optional button and image', icon: RectangleHorizontal },
    {
      type: 'gallery',
      label: 'Gallery',
      description: media?.access.canPick ? 'A grid of images that open full screen' : media?.access.reason ?? 'Install the Vault module to add images.',
      icon: LayoutGrid,
      disabled: !media?.access.canPick,
    },
    { type: 'buttons', label: 'Buttons', description: 'One or more call-to-action buttons', icon: MousePointerClick },
    { type: 'divider', label: 'Divider', description: 'A line or empty space between blocks', icon: SeparatorHorizontal },
    ...(blockComponents().length
      ? [{ type: 'component' as const, label: 'Component', description: 'A built-in feature, such as a sitemap', icon: Puzzle }]
      : []),
  ];

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let toggle: HTMLButtonElement | undefined = $state();
  let menu: HTMLElement | undefined = $state();

  async function show() {
    open = true;
    await tick();
    menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }
  function hide(refocus = true) {
    open = false;
    if (refocus) toggle?.focus();
  }
  function pick(type: BlockType) {
    open = false;
    onpick(type);
  }

  function onMenuKey(e: KeyboardEvent) {
    const items = [...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
    else if (e.key === 'Tab') hide(false);
  }

  $effect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root?.contains(e.target as Node)) hide(false); };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  });
</script>

<div bind:this={root} class="group/ins relative flex items-center justify-center {prominent ? 'py-4' : 'h-10'}">
  {#if prominent}
    <button
      bind:this={toggle}
      type="button"
      class="btn btn-sm btn-outline border-dashed"
      aria-haspopup="menu"
      aria-expanded={open}
      onclick={() => (open ? hide() : show())}
    ><Plus class="size-4" />Add block</button>
  {:else}
    <span
      class="absolute inset-x-4 top-1/2 h-px bg-primary/50 transition-opacity duration-150 {open ? 'opacity-100' : 'opacity-0 group-hover/ins:opacity-100 group-focus-within/ins:opacity-100'}"
      aria-hidden="true"
    ></span>
    <button
      bind:this={toggle}
      type="button"
      class="btn btn-circle btn-xs btn-primary relative transition-opacity duration-150 {open ? 'opacity-100' : 'opacity-0 group-hover/ins:opacity-100 focus-visible:opacity-100'}"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={label}
      title={label}
      onclick={() => (open ? hide() : show())}
    ><Plus class="size-3.5" /></button>
  {/if}

  {#if open}
    <div
      bind:this={menu}
      role="menu"
      tabindex="-1"
      aria-label="Block types"
      class="absolute top-full z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-1.5 shadow-xl origin-top"
      transition:scale={{ duration: ms(150), start: 0.95, easing: cubicOut }}
      onkeydown={onMenuKey}
    >
      {#each types as t (t.type)}
        <button
          type="button"
          role="menuitem"
          class="flex items-start gap-3 w-full text-left rounded-field px-2.5 py-2 hover:bg-base-200 focus:bg-base-200 outline-none aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          aria-disabled={t.disabled ? 'true' : undefined}
          onclick={() => { if (!t.disabled) pick(t.type); }}
        >
          <t.icon class="size-4 mt-0.5 shrink-0 opacity-70" />
          <span class="min-w-0">
            <span class="block text-sm font-medium">{t.label}</span>
            <span class="block text-xs opacity-60">{t.description}</span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>
