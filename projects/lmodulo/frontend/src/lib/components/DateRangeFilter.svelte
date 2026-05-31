<script lang="ts">
  import type { DateRange } from '$lib/utils/dashboard';

  type Preset = 'all' | '7d' | '30d' | '90d' | 'custom';

  let { value = $bindable<DateRange>({ from: null, to: null }) } = $props();

  let preset  = $state<Preset>('all');
  let open    = $state(false);
  let rawFrom = $state('');
  let rawTo   = $state('');

  const PRESETS: [Preset, string][] = [
    ['all',  'All'],
    ['7d',   '7d' ],
    ['30d',  '30d'],
    ['90d',  '90d'],
  ];

  function pick(p: Preset) {
    if (p === 'custom') { open = !open; return; }
    open   = false;
    preset = p;
    if (p === 'all') { value = { from: null, to: null }; return; }
    const to   = new Date(); to.setHours(23, 59, 59, 999);
    const from = new Date(); from.setHours(0, 0, 0, 0);
    if (p === '7d')  from.setDate(from.getDate() - 7);
    if (p === '30d') from.setDate(from.getDate() - 30);
    if (p === '90d') from.setDate(from.getDate() - 90);
    value = { from, to };
  }

  function applyCustom() {
    open   = false;
    preset = (rawFrom || rawTo) ? 'custom' : 'all';
    value  = {
      from: rawFrom ? new Date(rawFrom + 'T00:00:00') : null,
      to:   rawTo   ? new Date(rawTo   + 'T23:59:59') : null,
    };
  }
</script>

<div class="relative flex items-center gap-0.5">
  {#each PRESETS as [p, label]}
    <button
      type="button"
      onclick={() => pick(p)}
      class="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide transition-all
        {preset === p && !open ? 'bg-base-300 opacity-80' : 'opacity-25 hover:opacity-60'}"
    >{label}</button>
  {/each}
  <button
    type="button"
    onclick={() => pick('custom')}
    title="Custom range"
    class="px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none transition-all
      {preset === 'custom' || open ? 'bg-base-300 opacity-80' : 'opacity-25 hover:opacity-60'}"
  >···</button>

  {#if open}
  <div class="absolute right-0 top-full mt-1.5 z-30 bg-base-200 border border-base-300 rounded-box p-3 shadow-md w-44">
    <div class="space-y-2.5">
      <div>
        <p class="text-[9px] font-semibold uppercase tracking-widest opacity-40 mb-1">From</p>
        <input type="date" bind:value={rawFrom} class="input input-xs w-full" />
      </div>
      <div>
        <p class="text-[9px] font-semibold uppercase tracking-widest opacity-40 mb-1">To</p>
        <input type="date" bind:value={rawTo} class="input input-xs w-full" />
      </div>
      <div class="flex gap-1.5">
        <button type="button" onclick={applyCustom} class="btn btn-xs btn-primary flex-1">Apply</button>
        <button type="button" onclick={() => open = false} class="btn btn-xs flex-1">Cancel</button>
      </div>
    </div>
  </div>
  {/if}
</div>
