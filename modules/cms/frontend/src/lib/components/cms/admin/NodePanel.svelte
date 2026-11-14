<script lang="ts">
  // The detail panel under a selected site tree item: its fields, publishing, moving and deleting.
  // Field edits are saved together with Save; publish, unpublish, move and delete act at once.
  import { untrack } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import {
    ArrowUp, ArrowDown, ListIndentIncrease, ListIndentDecrease, Pencil, Eye, ExternalLink, House, Trash2, TriangleAlert,
  } from 'lucide-svelte';
  import { page } from '$app/state';
  import { cmsApi, defaultComponent, defaultProps, missingModule, missingModuleText, pageComponents, pathFor, slugProblem, type TreeItem } from '$lib/cms/admin';
  import { CMS_COMPONENTS } from '$lib/cms/components';
  import { safeHref, toSlug } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import PropsEditor from './PropsEditor.svelte';
  import { getTreeState, type MoveDir } from './tree.svelte';
  import type { CmsNode, NodeType } from '$lib/cms/types';

  let { item }: { item: TreeItem } = $props();

  const tree = getTreeState();
  const uid = $props.id();
  const components = pageComponents();
  const node = $derived(item.node);
  const readonly = !tree.can.update;

  interface Form {
    title: string; type: NodeType; slug: string; showInMenu: boolean;
    url: string; newTab: boolean; componentKey: string; props: Record<string, unknown>;
  }
  const fromNode = (n: CmsNode): Form => ({
    title: n.title, type: n.type, slug: n.slug ?? '', showInMenu: n.showInMenu,
    url: n.url ?? '', newTab: n.newTab, componentKey: n.component?.key ?? '', props: { ...(n.component?.props ?? {}) },
  });

  // The form starts from the item as it is when the panel opens; after a save it restarts from the saved item
  let saved = $state(untrack(() => fromNode(item.node)));
  let form = $state(untrack(() => fromNode(item.node)));
  // A draft item whose slug still matches its title keeps following the title
  let slugFollows = $state(untrack(() => item.node.status === 'draft' && item.node.slug === toSlug(item.node.title)));
  let error = $state('');
  let notice = $state<{ kind: 'success' | 'warning'; lines: string[] } | null>(null);
  let saving = $state(false);
  let confirmDelete = $state(false);

  const dirty = $derived(JSON.stringify(form) !== JSON.stringify(saved));
  $effect(() => { tree.panelDirty = dirty; });
  $effect(() => () => { tree.panelDirty = false; });

  const parentId = $derived(item.parent?.node.id ?? null);
  const slugError = $derived(form.type === 'link' ? null
    : slugProblem(form.slug, { parentId, selfId: node.id, nodes: tree.nodes, reserved: tree.reserved }));
  const urlError = $derived(form.type === 'link' && !safeHref(form.url) ? 'Enter a URL starting with https://, http://, mailto:, tel:, / or #.' : null);
  const titleError = $derived(form.title.trim() ? null : 'Add a title.');
  const componentError = $derived(form.type === 'component' && !form.componentKey ? 'Choose a component.' : null);
  const valid = $derived(!titleError && !slugError && !urlError && !componentError);
  const entry = $derived(form.type === 'component' ? CMS_COMPONENTS[form.componentKey] : undefined);
  const unknownComponent = $derived(form.type === 'component' && !!form.componentKey && !entry);
  const missing = $derived(missingModule(entry, page.data.user));
  const slugChanged = $derived(node.status === 'published' && node.type !== 'link' && form.slug !== saved.slug);

  function onTitle(v: string) {
    form.title = v;
    if (slugFollows && form.type !== 'link') form.slug = toSlug(v);
  }

  function onType(t: NodeType) {
    form.type = t;
    if (t !== 'link' && !form.slug) { form.slug = toSlug(form.title); slugFollows = node.status === 'draft'; }
    const first = defaultComponent(components);
    if (t === 'component' && !form.componentKey && first) {
      form.componentKey = first.key;
      form.props = defaultProps(first.props);
    }
  }

  function onComponent(key: string) {
    form.componentKey = key;
    form.props = defaultProps(CMS_COMPONENTS[key]?.props);
  }

  function reset() {
    form = fromNode(node);
    saved = fromNode(node);
    error = '';
  }

  async function save(e?: SubmitEvent) {
    e?.preventDefault();
    if (!dirty || !valid || readonly) return;
    const body: Record<string, unknown> = {};
    if (form.title !== saved.title) body.title = form.title.trim();
    if (form.type !== saved.type) body.type = form.type;
    if (form.showInMenu !== saved.showInMenu) body.showInMenu = form.showInMenu;
    if (form.type === 'link') {
      if (form.url !== saved.url || form.type !== saved.type) body.url = form.url.trim();
      if (form.newTab !== saved.newTab || form.type !== saved.type) body.newTab = form.newTab;
    } else if (form.slug !== saved.slug || form.type !== saved.type) {
      body.slug = form.slug;
    }
    if (form.type === 'component' && (form.componentKey !== saved.componentKey || JSON.stringify(form.props) !== JSON.stringify(saved.props) || form.type !== saved.type)) {
      body.component = { key: form.componentKey, props: $state.snapshot(form.props) };
    }
    saving = true;
    error = '';
    notice = null;
    const res = await tree.write(() => cmsApi<CmsNode>(`nodes/${node.id}`, { method: 'PATCH', body }));
    saving = false;
    if (!res.ok || !res.data) { error = res.message; return; }
    form = fromNode(res.data);
    saved = fromNode(res.data);
    slugFollows = res.data.status === 'draft' && res.data.slug === toSlug(res.data.title);
    notice = { kind: 'success', lines: ['Saved.'] };
  }

  async function publish(action: 'publish' | 'unpublish') {
    error = '';
    notice = null;
    const res = await tree.write(() => cmsApi<{ warnings: string[] }>(`pages/${node.id}/${action}`, { method: 'POST' }));
    if (!res.ok) { error = res.message; return; }
    const warnings = res.data?.warnings ?? [];
    notice = warnings.length
      ? { kind: 'warning', lines: warnings }
      : { kind: 'success', lines: [action === 'publish' ? 'Published.' : 'Unpublished. It is no longer on the site.'] };
    tree.announcement = notice.lines.join(' ');
  }

  async function makeHome() {
    error = '';
    notice = null;
    const res = await tree.write(() => cmsApi(`settings`, { method: 'PATCH', body: { homeNodeId: node.id } }));
    if (!res.ok) { error = res.message; return; }
    notice = node.visible
      ? { kind: 'success', lines: [`"${node.title}" is now the home page.`] }
      : { kind: 'warning', lines: [`"${node.title}" is now the home page. Until it is published, the site shows the default home page.`] };
  }

  async function remove() {
    error = '';
    const title = node.title;
    const res = await tree.write(() => cmsApi(`nodes/${node.id}`, { method: 'DELETE' }));
    if (!res.ok) { error = res.message; confirmDelete = false; return; }
    tree.panelDirty = false;
    tree.selectedId = null;
    tree.announcement = `Deleted "${title}".`;
  }

  const moves: { dir: MoveDir; label: string; icon: typeof ArrowUp }[] = [
    { dir: 'up', label: 'Move up', icon: ArrowUp },
    { dir: 'down', label: 'Move down', icon: ArrowDown },
    { dir: 'out', label: 'Outdent', icon: ListIndentDecrease },
    { dir: 'in', label: 'Indent', icon: ListIndentIncrease },
  ];
