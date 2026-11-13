<script lang="ts">
  import type { DividerData } from '$lib/cms/types';

  let { data }: { data: DividerData } = $props();
  const space = $derived({ sm: 'my-4', md: 'my-8', lg: 'my-16' }[data.size] ?? 'my-8');
  const gap = $derived({ sm: 'h-4', md: 'h-10', lg: 'h-20' }[data.size] ?? 'h-10');
</script>

{#if data.style === 'space'}
  <div class={gap} aria-hidden="true"></div>
{:else}
  <hr class="border-0 border-t border-base-300 {space}" />
{/if}
