<script lang="ts">
  import '../app.css';
  import { Menu as MenuIcon, CircleUser, LogOut, X, User, Users, Mail as MailIcon, Settings, ChevronRight, ChevronDown } from 'lucide-svelte';
  import { navItems, isNavGroup } from '$lib/config/nav';
  import { navigating, page } from '$app/state';
  import { goto } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import Logo from '$lib/components/Logo.svelte';
  import ChatAssistant from '$lib/components/ChatAssistant.svelte';
  import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';
  import { connect, disconnect } from '$lib/stores/notifications.svelte';
  import { brand } from '$lib/config/logo';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  let sidebarOpen = $state(false);
  let logoutForm: HTMLFormElement = $state()!;
  let unreadCount = $state(data.unreadCount ?? 0);
  let openGroups = $state<Record<string, boolean>>({});
  let userMenuDetails: HTMLDetailsElement = $state()!;

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

  // Re-fetch unread count on every navigation
  $effect(() => {
    void page.url.pathname; // track route changes
    if (!data.user) return;
    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) unreadCount = d.count; })
      .catch(() => {});
  });

  // WebSocket notifications — connect when authenticated, disconnect on logout
  $effect(() => {
    if (data.user) {
      connect();
      return () => disconnect();
    }
  });

  function closeUserMenu() {
    userMenuDetails?.removeAttribute('open');
  }
</script>

<svelte:head>
  <title>{data.appName ?? 'Application'} — {brand.description}</title>
</svelte:head>

{#if data.user}

  <!-- Navigation loading overlay -->
  {#if navigating.to !== null}
    <div data-theme="luxury" class="fixed inset-0 z-[100] flex items-center justify-center bg-base-100/60 backdrop-blur-sm">
      <div class="card bg-base-200 shadow-xl px-6 py-4 flex items-center gap-3">
        <svg
          class="size-5 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-sm font-medium">Loading…</span>
      </div>
    </div>
  {/if}

  <!-- Hidden logout form -->
  <form bind:this={logoutForm} method="POST" action="/logout" class="hidden"></form>

  <!-- Authenticated app shell -->
  <div data-theme="luxury" class="h-screen flex flex-col overflow-hidden">

    <!-- Sticky header -->
    <header class="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 shrink-0 bg-base-200 shadow-sm">

      <!-- Mobile hamburger (hidden on lg+) -->
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square lg:hidden"
        onclick={() => (sidebarOpen = !sidebarOpen)}
        aria-label="Toggle navigation"
      >
        {#if sidebarOpen}<X class="size-5" />{:else}<MenuIcon class="size-5" />{/if}
      </button>

      <!-- Logo / Title -->
      <a href="/dashboard" class="flex items-center gap-2 flex-1 no-underline text-inherit">
        <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
      </a>

      <!-- Trail -->
      <div class="flex items-center gap-2">
        <span class="text-sm opacity-60 hidden sm:inline">
          {data.user.firstName && data.user.lastName
            ? `${data.user.firstName} ${data.user.lastName}`
            : data.user.username}
        </span>

        <span class="hidden sm:block w-px h-5 bg-base-content/20"></span>

        <a href="/messages" class="btn btn-ghost btn-sm btn-square relative" aria-label="Messages">
          <MailIcon class="size-5" />
          {#if unreadCount > 0}
            <span class="bg-error absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-error-content">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          {/if}
        </a>

        <NotificationBell />

        <details class="dropdown dropdown-end" bind:this={userMenuDetails}>
          <summary
            class="btn btn-ghost btn-sm btn-square"
            aria-label="User menu"
          >
            <CircleUser class="size-6" />
          </summary>
          <ul class="dropdown-content menu bg-base-200 border border-base-300 rounded-box shadow-xl p-1 min-w-44 z-30 mt-1">
            <li>
              <button
                class="{page.url.pathname === '/profile' ? 'active' : ''}"
                onclick={() => { closeUserMenu(); goto('/profile'); }}
              >
                <User class="size-4 shrink-0" />
                <span>Profile</span>
              </button>
            </li>
            {#if hasPermission(data.user, 'users', 'read') || hasPermission(data.user, 'roles', 'read')}
              <li>
                <button
                  class="{page.url.pathname === '/user-management' ? 'active' : ''}"
                  onclick={() => { closeUserMenu(); goto('/user-management'); }}
                >
                  <Users class="size-4 shrink-0" />
                  <span>User Management</span>
                </button>
              </li>
            {/if}
            {#if hasPermission(data.user, 'settings', 'read')}
              <li>
                <button
                  class="{page.url.pathname === '/settings' ? 'active' : ''}"
                  onclick={() => { closeUserMenu(); goto('/settings'); }}
                >
                  <Settings class="size-4 shrink-0" />
                  <span>Settings</span>
                </button>
              </li>
            {/if}
            <li class="my-0.5 border-t border-base-300"></li>
            <li>
              <button
                class="text-error"
                onclick={() => { closeUserMenu(); logoutForm.requestSubmit(); }}
              >
                <LogOut class="size-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </li>
          </ul>
        </details>
      </div>

    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Mobile overlay -->
      {#if sidebarOpen}
        <button
          type="button"
          class="fixed inset-0 z-10 bg-black/40 lg:hidden"
          onclick={() => (sidebarOpen = false)}
          aria-label="Close navigation"
          tabindex="-1"
        ></button>
      {/if}

      <!-- Sidebar: always visible on lg+, slide-in on mobile -->
      <aside
        class="
          fixed top-14 left-0 z-10 h-[calc(100vh-3.5rem)] w-64
          transition-transform duration-200
          bg-base-100 border-r border-base-300
          lg:static lg:top-auto lg:h-auto lg:z-auto lg:translate-x-0
          {sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        "
      >
        <nav class="h-full p-3">
          <ul class="flex flex-col gap-0.5">
            {#each navItems as entry}
              {#if isNavGroup(entry)}
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
                    {#if isOpen}
                      <ChevronDown class="size-3 opacity-40" />
                    {:else}
                      <ChevronRight class="size-3 opacity-40" />
                    {/if}
                  </button>
                  <div class="nav-subnav" class:nav-subnav-open={isOpen}>
                    <div class="nav-subnav-inner">
                      {#each entry.children as child}
                        {#if !child.permission || hasPermission(data.user, child.permission.resource, child.permission.action)}
                          {@const ChildIcon = child.icon}
                          <a
                            href={child.href}
                            class="flex items-center gap-3 pl-9 pr-3 py-2 rounded w-full text-sm {page.url.pathname.startsWith(child.href) ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                            onclick={() => (sidebarOpen = false)}
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
                      class="flex items-center gap-3 p-3 rounded w-full {page.url.pathname === entry.href ? 'bg-primary/15 text-primary' : 'hover:bg-base-300/50'}"
                      onclick={() => (sidebarOpen = false)}
                    >
                      <Icon class="size-4 shrink-0" />
                      <span class="text-sm">{entry.label}</span>
                    </a>
                  </li>
                {/if}
              {/if}
            {/each}
          </ul>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <div class="container mx-auto p-6 max-w-5xl">
          {@render children()}
        </div>
      </main>

    </div>
  </div>

  {#if data.chatEnabled}
    <div data-theme="luxury" style="display:contents"><ChatAssistant /></div>
  {/if}

{:else}
  <!-- Public / unauthenticated pages (login, register, etc.) -->
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
  }
</style>