</script>

<form
  id="node-panel-{node.id}"
  class="mt-1 mb-2 mr-2 rounded-box border border-base-300 bg-base-200/40 p-4 flex flex-col gap-4"
  style="margin-left: {0.25 + item.depth * 1.5}rem"
  aria-label="Edit {node.title}"
  onsubmit={save}
>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium" for="{uid}-title">Title</label>
      <input id="{uid}-title" class="input input-sm w-full" value={form.title} maxlength="200" disabled={readonly} oninput={e => onTitle(e.currentTarget.value)} aria-invalid={!!titleError} />
      {#if titleError}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>{titleError}</p>{/if}
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium" for="{uid}-type">Type</label>
      <select id="{uid}-type" class="select select-sm w-full" value={form.type} disabled={readonly} onchange={e => onType(e.currentTarget.value as NodeType)}>
        <option value="page">Page</option>
        <option value="label">Label (menu heading)</option>
        <option value="link" disabled={item.children.length > 0}>Link{item.children.length ? ' (move its items first)' : ''}</option>
        <option value="component" disabled={!components.length && node.type !== 'component'}>Component</option>
      </select>
      {#if form.type !== saved.type && saved.type === 'page'}
        <p class="text-xs opacity-70" transition:slide={{ duration: ms(200) }}>The page's content is kept, and comes back if you make it a page again.</p>
      {/if}
    </div>

    {#if form.type === 'link'}
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="{uid}-url">URL</label>
        <input id="{uid}-url" class="input input-sm w-full font-mono" inputmode="url" value={form.url} maxlength="2048" disabled={readonly} oninput={e => (form.url = e.currentTarget.value.trim())} aria-invalid={!!urlError} />
        {#if urlError}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>{urlError}</p>{/if}
      </div>
      <label class="flex items-center gap-2 text-sm cursor-pointer sm:mt-6">
        <input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.newTab} disabled={readonly} /> Open in a new tab
      </label>
    {:else}
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="{uid}-slug">Slug</label>
        <input
          id="{uid}-slug"
          class="input input-sm w-full font-mono"
          value={form.slug}
          maxlength="80"
          disabled={readonly}
          aria-describedby="{uid}-path"
          aria-invalid={!!slugError}
          oninput={e => { form.slug = e.currentTarget.value.trim(); slugFollows = false; }}
        />
        <p id="{uid}-path" class="text-xs opacity-60 font-mono break-all">{node.isHome ? `/ (home page; also ${pathFor(parentId, form.slug || '…', tree.nodes)})` : pathFor(parentId, form.slug || '…', tree.nodes)}</p>
        {#if slugError}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>{slugError}</p>{/if}
        {#if slugChanged && !slugError}
          <p class="text-xs text-warning" transition:slide={{ duration: ms(200) }}>This changes the URL of this item and everything under it. Links inside the site follow; links from other sites and bookmarks will break.</p>
        {/if}
      </div>
      <label class="flex items-center gap-2 text-sm cursor-pointer sm:mt-6">
        <input type="checkbox" class="toggle toggle-sm" bind:checked={form.showInMenu} disabled={readonly} /> Show in the menu
      </label>
    {/if}
  </div>

  {#if form.type === 'link'}
    <label class="flex items-center gap-2 text-sm cursor-pointer -mt-2">
      <input type="checkbox" class="toggle toggle-sm" bind:checked={form.showInMenu} disabled={readonly} /> Show in the menu
    </label>
  {/if}

  {#if form.type === 'component'}
    <div class="flex flex-col gap-3 rounded-box bg-base-100 border border-base-300 p-3" transition:slide={{ duration: ms(200) }}>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="{uid}-component">Component</label>
        <select id="{uid}-component" class="select select-sm w-full sm:max-w-xs" value={form.componentKey} disabled={readonly} onchange={e => onComponent(e.currentTarget.value)}>
          {#if unknownComponent}<option value={form.componentKey}>{form.componentKey} (not installed)</option>{/if}
          {#each components as c (c.key)}<option value={c.key}>{c.label}</option>{/each}
        </select>
        {#if entry}<p class="text-xs opacity-60">{entry.description}</p>{/if}
      </div>
      {#if unknownComponent}
        <p class="text-sm text-warning flex items-start gap-2"><TriangleAlert class="size-4 shrink-0 mt-0.5" />No component called "{form.componentKey}" is installed, so this page shows only its title on the site.</p>
      {/if}
      {#if entry && missing}
        <p class="text-sm text-warning flex items-start gap-2" transition:slide={{ duration: ms(200) }}><TriangleAlert class="size-4 shrink-0 mt-0.5" />{missingModuleText(entry.label, missing)}</p>
      {/if}
      {#if entry?.props?.length}
        <PropsEditor specs={entry.props} props={form.props} disabled={readonly} onchange={p => (form.props = p)} />
      {/if}
    </div>
  {/if}

  {#if error}<div role="alert" class="alert alert-error text-sm py-2" transition:slide={{ duration: ms(200) }}>{error}</div>{/if}
  {#if notice}
    <div role="status" class="alert {notice.kind === 'warning' ? 'alert-warning' : 'alert-success'} text-sm py-2" transition:slide={{ duration: ms(200) }}>
      <div class="flex flex-col gap-0.5">{#each notice.lines as line}<span>{line}</span>{/each}</div>
    </div>
  {/if}

  <div class="flex flex-wrap items-center gap-2">
    {#if !readonly}
      <button type="submit" class="btn btn-primary btn-sm" disabled={!dirty || !valid || saving}>
        {#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
        Save
      </button>
      {#if dirty}
        <button type="button" class="btn btn-ghost btn-sm" onclick={reset} transition:fade={{ duration: ms(150) }}>Discard changes</button>
      {/if}
    {/if}
    {#if node.type === 'page' && tree.can.pages}
      <a href="/cms/pages/{node.id}" class="btn btn-sm btn-outline"><Pencil class="size-4" />Edit content</a>
    {/if}
    {#if node.type !== 'link' && node.visible && node.href}
      <a href={node.href} class="btn btn-sm btn-ghost" target="_blank" rel="noopener"><ExternalLink class="size-4" />View</a>
    {:else if (node.type === 'page' || node.type === 'component') && tree.can.pages}
      <a href="/cms/preview/{node.id}" class="btn btn-sm btn-ghost" target="_blank" rel="noopener"><Eye class="size-4" />Preview</a>
    {/if}
    <span class="flex-1"></span>
    {#if tree.can.publish}
      {#if node.status === 'published'}
        <button type="button" class="btn btn-sm btn-ghost" disabled={tree.busy} onclick={() => publish('unpublish')}>Unpublish</button>
      {:else}
        <button type="button" class="btn btn-sm btn-success" disabled={tree.busy || dirty} title={dirty ? 'Save your changes first' : undefined} onclick={() => publish('publish')}>Publish</button>
      {/if}
    {/if}
  </div>

  {#if !readonly || tree.can.delete}
    <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-base-300">
      {#if !readonly}
        <span class="text-xs opacity-60 mr-1">Move</span>
        <div class="join">
          {#each moves as m (m.dir)}
            <button
              type="button"
              class="btn btn-xs btn-square join-item"
              aria-label={m.label}
              title="{m.label} (Alt + {m.dir === 'up' ? '↑' : m.dir === 'down' ? '↓' : m.dir === 'in' ? '→' : '←'})"
              disabled={tree.busy || !tree.target(node.id, m.dir)}
              onclick={() => tree.moveBy(node.id, m.dir, false)}
            ><m.icon class="size-3.5" /></button>
          {/each}
        </div>
        {#if node.type === 'page' && !node.isHome}
          <button type="button" class="btn btn-xs btn-ghost" disabled={tree.busy} onclick={makeHome}><House class="size-3.5" />Make home page</button>
        {/if}
      {/if}
      <span class="flex-1"></span>
      {#if tree.can.delete}
        {#if item.children.length}
          <span class="text-xs opacity-60">To delete it, move or delete the items under it first.</span>
        {:else if !confirmDelete}
          <button type="button" class="btn btn-xs btn-ghost text-error" onclick={() => (confirmDelete = true)}><Trash2 class="size-3.5" />Delete</button>
        {/if}
      {/if}
    </div>
  {/if}

  {#if confirmDelete}
    <div role="alertdialog" aria-labelledby="{uid}-del" class="rounded-box border border-error/40 bg-error/5 p-3 flex flex-wrap items-center gap-3" transition:slide={{ duration: ms(200) }}>
      <p id="{uid}-del" class="text-sm flex-1 min-w-48">
        Delete "{node.title}"? {node.type === 'page' ? 'Its content is deleted too. ' : ''}{node.isHome ? 'It is the home page, so the site will show the default home page. ' : ''}This can't be undone.
      </p>
      <button type="button" class="btn btn-sm btn-error" disabled={tree.busy} onclick={remove}>Delete</button>
      <button type="button" class="btn btn-sm btn-ghost" onclick={() => (confirmDelete = false)}>Cancel</button>
    </div>
  {/if}
</form>
