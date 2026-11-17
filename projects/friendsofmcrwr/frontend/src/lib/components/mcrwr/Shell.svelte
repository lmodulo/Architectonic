<script lang="ts">
  // The public website's frame for friendsofmcrwr: header, menu, footer. Registered as the cms site design
  // ($lib/config/site-design/friendsofmcrwr.ts), so every CMS page uses it; the landing page uses it directly
  // with `overlay` (the header sits transparent over the photo until the page scrolls).
  //
  // Menu: the cms menu components, so the tree can be any depth (dropdowns, then flyouts; a nested accordion in
  // the drawer). Phones get one bar with the drawer. From lg up the header has two rows: the logo row, which
  // scrolls away, and a full-width menu row that stays pinned (with a small emblem once the logo is gone). When
  // the top-level items don't fit that row, however many there are, the header switches to the drawer instead.
  import './theme.css';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Menu as MenuIcon, LayoutDashboard, Facebook } from 'lucide-svelte';
  import SiteMenu from '$lib/components/cms/site/SiteMenu.svelte';
  import SiteMobileMenu from '$lib/components/cms/site/SiteMobileMenu.svelte';
  import Brand from './Brand.svelte';
  import Footer from './Footer.svelte';
  import { SITE, headerCta, resolveLinks, type SiteLinks } from './site';
  import type { MenuItem, PageView, SiteMenu as SiteMenuData } from '$lib/cms/types';
  import type { Snippet } from 'svelte';

  let { menu, overlay = false, links: given, children }: {
    menu: SiteMenuData;
    /** part of the site-design contract; breadcrumbs are shown by PageTitle instead */
    breadcrumbs?: PageView['breadcrumbs'];
    /** transparent header over a full-bleed photo (landing page) */
    overlay?: boolean;
    /** links found in the whole site tree (landing page); otherwise found in the menu */
    links?: SiteLinks;
    children: Snippet;
  } = $props();

  const links = $derived(given ?? resolveLinks(menu.items));
  const cta = $derived(headerCta(links));
  const user = $derived(page.data.user as { role?: string } | null | undefined);
  const staff = $derived(!!user && user.role !== 'customer');

  // Active trail: items whose URL is the current page or one of its ancestors
  const active = $derived.by(() => {
    const path = page.url.pathname;
    const trail = new Set<string>();
    let currentId: string | null = null;
    const walk = (items: MenuItem[]): boolean => {
      let any = false;
      for (const item of items) {
        const internal = item.type !== 'link' && item.href.startsWith('/');
        const exact = internal && item.href === path;
        const prefix = internal && item.href !== '/' && path.startsWith(item.href + '/');
        const child = walk(item.children);
        if (exact) currentId = item.id;
        if (exact || prefix || child) { trail.add(item.id); any = true; }
      }
      return any;
    };
    walk(menu.items);
    return { trail, currentId };
  });

  // ── Menu row or drawer ──
  let slot: HTMLElement | undefined = $state();   // the width the menu row may use
  let row: HTMLElement | undefined = $state();
  let wide = $state(false);                       // lg and up
  let crowded = $state(false);                    // wide, but the top-level items don't fit the row
  const useDrawer = $derived(!wide || crowded);

  onMount(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const measure = () => {
      wide = mq.matches;
      const list = row?.querySelector('ul');
      crowded = !!(wide && slot && list && list.scrollWidth > slot.clientWidth + 1);
    };
    const ro = new ResizeObserver(measure);
    if (slot) ro.observe(slot);
    mq.addEventListener('change', measure);
    document.fonts?.ready.then(measure);
    measure();
    return () => { ro.disconnect(); mq.removeEventListener('change', measure); };
  });

  let drawerOpen = $state(false);
  let menuButton: HTMLButtonElement | undefined = $state();
  afterNavigate(() => { drawerOpen = false; });
  $effect(() => { if (!useDrawer) drawerOpen = false; });
  function closeDrawer() {
    drawerOpen = false;
    menuButton?.focus();
  }

  // ── Scrolling: the transparent landing header turns solid; on desktop the logo row gives way to the menu row ──
  let scrollY = $state(0);
  onMount(() => {
    const onScroll = () => { scrollY = window.scrollY; };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
  const transparent = $derived(overlay && scrollY <= 24);
  /** desktop, menu row in use, logo row scrolled out of view (72px, h-18) */
  const pinned = $derived(wide && !crowded && scrollY > 72);
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..600&display=swap" />
</svelte:head>

{#snippet drawerBrand()}<Brand tone="dark" />{/snippet}

<div data-theme="mcrwr" class="mw-site min-h-screen flex flex-col bg-base-100 text-base-content">
  <a href="#mw-main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] btn btn-sm btn-primary">Skip to content</a>

  <!-- Sticky with top: -72px on desktop: the logo row scrolls off and the menu row stays. The landing page's
       header is fixed over the photo instead, so it moves up by the same amount. -->
  <header
    class="mw-header inset-x-0 z-30 transition-[background-color,color,border-color,translate] duration-300
      {overlay ? 'fixed top-0' : crowded ? 'sticky top-0' : 'sticky top-0 lg:-top-18'}
      {overlay && pinned ? '-translate-y-18' : ''}
      {transparent ? 'text-white border-b border-transparent bg-gradient-to-b from-black/45 to-transparent' : 'bg-base-100/95 backdrop-blur border-b border-base-300 text-base-content'}"
    data-transparent={transparent}
  >
    <!-- Logo row -->
    <div class="max-w-6xl mx-auto px-4 sm:px-5 h-16 lg:h-18 flex items-center gap-3">
      <Brand tone={transparent ? 'light' : 'dark'} />
      <div class="flex-1"></div>
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" class="hidden lg:inline-flex btn btn-ghost btn-sm btn-square {transparent ? 'hover:bg-white/15' : ''}" aria-label="Facebook" title="Facebook">
          <Facebook class="size-4" />
        </a>
        {#if staff}
          <a href="/dashboard" class="btn btn-ghost btn-sm btn-square {transparent ? 'hover:bg-white/15' : ''}" aria-label="Dashboard" title="Dashboard">
            <LayoutDashboard class="size-4" />
          </a>
        {/if}
        {#if cta}
          <a href={cta.href} class="btn btn-accent btn-sm mw-btn px-5 hidden sm:inline-flex {crowded ? '' : 'lg:hidden'}">{cta.label}</a>
        {/if}
        {#if menu.items.length}
          <button
            bind:this={menuButton}
            type="button"
            class="btn btn-ghost btn-square {crowded ? '' : 'lg:hidden'} {transparent ? 'hover:bg-white/15' : ''}"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="cms-mobile-menu"
            onclick={() => (drawerOpen = true)}
          ><MenuIcon class="size-6" /></button>
        {/if}
      </div>
    </div>

    <!-- Menu row, lg and up. When crowded it collapses but stays laid out, so it can be measured again. -->
    {#if menu.items.length}
      <div class="hidden lg:block {crowded ? 'h-0 overflow-hidden invisible' : `border-t ${transparent ? 'border-white/15' : 'border-base-300'}`}">
        <div class="max-w-6xl mx-auto px-5 h-12 flex items-center">
          <a
            href="/"
            tabindex="-1"
            aria-hidden="true"
            class="shrink-0 overflow-hidden transition-[width,opacity,margin] duration-300 {pinned ? 'w-8 opacity-100 mr-3' : 'w-0 opacity-0'}"
          ><img src="/brand/emblem-black.png" alt="" width="203" height="192" class="h-8 w-auto max-w-none" /></a>
          <!-- -ml-3 lines the first item's text up with the logo above (items have px-3) -->
          <div bind:this={slot} class="flex-1 min-w-0 -ml-3">
            <div bind:this={row} class="min-w-0">
              <SiteMenu items={menu.items} trail={active.trail} currentId={active.currentId} class="block" />
            </div>
          </div>
          {#if cta && !crowded}
            <a href={cta.href} class="btn btn-accent btn-sm mw-btn px-5 shrink-0 ml-4">{cta.label}</a>
          {/if}
        </div>
      </div>
    {/if}
  </header>

  <SiteMobileMenu
    open={drawerOpen}
    items={menu.items}
    trail={active.trail}
    currentId={active.currentId}
    onclose={closeDrawer}
    brand={drawerBrand}
    breakpoint={null}
  />

  <main id="mw-main" tabindex="-1" class="flex-1 outline-none">
    {@render children()}
  </main>

  <Footer {menu} {links} />
</div>
