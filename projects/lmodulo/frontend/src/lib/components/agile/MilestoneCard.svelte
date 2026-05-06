<script lang="ts">
  import { Milestone, Calendar, Layers } from 'lucide-svelte';
  import { STATUS_COLOR, PRIORITY_COLOR, fmtDateRange, completionColor } from '$lib/utils/agile';
  import type { AgileMilestone } from '$lib/utils/agile';

  let { milestone, onclick }: { milestone: AgileMilestone; onclick?: () => void } = $props();

  const pct    = $derived(Math.round(milestone.completionPct ?? 0));
  const barClr = $derived(completionColor(pct));
</script>

<div
  class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4 cursor-pointer hover:bg-base-300/50 transition-colors"
  role="button"
  tabindex="0"
  onclick={onclick}
  onkeydown={e => e.key === 'Enter' && onclick?.()}
>
  <!-- Header -->
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <Milestone class="size-4 shrink-0 text-primary" />
      <h3 class="font-semibold truncate text-sm">{milestone.title}</h3>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <span class="badge text-xs {PRIORITY_COLOR[milestone.priority] ?? 'badge-ghost'}">{milestone.priority}</span>
      <span class="badge text-xs {STATUS_COLOR[milestone.status] ?? 'badge-ghost'}">{milestone.status}</span>
    </div>
  </div>

  <!-- Goal -->
  {#if milestone.strategicGoal}
    <p class="text-xs opacity-60 line-clamp-2">{milestone.strategicGoal}</p>
  {/if}

  <!-- Progress bar -->
  <div class="space-y-1">
    <div class="flex items-center justify-between text-xs">
      <span class="opacity-60">Progress</span>
      <span class="font-semibold" style="color:{barClr}">{pct}%</span>
    </div>
    <div class="w-full h-2 rounded-full bg-base-300 overflow-hidden">
      <div class="h-full rounded-full transition-all" style="width:{pct}%;background:{barClr}"></div>
    </div>
  </div>

  <!-- Meta -->
  <div class="flex items-center justify-between text-xs opacity-50">
    <span class="flex items-center gap-1">
      <Calendar class="size-3" />
      {fmtDateRange(milestone.startDate ?? null, milestone.endDate ?? null)}
    </span>
    <span class="flex items-center gap-1">
      <Layers class="size-3" />
      {milestone.sprintCount ?? 0} sprints · {milestone.taskCount ?? 0} tasks
    </span>
  </div>
</div>
