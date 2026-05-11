<script lang="ts">
  import { healthColor } from '$lib/utils/crm';

  let { score = 0, showLabel = true }: { score?: number; showLabel?: boolean } = $props();
  const pct   = $derived(Math.min(100, Math.max(0, score)));
  const color = $derived(healthColor(pct));
</script>

<div class="flex items-center gap-2 min-w-0">
  <div class="flex-1 h-1.5 rounded-full bg-base-300 overflow-hidden min-w-[48px]">
    <div
      class="h-full rounded-full transition-all duration-300"
      style="width: {pct}%; background-color: {color};"
    ></div>
  </div>
  {#if showLabel}
    <span class="text-xs tabular-nums opacity-60 shrink-0">{pct}</span>
  {/if}
</div>
