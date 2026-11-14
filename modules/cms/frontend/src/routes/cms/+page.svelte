<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { hasPermission } from '$lib/permissions';
  import SiteTree from '$lib/components/cms/admin/SiteTree.svelte';
  import { TreeState, setTreeState } from '$lib/components/cms/admin/tree.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // The layout re-creates this page on every visit (it keys on the path), and the tree keeps its
  // own copy of the nodes from then on, so the load data is read once.
  const tree = setTreeState(untrack(() => {
    const user = page.data.user;
    return new TreeState(data.nodes, data.reserved, data.routeSlugs, {
      create: hasPermission(user, 'cms_nodes', 'create'),
      update: hasPermission(user, 'cms_nodes', 'update'),
      delete: hasPermission(user, 'cms_nodes', 'delete'),
      publish: hasPermission(user, 'cms_publish', 'update'),
      pages: hasPermission(user, 'cms_pages', 'read'),
    });
  }));

  // ?node=<id> opens that item's panel (the page builder links back this way)
  untrack(() => {
    const requested = page.url.searchParams.get('node');
    if (requested && tree.item(requested)) tree.selectedId = requested;
  });
</script>

<svelte:head><title>Content · Site</title></svelte:head>

{#if data.loadFailed}
  <div role="alert" class="alert alert-error text-sm">The site tree could not be loaded. Reload the page to try again.</div>
{:else}
  <SiteTree />
{/if}
