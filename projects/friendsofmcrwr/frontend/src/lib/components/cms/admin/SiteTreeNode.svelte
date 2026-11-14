<script lang="ts">
  // One site tree row, its detail panel and its children (recursive). Rows are dragged by their
  // grip; the drop zone is the top, middle or bottom of the row under the pointer (before, inside,
  // after). Alt + arrow keys on a row move it without a mouse.
  import { slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { GripVertical, ChevronRight, Plus, FileText, Puzzle, Link as LinkIcon, FolderOpen, House } from 'lucide-svelte';
  import { ms } from '$lib/cms/motion';
  import NodePanel from './NodePanel.svelte';
  import AddNodeForm from './AddNodeForm.svelte';
  import SiteTreeNode from './SiteTreeNode.svelte';
  import { getTreeState, type DropZone, type MoveDir } from './tree.svelte';
  import type { TreeItem } from '$lib/cms/admin';
  import type { NodeType } from '$lib/cms/types';

  let { item }: { item: TreeItem } = $props();

  const tree = getTreeState();
  const typeIcon: Record<NodeType, typeof FileText> = { page: FileText, component: Puzzle, link: LinkIcon, label: FolderOpen };
  const typeLabel: Record<NodeType, string> = { page: 'Page', component: 'Component', link: 'Link', label: 'Label' };

  const node = $derived(item.node);
  const Icon = $derived(typeIcon[node.type]);
  const selected = $derived(tree.selectedId === node.id);
  const open = $derived(!tree.collapsed[node.id]);
  const zone = $derived(tree.drop?.id === node.id ? tree.drop.zone : null);
  const indent = $derived(0.25 + item.depth * 1.5);
  let row: HTMLElement | undefined = $state();

  function zoneAt(e: DragEvent): DropZone {
    const r = row!.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    if (node.type === 'link') return y < 0.5 ? 'before' : 'after';
    return y < 0.3 ? 'before' : y > 0.7 ? 'after' : 'inside';
  }

  function onDragStart(e: DragEvent) {
    if (!e.dataTransfer || !row) return;
    tree.dragId = node.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-cms-node', node.id);
    e.dataTransfer.setDragImage(row, 16, row.offsetHeight / 2);
  }
  function onDragOver(e: DragEvent) {
    if (!tree.dragId || !e.dataTransfer) return;
    const z = zoneAt(e);
    if (!tree.canDrop(node.id, z)) {
      if (tree.drop?.id === node.id) tree.drop = null;
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (tree.drop?.id !== node.id || tree.drop.zone !== z) tree.drop = { id: node.id, zone: z };
  }
  function onDragLeave(e: DragEvent) {
    if (tree.drop?.id === node.id && !row?.contains(e.relatedTarget as Node | null)) tree.drop = null;
  }
  function onDrop(e: DragEvent) {
    if (!tree.dragId) return;
    e.preventDefault();
    tree.dropOn(node.id, zoneAt(e));
  }
  function onDragEnd() {
    tree.dragId = null;
    tree.drop = null;
  }

  const KEY_MOVES: Record<string, MoveDir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowRight: 'in', ArrowLeft: 'out' };
  function onKeydown(e: KeyboardEvent) {
    const dir = KEY_MOVES[e.key];
    if (!e.altKey || !dir || !tree.can.update) return;
    e.preventDefault();
    if (!tree.busy) tree.moveBy(node.id, dir);
  }
</script>

<!-- Drop target for dragged rows; the keyboard alternative is Alt + arrow keys on the row's button -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={row}
  class="relative flex items-center gap-1 pr-1 py-0.5 rounded-field transition-colors
    {selected ? 'bg-base-200' : 'hover:bg-base-200/60'}
    {zone === 'inside' ? 'ring-2 ring-primary ring-inset bg-primary/10' : ''}
    {tree.dragId === node.id ? 'opacity-40' : ''}"
  style="padding-left: {indent}rem"
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
>
  {#if zone === 'before' || zone === 'after'}
    <span
      class="absolute right-0 h-0.5 rounded-full bg-primary pointer-events-none {zone === 'before' ? '-top-px' : '-bottom-px'}"
      style="left: {indent}rem"
      aria-hidden="true"
    ></span>
  {/if}

  {#if tree.can.update}
    <span
      class="shrink-0 p-1 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
      draggable="true"
      role="presentation"
      title="Drag to move"
      ondragstart={onDragStart}
      ondragend={onDragEnd}
    ><GripVertical class="size-4" /></span>
  {/if}

  {#if item.children.length}
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-square shrink-0"
      aria-expanded={open}
      aria-label="{open ? 'Collapse' : 'Expand'} {node.title}"
      onclick={() => tree.toggle(node.id)}
    ><ChevronRight class="size-4 transition-transform duration-200 {open ? 'rotate-90' : ''}" /></button>
  {:else}
    <span class="w-6 shrink-0" aria-hidden="true"></span>
  {/if}

  <Icon class="size-4 shrink-0 opacity-60" aria-hidden="true" />

  <button
    type="button"
    data-node-button={node.id}
    class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-3 text-left px-1.5 py-1.5 rounded-field"
    aria-expanded={selected}
    aria-controls={selected ? `node-panel-${node.id}` : undefined}
    aria-keyshortcuts={tree.can.update ? 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowRight Alt+ArrowLeft' : undefined}
    onclick={() => tree.select(node.id)}
    onkeydown={onKeydown}
  >
    <span class="font-medium truncate"><span class="sr-only">{typeLabel[node.type]}: </span>{node.title}</span>
    <span class="font-mono text-xs opacity-60 truncate">{node.type === 'link' ? node.url : node.href}</span>
  </button>

  <div class="hidden sm:flex flex-wrap justify-end gap-1 shrink-0">
    {#if node.isHome}<span class="badge badge-sm badge-neutral gap-1"><House class="size-3" />Home</span>{/if}
    {#if tree.isShadowed(node)}
      <span class="badge badge-sm badge-error" title="An app page uses /{node.slug}, so visitors see that page instead">Shadowed</span>
    {/if}
    {#if node.status === 'published' && node.visible}
      <span class="badge badge-sm badge-success">Published</span>
    {:else if node.status === 'published'}
      <span class="badge badge-sm badge-warning" title="Not public until the item above it is published">Hidden by parent</span>
    {:else}
      <span class="badge badge-sm badge-ghost">Draft</span>
    {/if}
    {#if !node.showInMenu}<span class="badge badge-sm badge-outline">Not in menu</span>{/if}
  </div>
  <!-- Phones: one dot for the status -->
  <span
    class="sm:hidden size-2 rounded-full shrink-0 {node.status === 'published' && node.visible ? 'bg-success' : node.status === 'published' ? 'bg-warning' : 'bg-base-content/30'}"
    title={node.status === 'published' && node.visible ? 'Published' : node.status === 'published' ? 'Hidden by parent' : 'Draft'}
  ></span>

  {#if tree.can.create && node.type !== 'link'}
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-square shrink-0"
      aria-label="Add an item under {node.title}"
      title="Add an item under {node.title}"
      onclick={() => { tree.expand(node.id); tree.addingUnder = node.id; }}
    ><Plus class="size-4" /></button>
  {/if}
</div>

{#if selected}
  <div transition:slide={{ duration: ms(200) }}>
    <NodePanel {item} />
  </div>
{/if}

{#if item.children.length && open}
  <ul transition:slide={{ duration: ms(200) }}>
    {#each item.children as child (child.node.id)}
      <li animate:flip={{ duration: ms(200) }} transition:slide={{ duration: ms(200) }}>
        <SiteTreeNode item={child} />
      </li>
    {/each}
  </ul>
{/if}

{#if tree.addingUnder === node.id}
  <div transition:slide={{ duration: ms(200) }}>
    <AddNodeForm parentId={node.id} />
  </div>
{/if}
