<script lang="ts">
  // The CMS home page at `/`: the same site shell and renderer as every other public page.
  import SiteShell from '$lib/components/cms/site/SiteShell.svelte';
  import CmsPage from '$lib/components/cms/render/CmsPage.svelte';
  import type { PageView, SiteMenu } from '$lib/cms/types';

  let { data }: { data: { menu: SiteMenu; view: PageView; componentData: Record<string, unknown> } } = $props();
</script>

<SiteShell menu={data.menu}>
  <CmsPage view={data.view} componentData={data.componentData} />
</SiteShell>
