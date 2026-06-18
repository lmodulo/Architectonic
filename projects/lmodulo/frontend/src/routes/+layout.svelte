<script lang="ts">
  import '../app.css';
  import {
    Menu as MenuIcon, LogOut, X, User, Users,
    Settings, ChevronRight, ChevronDown, HelpCircle,
    Mail, Bell
  } from 'lucide-svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import GlobalSearch from '$lib/components/GlobalSearch.svelte';
  import { navItems, isNavGroup, isSeparator } from '$lib/config/nav';
  import { navigating, page } from '$app/state';
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import { tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { hasPermission } from '$lib/permissions';
  import { scrollStore } from '$lib/stores/scroll';
  import Logo from '$lib/components/Logo.svelte';
  import ChatAssistant from '$lib/components/ChatAssistant.svelte';
  import UserCard from '$lib/components/UserCard.svelte';
  import LogTimePalette from '$lib/components/agile/LogTimePalette.svelte';
  import { connect, disconnect, getUnreadCount } from '$lib/stores/notifications.svelte';
  import { closeCard } from '$lib/stores/userCard.svelte';
  import { isOpen as isPaletteOpen, openLogTimePalette, closeLogTimePalette } from '$lib/stores/logTimePalette.svelte';
  import { brand } from '$lib/config/logo';
  import { APP_THEME, APP_FONTS } from '$lib/config/theme';

  const fontVars = [
    `--display:'${APP_FONTS.display.family}',${APP_FONTS.display.fallback}`,
    `--body:'${APP_FONTS.body.family}',${APP_FONTS.body.fallback}`,
    `--mono:'${APP_FONTS.mono.family}',${APP_FONTS.mono.fallback}`,
  ].join(';');
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  let sidebarOpen = $state(false);
  let sidebarExpanded = $state(false);
  const pathname = $derived(page.url.pathname);
  let logoutForm: HTMLFormElement = $state()!;
  let unreadCount = $state(data.unreadCount ?? 0);
  let openGroups = $state<Record<string, boolean>>({});
  let profileOpen = $state(false);
  let showOverlay = $state(false);
  let overlayTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (navigating.to !== null) {
      overlayTimer = setTimeout(() => { showOverlay = true; }, 500);
    } else {
      if (overlayTimer !== null) { clearTimeout(overlayTimer); overlayTimer = null; }
      showOverlay = false;
    }
  });

  $effect(() => {
    const pathname = page.url.pathname;
    for (const entry of navItems) {
      if (isNavGroup(entry) && entry.children.some(c => pathname.startsWith(c.href))) {
        openGroups[entry.label] = true;
      }
    }
  });

  function toggleGroup(label: string) {
    openGroups[label] = !openGroups[label];
  }

  $effect(() => {
    void page.url.pathname;
    if (!data.user) return;
    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) unreadCount = d.count; })
      .catch(() => {});
  });

  $effect(() => {
    if (data.user) {
      connect();
      return () => disconnect();
    }
  });

  let mainEl: HTMLElement;

  beforeNavigate(() => {
    if (mainEl) scrollStore.save(page.url.pathname, mainEl.scrollTop);
  });

  afterNavigate(async ({ type }) => {
    if (!mainEl) return;
    if (type === 'popstate') {
      await tick();
      mainEl.scrollTop = scrollStore.get(page.url.pathname);
    } else {
      mainEl.scrollTop = 0;
    }
  });

  $effect(() => {
    if (!data.user) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isPaletteOpen() ? closeLogTimePalette() : openLogTimePalette();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function closeSidebar() {
    sidebarOpen = false;
  }

  function onAsideMouseEnter() { sidebarExpanded = true; }
  function onAsideMouseLeave() { sidebarExpanded = false; }
</script>

<svelte:head>
  <title>{data.appName ?? 'Application'} — {brand.description}</title>
  {#if APP_FONTS.preconnect}
    {#each APP_FONTS.preconnect as href}
      <link rel="preconnect" {href} crossorigin />
    {/each}
  {/if}
  {#if APP_FONTS.cdnUrls}
    {#each APP_FONTS.cdnUrls as href}
      <link rel="stylesheet" {href} />
    {/each}
  {/if}
</svelte:head>

{#if data.user && pathname !== '/' && !pathname.startsWith('/documentation') && !page.data.isPrint}

  <form bind:this={logoutForm} method="POST" action="/logout" class="hidden"></form>

  <div data-theme={APP_THEME} style={fontVars} class="h-screen flex overflow-hidden">

    <!-- Mobile overlay -->
    {#if sidebarOpen}
      <button
        type="button"
        class="fixed inset-0 z-20 bg-black/50 lg:hidden"
        onclick={closeSidebar}
        aria-label="Close navigation"
        tabindex="-1"
      ></button>
    {/if}

    <!-- Sidebar -->
    <aside
      class="
        fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden
        bg-base-200 border-r border-base-300
        transition-[width,transform] duration-200 ease-in-out rounded-br-xl
        lg:static lg:translate-x-0 lg:mr-2 lg:mb-2
        {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        {sidebarExpanded ? 'w-64' : 'w-64 lg:w-[67px]'}
      "
      onmouseenter={onAsideMouseEnter}
      onmouseleave={onAsideMouseLeave}
    >

      <!-- Brand -->
      <div class="relative flex items-center gap-2 px-4 h-16 shrink-0">
        <a
          href={data.user?.role === 'customer' ? '/client-portal' : '/dashboard'}
          class="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit transition-opacity duration-150 {sidebarExpanded ? 'opacity-100' : 'lg:opacity-0 lg:pointer-events-none'}"
          onclick={closeSidebar}
        >
          <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
        </a>
        <a
          href={data.user?.role === 'customer' ? '/client-portal' : '/dashboard'}
          class="hidden lg:flex absolute inset-0 items-center justify-center no-underline transition-opacity duration-150 {sidebarExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
          onclick={closeSidebar}
          aria-hidden="true"
          tabindex={sidebarExpanded ? -1 : 0}
        >
          <span
            style="font-family: var(--display); background: radial-gradient(circle, color-mix(in oklch, var(--color-accent) 30%, transparent) 0%, transparent 70%);"
            class="text-4xl font-bold text-base-content select-none w-12 h-12 flex items-center justify-center rounded-full"
          >%</span>
        </a>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square lg:hidden shrink-0"
          onclick={closeSidebar}
          aria-label="Close navigation"
        >
          <X class="size-4" />
        </button>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 overflow-y-auto p-3 border-none">
        <ul class="flex flex-col gap-0.5">
          {#each navItems.filter(entry => {
            if (!data.user) return false;
            const isCustomer = data.user.role === 'customer';
            if (isCustomer) return 'customerOnly' in entry && (entry as import('$lib/config/nav').NavItem).customerOnly;
            return !('customerOnly' in entry) || !(entry as import('$lib/config/nav').NavItem).customerOnly;
          }) as entry}
            {#if isSeparator(entry)}
              <li><div class="border-t border-base-300/50 my-1"></div></li>
            {:else if isNavGroup(entry)}
              {@const anyChildActive = entry.children.some(c => pathname.startsWith(c.href))}
              {@const isOpen = openGroups[entry.label] ?? false}
              {@const GroupIcon = entry.icon}
              <li>
                <button
                  type="button"
                  class="flex items-center gap-3 p-3 rounded w-full text-sm {anyChildActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                  onclick={() => toggleGroup(entry.label)}
                >
                  <GroupIcon class="size-4 shrink-0" />
                  <span class="flex-1 text-left whitespace-nowrap transition-opacity duration-150 {sidebarExpanded ? '' : 'lg:opacity-0'}">{entry.label}</span>
                  {#if isOpen}
                    <ChevronDown class="size-3 opacity-40 transition-opacity duration-150 {sidebarExpanded ? '' : 'lg:opacity-0'}" />
                  {:else}
                    <ChevronRight class="size-3 opacity-40 transition-opacity duration-150 {sidebarExpanded ? '' : 'lg:opacity-0'}" />
                  {/if}
                </button>
                <div class="nav-subnav" class:nav-subnav-open={isOpen && (sidebarOpen || sidebarExpanded)}>
                  <div class="nav-subnav-inner">
                    {#each entry.children as child}
                      {#if !child.permission || hasPermission(data.user, child.permission.resource, child.permission.action)}
                        {@const ChildIcon = child.icon}
                        <a
                          href={child.href}
                          class="flex items-center gap-3 pl-9 pr-3 py-2 rounded text-sm {pathname.startsWith(child.href) ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                          onclick={closeSidebar}
                        >
                          <ChildIcon class="size-3.5 shrink-0 opacity-70" />
                          {child.label}
                        </a>
                      {/if}
                    {/each}
                  </div>
                </div>
              </li>
            {:else}
              {#if !entry.permission || hasPermission(data.user, entry.permission.resource, entry.permission.action)}
                {@const Icon = entry.icon}
                <li>
                  <a
                    href={entry.href}
                    class="flex items-center gap-3 p-3 rounded {(entry.matchPrefix ? pathname.startsWith(entry.href) : pathname === entry.href) ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                    onclick={closeSidebar}
                  >
                    <Icon class="size-4 shrink-0" />
                    <span class="text-sm flex-1 whitespace-nowrap transition-opacity duration-150 {sidebarExpanded ? '' : 'lg:opacity-0'}">{entry.label}</span>
                    {#if entry.href === '/agile'}
                      <kbd class="kbd kbd-xs opacity-40 transition-opacity duration-150 {sidebarExpanded ? '' : 'lg:opacity-0'}">⌘K</kbd>
                    {/if}
                  </a>
                </li>
              {/if}
            {/if}
          {/each}
        </ul>
      </nav>

      <!-- Footer -->
      <div class="border-t border-base-300 p-2 flex flex-col gap-0.5">

        <!-- Profile -->
        <div>
          <button
            type="button"
            class="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-base-300/50 transition-colors"
            onclick={() => (profileOpen = !profileOpen)}
          >
            <Avatar user={data.user} size="sm" />
            <div class="flex-1 min-w-0 text-left overflow-hidden transition-opacity duration-150 {sidebarExpanded ? '' : 'lg:opacity-0'}">
              <p class="text-sm font-medium truncate leading-tight">
                {data.user.firstName && data.user.lastName
                  ? `${data.user.firstName} ${data.user.lastName}`
                  : data.user.username}
              </p>
              <p class="text-xs opacity-50 truncate leading-tight">{data.user.username}</p>
            </div>
            <ChevronDown class="size-3 opacity-40 transition-[transform,opacity] duration-200 {profileOpen ? 'rotate-180' : ''} {sidebarExpanded ? '' : 'lg:opacity-0'}" />
          </button>

          <div class="nav-subnav" class:nav-subnav-open={profileOpen && (sidebarOpen || sidebarExpanded)}>
            <div class="nav-subnav-inner pt-1">
              <a
                href="/profile"
                class="flex items-center gap-3 px-3 py-2 rounded text-sm {pathname === '/profile' ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                onclick={() => { closeSidebar(); profileOpen = false; }}
              >
                <User class="size-4 shrink-0" />
                <span>Profile</span>
              </a>
              {#if hasPermission(data.user, 'users', 'read') || hasPermission(data.user, 'roles', 'read')}
                <a
                  href="/user-management"
                  class="flex items-center gap-3 px-3 py-2 rounded text-sm {pathname === '/user-management' ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                  onclick={() => { closeSidebar(); profileOpen = false; }}
                >
                  <Users class="size-4 shrink-0" />
                  <span>User Management</span>
                </a>
              {/if}
              {#if hasPermission(data.user, 'settings', 'read')}
                <a
                  href="/settings"
                  class="flex items-center gap-3 px-3 py-2 rounded text-sm {pathname === '/settings' ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                  onclick={() => { closeSidebar(); profileOpen = false; }}
                >
                  <Settings class="size-4 shrink-0" />
                  <span>Settings</span>
                </a>
              {/if}
              <div class="border-t border-base-300/50 my-1"></div>
              <a
                href="/documentation"
                class="flex items-center gap-3 px-3 py-2 rounded text-sm {pathname.startsWith('/documentation') ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                onclick={() => { closeSidebar(); profileOpen = false; }}
              >
                <HelpCircle class="size-4 shrink-0" />
                <span>Support</span>
              </a>
              <div class="border-t border-base-300/50 my-1"></div>
              <button
                type="button"
                class="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-error hover:bg-error/10 transition-colors"
                onclick={() => { closeSidebar(); profileOpen = false; logoutForm.requestSubmit(); }}
              >
                <LogOut class="size-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </aside>

    <!-- Main content column -->
    <div class="relative flex flex-col flex-1 min-w-0 overflow-hidden">

      <!-- Top bar (always visible) -->
      <header class="flex items-center gap-3 px-4 h-16 shrink-0 bg-base-200 rounded-br-xl">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square lg:hidden"
          onclick={() => (sidebarOpen = !sidebarOpen)}
          aria-label="Toggle navigation"
        >
          <MenuIcon class="size-5" />
        </button>
        <div class="hidden lg:grid h-16 items-center transition-[grid-template-columns] duration-200 ease-in-out {sidebarExpanded ? 'grid-cols-[0fr]' : 'grid-cols-[1fr]'}">
          <div class="overflow-hidden h-full flex items-center">
            <div class="flex items-center gap-3 pr-0.5">
              <a
                href={data.user?.role === 'customer' ? '/client-portal' : '/dashboard'}
                class="flex items-center no-underline text-inherit"
              >
                <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
              </a>
            </div>
          </div>
        </div>
        <div class="flex-1"></div>
        {#if data.user?.role !== 'customer'}<GlobalSearch />{/if}
        <div class="w-px h-5 bg-base-300 shrink-0"></div>
        <div class="flex items-center gap-1">
          <div class="tooltip tooltip-bottom" data-tip="Messages">
            <a href="/messages" class="btn btn-ghost btn-sm btn-square relative">
              <Mail class="size-4" />
              {#if unreadCount > 0}
                <span class="bg-error absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-error-content">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              {/if}
            </a>
          </div>
          <div class="tooltip tooltip-bottom" data-tip="Notifications">
            <a href="/notifications" class="btn btn-ghost btn-sm btn-square relative">
              <Bell class="size-4" />
              {#if getUnreadCount() > 0}
                <span class="bg-error absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-error-content">
                  {getUnreadCount() > 99 ? '99+' : getUnreadCount()}
                </span>
              {/if}
            </a>
          </div>
        </div>
        <div class="hidden lg:grid transition-[grid-template-columns] duration-200 ease-in-out {sidebarExpanded ? 'grid-cols-[0fr]' : 'grid-cols-[1fr]'}">
          <div class="overflow-hidden">
            <div class="pl-0.5">
              <div class="w-px h-5 bg-base-300 shrink-0"></div>
            </div>
          </div>
        </div>
      </header>

      {#if showOverlay}
        <div
          transition:fade={{ duration: 150 }}
          class="absolute inset-0 z-10 flex items-center justify-center bg-base-100/50 backdrop-blur-[2px] pointer-events-none"
        >
          <div class="card bg-base-200 shadow-xl px-5 py-3 flex items-center gap-3 pointer-events-auto">
            <svg class="size-4 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm font-medium">Loading…</span>
          </div>
        </div>
      {/if}

      <!-- Page content -->
      <main bind:this={mainEl} class="flex-1 overflow-y-auto overflow-x-hidden" onscroll={closeCard}>
        {#key pathname}
          <div class="container mx-auto px-6 pb-6 max-w-5xl page-content transition-[opacity,filter] duration-200 {showOverlay ? 'opacity-40 blur-[1px]' : ''}">
            {@render children()}
          </div>
        {/key}
      </main>
    </div>

  </div>

  <div data-theme={APP_THEME} style="display:contents"><UserCard /></div>

  {#if isPaletteOpen()}
    <div data-theme={APP_THEME} style="display:contents"><LogTimePalette /></div>
  {/if}

  {#if data.chatEnabled}
    <div data-theme={APP_THEME} style="display:contents"><ChatAssistant /></div>
  {/if}

{:else}
  {@render children()}
{/if}

<style>
  @keyframes page-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  :global(.page-content > *) { animation: page-in 280ms ease backwards; }
  :global(.page-content > [data-no-anim]) { animation: none; }
  :global(.page-content > *:nth-child(2)) { animation-delay:  40ms; }
  :global(.page-content > *:nth-child(3)) { animation-delay:  80ms; }
  :global(.page-content > *:nth-child(4)) { animation-delay: 120ms; }
  :global(.page-content > *:nth-child(5)) { animation-delay: 160ms; }
  :global(.page-content > *:nth-child(6)) { animation-delay: 200ms; }

  @media (prefers-reduced-motion: reduce) {
    :global(.page-content > *) { animation: none; }
  }

  .nav-subnav {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 200ms ease;
  }

  .nav-subnav.nav-subnav-open {
    grid-template-rows: 1fr;
  }

.nav-subnav-inner {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding-bottom: 0.25rem;
  }</style>
