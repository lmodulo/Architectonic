<script lang="ts">
  // The site tree: every item of the public site, nested as in the menu. Selecting an item opens its
  // panel underneath; dragging or Alt + arrow keys move it.
  import { slide, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { Plus, X } from 'lucide-svelte';
  import { ms } from '$lib/cms/motion';
  import SiteTreeNode from './SiteTreeNode.svelte';
  import AddNodeForm from './AddNodeForm.svelte';
  import { getTreeState } from './tree.svelte';

  const tree = getTreeState();
  const roots = $derived(tree.tree.roots);
</script>

<section class="flex flex-col gap-3" aria-labelledby="cms-tree-heading">
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2">
      <span class="w-0.5 h-4 rounded-full bg-primary"></span>
      <h2 id="cms-tree-heading" class="text-sm font-semibold">Site tree</h2>
    </div>
    {#if tree.busy}
      <span class="loading loading-spinner loading-xs opacity-60" transition:fade={{ duration: ms(150) }} aria-label="Saving"></span>
    {/if}
    <p class="text-xs opacity-60 flex-1 min-w-48">
      {tree.can.update ? 'The order here is the menu order. Drag items to move them, or select one and press Alt + arrow keys.' : 'The order here is the menu order.'}
    </p>
    {#if tree.can.create}
      <button type="button" class="btn btn-sm btn-primary" onclick={() => (tree.addingUnder = null)} disabled={tree.addingUnder === null}>
        <Plus class="size-4" />Add item
      </button>
    {/if}
  </div>

  {#if tree.error}
    <div role="alert" class="alert alert-error text-sm py-2" transition:slide={{ duration: ms(200) }}>
      <span class="flex-1">{tree.error}</span>
      <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Dismiss" onclick={() => (tree.error = '')}><X class="size-4" /></button>
    </div>
  {/if}

  <div class="rounded-box border border-base-300 bg-base-100 p-1.5">
    {#if roots.length === 0 && tree.addingUnder !== null}
      <div class="py-10 text-center flex flex-col items-center gap-3" transition:slide={{ duration: ms(200) }}>
        <p class="text-sm opacity-70">The site has no pages yet.</p>
        {#if tree.can.create}
          <button type="button" class="btn btn-sm btn-primary" onclick={() => (tree.addingUnder = null)}><Plus class="size-4" />Add the first page</button>
        {/if}
      </div>
    {/if}
    <ul>
      {#each roots as item (item.node.id)}
        <li animate:flip={{ duration: ms(200) }} transition:slide={{ duration: ms(200) }}>
          <SiteTreeNode {item} />
        </li>
      {/each}
    </ul>
    {#if tree.addingUnder === null}
      <div transition:slide={{ duration: ms(200) }}>
        <AddNodeForm parentId={null} />
      </div>
    {/if}
  </div>

  <p class="sr-only" aria-live="polite">{tree.announcement}</p>
</section>
