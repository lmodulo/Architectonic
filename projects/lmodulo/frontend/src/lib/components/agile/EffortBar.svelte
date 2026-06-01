<script lang="ts">
  import { fmtEffort } from '$lib/utils/agile';

  let {
    estimated = 0,
    actual    = 0,
    remaining = 0,
    width     = 200,
    height    = 12,
  }: {
    estimated?: number;
    actual?:    number;
    remaining?: number;
    width?:     number;
    height?:    number;
  } = $props();

  const total   = $derived(Math.max(estimated, actual + remaining, 1));
  const actPct  = $derived((actual    / total) * width);
  const remPct  = $derived((remaining / total) * width);
</script>

<style>
  @keyframes effort-scale-x {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
</style>

<div class="space-y-1">
  <svg viewBox="0 0 {width} {height}" width="100%" {height} class="block rounded overflow-hidden" aria-hidden="true">
    <!-- background -->
    <rect x="0" y="0" width={width} height={height} fill="currentColor" fill-opacity="0.07" rx="3"/>
    <!-- actual (done) -->
    {#if actPct > 0}
      <rect x="0" y="0" width={actPct} height={height} fill="var(--color-success)" rx="3" style="transform-box:fill-box;transform-origin:left center;animation:effort-scale-x 0.7s ease-out both"/>
    {/if}
    <!-- remaining -->
    {#if remPct > 0}
      <rect x={actPct} y="0" width={remPct} height={height} fill="var(--color-primary)" fill-opacity="0.5" rx="3" style="transform-box:fill-box;transform-origin:left center;animation:effort-scale-x 0.7s ease-out 0.15s both"/>
    {/if}
  </svg>
  <div class="flex items-center gap-3 text-[10px] opacity-60">
    <span class="flex items-center gap-1">
      <span class="size-2 rounded-full bg-success inline-block"></span>
      {fmtEffort(actual)} logged
    </span>
    <span class="flex items-center gap-1">
      <span class="size-2 rounded-full bg-primary/50 inline-block"></span>
      {fmtEffort(remaining)} left
    </span>
    <span class="opacity-60">/ {fmtEffort(estimated)} est</span>
  </div>
</div>
