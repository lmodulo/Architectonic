<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import SiteShell from '$lib/components/cms/site/SiteShell.svelte';
  import type { PageView } from '$lib/cms/types';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  const view = $derived(page.data.view as PageView | undefined);
</script>

<SiteShell menu={data.menu} breadcrumbs={view?.breadcrumbs}>
  {@render children()}
</SiteShell>
