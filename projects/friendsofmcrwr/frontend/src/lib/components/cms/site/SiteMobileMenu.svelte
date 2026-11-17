<script lang="ts">
  // Mobile menu: a drawer from the left with the whole tree as a nested accordion. The active
  // trail starts expanded. Esc or the backdrop closes it; focus stays inside while it's open and
  // returns to the menu button afterwards; the page behind doesn't scroll.
  import { X, ChevronDown } from 'lucide-svelte';
  import { fade, slide } from 'svelte/transition';
  import { tick } from 'svelte';
  import { isExternal } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import type { MenuItem } from '$lib/cms/types';
  import type { Snippet } from 'svelte';

  let { open, items, trail, currentId, onclose, brand, breakpoint = 'lg' }: {
    open: boolean;
    items: MenuItem[];
    trail: Set<string>;
    currentId: string | null;
    onclose: () => void;
    brand: Snippet;
    /**
     * 'lg': the drawer is for small screens only; it's hidden, and closes itself, from the lg breakpoint up
     * (where SiteMenu's row takes over). null: usable at any width, for a shell that switches to the drawer
     * whenever its menu row doesn't fit.
     */
    breakpoint?: 'lg' | null;
  } = $props();

  const smallOnly = $derived(breakpoint === 'lg' ? 'lg:hidden' : '');

  let expanded = $state<Record<string, boolean>>({});
  let panel: HTMLElement | undefined = $state();
  let closeButton: HTMLButtonElement | undefined = $state();

  $effect(() => {
    if (!open) return;
    // Expand the branch that contains the current page
    expanded = Object.fromEntries([...trail].map(id => [id, true]));
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    tick().then(() => closeButton?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onclose(); } };
    const wide = window.matchMedia('(min-width: 1024px)');
    const onWide = () => { if (breakpoint === 'lg' && wide.matches) onclose(); };
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  });

  // Keep Tab inside the drawer
  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !panel) return;
    const focusables = [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  const toggle = (id: string) => (expanded[id] = !expanded[id]);
  const rowClass = (item: MenuItem) =>
    `flex-1 min-w-0 px-3 py-2.5 rounded-field text-left transition-colors hover:bg-base-200 ${trail.has(item.id) ? 'bg-base-200 font-semibold' : ''}`;
</script>

{#snippet tree(list: MenuItem[], depth: number)}
  <ul class="flex flex-col gap-0.5 {depth ? 'ml-4 pl-2 border-l border-base-300' : ''}">
    {#each list as item (item.id)}
      <li>
        <div class="flex items-center gap-1">
          {#if item.type === 'label'}
            <button type="button" class="{rowClass(item)} flex items-center justify-between" aria-expanded={!!expanded[item.id]} onclick={() => toggle(item.id)}>
              <span>{item.title}</span>
              <ChevronDown class="size-4 opacity-60 transition-transform duration-200 {expanded[item.id] ? 'rotate-180' : ''}" />
            </button>
          {:else}
            <a
              href={item.href}
              class={rowClass(item)}
              aria-current={item.id === currentId ? 'page' : undefined}
              target={item.newTab ? '_blank' : undefined}
              rel={item.newTab || (item.type === 'link' && isExternal(item.href)) ? 'noopener noreferrer' : undefined}
              onclick={onclose}
            >{item.title}</a>
            {#if item.children.length}
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square"
                aria-expanded={!!expanded[item.id]}
                aria-label="{item.title} submenu"
                onclick={() => toggle(item.id)}
              ><ChevronDown class="size-4 opacity-60 transition-transform duration-200 {expanded[item.id] ? 'rotate-180' : ''}" /></button>
            {/if}
          {/if}
        </div>
        {#if item.children.length && expanded[item.id]}
          <div transition:slide={{ duration: ms(200) }}>
            {@render tree(item.children, depth + 1)}
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-40 bg-black/50 {smallOnly}"
    aria-label="Close menu"
    tabindex="-1"
    onclick={onclose}
    transition:fade={{ duration: ms(200) }}
  ></button>
  <div
    class="fixed inset-y-0 left-0 z-50 overflow-hidden {smallOnly} shadow-2xl"
    transition:slide={{ axis: 'x', duration: ms(250) }}
  >
    <div
      bind:this={panel}
      id="cms-mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      tabindex="-1"
      class="w-80 max-w-[85vw] h-full flex flex-col bg-base-100"
      onkeydown={trapFocus}
    >
      <div class="flex items-center gap-2 px-4 h-16 border-b border-base-300 shrink-0">
        <div class="flex-1 min-w-0">{@render brand()}</div>
        <button bind:this={closeButton} type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Close menu" onclick={onclose}>
          <X class="size-5" />
        </button>
      </div>
      <nav aria-label="Main" class="flex-1 overflow-y-auto p-3">
        {@render tree(items, 0)}
      </nav>
    </div>
  </div>
{/if}
