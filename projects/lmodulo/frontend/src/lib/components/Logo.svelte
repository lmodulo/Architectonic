<script lang="ts">
  let { brandName = '', brandLogo = '' }: { brandName?: string; brandLogo?: string } = $props();
</script>

{#if brandLogo}
  <img src={brandLogo} alt={brandName || 'Logo'} style="height:36px;width:auto;flex-shrink:0;" />
{:else if brandName}
  <span class="text-xl font-semibold">{brandName}</span>
{/if}
