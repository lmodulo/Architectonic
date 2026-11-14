<script lang="ts">
  // The draft as visitors would see it, inside the public site's chrome, with a ribbon saying so.
  // Bare route (lib/config/module-routes/cms.ts) and reset to the root layout, so no app shell.
  import { Eye, Pencil } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import SiteShell from '$lib/components/cms/site/SiteShell.svelte';
  import CmsPage from '$lib/components/cms/render/CmsPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const canOpenEditor = $derived(data.view.node.type === 'page' && hasPermission(data.user, 'cms_pages', 'read'));
</script>

<svelte:head><meta name="robots" content="noindex, nofollow" /></svelte:head>

<SiteShell menu={data.menu} breadcrumbs={data.view.breadcrumbs}>
  <CmsPage view={data.view} componentData={data.componentData} />
</SiteShell>

<div
  class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-warning text-warning-content shadow-lg pl-4 pr-1.5 py-1.5 text-sm max-w-[calc(100vw-2rem)]"
  role="status"
>
  <Eye class="size-4 shrink-0" />
  <span class="font-semibold whitespace-nowrap">Draft preview</span>
  <span class="hidden sm:inline opacity-80 whitespace-nowrap">Visitors don't see this version yet</span>
  {#if canOpenEditor}
    <a href="/cms/pages/{data.view.node.id}" class="btn btn-xs rounded-full bg-warning-content text-warning border-0 hover:opacity-90"><Pencil class="size-3" />Edit</a>
  {/if}
</div>
