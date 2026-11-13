<script lang="ts">
  import { LayoutTemplate, FileText, Puzzle, Link as LinkIcon, FolderOpen, House, ExternalLink } from 'lucide-svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import type { CmsNode, NodeType } from '$lib/cms/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const typeIcon: Record<NodeType, typeof FileText> = { page: FileText, component: Puzzle, link: LinkIcon, label: FolderOpen };
  const typeLabel: Record<NodeType, string> = { page: 'Page', component: 'Component', link: 'Link', label: 'Label' };

  // GET /cms/nodes lists parents before their children, so depth can be read off in one pass
  const rows = $derived.by(() => {
    const depth = new Map<string, number>();
    return data.nodes.map((n: CmsNode) => {
      const d = n.parentId ? (depth.get(n.parentId) ?? -1) + 1 : 0;
      depth.set(n.id, d);
      return { node: n, depth: d };
    });
  });
</script>

<svelte:head><title>Content</title></svelte:head>

<div data-no-anim class="flex flex-col gap-6">
  <PageHeader icon={LayoutTemplate} title="Content" subtitle="Site · Settings" />

  {#if data.loadFailed}
    <div role="alert" class="alert alert-error text-sm">The site tree could not be loaded.</div>
  {:else if rows.length === 0}
    <p class="text-sm opacity-60">The site has no pages yet.</p>
  {:else}
    <div class="rounded-box border border-base-300 bg-base-100 overflow-x-auto">
      <table class="table table-sm">
        <thead>
          <tr><th>Item</th><th>URL</th><th>Status</th></tr>
        </thead>
        <tbody>
          {#each rows as { node, depth } (node.id)}
            {@const Icon = typeIcon[node.type]}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td>
                <div class="flex items-center gap-2" style="padding-left: {depth * 1.25}rem">
                  <Icon class="size-4 shrink-0 opacity-60" aria-label={typeLabel[node.type]} />
                  <span class="font-medium">{node.title}</span>
                  {#if node.isHome}<House class="size-3.5 opacity-60" aria-label="Home page" />{/if}
                </div>
              </td>
              <td class="font-mono text-xs opacity-70">
                {#if node.type === 'link'}
                  <span class="inline-flex items-center gap-1">{node.url}{#if node.newTab}<ExternalLink class="size-3" />{/if}</span>
                {:else}
                  {node.href}
                {/if}
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  {#if node.status === 'published'}
                    <span class="badge badge-sm badge-success">Published</span>
                  {:else}
                    <span class="badge badge-sm badge-ghost">Draft</span>
                  {/if}
                  {#if node.status === 'published' && !node.visible}
                    <span class="badge badge-sm badge-warning">Hidden by parent</span>
                  {/if}
                  {#if !node.showInMenu}
                    <span class="badge badge-sm badge-outline">Hidden from menu</span>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
