<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { CalendarDaysIcon } from 'lucide-svelte';
  import type { PageData } from './$types';
  import EventCard from '$lib/components/EventCard.svelte';
  import SubscriptionPanel from '$lib/components/SubscriptionPanel.svelte';
  import { groupByMonth, typeLabel } from '$lib/utils/calendarEvents';

  let { data }: { data: PageData } = $props();

  const groups    = $derived(groupByMonth(data.events ?? []));
  const eventTypes = $derived(data.eventTypes ?? []);
</script>

<svelte:head><title>Calendar Events</title></svelte:head>

<PageHeader icon={CalendarDaysIcon} title="Events" subtitle="Upcoming events and announcements." />

<div class="max-w-3xl mx-auto px-4 pt-6 pb-10 space-y-10">

  <!-- Type filter tabs -->
  {#if eventTypes.length > 1}
    <nav class="flex flex-wrap gap-2" aria-label="Event type filter">
      <a
        href="/calendar-events"
        class="btn btn-sm {!data.activeType ? 'btn-primary' : 'btn-ghost'}"
      >All</a>
      {#each eventTypes as type}
        <a
          href="/calendar-events?type={encodeURIComponent(type)}"
          class="btn btn-sm {data.activeType === type ? 'btn-primary' : 'btn-ghost'}"
        >{typeLabel(type)}</a>
      {/each}
    </nav>
  {/if}

  <!-- Subscription panel -->
  <SubscriptionPanel user={data.user ?? null} {eventTypes} />

  <!-- Events -->
  {#if groups.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-10 text-center space-y-2">
      <p class="text-lg font-semibold opacity-50">No upcoming events scheduled.</p>
      <p class="text-sm opacity-40">Check back soon.</p>
    </div>
  {:else}
    {#each groups as group}
      <section class="space-y-4">
        <h2 class="text-xs font-semibold uppercase tracking-widest opacity-50 border-b border-base-300 pb-2">
          {group.month}
        </h2>
        {#each group.items as ev}
          <EventCard event={ev} />
        {/each}
      </section>
    {/each}
  {/if}

</div>
