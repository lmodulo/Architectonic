<script lang="ts">
  // Desktop menu: top-level items in a row; items with children drop down (level 2), deeper levels
  // fly out to the side (SiteMenuItem). Pages with children are a link plus a chevron toggle; labels
  // are a single toggle. Opens on hover (mouse), click, or ArrowDown; Esc or ArrowLeft closes and
  // returns focus; ArrowLeft/Right move along the top row; clicking outside or tabbing away closes.
  import { ChevronDown } from 'lucide-svelte';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { afterNavigate } from '$app/navigation';
  import { isExternal } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import { focusFirstRow, submenuKeydown } from '$lib/cms/menuKeys';
  import SiteMenuItem from './SiteMenuItem.svelte';
  import type { MenuItem } from '$lib/cms/types';

  let { items, trail, currentId, class: navClass = 'hidden lg:block' }: {
    items: MenuItem[];
    trail: Set<string>;
    currentId: string | null;
    /** Classes for the <nav>; the default shows the row from the lg breakpoint (the drawer serves below it) */
    class?: string;
  } = $props();

  let openId = $state<string | null>(null);
  let nav: HTMLElement;
  const toggles: Record<string, HTMLButtonElement> = {};
  const lis: Record<string, HTMLLIElement> = {};
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  // A mouse click usually lands right after the hover that opened the menu; that click should
  // keep it open, not toggle it shut. The next click closes it.
  let openedByHover = false;

  afterNavigate(() => { openId = null; });

  function show(id: string) { clearTimeout(closeTimer); openId = id; }
  function hide(refocus = false) {
    const id = openId;
    openId = null;
    if (refocus && id) toggles[id]?.focus();
  }
  function toggle(id: string) {
    if (openId === id && !openedByHover) hide();
    else show(id);
    openedByHover = false;
  }

  // Mouse hover opens; a short delay lets the pointer cross into the dropdown
  const enter = (e: PointerEvent, item: MenuItem) => {
    if (e.pointerType !== 'mouse' || !item.children.length) return;
    if (openId !== item.id) openedByHover = true;
    show(item.id);
  };
  const leave = (e: PointerEvent) => { if (e.pointerType === 'mouse') closeTimer = setTimeout(() => (openId = null), 180); };

  $effect(() => {
    if (!openId) return;
    const onDown = (e: PointerEvent) => { if (!nav.contains(e.target as Node)) openId = null; };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  });

  function onFocusOut(e: FocusEvent) {
    if (!nav.contains(e.relatedTarget as Node | null)) openId = null;
  }

  // Top row: ArrowLeft/Right between items, ArrowDown opens an item's dropdown and focuses it
  function onTopKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (!target.hasAttribute('data-top')) return;
    const tops = [...nav.querySelectorAll<HTMLElement>('[data-top]')];
    const i = tops.indexOf(target);
    const id = target.closest<HTMLElement>('[data-item]')?.dataset.item;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      tops[(i + (e.key === 'ArrowRight' ? 1 : -1) + tops.length) % tops.length]?.focus();
    } else if (e.key === 'ArrowDown' && id && items.find(it => it.id === id)?.children.length) {
      e.preventDefault();
      show(id);
      void focusFirstRow(lis[id]);
    } else if (e.key === 'Escape' && openId) {
      e.preventDefault();
      hide(true);
    }
  }

  // The active trail gets a background pill rather than a colour: `text-primary` is too dark to
  // read on several dark DaisyUI themes (e.g. business)
  const topClass = (item: MenuItem) =>
    `px-3 py-2 rounded-field text-sm font-medium transition-colors hover:bg-base-200 focus-visible:bg-base-200 outline-none ${trail.has(item.id) ? 'bg-base-200 font-semibold' : ''}`;
</script>

<nav bind:this={nav} aria-label="Main" class={navClass} onfocusout={onFocusOut}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions (keydown is delegated from the focusable links and buttons inside) -->
  <ul class="flex items-center gap-1" onkeydown={onTopKeydown}>
    {#each items as item (item.id)}
      <li
        bind:this={lis[item.id]}
        data-item={item.id}
        class="relative"
        onpointerenter={(e) => enter(e, item)}
        onpointerleave={leave}
      >
        {#if item.children.length === 0}
          <a
            href={item.href}
            data-top
            class={topClass(item)}
            aria-current={item.id === currentId ? 'page' : undefined}
            target={item.newTab ? '_blank' : undefined}
            rel={item.newTab || (item.type === 'link' && isExternal(item.href)) ? 'noopener noreferrer' : undefined}
          >{item.title}</a>
        {:else}
          <div class="flex items-center">
            {#if item.type !== 'label'}
              <a
                href={item.href}
                data-top
                class="{topClass(item)} pr-1"
                aria-current={item.id === currentId ? 'page' : undefined}
              >{item.title}</a>
            {/if}
            <button
              type="button"
              data-top
              class="{item.type === 'label' ? topClass(item) : 'btn btn-ghost btn-xs btn-square'} inline-flex items-center gap-1"
              aria-expanded={openId === item.id}
              aria-haspopup="true"
              aria-label={item.type === 'label' ? undefined : `${item.title} submenu`}
              onclick={() => toggle(item.id)}
              bind:this={toggles[item.id]}
            >
              {#if item.type === 'label'}{item.title}{/if}
              <ChevronDown class="size-4 opacity-60 transition-transform duration-200 {openId === item.id ? 'rotate-180' : ''}" />
            </button>
          </div>

          {#if openId === item.id}
            <div
              class="absolute left-0 top-full pt-2 z-40 origin-top-left"
              transition:scale={{ start: 0.95, duration: ms(150), easing: cubicOut }}
            >
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions (keydown is delegated from the focusable links and buttons inside) -->
              <ul
                class="w-60 p-2 flex flex-col gap-0.5 bg-base-100 border border-base-300 rounded-box shadow-xl"
                onkeydown={(e) => submenuKeydown(e, e.currentTarget, () => hide(true))}
              >
                {#each item.children as child (child.id)}
                  <SiteMenuItem item={child} {trail} {currentId} />
                {/each}
              </ul>
            </div>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
</nav>
