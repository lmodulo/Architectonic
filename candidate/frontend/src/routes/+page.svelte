<script lang="ts">
  import ScaffoldHome from '$lib/components/ScaffoldHome.svelte';
  import { MODULE_HOME_COMPONENTS } from '$lib/config/module-home';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // A module's home page (see $lib/server/module-home.ts) replaces the scaffold one when its loader returns data
  const Home = $derived(data.moduleHome ? MODULE_HOME_COMPONENTS[data.moduleHome.key] : undefined);
</script>

{#if Home && data.moduleHome}
  <Home data={data.moduleHome.data} />
{:else}
  <ScaffoldHome />
{/if}
