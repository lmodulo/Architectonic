<script lang="ts">
  // The `events` page type and block this module adds to Content (registry entry
  // $lib/config/cms-components/events.ts): upcoming public Calendar events, soonest first. Text only: the
  // event description arrives as HTML and is reduced to plain text by the load ($lib/utils/siteEvents.ts).
  // As a whole page the events are grouped under month headings; as a block they are one list.
  // An event's photos and videos show as a gallery: all of them on a page, a row of four in a block.
  // Must not import Content's code (this module has to build without Content).
  import EventMediaGallery from '$lib/components/EventMediaGallery.svelte';
  import { dayOf, eventDates, eventDatetime, eventTimes, monthHeading, monthOf, typeLabel, type EventsData, type SiteEvent } from '$lib/utils/siteEvents';

  // Content also passes `props` and `rest` (its CmsComponentProps)
  let { data, mode }: { data: unknown; mode: 'page' | 'block'; props?: Record<string, unknown>; rest?: string | null } = $props();

  const loaded = $derived(data as EventsData | undefined);
  const events = $derived(loaded && 'events' in loaded ? loaded.events : null);
  const months = $derived.by(() => {
    const out: { heading: string; events: SiteEvent[] }[] = [];
    for (const e of events ?? []) {
      const heading = monthHeading(e.start);
      if (out.at(-1)?.heading === heading) out.at(-1)!.events.push(e);
      else out.push({ heading, events: [e] });
    }
    return out;
  });
</script>

{#snippet list(items: SiteEvent[])}
  <ul class="flex flex-col divide-y divide-base-300 border-y border-base-300">
    {#each items as e, i (`${e.id}-${i}`)}
      {@const times = eventTimes(e)}
      <li class="flex gap-4 py-4">
        <div class="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-box bg-base-200 leading-none" aria-hidden="true">
          <span class="text-xs uppercase tracking-wide opacity-70">{monthOf(e.start)}</span>
          <span class="text-xl font-bold mt-0.5">{dayOf(e.start)}</span>
        </div>
        <div class="flex flex-col gap-1 min-w-0 flex-1">
          <h3 class="text-lg font-semibold leading-snug text-balance">{e.title}</h3>
          <p class="text-sm opacity-75">
            <time datetime={eventDatetime(e)}>{eventDates(e)}</time>{#if times}<span aria-hidden="true">{' · '}</span><span class="sr-only">{', '}</span>{times}{/if}{#if e.location}<span aria-hidden="true">{' · '}</span><span class="sr-only">{', '}</span>{e.location}{/if}
          </p>
          {#if e.summary}<p class="text-sm leading-relaxed {mode === 'block' ? 'line-clamp-2' : ''}">{e.summary}</p>{/if}
          {#if e.eventType !== 'upcoming_event'}<p class="text-xs opacity-60">{typeLabel(e.eventType)}</p>{/if}
          {#if e.media.length}
            <div class="mt-2"><EventMediaGallery media={e.media} title={e.title} compact={mode === 'block'} /></div>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{/snippet}

<!-- The content width of Content's text column (max-w-3xl less its px-4). A whole Events page already has
     that width; as a block, inside Content's wider component-block column, this keeps the list in line with the text -->
<div class="cms-events not-prose w-full max-w-[46rem] mx-auto">
  {#if !events}
    <p class="text-sm opacity-60">Events are unavailable right now.</p>
  {:else if events.length === 0}
    <p class="text-sm opacity-60">There are no upcoming events right now.</p>
  {:else if mode === 'page'}
    <div class="flex flex-col gap-8">
      {#each months as m (m.heading)}
        <section class="flex flex-col gap-3" aria-labelledby="ev-{m.heading.replace(/\W+/g, '-')}">
          <h2 id="ev-{m.heading.replace(/\W+/g, '-')}" class="text-xl font-semibold tracking-tight">{m.heading}</h2>
          {@render list(m.events)}
        </section>
      {/each}
    </div>
  {:else}
    {@render list(events)}
  {/if}
</div>
