<script lang="ts">
  import type { PageData } from './$types';
  import EventCard from '$lib/components/EventCard.svelte';
  import SubscriptionPanel from '$lib/components/SubscriptionPanel.svelte';
  import { groupByMonth, typeLabel } from '$lib/utils/calendarEvents';

  let { data }: { data: PageData } = $props();

  const groups    = $derived(groupByMonth(data.events ?? []));
  const eventTypes = $derived(data.eventTypes ?? []);
</script>

<svelte:head><title>Calendar Events</title></svelte:head>

<div class="max-w-3xl mx-auto px-4 py-10 space-y-10">

  <div>
    <h1 class="text-3xl font-bold">Events</h1>
    <p class="text-sm opacity-60 mt-1">Upcoming events and announcements.</p>
  </div>

  <!-- Type filter tabs -->
  {#if eventTypes.length > 1}
    <nav class="flex flex-wrap gap-2" aria-label="Event type filter">
      <a
        href="/calendar-events"
        class="btn btn-sm {!data.activeType ? 'preset-filled-primary-500' : 'preset-tonal'}"
      >All</a>
      {#each eventTypes as type}
        <a
          href="/calendar-events?type={encodeURIComponent(type)}"
          class="btn btn-sm {data.activeType === type ? 'preset-filled-primary-500' : 'preset-tonal'}"
        >{typeLabel(type)}</a>
      {/each}
    </nav>
  {/if}

  <!-- Subscription panel -->
  <SubscriptionPanel user={data.user ?? null} {eventTypes} />

  <!-- Events -->
  {#if groups.length === 0}
    <div class="card preset-filled-surface-100-900 p-10 text-center space-y-2">
      <p class="text-lg font-semibold opacity-50">No upcoming events scheduled.</p>
      <p class="text-sm opacity-40">Check back soon.</p>
    </div>
  {:else}
    {#each groups as group}
      <section class="space-y-4">
        <h2 class="text-xs font-semibold uppercase tracking-widest opacity-50 border-b border-surface-200-800 pb-2">
          {group.month}
        </h2>
        {#each group.items as ev}
          <EventCard event={ev} />
        {/each}
      </section>
    {/each}
  {/if}

</div>
