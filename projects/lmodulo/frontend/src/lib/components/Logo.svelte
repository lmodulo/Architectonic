<script lang="ts">
  let { brandName = '', brandLogo = '' }: { brandName?: string; brandLogo?: string } = $props();
</script>

{#if brandLogo}
  <img src={brandLogo} alt={brandName || 'Logo'} class="size-6 object-contain" />
{/if}
{#if brandName}
  <span class="text-xl font-semibold">{brandName}</span>
{/if}
