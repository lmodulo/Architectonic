<script lang="ts">
  // Registry component `events`: upcoming public Calendar events, soonest first. Text only: the
  // event description arrives as HTML and is reduced to plain text by the load ($lib/cms/events.ts).
  // As a whole page the events are grouped under month headings; as a block they are one list.
  import { dayOf, eventDates, monthHeading, monthOf, typeLabel, type EventsData, type SiteEvent } from '$lib/cms/events';
  import type { CmsComponentProps } from '$lib/cms/types';

  let { data, mode }: CmsComponentProps = $props();

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
      <li class="flex gap-4 py-4">
        <div class="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-box bg-base-200 leading-none" aria-hidden="true">
          <span class="text-xs uppercase tracking-wide opacity-70">{monthOf(e.start)}</span>
          <span class="text-xl font-bold mt-0.5">{dayOf(e.start)}</span>
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <h3 class="text-lg font-semibold leading-snug text-balance">{e.title}</h3>
          <p class="text-sm opacity-75">
            <time datetime={e.start}>{eventDates(e)}</time>{#if e.location}<span aria-hidden="true">{' · '}</span><span class="sr-only">{', '}</span>{e.location}{/if}
          </p>
          {#if e.summary}<p class="text-sm leading-relaxed {mode === 'block' ? 'line-clamp-2' : ''}">{e.summary}</p>{/if}
          {#if e.eventType !== 'upcoming_event'}<p class="text-xs opacity-60">{typeLabel(e.eventType)}</p>{/if}
        </div>
      </li>
    {/each}
  </ul>
{/snippet}

<!-- The content width of the page's title and text column (max-w-3xl less its px-4), so the list
     lines up with them inside the wider component column -->
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
