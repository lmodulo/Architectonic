<script lang="ts">
  // friendsofmcrwr's landing page at `/`; its loader is $lib/server/module-home/00-landing.ts
  import Landing from '$lib/components/mcrwr/Landing.svelte';

  let { data } = $props();
</script>

<Landing {data} />
