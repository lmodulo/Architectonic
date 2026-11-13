<script lang="ts">
  // One row inside a desktop dropdown. Rows with children open a flyout to the side (to the left
  // when there's no room on the right), which recurses for any depth.
  import { ChevronRight } from 'lucide-svelte';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { isExternal } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import { submenuKeydown } from '$lib/cms/menuKeys';
  import type { MenuItem } from '$lib/cms/types';
  import Self from './SiteMenuItem.svelte';

  let { item, trail, currentId }: { item: MenuItem; trail: Set<string>; currentId: string | null } = $props();

  let open = $state(false);
  let flipLeft = $state(false);
  let li: HTMLLIElement;
  let toggle: HTMLButtonElement | undefined = $state();
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let openedByHover = false;   // see SiteMenu: the click after a hover keeps the flyout open

  const hasChildren = $derived(item.children.length > 0);
  const onTrail = $derived(trail.has(item.id));
  const external = $derived(item.type === 'link' && isExternal(item.href));
  const rowClass = $derived(`flex-1 min-w-0 px-3 py-2 rounded-field text-sm text-left transition-colors hover:bg-base-200 focus-visible:bg-base-200 outline-none ${onTrail ? 'bg-base-200 font-semibold' : ''}`);

  function show() {
    clearTimeout(closeTimer);
    if (!li) return;
    flipLeft = li.getBoundingClientRect().right + 248 > window.innerWidth;
    open = true;
  }
  function hide(refocus = false) {
    open = false;
    if (refocus) toggle?.focus();
  }
  const enter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !hasChildren) return;
    if (!open) openedByHover = true;
    show();
  };
  function toggleOpen() {
    if (open && !openedByHover) hide();
    else show();
    openedByHover = false;
  }
  const leave = (e: PointerEvent) => { if (e.pointerType === 'mouse') closeTimer = setTimeout(() => (open = false), 150); };
</script>

<li bind:this={li} class="relative" onpointerenter={enter} onpointerleave={leave}>
  <div class="flex items-center gap-0.5">
    {#if item.type === 'label'}
      <button
        type="button"
        data-menu-row
        data-menu-toggle
        class="{rowClass} flex items-center justify-between gap-2"
        aria-expanded={open}
        aria-haspopup="true"
        onclick={toggleOpen}
        bind:this={toggle}
      >
        <span class="truncate">{item.title}</span>
        <ChevronRight class="size-4 shrink-0 opacity-60" />
      </button>
    {:else}
      <a
        href={item.href}
        data-menu-row
        class={rowClass}
        aria-current={item.id === currentId ? 'page' : undefined}
        target={item.newTab ? '_blank' : undefined}
        rel={item.newTab || external ? 'noopener noreferrer' : undefined}
      >{item.title}</a>
      {#if hasChildren}
        <button
          type="button"
          data-menu-toggle
          class="btn btn-ghost btn-xs btn-square"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="{item.title} submenu"
          onclick={toggleOpen}
          bind:this={toggle}
        ><ChevronRight class="size-4 opacity-60" /></button>
      {/if}
    {/if}
  </div>

  {#if hasChildren && open}
    <div
      class="absolute top-0 z-50 {flipLeft ? 'right-full pr-2 origin-top-right' : 'left-full pl-2 origin-top-left'}"
      transition:scale={{ start: 0.95, duration: ms(150), easing: cubicOut }}
    >
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions (keydown is delegated from the focusable links and buttons inside) -->
      <ul
        class="w-60 p-2 flex flex-col gap-0.5 bg-base-100 border border-base-300 rounded-box shadow-xl"
        onkeydown={(e) => submenuKeydown(e, e.currentTarget, () => hide(true))}
      >
        {#each item.children as child (child.id)}
          <Self item={child} {trail} {currentId} />
        {/each}
      </ul>
    </div>
  {/if}
</li>
