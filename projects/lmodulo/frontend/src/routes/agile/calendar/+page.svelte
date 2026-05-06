<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import type { PageData } from './$types';
  import type { AgileMilestone, AgileSprint, AgileTask } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  const calEvents  = $derived((data.calEvents  ?? []) as any[]);
  const milestones = $derived((data.milestones ?? []) as AgileMilestone[]);
  const sprints    = $derived((data.sprints    ?? []) as AgileSprint[]);
  const tasks      = $derived((data.tasks      ?? []) as AgileTask[]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  const calLabel = $derived(new Date(calYear, calMonth, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  function prevMonth() { calMonth === 0 ? (calMonth = 11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth = 0, calYear++) : calMonth++; }

  function ds(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  function spansDay(start: string | undefined, end: string | undefined, d: string): boolean {
    if (!start) return false;
    return start.slice(0, 10) <= d && d <= (end ?? start).slice(0, 10);
  }

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const d    = new Date(year, month, day);
      const dStr = ds(year, month, day);
      const dayEvents = calEvents.filter(e => {
        const start = e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '';
        const end   = e.endDate   ? new Date(e.endDate).toISOString().slice(0, 10)   : start;
        return start <= dStr && dStr <= end;
      });
      return { day, isToday: d.toDateString() === today.toDateString(), events: dayEvents };
    });
  }

  const calDays = $derived(buildCal(calYear, calMonth));

  const EVENT_TYPE_COLOR: Record<string, string> = {
    Planning:       'bg-primary',
    Deadline:       'bg-error',
    Review:         'bg-secondary',
    Retrospective:  'bg-warning',
    Custom:         'bg-neutral',
    upcoming_event: 'bg-primary',
    announcement:   'bg-secondary',
    deadline:       'bg-error',
    project_scope:  'bg-success',
  };
</script>

<svelte:head><title>Agile Calendar</title></svelte:head>

<div class="space-y-4">

  <div>
    <h2 class="text-lg font-semibold">Calendar</h2>
    <p class="text-xs opacity-50 mt-0.5">Aggregated CalendarEvents attached to Milestones, Sprints, Jobs, and Tasks.</p>
  </div>

  <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">

    <!-- Nav -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-base-300">
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={prevMonth} aria-label="Previous month">
        <ChevronLeft class="size-4"/>
      </button>
      <span class="font-semibold text-sm">{calLabel}</span>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={nextMonth} aria-label="Next month">
        <ChevronRight class="size-4"/>
      </button>
    </div>

    <!-- DOW header -->
    <div class="grid grid-cols-7 border-b border-base-300">
      {#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as dow}
        <div class="px-2 py-2 text-center text-xs font-semibold opacity-50 uppercase tracking-wide">{dow}</div>
      {/each}
    </div>

    <!-- Day cells -->
    <div class="grid grid-cols-7">
      {#each calDays as cell, i}
        {@const borderR = (i+1) % 7 !== 0 ? 'border-r' : ''}
        {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
        <div class="min-h-[5.5rem] p-2 border-base-300 {borderR} {borderB}
          {cell?.isToday ? 'bg-primary/5' : ''}">
          {#if cell}
            <span class="text-xs font-semibold
              {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-content' : 'opacity-70'}">
              {cell.day}
            </span>
            <div class="mt-1 space-y-0.5">
              <!-- Calendar events -->
              {#each cell.events as ev}
                {@const color = EVENT_TYPE_COLOR[ev.eventType] ?? 'bg-neutral'}
                <div class="text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate text-white {color}/80"
                  title="{ev.title} ({ev.eventType})">
                  {ev.title}
                </div>
              {/each}
              <!-- Milestones -->
              {#each milestones.filter(m => spansDay(m.startDate, m.endDate, ds(calYear, calMonth, cell.day))) as m}
                <a href="/agile/milestones/{m.id}"
                  class="flex text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-primary/80 text-white hover:bg-primary transition-colors"
                  title={m.title}>{m.title}</a>
              {/each}
              <!-- Sprints -->
              {#each sprints.filter(sp => spansDay(sp.startDate, sp.endDate, ds(calYear, calMonth, cell.day))) as sp}
                <a href="/agile/sprints/{sp.id}"
                  class="flex text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-secondary/80 text-white hover:bg-secondary transition-colors"
                  title="Sprint {sp.sprintNumber}: {sp.title}">S{sp.sprintNumber}: {sp.title}</a>
              {/each}
              <!-- Tasks due -->
              {#each tasks.filter(t => t.dueDate?.slice(0, 10) === ds(calYear, calMonth, cell.day)).slice(0, 3) as t}
                <div class="text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-warning/70 text-warning-content"
                  title={t.title}>{t.title}</div>
              {/each}
              {#if tasks.filter(t => t.dueDate?.slice(0, 10) === ds(calYear, calMonth, cell.day)).length > 3}
                <div class="text-[9px] opacity-50 px-1">
                  +{tasks.filter(t => t.dueDate?.slice(0, 10) === ds(calYear, calMonth, cell.day)).length - 3} more
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

  </div>

  <!-- Legend -->
  <div class="flex flex-wrap gap-4 text-xs opacity-60">
    <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-primary/80 inline-block"></span>Milestone</span>
    <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-secondary/80 inline-block"></span>Sprint</span>
    <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-warning/70 inline-block"></span>Task due</span>
    {#each Object.entries(EVENT_TYPE_COLOR).slice(0, 5) as [type, color]}
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-sm {color}/80 inline-block"></span>
        {type.replace(/_/g, ' ')}
      </span>
    {/each}
  </div>

</div>
