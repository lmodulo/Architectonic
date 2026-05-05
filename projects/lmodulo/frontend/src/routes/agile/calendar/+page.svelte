<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const calEvents = $derived((data.calEvents ?? []) as any[]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  const calLabel = $derived(new Date(calYear, calMonth, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  function prevMonth() { calMonth === 0 ? (calMonth = 11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth = 0, calYear++) : calMonth++; }

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEvents = calEvents.filter(e => {
        const start = e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '';
        const end   = e.endDate   ? new Date(e.endDate).toISOString().slice(0, 10)   : start;
        return start <= dateStr && dateStr <= end;
      });
      return {
        day,
        isToday: d.toDateString() === today.toDateString(),
        events: dayEvents,
      };
    });
  }

  const calDays = $derived(buildCal(calYear, calMonth));

  const EVENT_TYPE_COLOR: Record<string, string> = {
    Planning:      'bg-primary-500',
    Deadline:      'bg-error-500',
    Review:        'bg-secondary-500',
    Retrospective: 'bg-warning-500',
    Custom:        'bg-tertiary-500',
    upcoming_event:'bg-primary-500',
    announcement:  'bg-secondary-500',
    deadline:      'bg-error-500',
    project_scope: 'bg-success-500',
  };
</script>

<svelte:head><title>Agile Calendar</title></svelte:head>

<div class="space-y-4">

  <div>
    <h2 class="text-lg font-semibold">Calendar</h2>
    <p class="text-xs opacity-50 mt-0.5">Aggregated CalendarEvents attached to Milestones, Sprints, Jobs, and Tasks.</p>
  </div>

  <div class="card preset-filled-surface-100-900 overflow-hidden">

    <!-- Nav -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-surface-200-800">
      <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={prevMonth} aria-label="Previous month">
        <ChevronLeft class="size-4"/>
      </button>
      <span class="font-semibold text-sm">{calLabel}</span>
      <button type="button" class="btn-icon btn-sm hover:preset-tonal" onclick={nextMonth} aria-label="Next month">
        <ChevronRight class="size-4"/>
      </button>
    </div>

    <!-- DOW header -->
    <div class="grid grid-cols-7 border-b border-surface-200-800">
      {#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as dow}
        <div class="px-2 py-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wide">{dow}</div>
      {/each}
    </div>

    <!-- Day cells -->
    <div class="grid grid-cols-7">
      {#each calDays as cell, i}
        {@const borderR = (i+1) % 7 !== 0 ? 'border-r' : ''}
        {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
        <div class="min-h-[5.5rem] p-2 border-surface-200-800 {borderR} {borderB}
          {cell?.isToday ? 'bg-primary-500/5' : ''}">
          {#if cell}
            <span class="text-xs font-semibold
              {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full preset-filled-primary-500 text-white' : 'opacity-70'}">
              {cell.day}
            </span>
            <div class="mt-1 space-y-0.5">
              {#each cell.events as ev}
                {@const color = EVENT_TYPE_COLOR[ev.eventType] ?? 'bg-surface-500'}
                <div class="text-[9px] font-medium leading-tight px-1 py-0.5 rounded-sm truncate text-white {color}"
                  title="{ev.title} ({ev.eventType})">
                  {ev.title}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

  </div>

  <!-- Legend -->
  <div class="flex flex-wrap gap-4 text-xs opacity-60">
    {#each Object.entries(EVENT_TYPE_COLOR).slice(0, 5) as [type, color]}
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-sm {color} inline-block"></span>
        {type.replace('_', ' ')}
      </span>
    {/each}
  </div>

</div>
