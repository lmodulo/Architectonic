<script lang="ts">
  // Documentation site shell. /documentation is public and renders without the app shell
  // (see CORE_ROUTE_RULES in $lib/config/route-rules.ts). Pages come from $lib/config/docs.ts:
  // core pages plus whatever installed modules register.
  import { page } from '$app/state';
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import { tick, type Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import { X, Menu, ArrowLeft } from 'lucide-svelte';
  import { scrollStore } from '$lib/stores/scroll';
  import Logo from '$lib/components/Logo.svelte';
  import { CORE_DOCS, MODULE_DOCS, docsHref, DOCS_BASE } from '$lib/config/docs';
  import type { LayoutData } from './$types';

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

  const groups = $derived([
    { label: 'Guide',   pages: CORE_DOCS },
    { label: 'Modules', pages: MODULE_DOCS },
  ].filter(g => g.pages.length > 0));

  const isActive = (slug: string) => {
    const href = docsHref(slug);
    return slug === '' ? page.url.pathname === href : page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  };

  const back = $derived(
    data.user ? { href: data.user.role === 'customer' ? '/' : '/dashboard', label: 'Back to app' } : { href: '/login', label: 'Sign in' }
  );
  const appLabel = $derived(data.appName || 'Architectonic');
</script>

<div class="flex h-screen overflow-hidden bg-base-100">

  {#if sidebarOpen}
    <button
      type="button"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      onclick={() => (sidebarOpen = false)}
      aria-label="Close navigation"
      tabindex="-1"
      transition:fade={{ duration: 150 }}
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
      <a href={DOCS_BASE} class="flex-1 min-w-0 no-underline text-inherit">
        {#if data.brandName || data.brandLogo}
          <div class="flex items-center gap-2 mb-1.5">
            <Logo brandName={data.brandName ?? ''} brandLogo={data.brandLogo ?? ''} />
          </div>
        {:else}
          <p class="text-sm font-bold leading-tight">{appLabel}</p>
        {/if}
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

    <nav class="flex-1 overflow-y-auto p-3 space-y-4">
      {#each groups as group}
        <div>
          <p class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide opacity-40">{group.label}</p>
          <ul class="flex flex-col gap-0.5">
            {#each group.pages as doc (doc.slug)}
              <li>
                <a
                  href={docsHref(doc.slug)}
                  class="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors {isActive(doc.slug) ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
                  onclick={() => (sidebarOpen = false)}
                >
                  <doc.icon class="size-4 shrink-0 opacity-70" />
                  {doc.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>

    <div class="border-t border-base-300 p-4">
      <a href={back.href} class="text-xs opacity-60 hover:opacity-100 transition-opacity inline-flex items-center gap-1">
        <ArrowLeft class="size-3" /> {back.label}
      </a>
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
        <Menu class="size-5" />
      </button>
      <span class="text-sm font-semibold">{appLabel} docs</span>
    </header>

    <main bind:this={mainEl} class="flex-1 overflow-auto">
      <div class="container mx-auto p-8 max-w-4xl">
        {@render children()}
      </div>
    </main>

  </div>
</div>
