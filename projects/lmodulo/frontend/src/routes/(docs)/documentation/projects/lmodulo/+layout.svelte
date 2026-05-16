<script lang="ts">
  import { page } from '$app/state';
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import { tick } from 'svelte';
  import { APP_THEME } from '$lib/config/theme';
  import { scrollStore } from '$lib/stores/scroll';
  import {
    Menu as MenuIcon, X,
    BookOpen, Rocket, Layers, Lock, ShieldCheck,
    Code2, ListTodo, Mail, CalendarDays, Settings, Handshake, Receipt, Zap, Building2,
  } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import Logo from '$lib/components/Logo.svelte';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();
  let sidebarOpen = $state(false);
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

  const BASE = '/documentation/projects/lmodulo';

  const sections = [
    { label: 'Overview',           href: BASE,                        icon: BookOpen,    exact: true },
    { label: 'Getting Started',    href: `${BASE}/getting-started`,   icon: Rocket },
    { label: 'Architecture',       href: `${BASE}/architecture`,      icon: Layers },
    { label: 'Authentication',     href: `${BASE}/authentication`,    icon: Lock },
    { label: 'Roles & Permissions',href: `${BASE}/rbac`,              icon: ShieldCheck },
    { label: 'Workspaces',         href: `${BASE}/workspaces`,        icon: Building2 },
    { label: 'API Reference',      href: `${BASE}/api`,               icon: Code2 },
    { label: 'Agile Module',       href: `${BASE}/agile`,             icon: ListTodo },
    { label: 'Nexus CRM',         href: `${BASE}/crm`,               icon: Handshake },
    { label: 'Folio',             href: `${BASE}/folio`,             icon: Receipt },
    { label: 'Messaging',          href: `${BASE}/messaging`,         icon: Mail },
    { label: 'Calendar & Events',  href: `${BASE}/calendar`,          icon: CalendarDays },
    { label: 'Automation',         href: `${BASE}/automation`,        icon: Zap },
    { label: 'Administration',     href: `${BASE}/administration`,    icon: Settings },
  ];

  function isActive(href: string, exact = false) {
    return exact ? page.url.pathname === href : page.url.pathname.startsWith(href);
  }
</script>

<div data-theme={APP_THEME} class="flex h-screen overflow-hidden bg-base-100">

  {#if sidebarOpen}
    <button
      type="button"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      onclick={() => (sidebarOpen = false)}
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
    <div class="flex items-center gap-2 px-4 py-3 shrink-0 border-b border-base-300">
      <a href={BASE} class="flex-1 min-w-0 no-underline text-inherit">
        {#if data.brandName || data.brandLogo}
          <div class="flex items-center gap-2 mb-1.5">
            <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
          </div>
        {/if}
        <p class="text-sm font-bold leading-tight">lmodulo</p>
        <p class="text-xs opacity-50 leading-tight">Documentation</p>
      </a>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square lg:hidden shrink-0"
        onclick={() => (sidebarOpen = false)}
        aria-label="Close navigation"
      >
        <X class="size-4" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto p-3">
      <ul class="flex flex-col gap-0.5">
        {#each sections as section}
          {@const Icon = section.icon}
          <li>
            <a
              href={section.href}
              class="flex items-center gap-3 p-3 rounded text-sm {isActive(section.href, section.exact ?? false) ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
              onclick={() => (sidebarOpen = false)}
            >
              <Icon class="size-4 shrink-0 opacity-70" />
              {section.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="border-t border-base-300 p-4">
      <a href="/dashboard" class="text-xs opacity-50 hover:opacity-80 transition-opacity">← Back to app</a>
    </div>
  </aside>

  <!-- Main content column -->
  <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

    <header class="flex items-center gap-3 px-4 h-14 shrink-0 bg-base-200 border-b border-base-300 lg:hidden">
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
        onclick={() => (sidebarOpen = !sidebarOpen)}
        aria-label="Toggle navigation"
      >
        <MenuIcon class="size-5" />
      </button>
      <span class="text-sm font-semibold">lmodulo docs</span>
    </header>

    <main bind:this={mainEl} class="flex-1 overflow-auto">
      <div class="container mx-auto p-8 max-w-4xl">
        {@render children()}
      </div>
    </main>

  </div>
</div>
