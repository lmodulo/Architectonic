<script lang="ts">
  import { page } from '$app/state';
  import { LayoutGrid, FileText, RefreshCw, ClipboardList, Receipt, BarChart2 } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { LayoutData } from './$types';
  import { dragScroll } from '$lib/actions/dragScroll';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = [
    { href: '/folio',               label: 'Overview',      icon: LayoutGrid,    permission: null },
    { href: '/folio/invoices',      label: 'Invoices',      icon: FileText,      permission: null },
    { href: '/folio/estimates',     label: 'Estimates',     icon: ClipboardList, permission: 'finance_estimates' },
    { href: '/folio/subscriptions', label: 'Subscriptions', icon: RefreshCw,     permission: 'finance_subscriptions' },
    { href: '/folio/expenses',      label: 'Expenses',      icon: Receipt,       permission: 'finance_expenses' },
    { href: '/folio/reports',       label: 'Reports',       icon: BarChart2,      permission: 'finance_reports' },
  ];

  const isActive = (href: string) =>
    href === '/folio'
      ? page.url.pathname === '/folio'
      : page.url.pathname.startsWith(href);
</script>

<div data-no-anim class="flex flex-col gap-6">
  <!-- Page header -->
  <div class="page-heading flex items-start gap-3">
    <Receipt class="size-6 shrink-0 mt-0.5" />
    <div>
      <h1 class="text-2xl font-bold leading-none">Folio</h1>
      <p class="text-xs opacity-60 mt-0.5">Invoices · Estimates · Subscriptions · Expenses</p>
    </div>
  </div>

  <!-- Sub-navigation -->
  {#if hasPermission(data.user, 'finance_invoices', 'read')}
    <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-6">
      {#each navLinks as link}
        {#if !link.permission || hasPermission(data.user, link.permission, 'read')}
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

  {#key page.url.pathname}
    <div class="page-content pt-6">
      {@render children()}
    </div>
  {/key}
</div>
