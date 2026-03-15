<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <div>
    <h1 class="h3 font-bold">GitHub</h1>
    <p class="text-sm opacity-60 mt-1">Connected repositories.</p>
  </div>

  <div class="card preset-filled-surface-100-900 divide-y divide-surface-200-800">
    {#if data.items.length === 0}
      <p class="px-5 py-8 text-sm opacity-50 text-center">No repositories connected.</p>
    {:else}
      {#each data.items as item}
        <div class="px-5 py-4 text-sm">{JSON.stringify(item)}</div>
      {/each}
    {/if}
  </div>
</div>
