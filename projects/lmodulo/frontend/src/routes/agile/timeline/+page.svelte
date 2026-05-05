<script lang="ts">
  import type { PageData } from './$types';
  import GanttChart from '$lib/components/agile/GanttChart.svelte';
  import type { AgileMilestone, AgileSprint } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  const milestones = $derived((data.milestones ?? []) as AgileMilestone[]);
  const sprints    = $derived((data.sprints    ?? []) as AgileSprint[]);
</script>

<svelte:head><title>Agile Timeline</title></svelte:head>

<div class="space-y-5">
  <div>
    <h2 class="text-lg font-semibold">Timeline</h2>
    <p class="text-xs opacity-50 mt-0.5">Gantt view of milestones and sprints. Click a row to navigate.</p>
  </div>

  <div class="card preset-filled-surface-100-900 p-4">
    {#if milestones.length === 0}
      <p class="text-sm opacity-40 text-center py-12">No milestones with dates to display.</p>
    {:else}
      <GanttChart {milestones} {sprints} />
    {/if}
  </div>

  <!-- Legend -->
  <div class="flex items-center gap-6 text-xs opacity-60">
    <span class="flex items-center gap-2">
      <span class="inline-block w-8 h-3 rounded bg-primary-500/80"></span>
      Milestone
    </span>
    <span class="flex items-center gap-2">
      <span class="inline-block w-8 h-3 rounded bg-secondary-500/55"></span>
      Sprint
    </span>
    <span class="flex items-center gap-2">
      <span class="inline-block w-px h-4 bg-error-500 opacity-70"></span>
      Today
    </span>
  </div>
</div>
