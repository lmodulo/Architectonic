<script lang="ts">
  import '../app.css';
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
  import { Menu, Home, CircleUser, LogOut, X } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  let sidebarOpen = $state(false);
</script>

{#if data.user}
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
        {#if sidebarOpen}<X class="size-5" />{:else}<Menu class="size-5" />{/if}
      </button>

      <!-- Title -->
      <span class="text-xl font-semibold flex-1">App Skeleton</span>

      <!-- Trail -->
      <div class="flex items-center gap-2">
        <span class="text-sm opacity-60 hidden sm:inline">{data.user.username}</span>
        <form method="POST" action="/logout">
          <button type="submit" class="btn-icon hover:preset-tonal" aria-label="Log out">
            <LogOut class="size-5" />
          </button>
        </form>
        <CircleUser class="size-6 opacity-60" />
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
              <Navigation.TriggerAnchor
                href="/dashboard"
                class="flex items-center gap-3 p-3 rounded-base hover:preset-tonal w-full"
                onclick={() => (sidebarOpen = false)}
              >
                <Home class="size-4 shrink-0" />
                <Navigation.TriggerText>Dashboard</Navigation.TriggerText>
              </Navigation.TriggerAnchor>
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

{:else}
  <!-- Public / unauthenticated pages (login, register, etc.) -->
  {@render children()}
{/if}
