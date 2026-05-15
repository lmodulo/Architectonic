<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutGrid, FileText, RefreshCw } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = [
    { href: '/folio',               label: 'Overview',      icon: LayoutGrid },
    { href: '/folio/invoices',      label: 'Invoices',      icon: FileText   },
    { href: '/folio/subscriptions', label: 'Subscriptions', icon: RefreshCw  },
  ];

  const isActive = (href: string) =>
    href === '/folio'
      ? $page.url.pathname === '/folio'
      : $page.url.pathname.startsWith(href);
</script>

<div class="flex flex-col gap-6">
  <!-- Page header -->
  <div>
    <h1 class="text-2xl font-bold leading-none">Folio</h1>
    <p class="text-xs opacity-50 mt-0.5">Invoices · Subscriptions</p>
  </div>

  <!-- Sub-navigation -->
  {#if hasPermission(data.user, 'finance_invoices', 'read')}
    <nav class="flex gap-1 border-b border-base-300 -mb-2">
      {#each navLinks as link}
        {#if link.href !== '/folio/subscriptions' || hasPermission(data.user, 'finance_subscriptions', 'read')}
          <a
            href={link.href}
            class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
              {isActive(link.href)
                ? 'bg-primary text-primary-content'
                : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
          >
            <svelte:component this={link.icon} class="size-4" />
            {link.label}
          </a>
        {/if}
      {/each}
    </nav>
  {/if}

  {@render children()}
</div>
