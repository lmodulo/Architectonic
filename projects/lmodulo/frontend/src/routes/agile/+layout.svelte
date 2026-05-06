<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutGrid, KanbanSquare, GanttChart, CalendarDays, Milestone } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = [
    { href: '/agile',          label: 'Overview',  icon: LayoutGrid    },
    { href: '/agile/board',    label: 'Board',     icon: KanbanSquare  },
    { href: '/agile/timeline', label: 'Timeline',  icon: GanttChart    },
    { href: '/agile/calendar', label: 'Calendar',  icon: CalendarDays  },
  ];

  const overviewPrefixes = ['/agile/milestones', '/agile/sprints', '/agile/jobs'];

  const isActive = (href: string) =>
    href === '/agile'
      ? $page.url.pathname === '/agile' || overviewPrefixes.some(p => $page.url.pathname.startsWith(p))
      : $page.url.pathname.startsWith(href);
</script>

<div class="flex flex-col gap-6">
  <!-- Page header -->
  <div class="flex items-center gap-3">
    <div class="p-2 rounded-lg bg-primary/15">
      <Milestone class="size-5 text-primary" />
    </div>
    <div>
      <h1 class="text-2xl font-bold leading-none">Agile Tracker</h1>
      <p class="text-xs opacity-50 mt-0.5">Milestones · Sprints · Jobs · Tasks</p>
    </div>
  </div>

  <!-- Sub-navigation -->
  {#if hasPermission(data.user, 'agile_milestones', 'read')}
    <nav class="flex gap-1 border-b border-base-300 -mb-2">
      {#each navLinks as link}
        <a
          href={link.href}
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
            {isActive(link.href)
              ? 'border-b-2 border-primary text-primary'
              : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        >
          <svelte:component this={link.icon} class="size-4" />
          {link.label}
        </a>
      {/each}
    </nav>
  {/if}

  <!-- Page content -->
  {@render children()}
</div>
