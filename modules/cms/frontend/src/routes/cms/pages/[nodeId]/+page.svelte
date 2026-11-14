<script lang="ts">
  // The page builder. Drafts save themselves shortly after each change (sending the `rev` they were
  // based on); a 409 means the page was saved elsewhere since, and the editor stops until the user
  // chooses. Leaving the page waits for the save, or asks.
  import { onDestroy, untrack } from 'svelte';
  import { slide } from 'svelte/transition';
  import { beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { ArrowLeft, Eye, Check, CloudOff, SlidersHorizontal, ExternalLink, TriangleAlert } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { hasPermission } from '$lib/permissions';
  import { blockProblems, cmsApi, editable, editorLinkMap, linkTargets } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import BlockEditor from '$lib/components/cms/admin/BlockEditor.svelte';
  import type { Block, CmsNode, NodeStatus, PageDraft, Seo } from '$lib/cms/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const nodeId = untrack(() => data.page.nodeId);
  const canEdit = untrack(() => hasPermission(page.data.user, 'cms_pages', 'update'));
  const canPublish = untrack(() => hasPermission(page.data.user, 'cms_publish', 'update'));

  let nodes = $state.raw<CmsNode[]>(untrack(() => data.nodes));
  const node = $derived(nodes.find(n => n.id === nodeId));
  const links = $derived(editorLinkMap(nodes));
  const pagePaths = $derived(linkTargets(nodes).map(t => ({ path: t.path, title: t.label.replace(/^(— )+/, '') })));

  const initial = untrack(() => editable(data.page.draft));
  let blocks = $state<Block[]>(initial.blocks);
  let seo = $state<Seo>(initial.seo);
  let rev = untrack(() => data.page.rev);
  let status = $state<NodeStatus>(untrack(() => data.page.status));
  let hasChanges = $state(untrack(() => data.page.hasUnpublishedChanges));
  let publishedAt = $state<string | null>(untrack(() => data.page.publishedAt));
  let activeId = $state<string | null>(null);
  /** bumped to remount the canvas after loading another version */
  let generation = $state(0);

  // ── Autosave ───────────────────────────────────────────────────────────────────────────
  type SaveState = 'saved' | 'pending' | 'saving' | 'error' | 'conflict';
  const DEBOUNCE_MS = 1200;
  const MAX_WAIT_MS = 10_000;

  let saveState = $state<SaveState>('saved');
  let saveError = $state('');
  let removedNotice = $state('');
  let conflictRev: number | null = null;
  let savedJson = $state(untrack(() => JSON.stringify({ blocks, seo })));
  const currentJson = $derived(JSON.stringify({ blocks, seo }));
  const dirty = $derived(currentJson !== savedJson);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let firstPendingAt = 0;
  let inflight: Promise<boolean> | null = null;

  const errorCount = $derived(blocks.reduce((n, b) => n + blockProblems(b, nodes).errors.length, 0));

  $effect(() => {
    if (!canEdit) return;
    if (currentJson !== savedJson) untrack(schedule);
  });
  onDestroy(() => clearTimeout(timer));

  function schedule() {
    if (saveState === 'conflict') return;
    if (saveState !== 'saving') saveState = 'pending';
    clearTimeout(timer);
    const now = Date.now();
    if (!firstPendingAt) firstPendingAt = now;
    timer = setTimeout(save, Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - (now - firstPendingAt))));
  }

  /** Saves now. Resolves true once everything on screen is saved. */
  async function save(): Promise<boolean> {
    clearTimeout(timer);
    if (!canEdit || saveState === 'conflict') return false;
    while (inflight) await inflight;
    if (currentJson === savedJson) { if (saveState !== 'error') saveState = 'saved'; return true; }
    inflight = send();
    try {
      return (await inflight) && currentJson === savedJson;
    } finally {
      inflight = null;
    }
  }

  async function send(): Promise<boolean> {
    firstPendingAt = 0;
    saveState = 'saving';
    const sent = currentJson;
    // Parts the editor already flags in red are expected to be left out; only warn about surprises
    const expected = errorCount;
    const res = await cmsApi<{ rev: number; removed: number }>(`pages/${nodeId}/draft`, {
      method: 'PUT',
      body: { ...JSON.parse(sent), rev },
    });
    if (res.ok && res.data) {
      rev = res.data.rev;
      savedJson = sent;
      hasChanges = true;
      saveError = '';
      const r = res.data.removed;
      removedNotice = r > expected ? `Some content couldn't be saved because the site can't show it, and was left out. Reload the page to see what was kept.` : '';
      saveState = currentJson === sent ? 'saved' : 'pending';
      return true;
    }
    if (res.status === 409) {
      conflictRev = typeof res.body?.rev === 'number' ? res.body.rev : null;
      saveState = 'conflict';
      return false;
    }
    saveState = 'error';
    saveError = res.message;
    return false;
  }

  // ── Conflict (409) ─────────────────────────────────────────────────────────────────────
  let reloading = $state(false);

  async function loadLatest() {
    reloading = true;
    const res = await cmsApi<PageDraft>(`pages/${nodeId}`);
    reloading = false;
    if (!res.ok || !res.data) { saveError = res.message; return; }
    clearTimeout(timer);
    const latest = editable(res.data.draft);
    blocks = latest.blocks;
    seo = latest.seo;
    savedJson = JSON.stringify({ blocks, seo });
    rev = res.data.rev;
    status = res.data.status;
    hasChanges = res.data.hasUnpublishedChanges;
    publishedAt = res.data.publishedAt;
    activeId = null;
    removedNotice = '';
    generation++;
    saveState = 'saved';
  }

  async function keepMine() {
    if (conflictRev === null) { await loadLatest(); return; }
    rev = conflictRev;
    saveState = 'pending';
    await save();
  }

  // ── Leaving ────────────────────────────────────────────────────────────────────────────
  let leaveTo = $state<URL | null>(null);
  let leaving = false;

  beforeNavigate(nav => {
    if (leaving || !canEdit || !dirty) return;
    // Reload, close or an external link: the browser asks
    if (nav.type === 'leave') { nav.cancel(); return; }
    if (!nav.to) return;
    nav.cancel();
    const url = nav.to.url;
    save().then(ok => {
      if (ok) { leaving = true; goto(url); }
      else leaveTo = url;
    });
  });

  function leaveAnyway() {
    const url = leaveTo;
    leaveTo = null;
    leaving = true;
    if (url) goto(url);
  }

  // ── Publishing ─────────────────────────────────────────────────────────────────────────
  let busy = $state(false);
  let notice = $state<{ kind: 'success' | 'warning' | 'error'; lines: string[] } | null>(null);

  async function refreshNodes() {
    const res = await cmsApi<CmsNode[]>('nodes');
    if (res.ok && res.data) nodes = res.data;
  }

  async function publish() {
    notice = null;
    busy = true;
    try {
      if (!(await save())) {
        if (saveState !== 'conflict') notice = { kind: 'error', lines: [`Couldn't save your latest changes, so nothing was published. ${saveError}`] };
        return;
      }
      const res = await cmsApi<{ warnings: string[] }>(`pages/${nodeId}/publish`, { method: 'POST', body: { rev } });
      if (res.status === 409) {
        conflictRev = typeof res.body?.rev === 'number' ? res.body.rev : null;
        saveState = 'conflict';
        return;
      }
      if (!res.ok) { notice = { kind: 'error', lines: [res.message] }; return; }
      status = 'published';
      hasChanges = false;
      publishedAt = new Date().toISOString();
      const lines = [...(res.data?.warnings ?? [])];
      if (errorCount) lines.push('Parts marked in red were not saved, so they aren\'t on the site.');
      notice = lines.length ? { kind: 'warning', lines } : { kind: 'success', lines: ['Published. The page is on the site.'] };
      await refreshNodes();
    } finally {
      busy = false;
    }
  }

  async function unpublish() {
    notice = null;
    busy = true;
    const res = await cmsApi<{ warnings: string[] }>(`pages/${nodeId}/unpublish`, { method: 'POST' });
    busy = false;
    if (!res.ok) { notice = { kind: 'error', lines: [res.message] }; return; }
    status = 'draft';
    hasChanges = true;
    publishedAt = null;
    notice = { kind: 'success', lines: ['Unpublished. The page is no longer on the site.', ...(res.data?.warnings ?? [])] };
    await refreshNodes();
  }

  /** Preview shows the saved draft, so save first; the tab opens straight away to keep the popup allowed. */
  async function openPreview(e: MouseEvent) {
    if (!dirty) return;
    e.preventDefault();
    const tab = window.open('about:blank', '_blank');
    await save();
    if (tab) tab.location.href = `/cms/preview/${nodeId}`;
  }

  // ── Layout ─────────────────────────────────────────────────────────────────────────────
  let barHeight = $state(0);
  let settingsOpen = $state(false);
  const live = $derived(status === 'published' && !!node?.visible);
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
</script>

