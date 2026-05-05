<script lang="ts">
  import { GripVertical, Clock, AlertCircle } from 'lucide-svelte';
  import { STATUS_COLOR, PRIORITY_COLOR, fmtEffort, fmtDate } from '$lib/utils/agile';
  import type { AgileTask } from '$lib/utils/agile';

  let {
    task,
    draggable = true,
    onclick,
    ondragstart,
  }: {
    task:        AgileTask;
    draggable?:  boolean;
    onclick?:    () => void;
    ondragstart?: (e: DragEvent) => void;
  } = $props();

  const isBlocked  = $derived(task.status === 'Blocked');
  const isOverdue  = $derived(task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'Done' : false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card preset-filled-surface-100-900 p-3 space-y-2.5 border border-surface-200-800
    {isBlocked ? 'border-l-4 border-l-error-500' : ''}
    {draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
    hover:shadow-md transition-all select-none"
  draggable={draggable}
  ondragstart={ondragstart}
  onclick={onclick}
  onkeydown={e => e.key === 'Enter' && onclick?.()}
  role="button"
  tabindex="0"
>
  <!-- Title row -->
  <div class="flex items-start gap-1.5">
    {#if draggable}
      <GripVertical class="size-3.5 shrink-0 opacity-30 mt-0.5" />
    {/if}
    <p class="text-sm font-medium leading-snug flex-1 min-w-0">{task.title}</p>
  </div>

  <!-- Badges -->
  <div class="flex flex-wrap gap-1.5 items-center">
    <span class="badge text-[10px] {PRIORITY_COLOR[task.priority] ?? 'preset-tonal-surface'}">{task.priority}</span>
    <span class="badge text-[10px] {STATUS_COLOR[task.status] ?? 'preset-tonal-surface'}">{task.status}</span>
    {#if isBlocked}
      <span class="flex items-center gap-0.5 text-[10px] text-error-500">
        <AlertCircle class="size-2.5" /> Blocked
      </span>
    {/if}
  </div>

  <!-- Estimate & due date -->
  <div class="flex items-center justify-between text-[10px] opacity-50">
    <span class="flex items-center gap-0.5">
      <Clock class="size-3" />
      {fmtEffort(task.estimateHours)}
      {#if task.actualHours}
        · {fmtEffort(task.actualHours)} logged
      {/if}
    </span>
    {#if task.dueDate}
      <span class="{isOverdue ? 'text-error-500 opacity-100' : ''}">Due {fmtDate(task.dueDate)}</span>
    {/if}
  </div>
</div>
