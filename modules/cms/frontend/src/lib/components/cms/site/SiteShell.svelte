<script lang="ts">
  // The public website's chrome: brand, desktop menu or mobile drawer, optional breadcrumbs and
  // the footer. It renders inside the root layout's bare branch (no app shell) and uses the app's
  // runtime DaisyUI theme, which is already on <html data-theme>. Not for app pages (no PageHeader).
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { Menu as MenuIcon, ChevronRight } from 'lucide-svelte';
  import Logo from '$lib/components/Logo.svelte';
  import SiteMenu from './SiteMenu.svelte';
  import SiteMobileMenu from './SiteMobileMenu.svelte';
  import SiteFooter from './SiteFooter.svelte';
  import type { MenuItem, PageView, SiteMenu as SiteMenuData } from '$lib/cms/types';
  import type { Snippet } from 'svelte';

  let { menu, breadcrumbs, children }: {
    menu: SiteMenuData;
    breadcrumbs?: PageView['breadcrumbs'];
    children: Snippet;
  } = $props();

  const brandName = $derived((page.data.brandName as string | null) ?? '');
  const brandLogo = $derived((page.data.brandLogo as string | null) ?? '');
  const appName = $derived((page.data.appName as string | null) ?? '');
  const user = $derived(page.data.user as { role?: string } | null | undefined);

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

  const crumbs = $derived(breadcrumbs && breadcrumbs.length > 1 ? breadcrumbs : null);

  let drawerOpen = $state(false);
  let menuButton: HTMLButtonElement | undefined = $state();
  afterNavigate(() => { drawerOpen = false; });

  function closeDrawer() {
    drawerOpen = false;
    menuButton?.focus();
  }
</script>

<!-- Brand from Settings → Brand, else the app name; nothing at all when neither is set -->
{#snippet brand()}
  {#if brandLogo || brandName || appName}
    <a href="/" class="inline-flex items-center gap-2 min-w-0 font-semibold">
      {#if brandLogo || brandName}
        <Logo {brandName} {brandLogo} />
        {#if brandLogo && brandName}<span class="text-lg truncate">{brandName}</span>{/if}
      {:else}
        <span class="text-lg truncate">{appName}</span>
      {/if}
    </a>
  {/if}
{/snippet}

<div class="min-h-screen flex flex-col bg-base-100 text-base-content">
  <a href="#cms-main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] btn btn-sm btn-primary">Skip to content</a>

  <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
      <div class="shrink-0">{@render brand()}</div>
      <SiteMenu items={menu.items} trail={active.trail} currentId={active.currentId} />
      <div class="flex-1"></div>
      {#if user && user.role !== 'customer'}
        <a href="/dashboard" class="btn btn-ghost btn-sm hidden sm:inline-flex">Dashboard</a>
      {/if}
      {#if menu.items.length}
        <button
          bind:this={menuButton}
          type="button"
          class="btn btn-ghost btn-square lg:hidden"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="cms-mobile-menu"
          onclick={() => (drawerOpen = true)}
        ><MenuIcon class="size-5" /></button>
      {/if}
    </div>
  </header>

  <SiteMobileMenu open={drawerOpen} items={menu.items} trail={active.trail} currentId={active.currentId} onclose={closeDrawer} {brand} />

  {#if crumbs}
    <!-- Same column as the page title and text -->
    <nav aria-label="Breadcrumb" class="max-w-3xl w-full mx-auto px-4 pt-6">
      <ol class="flex flex-wrap items-center gap-1 text-sm opacity-70">
        {#each crumbs as crumb, i (crumb.id)}
          <li class="inline-flex items-center gap-1">
            {#if i > 0}<ChevronRight class="size-3.5 opacity-60" aria-hidden="true" />{/if}
            {#if i === crumbs.length - 1 || !crumb.path}
              <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{crumb.title}</span>
            {:else}
              <a href={crumb.path} class="hover:underline underline-offset-4">{crumb.title}</a>
            {/if}
          </li>
        {/each}
      </ol>
    </nav>
  {/if}

  <main id="cms-main" tabindex="-1" class="flex-1 outline-none">
    {@render children()}
  </main>

  <SiteFooter footer={menu.footer} {brand} />
</div>
