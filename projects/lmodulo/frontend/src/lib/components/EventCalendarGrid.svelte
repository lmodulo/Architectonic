<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { eventsForDay, typePillClass, type CalendarEvent } from '$lib/utils/calendarEvents';

  let {
    events,
    readonly = false,
    onEventClick,
    onDayDblClick,
  }: {
    events: CalendarEvent[];
    readonly?: boolean;
    onEventClick?: (ev: CalendarEvent) => void;
    onDayDblClick?: (dateStr: string) => void;
  } = $props();

  function ds(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  let calYear  = $state(today.getFullYear());
  let calMonth = $state(today.getMonth());

  const calLabel = $derived(
    new Date(calYear, calMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );

  const calDays = $derived(buildCal(calYear, calMonth));

  function buildCal(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = new Date(year, month, 1).getDay();
    const cells       = Math.ceil((startDow + daysInMonth) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => {
      const day = i - startDow + 1;
      if (day < 1 || day > daysInMonth) return null;
      const d = new Date(year, month, day);
      return { day, isToday: d.toDateString() === today.toDateString() };
    });
  }

  function prevMonth() { calMonth === 0 ? (calMonth = 11, calYear--) : calMonth--; }
  function nextMonth() { calMonth === 11 ? (calMonth = 0, calYear++) : calMonth++; }
</script>

<div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">

  <!-- Nav -->
  <div class="flex items-center justify-between px-5 py-3 border-b border-base-300">
    <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={prevMonth} aria-label={m.event_cal_prev_month()}>
      <Icon name="ChevronLeft" size={16} class="size-4" />
    </button>
    <span class="font-semibold text-sm">{calLabel}</span>
    <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={nextMonth} aria-label={m.event_cal_next_month()}>
      <Icon name="ChevronRight" size={16} class="size-4" />
    </button>
  </div>

  <!-- DOW header -->
  <div class="grid grid-cols-7 border-b border-base-300">
    {#each [m.event_cal_sun(), m.event_cal_mon(), m.event_cal_tue(), m.event_cal_wed(), m.event_cal_thu(), m.event_cal_fri(), m.event_cal_sat()] as dow}
      <div class="px-2 py-2 text-center text-xs font-semibold opacity-50 uppercase tracking-wide">{dow}</div>
    {/each}
  </div>

  <!-- Day cells -->
  <div class="grid grid-cols-7">
    {#each calDays as cell, i}
      {@const borderR = (i + 1) % 7 !== 0 ? 'border-r' : ''}
      {@const borderB = i < calDays.length - 7 ? 'border-b' : ''}
      <div
        class="min-h-[5.5rem] p-2 border-base-300 {borderR} {borderB} {cell?.isToday ? 'bg-primary/5' : ''}"
        ondblclick={() => { if (cell && onDayDblClick) onDayDblClick(ds(calYear, calMonth, cell.day)); }}
      >
        {#if cell}
          <span class="text-xs font-semibold
            {cell.isToday ? 'inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-content' : 'opacity-70'}">
            {cell.day}
          </span>
          {#each eventsForDay(events, calYear, calMonth, cell.day) as ev}
            {#if !readonly && onEventClick}
              <button
                type="button"
                class="mt-1 w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate text-white transition-colors {typePillClass(ev.eventType)}"
                onclick={() => onEventClick(ev)}
                title={ev.title}
              >{ev.title}</button>
            {:else}
              <span
                class="mt-1 block w-full text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate text-white {typePillClass(ev.eventType)}"
                title={ev.title}
              >{ev.title}</span>
            {/if}
          {/each}
        {/if}
      </div>
    {/each}
  </div>

</div>
