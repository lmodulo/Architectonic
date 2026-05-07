<script lang="ts">
  import EventTypeBadge from './EventTypeBadge.svelte';
  import { fmtDateRange, fmtShortRange, typePreset, type CalendarEvent } from '$lib/utils/calendarEvents';
  import { MapPin, User } from 'lucide-svelte';

  let {
    event,
    compact = false,
    showType = true,
  }: {
    event: CalendarEvent;
    compact?: boolean;
    showType?: boolean;
  } = $props();

  const startDate = $derived(new Date(event.startDate + 'T00:00:00'));
</script>

<article class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
  <div class="px-6 py-5 {compact ? '' : 'border-b border-base-300'} flex items-start gap-4">
    <!-- Date badge -->
    <div class="shrink-0 flex flex-col items-center justify-center rounded-lg {typePreset(event.eventType)} w-14 h-14">
      <span class="text-xs font-semibold uppercase opacity-70 leading-none">
        {startDate.toLocaleString('en-US', { month: 'short' })}
      </span>
      <span class="text-2xl font-bold leading-none">{startDate.getDate()}</span>
    </div>

    <div class="flex-1 min-w-0 space-y-1">
      <div class="flex items-start gap-2 flex-wrap">
        <h3 class="text-{compact ? 'base' : 'lg'} font-semibold leading-tight flex-1 min-w-0">{event.title}</h3>
        {#if showType}
          <EventTypeBadge type={event.eventType} />
        {/if}
      </div>
      <p class="text-sm opacity-60">{compact ? fmtShortRange(event) : fmtDateRange(event)}</p>
      {#if event.location}
        <p class="text-xs opacity-50 flex items-center gap-1">
          <MapPin class="size-3" />
          {event.location}
        </p>
      {/if}
      {#if !compact && event.ownerName}
        <p class="text-xs opacity-40 flex items-center gap-1 mt-0.5">
          <User class="size-3 shrink-0" />
          by {event.ownerName}
          {#if event.visibility === 'public'}
            · public
          {:else if event.visibility === 'shared' && event.sharedWith && event.sharedWith.length > 0}
            · shared with {event.sharedWith.length} {event.sharedWith.length === 1 ? 'person' : 'people'}
          {:else if event.visibility === 'private'}
            · private
          {/if}
        </p>
      {/if}
      {#if event.tags.length > 0 && !compact}
        <div class="flex flex-wrap gap-1 mt-1">
          {#each event.tags as tag}
            <span class="badge badge-ghost text-xs">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  {#if !compact && event.content && event.content !== '<p></p>'}
    <div class="px-6 py-5 prose prose-sm dark:prose-invert max-w-none">
      {@html event.content}
    </div>
  {/if}
</article>
