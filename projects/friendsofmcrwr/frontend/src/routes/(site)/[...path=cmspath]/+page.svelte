<script lang="ts">
  import CmsPage from '$lib/components/cms/render/CmsPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<CmsPage view={data.view} componentData={data.componentData} />