<svelte:head><title>{node?.title ?? 'Page'} · Content</title></svelte:head>

{#snippet pageSettings(prefix: string)}
  <div class="flex flex-col gap-5 text-sm">
    <div class="flex flex-col gap-2">
      <p class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Page</p>
      <div class="flex flex-wrap gap-1">
        {#if status === 'published' && node?.visible}
          <span class="badge badge-sm badge-success">Published</span>
        {:else if status === 'published'}
          <span class="badge badge-sm badge-warning" title="Not public until the item above it is published">Hidden by parent</span>
        {:else}
          <span class="badge badge-sm badge-ghost">Draft</span>
        {/if}
        {#if status === 'published' && hasChanges}<span class="badge badge-sm badge-outline">Changes not published</span>{/if}
        {#if node?.isHome}<span class="badge badge-sm badge-neutral">Home page</span>{/if}
      </div>
      {#if node?.href}
        <p class="font-mono text-xs break-all opacity-70">
          {#if live}<a class="link inline-flex items-center gap-1" href={node.href} target="_blank" rel="noopener">{node.href}<ExternalLink class="size-3" /></a>{:else}{node.href}{/if}
        </p>
      {/if}
      {#if publishedAt}<p class="text-xs opacity-60">Last published {fmt(publishedAt)}</p>{/if}
      <a class="link text-xs w-fit" href="/cms?node={nodeId}">Title, URL and menu settings</a>
    </div>

    <div class="flex flex-col gap-3">
      <p class="text-[10px] font-semibold uppercase tracking-widest opacity-50">Search engines</p>
      <div class="flex flex-col gap-1">
        <label class="font-medium" for="{prefix}-seo-title">Title</label>
        <input id="{prefix}-seo-title" class="input input-sm w-full" bind:value={seo.title} placeholder={node?.title} maxlength="200" disabled={!canEdit} />
        <span class="text-xs opacity-60">Shown in browser tabs and search results. Leave empty to use the page title.</span>
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-medium" for="{prefix}-seo-desc">Description</label>
        <textarea id="{prefix}-seo-desc" class="textarea textarea-sm w-full" rows="4" bind:value={seo.description} maxlength="500" disabled={!canEdit}></textarea>
        <span class="text-xs {(seo.description?.length ?? 0) > 160 ? 'text-warning' : 'opacity-60'}">{seo.description?.length ?? 0} characters; search engines show about 160.</span>
      </div>
      <label class="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox checkbox-sm mt-0.5" bind:checked={seo.noindex} disabled={!canEdit} />
        <span>Ask search engines not to list this page</span>
      </label>
    </div>
  </div>
{/snippet}

{#if !node}
  <div role="alert" class="alert alert-warning text-sm">This page was deleted or moved out of the site tree. <a class="link" href="/cms">Back to the site tree</a></div>
{:else}
  <div class="flex flex-col gap-4" style="--cms-bar-h: {barHeight}px">
    <!-- Sticky bar: where you are, save state, and the page actions -->
    <div
      bind:clientHeight={barHeight}
      class="sticky top-0 z-30 -mx-6 px-6 py-2 bg-base-100/95 backdrop-blur border-b border-base-300 flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <a href="/cms?node={nodeId}" class="btn btn-ghost btn-sm btn-square" aria-label="Back to the site tree" title="Back to the site tree"><ArrowLeft class="size-4" /></a>
      <!-- The title keeps at least 12rem; the actions wrap onto a second row on phones -->
      <div class="min-w-48 flex-1">
        <h2 class="font-semibold leading-tight truncate">{node.title}</h2>
        <p class="text-xs leading-tight" aria-live="polite" data-save-state={canEdit ? saveState : 'readonly'}>
          {#if !canEdit}
            <span class="opacity-60">View only</span>
          {:else if saveState === 'saving'}
            <span class="opacity-60 inline-flex items-center gap-1"><span class="loading loading-spinner loading-xs"></span>Saving…</span>
          {:else if saveState === 'pending'}
            <span class="opacity-60">Unsaved changes</span>
          {:else if saveState === 'error'}
            <span class="text-error inline-flex items-center gap-1"><CloudOff class="size-3.5" />Not saved. <button type="button" class="link" onclick={save}>Try again</button></span>
          {:else if saveState === 'conflict'}
            <span class="text-warning">Changed elsewhere</span>
          {:else}
            <span class="opacity-60 inline-flex items-center gap-1"><Check class="size-3.5" />Draft saved</span>
          {/if}
        </p>
      </div>
      <div class="flex items-center gap-2 ml-auto">
      <button type="button" class="btn btn-ghost btn-sm lg:hidden" aria-label="Page settings" aria-expanded={settingsOpen} aria-controls="cms-page-settings-sm" onclick={() => (settingsOpen = !settingsOpen)}>
        <SlidersHorizontal class="size-4" /><span class="hidden sm:inline">Page settings</span>
      </button>
      <a href="/cms/preview/{nodeId}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" aria-label="Preview" onclick={openPreview}><Eye class="size-4" /><span class="hidden sm:inline">Preview</span></a>
      {#if canPublish}
        {#if status === 'published'}
          <button type="button" class="btn btn-ghost btn-sm" disabled={busy} onclick={unpublish}>Unpublish</button>
        {/if}
        <button
          type="button"
          class="btn btn-success btn-sm"
          disabled={busy || saveState === 'conflict' || (status === 'published' && !hasChanges && !dirty)}
          onclick={publish}
        >
          {#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
          {status === 'published' ? 'Publish changes' : 'Publish'}
        </button>
      {/if}
      </div>
    </div>

    {#if notice}
      <div role="status" class="alert {notice.kind === 'error' ? 'alert-error' : notice.kind === 'warning' ? 'alert-warning' : 'alert-success'} text-sm py-2" transition:slide={{ duration: ms(200) }}>
        <div class="flex-1 flex flex-col gap-0.5">{#each notice.lines as line}<span>{line}</span>{/each}</div>
        <button type="button" class="btn btn-ghost btn-xs" onclick={() => (notice = null)}>Dismiss</button>
      </div>
    {/if}
    {#if removedNotice}
      <div role="status" class="alert alert-warning text-sm py-2" transition:slide={{ duration: ms(200) }}>
        <TriangleAlert class="size-4" /><span>{removedNotice}</span>
      </div>
    {/if}
    {#if !canEdit}
      <p class="text-sm opacity-70">You can view this page but not change it.</p>
    {/if}

    {#if settingsOpen}
      <div id="cms-page-settings-sm" class="lg:hidden rounded-box border border-base-300 bg-base-200/40 p-4" transition:slide={{ duration: ms(200) }}>
        {@render pageSettings('sm')}
      </div>
    {/if}

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] items-start">
      {#key generation}
        <BlockEditor
          bind:blocks
          bind:activeId
          readonly={!canEdit}
          {nodes}
          {links}
          {pagePaths}
          toolbarTop="calc(var(--cms-bar-h) + 0.5rem)"
          pageTitle={node.title}
        />
      {/key}
      <aside class="hidden lg:block sticky rounded-box border border-base-300 bg-base-200/40 p-4" style="top: calc(var(--cms-bar-h) + 1rem)" aria-label="Page settings">
        {@render pageSettings('lg')}
      </aside>
    </div>
  </div>
{/if}

{#if saveState === 'conflict' && !leaveTo}
  <Modal label="This page was changed elsewhere" size="sm" z={60}>
    <div class="p-6 flex flex-col gap-4">
      <h2 class="text-lg font-semibold">This page was changed elsewhere</h2>
      <p class="text-sm opacity-80">
        Someone else, or this page open in another tab, saved a newer version. Load that version (your changes
        here since the last save are lost), or replace it with what you see here.
      </p>
      {#if saveError}<p class="text-sm text-error">{saveError}</p>{/if}
      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="btn btn-ghost btn-sm" onclick={keepMine}>Replace with my version</button>
        <button type="button" class="btn btn-primary btn-sm" disabled={reloading} onclick={loadLatest}>
          {#if reloading}<span class="loading loading-spinner loading-xs"></span>{/if}
          Load the newer version
        </button>
      </div>
    </div>
  </Modal>
{/if}

{#if leaveTo}
  <Modal label="Leave without saving?" size="sm" z={60}>
    <div class="p-6 flex flex-col gap-4">
      <h2 class="text-lg font-semibold">Leave without saving?</h2>
      <p class="text-sm opacity-80">
        {saveState === 'conflict' ? 'This page was changed elsewhere, so your latest changes weren\'t saved.' : `Your latest changes couldn't be saved${saveError ? `: ${saveError}` : '.'}`}
      </p>
      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="btn btn-ghost btn-sm" onclick={leaveAnyway}>Leave without saving</button>
        <button type="button" class="btn btn-primary btn-sm" onclick={() => (leaveTo = null)}>Stay on this page</button>
      </div>
    </div>
  </Modal>
{/if}
