<script lang="ts">
  import { Phone, Mail, CalendarDays, MonitorPlay, FileText, CheckSquare, CheckCircle } from 'lucide-svelte';
  import { ACTIVITY_TYPE_COLOR, fmtDate, fmtCurrency, type CrmActivity } from '$lib/utils/crm';

  const ICONS: Record<string, any> = {
    Call: Phone, Email: Mail, Meeting: CalendarDays,
    Demo: MonitorPlay, Note: FileText, Task: CheckSquare,
  };

  let {
    activity,
    onComplete,
  }: {
    activity: CrmActivity;
    onComplete?: (id: string) => void;
  } = $props();

  const Icon = $derived(ICONS[activity.type] ?? FileText);
  const done = $derived(!!activity.completedAt);
</script>

<div class="flex items-start gap-3 py-2.5 border-b border-base-300/50 last:border-0">
  <div class="mt-0.5 p-1.5 rounded-lg bg-base-300/50 shrink-0">
    <Icon class="size-3.5 opacity-60" />
  </div>
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm font-medium {done ? 'line-through opacity-50' : ''}">{activity.title}</span>
      <span class="badge badge-xs {ACTIVITY_TYPE_COLOR[activity.type] ?? 'badge-ghost'}">{activity.type}</span>
      {#if activity.outcome && activity.outcome !== 'N/A'}
        <span class="badge badge-xs badge-ghost">{activity.outcome}</span>
      {/if}
    </div>
    {#if activity.body}
      <p class="text-xs opacity-50 mt-0.5 line-clamp-2">{activity.body}</p>
    {/if}
    <div class="text-xs opacity-40 mt-0.5">
      {#if activity.scheduledAt}
        {fmtDate(activity.scheduledAt)}
      {:else}
        {fmtDate(activity.createdAt)}
      {/if}
    </div>
  </div>
  {#if !done && onComplete}
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-square shrink-0 opacity-40 hover:opacity-100"
      title="Mark complete"
      onclick={() => onComplete!(activity.id)}
    >
      <CheckCircle class="size-4" />
    </button>
  {:else if done}
    <CheckCircle class="size-4 shrink-0 text-success opacity-60 mt-0.5" />
  {/if}
</div>
