<script lang="ts">
  import LogoIcon from '$lib/components/LogoIcon.svelte';

  let { name, logo = '' }: { name: string; logo?: string } = $props();
</script>

{#if logo}
  <img src={logo} alt={name} class="size-6 object-contain" />
{:else}
  <LogoIcon class="size-6 text-primary-700 dark:text-primary-200" />
{/if}
<span class="text-xl font-semibold" style="font-family: var(--heading-font-family);">{name}</span>
