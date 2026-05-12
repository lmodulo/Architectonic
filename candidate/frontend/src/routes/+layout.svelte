<script lang="ts">
  import '../app.css';
  import {
    Menu as MenuIcon, LogOut, X, User, Users,
    Settings, ChevronDown, HelpCircle
  } from 'lucide-svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import { navItems, isNavGroup, isSeparator } from '$lib/config/nav';
  import { navigating, page } from '$app/state';
  import { hasPermission } from '$lib/permissions';
  import Logo from '$lib/components/Logo.svelte';
  import ChatAssistant from '$lib/components/ChatAssistant.svelte';
  import UserCard from '$lib/components/UserCard.svelte';
  import { connect, disconnect } from '$lib/stores/notifications.svelte';
  import { brand } from '$lib/config/logo';
  import { APP_THEME } from '$lib/config/theme';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  let sidebarOpen = $state(false);
  let logoutForm: HTMLFormElement = $state()!;
  let unreadCount = $state(data.unreadCount ?? 0);
  let openGroups = $state<Record<string, boolean>>({});
  let profileOpen = $state(false);

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

  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<svelte:head>
  <title>{data.appName ?? 'Application'} — {brand.description}</title>
</svelte:head>

{#if data.user}

  {#if navigating.to !== null}
    <div data-theme={APP_THEME} class="fixed inset-0 z-[100] flex items-center justify-center bg-base-100/60 backdrop-blur-sm">
      <div class="card bg-base-200 shadow-xl px-6 py-4 flex items-center gap-3">
        <svg class="size-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-sm font-medium">Loading…</span>
      </div>
    </div>
  {/if}

  <form bind:this={logoutForm} method="POST" action="/logout" class="hidden"></form>

  <div data-theme={APP_THEME} class="h-screen flex overflow-hidden">

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
    <aside class="
      fixed inset-y-0 left-0 z-30 w-64 flex flex-col
      bg-base-200 border-r border-base-300
      transition-transform duration-200
      lg:static lg:translate-x-0
      {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    ">

      <!-- Brand -->
      <div class="flex items-center gap-2 px-4 h-16 shrink-0 border-b border-base-300">
        <a href="/dashboard" class="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit" onclick={closeSidebar}>
          <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
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
      <nav class="flex-1 overflow-y-auto p-3">
        <ul class="flex flex-col gap-0.5">
          {#each navItems as entry}
            {#if isSeparator(entry)}
              <li><div class="border-t border-base-300/50 my-1"></div></li>
            {:else if isNavGroup(entry)}
              {@const anyChildActive = entry.children.some(c => page.url.pathname.startsWith(c.href))}
              {@const isOpen = openGroups[entry.label] ?? false}
              {@const GroupIcon = entry.icon}
              <li>
                <button
                  type="button"
                  class="flex items-center gap-3 p-3 rounded w-full text-sm {anyChildActive ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                  onclick={() => toggleGroup(entry.label)}
                >
                  <GroupIcon class="size-4 shrink-0" />
                  <span class="flex-1 text-left">{entry.label}</span>
                  <ChevronDown class="size-3 opacity-40 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
                </button>
                <div class="nav-subnav" class:nav-subnav-open={isOpen}>
                  <div class="nav-subnav-inner">
                    {#each entry.children as child}
                      {#if !child.permission || hasPermission(data.user, child.permission.resource, child.permission.action)}
                        {@const ChildIcon = child.icon}
                        <a
                          href={child.href}
                          class="flex items-center gap-3 pl-9 pr-3 py-2 rounded text-sm {page.url.pathname.startsWith(child.href) ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
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
                {@const isMessages = entry.href === '/messages'}
                <li>
                  <a
                    href={entry.href}
                    class="flex items-center gap-3 p-3 rounded {(entry.matchPrefix ? page.url.pathname.startsWith(entry.href) : page.url.pathname === entry.href) ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                    onclick={closeSidebar}
                  >
                    <span class="relative shrink-0">
                      <Icon class="size-4" />
                      {#if isMessages && unreadCount > 0}
                        <span class="bg-error absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      {/if}
                    </span>
                    <span class="text-sm flex-1">{entry.label}</span>
                    {#if isMessages && unreadCount > 0}
                      <span class="badge badge-error badge-xs">{unreadCount > 99 ? '99+' : unreadCount}</span>
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
            <div class="flex-1 min-w-0 text-left">
              <p class="text-sm font-medium truncate leading-tight">
                {data.user.firstName && data.user.lastName
                  ? `${data.user.firstName} ${data.user.lastName}`
                  : data.user.username}
              </p>
              <p class="text-xs opacity-50 truncate leading-tight">{data.user.username}</p>
            </div>
            <ChevronDown class="size-3 opacity-40 transition-transform duration-200 {profileOpen ? 'rotate-180' : ''}" />
          </button>

          <div class="nav-subnav" class:nav-subnav-open={profileOpen}>
            <div class="nav-subnav-inner pt-1">
              <a
                href="/profile"
                class="flex items-center gap-3 px-3 py-2 rounded text-sm {page.url.pathname === '/profile' ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                onclick={() => { closeSidebar(); profileOpen = false; }}
              >
                <User class="size-4 shrink-0" />
                <span>Profile</span>
              </a>
              {#if hasPermission(data.user, 'users', 'read') || hasPermission(data.user, 'roles', 'read')}
                <a
                  href="/user-management"
                  class="flex items-center gap-3 px-3 py-2 rounded text-sm {page.url.pathname === '/user-management' ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                  onclick={() => { closeSidebar(); profileOpen = false; }}
                >
                  <Users class="size-4 shrink-0" />
                  <span>User Management</span>
                </a>
              {/if}
              {#if hasPermission(data.user, 'settings', 'read')}
                <a
                  href="/settings"
                  class="flex items-center gap-3 px-3 py-2 rounded text-sm {page.url.pathname === '/settings' ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                  onclick={() => { closeSidebar(); profileOpen = false; }}
                >
                  <Settings class="size-4 shrink-0" />
                  <span>Settings</span>
                </a>
              {/if}
              <div class="border-t border-base-300/50 my-1"></div>
              <a
                href="/documentation/projects/lmodulo"
                class="flex items-center gap-3 px-3 py-2 rounded text-sm {page.url.pathname.startsWith('/documentation') ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
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
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

      <!-- Mobile top bar -->
      <header class="flex items-center gap-3 px-4 h-14 shrink-0 bg-base-200 border-b border-base-300 lg:hidden">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square"
          onclick={() => (sidebarOpen = !sidebarOpen)}
          aria-label="Toggle navigation"
        >
          <MenuIcon class="size-5" />
        </button>
        <a href="/dashboard" class="flex items-center gap-2 flex-1 no-underline text-inherit">
          <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
        </a>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto">
        <div class="container mx-auto p-6 max-w-5xl">
          {@render children()}
        </div>
      </main>
    </div>

  </div>

  <div data-theme={APP_THEME} style="display:contents"><UserCard /></div>

  {#if data.chatEnabled}
    <div data-theme={APP_THEME} style="display:contents"><ChatAssistant /></div>
  {/if}

{:else}
  {@render children()}
{/if}

<style>
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
