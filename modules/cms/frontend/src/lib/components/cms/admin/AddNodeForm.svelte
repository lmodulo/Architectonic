<script lang="ts">
  // Inline form that adds an item under a parent (or at the top level). The slug follows the title
  // until it is edited by hand; reserved and duplicate slugs are flagged before anything is sent.
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cmsApi, defaultComponent, defaultProps, pageComponents, pathFor, slugProblem } from '$lib/cms/admin';
  import { safeHref, toSlug } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import { getTreeState } from './tree.svelte';
  import type { CmsNode, NodeType } from '$lib/cms/types';

  let { parentId }: { parentId: string | null } = $props();

  const tree = getTreeState();
  const uid = $props.id();
  const components = pageComponents();
  const parent = $derived(tree.item(parentId)?.node);

  let title = $state('');
  let type = $state<NodeType>('page');
  let slug = $state('');
  let slugEdited = $state(false);
  let url = $state('');
  let newTab = $state(false);
  let componentKey = $state(defaultComponent(components)?.key ?? '');
  let error = $state('');
  let saving = $state(false);
  let touched = $state(false);
  let titleInput: HTMLInputElement | undefined = $state();

  onMount(() => titleInput?.focus());

  const effectiveSlug = $derived(slugEdited ? slug : toSlug(title));
  const slugError = $derived(type === 'link' || (!title.trim() && !slugEdited) ? null
    : slugProblem(effectiveSlug, { parentId, nodes: tree.nodes, reserved: tree.reserved }));
  const urlError = $derived(type === 'link' && touched && !safeHref(url) ? 'Enter a URL starting with https://, http://, mailto:, tel:, / or #.' : null);
  const canSubmit = $derived(!!title.trim() && !slugError && (type !== 'link' || !!safeHref(url)) && (type !== 'component' || !!componentKey) && !saving);

  function close() {
    tree.addingUnder = undefined;
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    touched = true;
    if (!canSubmit) return;
    error = '';
    saving = true;
    const body: Record<string, unknown> = { parentId, type, title: title.trim(), showInMenu: true };
    if (type === 'link') { body.url = url.trim(); body.newTab = newTab; }
    else body.slug = effectiveSlug;
    if (type === 'component') {
      const entry = components.find(c => c.key === componentKey);
      body.component = { key: componentKey, props: defaultProps(entry?.props) };
    }
    const res = await tree.write(() => cmsApi<CmsNode>('nodes', { method: 'POST', body }));
    saving = false;
    if (!res.ok || !res.data) { error = res.message; return; }
    tree.expand(parentId);
    tree.addingUnder = undefined;
    tree.announcement = `Added "${res.data.title}".`;
    tree.select(res.data.id);
    await tree.focusRow(res.data.id);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }
</script>

<!-- Escape anywhere in the form cancels it -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
  class="my-1 mr-2 rounded-box border border-dashed border-base-300 bg-base-200/40 p-3 flex flex-col gap-3"
  style="margin-left: {parentId ? 1.5 + (tree.item(parentId)?.depth ?? 0) * 1.5 : 0.25}rem"
  aria-label={parent ? `Add an item under ${parent.title}` : 'Add a top-level item'}
  onsubmit={submit}
  onkeydown={onKeydown}
>
  <p class="text-sm font-semibold">{parent ? `New item under "${parent.title}"` : 'New top-level item'}</p>
  <div class="grid gap-3 sm:grid-cols-[1fr_10rem]">
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium" for="{uid}-title">Title</label>
      <input id="{uid}-title" bind:this={titleInput} class="input input-sm w-full" bind:value={title} maxlength="200" required />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium" for="{uid}-type">Type</label>
      <select id="{uid}-type" class="select select-sm w-full" bind:value={type}>
        <option value="page">Page</option>
        <option value="label">Label (menu heading)</option>
        <option value="link">Link</option>
        <option value="component" disabled={!components.length}>Component{components.length ? '' : ' (none installed)'}</option>
      </select>
    </div>
  </div>

  {#if type === 'link'}
    <div class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" transition:slide={{ duration: ms(200) }}>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="{uid}-url">URL</label>
        <input id="{uid}-url" class="input input-sm w-full font-mono" inputmode="url" placeholder="https://example.org" bind:value={url} onblur={() => (touched = true)} maxlength="2048" />
      </div>
      <label class="flex items-center gap-2 text-sm cursor-pointer sm:pb-1.5">
        <input type="checkbox" class="checkbox checkbox-sm" bind:checked={newTab} /> Open in a new tab
      </label>
    </div>
    {#if urlError}<p class="text-xs text-error -mt-2" transition:slide={{ duration: ms(200) }}>{urlError}</p>{/if}
  {:else}
    <div class="flex flex-col gap-1" transition:slide={{ duration: ms(200) }}>
      <label class="text-sm font-medium" for="{uid}-slug">Slug</label>
      <div class="flex items-center gap-2">
        <input
          id="{uid}-slug"
          class="input input-sm w-full sm:max-w-xs font-mono"
          value={effectiveSlug}
          maxlength="80"
          aria-describedby="{uid}-url-preview"
          aria-invalid={!!slugError}
          oninput={e => { slug = e.currentTarget.value.trim(); slugEdited = true; }}
        />
        {#if slugEdited}
          <button type="button" class="btn btn-ghost btn-xs" onclick={() => { slugEdited = false; slug = ''; }}>Use title</button>
        {/if}
      </div>
      <p id="{uid}-url-preview" class="text-xs opacity-60 font-mono break-all">{pathFor(parentId, effectiveSlug || '…', tree.nodes)}</p>
      {#if slugError}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>{slugError}</p>{/if}
    </div>
    {#if type === 'component'}
      <div class="flex flex-col gap-1" transition:slide={{ duration: ms(200) }}>
        <label class="text-sm font-medium" for="{uid}-component">Component</label>
        <select id="{uid}-component" class="select select-sm w-full sm:max-w-xs" bind:value={componentKey}>
          {#each components as c (c.key)}<option value={c.key}>{c.label}</option>{/each}
        </select>
      </div>
    {/if}
  {/if}

  {#if error}<div role="alert" class="alert alert-error text-sm py-2" transition:slide={{ duration: ms(200) }}>{error}</div>{/if}

  <div class="flex items-center gap-2">
    <button type="submit" class="btn btn-primary btn-sm" disabled={!canSubmit}>
      {#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
      Add item
    </button>
    <button type="button" class="btn btn-ghost btn-sm" onclick={close}>Cancel</button>
    <span class="text-xs opacity-60 ml-auto hidden sm:inline">New items start as drafts.</span>
  </div>
</form>
