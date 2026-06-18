<script lang="ts">
  import { page } from '$app/state';
  import { LayoutGrid, Users, Building2, TrendingUp, CalendarDays, BarChart2, Handshake } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { LayoutData } from './$types';
  import { dragScroll } from '$lib/actions/dragScroll';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = [
    { href: '/crm',            label: 'Overview',   icon: LayoutGrid   },
    { href: '/crm/contacts',   label: 'Contacts',   icon: Users        },
    { href: '/crm/companies',  label: 'Companies',  icon: Building2    },
    { href: '/crm/pipeline',   label: 'Pipeline',   icon: TrendingUp   },
    { href: '/crm/activities', label: 'Activities', icon: CalendarDays },
    { href: '/crm/reports',    label: 'Reports',    icon: BarChart2    },
  ];

  const overviewPrefixes = ['/crm/deals', '/crm/contacts/', '/crm/companies/'];

  const isActive = (href: string) =>
    href === '/crm'
      ? page.url.pathname === '/crm' || overviewPrefixes.some(p => page.url.pathname.startsWith(p))
      : page.url.pathname.startsWith(href);

  const levelActiveClass = $derived.by(() => {
    const p = page.url.pathname;
    if (p.startsWith('/crm/activities')) return 'bg-accent text-accent-content';
    if (p.startsWith('/crm/deals'))      return 'bg-success text-success-content';
    if (p.startsWith('/crm/contacts/'))  return 'bg-secondary text-secondary-content';
    if (p.startsWith('/crm/companies/')) return 'bg-primary text-primary-content';
    return 'bg-primary text-primary-content';
  });
</script>

<div data-no-anim class="flex flex-col gap-6">
  <div class="page-heading flex items-start gap-3">
    <Handshake class="size-6 shrink-0 mt-0.5" />
    <div>
      <h1 class="text-2xl font-bold leading-none">Nexus</h1>
      <p class="text-xs opacity-60 mt-0.5">Companies · Contacts · Deals · Activities</p>
    </div>
  </div>

  {#if hasPermission(data.user, 'crm_contacts', 'read')}
    <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-6">
      {#each navLinks as link}
        <a
          href={link.href}
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
            {isActive(link.href)
              ? (link.href === '/crm' ? levelActiveClass : 'bg-primary text-primary-content')
              : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        >
          <svelte:component this={link.icon} class="size-4" />
          {link.label}
        </a>
      {/each}
    </nav>
  {/if}

  {#key page.url.pathname}
    <div class="page-content pt-6">
      {@render children()}
    </div>
  {/key}
</div>
