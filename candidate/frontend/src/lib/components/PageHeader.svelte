<script lang="ts">
  import type { Snippet } from 'svelte';
  let { title, subtitle, children }: { title: string; subtitle?: string; children?: Snippet } = $props();
</script>

<div>
  <h1 class="text-2xl font-bold">{title}</h1>
  {#if subtitle}
    <p class="text-sm opacity-60 mt-0.5">{subtitle}</p>
  {:else if children}
    <p class="text-sm opacity-60 mt-0.5">{@render children()}</p>
  {/if}
</div>
