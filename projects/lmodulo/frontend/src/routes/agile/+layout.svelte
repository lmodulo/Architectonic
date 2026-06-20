<script lang="ts">
  import { page } from '$app/state';
  import { LayoutGrid, KanbanSquare, GanttChart, CalendarDays, ClipboardList, BarChart2, ListChecks, Clock, Milestone } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import { m } from '$lib/paraglide/messages.js';
  import type { LayoutData } from './$types';
  import { dragScroll } from '$lib/actions/dragScroll';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = $derived([
    { href: '/agile',          label: m.agile_tab_overview(),  icon: LayoutGrid    },
    { href: '/agile/board',    label: m.agile_tab_board(),     icon: KanbanSquare  },
    { href: '/agile/plan',     label: m.agile_tab_plan(),      icon: ClipboardList },
    { href: '/agile/timeline', label: m.agile_tab_timeline(),  icon: GanttChart    },
    { href: '/agile/calendar', label: m.agile_tab_calendar(),  icon: CalendarDays  },
    { href: '/agile/reports',  label: m.agile_tab_reports(),   icon: BarChart2     },
    { href: '/agile/my-tasks', label: m.agile_tab_my_tasks(),  icon: ListChecks    },
    { href: '/agile/time',     label: m.agile_tab_time(),      icon: Clock         },
  ]);

  const overviewPrefixes = ['/agile/milestones', '/agile/sprints', '/agile/jobs', '/agile/tasks'];

  const isActive = (href: string) =>
    href === '/agile'
      ? page.url.pathname === '/agile' || overviewPrefixes.some(p => page.url.pathname.startsWith(p))
      : page.url.pathname.startsWith(href);

  const levelActiveClass = $derived.by(() => {
    const p = page.url.pathname;
    if (p.startsWith('/agile/tasks'))      return 'bg-accent text-accent-content';
    if (p.startsWith('/agile/jobs'))       return 'bg-success text-success-content';
    if (p.startsWith('/agile/sprints'))    return 'bg-secondary text-secondary-content';
    if (p.startsWith('/agile/milestones')) return 'bg-primary text-primary-content';
    return 'bg-primary text-primary-content';
  });
</script>

<div data-no-anim class="flex flex-col gap-6">
  <!-- Page header -->
  <div class="page-heading flex items-start gap-3">
    <Milestone class="size-6 shrink-0 mt-0.5" />
    <div>
      <h1 class="text-2xl font-bold leading-none">{m.agile_title()}</h1>
      <p class="text-xs opacity-60 mt-0.5">{m.agile_subtitle()}</p>
    </div>
  </div>

  <!-- Sub-navigation -->
  {#if hasPermission(data.user, 'agile_milestones', 'read')}
    <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-6">
      {#each navLinks as link}
        <a
          href={link.href}
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
            {isActive(link.href)
              ? (link.href === '/agile' ? levelActiveClass : 'bg-primary text-primary-content')
              : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        >
          <svelte:component this={link.icon} class="size-4" />
          {link.label}
        </a>
      {/each}
    </nav>
  {/if}

  <!-- Page content -->
  {#key page.url.pathname}
    <div class="page-content pt-6">
      {@render children()}
    </div>
  {/key}
</div>
