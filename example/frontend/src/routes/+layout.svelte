<script lang="ts">
  import '../app.css';
  import { Navigation, Menu as SkMenu } from '@skeletonlabs/skeleton-svelte';
  import { Menu as MenuIcon, CircleUser, LogOut, X, User, Users, ShieldCheck, Sun, Moon, Mail as MailIcon, Settings } from 'lucide-svelte';
  import { navItems } from '$lib/config/nav';
  import { navigating, page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { hasPermission } from '$lib/permissions';
  import Logo from '$lib/components/Logo.svelte';
  import ChatAssistant from '$lib/components/ChatAssistant.svelte';
  import { brand } from '$lib/config/logo';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  let sidebarOpen = $state(false);
  let logoutForm: HTMLFormElement = $state()!;
  let isDark = $state(false);
  let unreadCount = $state(data.unreadCount ?? 0);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  // Re-fetch unread count on every navigation
  $effect(() => {
    void page.url.pathname; // track route changes
    if (!data.user) return;
    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) unreadCount = d.count; })
      .catch(() => {});
  });

  function toggleTheme() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
  }
</script>

<svelte:head>
  <title>{brand.text} — {brand.description}</title>
</svelte:head>

{#if data.user}

  <!-- Navigation loading overlay -->
  {#if navigating.to !== null}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/60 backdrop-blur-sm">
      <div class="card preset-filled-surface-100-900 shadow-xl px-6 py-4 flex items-center gap-3">
        <svg
          class="size-5 animate-spin text-primary-500"
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
  <div class="h-screen flex flex-col overflow-hidden">

    <!-- Sticky header -->
    <header class="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 shrink-0 preset-filled-surface-100-900 shadow-sm">

      <!-- Mobile hamburger (hidden on lg+) -->
      <button
        type="button"
        class="btn-icon hover:preset-tonal lg:hidden"
        onclick={() => (sidebarOpen = !sidebarOpen)}
        aria-label="Toggle navigation"
      >
        {#if sidebarOpen}<X class="size-5" />{:else}<MenuIcon class="size-5" />{/if}
      </button>

      <!-- Logo / Title -->
      <a href="/dashboard" class="flex items-center gap-2 flex-1 no-underline text-inherit">
        <Logo />
      </a>

      <!-- Trail -->
      <div class="flex items-center gap-2">
        <span class="text-sm opacity-60 hidden sm:inline">
          {data.user.firstName && data.user.lastName
            ? `${data.user.firstName} ${data.user.lastName}`
            : data.user.username}
        </span>

        <span class="hidden sm:block w-px h-5 bg-surface-300-700 opacity-60"></span>

        <button
          type="button"
          class="btn-icon hover:preset-tonal"
          onclick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {#if isDark}
            <Sun class="size-5" />
          {:else}
            <Moon class="size-5" />
          {/if}
        </button>

        <a href="/messages" class="btn-icon hover:preset-tonal relative" aria-label="Messages">
          <MailIcon class="size-5" />
          {#if unreadCount > 0}
            <span class="preset-filled-error-500 absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          {/if}
        </a>

        <SkMenu positioning={{ placement: 'bottom-end' }}>
          <SkMenu.Trigger
            class="btn-icon hover:preset-tonal"
            aria-label="User menu"
          >
            <CircleUser class="size-6" />
          </SkMenu.Trigger>
          <SkMenu.Positioner>
            <SkMenu.Content class="card preset-filled-surface-100-900 border border-surface-200-800 shadow-xl p-1 min-w-44 z-30">
              <SkMenu.Item
                value="profile"
                onclick={() => goto('/profile')}
                class="flex items-center gap-3 px-3 py-2 rounded-base w-full text-left text-sm cursor-pointer {page.url.pathname === '/profile' ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
              >
                <User class="size-4 shrink-0" />
                <span>Profile</span>
              </SkMenu.Item>
              {#if hasPermission(data.user, 'users', 'read')}
                <SkMenu.Item
                  value="manage-users"
                  onclick={() => goto('/manage-users')}
                  class="flex items-center gap-3 px-3 py-2 rounded-base w-full text-left text-sm cursor-pointer {page.url.pathname === '/manage-users' ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
                >
                  <Users class="size-4 shrink-0" />
                  <span>Manage Users</span>
                </SkMenu.Item>
              {/if}
              {#if hasPermission(data.user, 'roles', 'read')}
                <SkMenu.Item
                  value="roles"
                  onclick={() => goto('/roles')}
                  class="flex items-center gap-3 px-3 py-2 rounded-base w-full text-left text-sm cursor-pointer {page.url.pathname === '/roles' ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
                >
                  <ShieldCheck class="size-4 shrink-0" />
                  <span>Roles</span>
                </SkMenu.Item>
              {/if}
              {#if hasPermission(data.user, 'settings', 'read')}
                <SkMenu.Item
                  value="settings"
                  onclick={() => goto('/settings')}
                  class="flex items-center gap-3 px-3 py-2 rounded-base w-full text-left text-sm cursor-pointer {page.url.pathname === '/settings' ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
                >
                  <Settings class="size-4 shrink-0" />
                  <span>Settings</span>
                </SkMenu.Item>
              {/if}
              <SkMenu.Separator class="my-1 border-t border-surface-200-800" />
              <SkMenu.Item
                value="logout"
                onclick={() => logoutForm.requestSubmit()}
                class="flex items-center gap-3 px-3 py-2 rounded-base hover:preset-tonal-error w-full text-left text-sm cursor-pointer text-error-500"
              >
                <LogOut class="size-4 shrink-0" />
                <span>Sign Out</span>
              </SkMenu.Item>
            </SkMenu.Content>
          </SkMenu.Positioner>
        </SkMenu>
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
          preset-filled-surface-50-950 border-r border-surface-200-800
          lg:static lg:top-auto lg:h-auto lg:z-auto lg:translate-x-0
          {sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        "
      >
        <Navigation layout="sidebar" class="h-full p-3">
          <Navigation.Menu>
            <Navigation.Group>
              {#each navItems as item}
                {#if !item.permission || hasPermission(data.user, item.permission.resource, item.permission.action)}
                  <Navigation.TriggerAnchor
                    href={item.href}
                    class="flex items-center gap-3 p-3 rounded-base w-full {page.url.pathname === item.href ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
                    onclick={() => (sidebarOpen = false)}
                  >
                    {@const Icon = item.icon}
                    <Icon class="size-4 shrink-0" />
                    <Navigation.TriggerText>{item.label}</Navigation.TriggerText>
                  </Navigation.TriggerAnchor>
                {/if}
              {/each}
            </Navigation.Group>
          </Navigation.Menu>
        </Navigation>
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
    <ChatAssistant />
  {/if}

{:else}
  <!-- Public / unauthenticated pages (login, register, etc.) -->
  {@render children()}
{/if}
