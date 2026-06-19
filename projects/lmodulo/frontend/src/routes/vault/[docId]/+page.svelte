<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    ArrowLeft, Download, Upload, Pencil, Check, X, Clock, FileText,
    File as FileIcon, Trash2, Save, SquarePen
  } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import TurndownService from 'turndown';
  import { fade } from 'svelte/transition';

  let { data }: { data: PageData } = $props();

  type Version = { id: string; versionNumber: number; mimetype: string; size: number; originalName: string; uploadedBy: string; note: string; createdAt: string };

  let doc      = $state({ ...data.doc });
  let versions = $state<Version[]>([...(data.versions?.versions ?? [])]);
  let currentVersionId = $state<string | null>(data.versions?.currentVersionId ?? null);

  const currentVersion = $derived(versions.find(v => v.id === currentVersionId) ?? versions[0]);

  const VISIBILITY_BADGE: Record<string, string> = {
    staff:      'badge-neutral',
    admin_only: 'badge-warning',
    customer:   'badge-success'
  };

  const VISIBILITY_LABEL: Record<string, string> = {
    staff:      'Staff',
    admin_only: 'Admin only',
    customer:   'Customer-visible'
  };

  function folderName(id: string | null) {
    if (!id) return 'None';
    return (data.folders as any[]).find(f => f.id === id)?.name ?? '—';
  }

  function userName(id: string) {
    const u = (data.users as any[]).find((u: any) => u.id === id);
    return u ? (u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.username) : id?.slice(-6);
  }

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtSize(bytes: number) {
    if (!bytes) return '—';
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImage(mime: string) { return mime?.startsWith('image/'); }
  function isPdf(mime: string)   { return mime === 'application/pdf'; }
  function isMarkdown(_mime: string, name: string) { return name?.toLowerCase().endsWith('.md'); }

  // ── Preview URL ────────────────────────────────────────────────────────────
  let previewUrl    = $state<string | null>(null);
  let markdownHtml  = $state<string | null>(null);

  async function loadPreview() {
    markdownHtml = null;
    editingRaw   = false;
    try {
      const res = await fetch(`/api/vault/documents/${doc.id}/file`);
      if (!res.ok) return;
      const d = await res.json();
      previewUrl = d.url;
      if (currentVersion && isMarkdown(currentVersion.mimetype, currentVersion.originalName)) {
        const contentRes = await fetch(d.url);
        if (contentRes.ok) {
          const text = await contentRes.text();
          markdownHtml = DOMPurify.sanitize(await marked(text));
        }
      }
    } catch { /* non-fatal */ }
  }

  $effect(() => { if (doc.id) loadPreview(); });

  // ── Edit raw markdown ──────────────────────────────────────────────────────
  let editingRaw  = $state(false);
  let rawEditorHtml = $state('');
  let rawSaving   = $state(false);
  let rawError    = $state('');

  function openEditRaw() {
    rawEditorHtml = markdownHtml ?? '';
    rawError      = '';
    editingRaw    = true;
  }

  function cancelEditRaw() {
    editingRaw = false;
    rawError   = '';
  }

  async function saveRaw() {
    rawSaving = true;
    rawError  = '';
    try {
      const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
      const markdown = td.turndown(rawEditorHtml);
      const filename = currentVersion?.originalName ?? `${doc.name}.md`;
      const blob = new Blob([markdown], { type: 'text/markdown; charset=utf-8' });
      const file = new File([blob], filename, { type: 'text/markdown' });
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/vault/documents/${doc.id}/versions`, { method: 'POST', body: fd });
      if (!res.ok) { const b = await res.json().catch(() => ({})); rawError = (b as any).message ?? 'Save failed'; return; }
      const vRes = await fetch(`/api/vault/documents/${doc.id}/versions`);
      if (vRes.ok) {
        const vData = await vRes.json();
        versions = vData.versions ?? [];
        currentVersionId = vData.currentVersionId ?? null;
      }
      await loadPreview();
    } catch (err) { rawError = err instanceof Error ? err.message : 'Network error'; }
    finally { rawSaving = false; }
  }

  // ── Download ───────────────────────────────────────────────────────────────
  async function download() {
    const res = await fetch(`/api/vault/documents/${doc.id}/file`);
    if (!res.ok) return;
    const { url, originalName } = await res.json();
    const a = document.createElement('a');
    a.href     = url;
    a.download = originalName ?? doc.name;
    a.target   = '_blank';
    a.click();
  }

  // ── Inline metadata edit ──────────────────────────────────────────────────
  let editOpen  = $state(false);
  let editForm  = $state({ name: '', description: '', visibility: 'staff', ownerId: '', folderId: '', tags: '' });
  let editSaving = $state(false);
  let editError  = $state('');

  function openEdit() {
    editForm  = {
      name:        doc.name,
      description: doc.description ?? '',
      visibility:  doc.visibility,
      ownerId:     doc.ownerId,
      folderId:    doc.folderId ?? '',
      tags:        (doc.tags ?? []).join(', ')
    };
    editError = '';
    editOpen  = true;
  }

  async function saveEdit() {
    if (!editForm.name.trim()) { editError = 'Name is required'; return; }
    editSaving = true; editError = '';
    try {
      const res = await fetch(`/api/vault/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name:        editForm.name.trim(),
          description: editForm.description,
          visibility:  editForm.visibility,
          ownerId:     editForm.ownerId || undefined,
          folderId:    editForm.folderId || null,
          tags:        editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); editError = (b as any).message ?? 'Save failed'; return; }
      doc = { ...doc, name: editForm.name.trim(), description: editForm.description, visibility: editForm.visibility, ownerId: editForm.ownerId, folderId: editForm.folderId || null, tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [], updatedAt: new Date().toISOString() };
      editOpen = false;
    } catch { editError = 'Network error'; }
    finally { editSaving = false; }
  }

  // ── Upload new version ────────────────────────────────────────────────────
  let versionOpen   = $state(false);
  let versionFile   = $state<File | null>(null);
  let versionNote   = $state('');
  let versionUploading = $state(false);
  let versionError  = $state('');

  function openVersion() { versionFile = null; versionNote = ''; versionError = ''; versionOpen = true; }

  async function submitVersion() {
    if (!versionFile) { versionError = 'Select a file'; return; }
    versionUploading = true; versionError = '';
    try {
      const fd = new FormData();
      fd.append('file', versionFile);
      fd.append('note', versionNote);
      const res = await fetch(`/api/vault/documents/${doc.id}/versions`, { method: 'POST', body: fd });
      if (!res.ok) { const b = await res.json().catch(() => ({})); versionError = (b as any).message ?? 'Upload failed'; return; }
      const vRes = await fetch(`/api/vault/documents/${doc.id}/versions`);
      if (vRes.ok) {
        const vData = await vRes.json();
        versions = vData.versions ?? [];
        currentVersionId = vData.currentVersionId ?? null;
      }
      await loadPreview();
      versionOpen = false;
    } catch { versionError = 'Network error'; }
    finally { versionUploading = false; }
  }

  // ── Set active version ─────────────────────────────────────────────────────
  async function setCurrentVersion(vId: string) {
    const res = await fetch(`/api/vault/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentVersionId: vId })
    });
    if (res.ok) {
      currentVersionId = vId;
      await loadPreview();
    }
  }

  // ── Delete document ────────────────────────────────────────────────────────
  let deleteOpen  = $state(false);
  let deleting    = $state(false);
  let deleteError = $state('');

  async function confirmDelete() {
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/vault/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); deleteError = (b as any).message ?? 'Delete failed'; return; }
      goto('/vault');
    } catch { deleteError = 'Network error'; }
    finally { deleting = false; }
  }
</script>

<svelte:head><title>{doc.name} — Vault</title></svelte:head>

<div class="flex flex-col gap-6">
  <!-- Back + actions header -->
  <div class="page-heading flex items-start justify-between gap-4">
    <div class="flex items-center gap-3">
      <a href="/vault" class="btn btn-ghost btn-square btn-sm"><ArrowLeft class="size-4" /></a>
      <div>
        <h1 class="text-2xl font-bold leading-none">{doc.name}</h1>
        <p class="text-xs opacity-50 mt-0.5">
          <span class="badge badge-sm {VISIBILITY_BADGE[doc.visibility] ?? 'badge-ghost'} mr-1">{VISIBILITY_LABEL[doc.visibility] ?? doc.visibility}</span>
          {folderName(doc.folderId)} · Updated {fmtDate(doc.updatedAt)}
        </p>
      </div>
    </div>
    <div class="flex gap-2 shrink-0">
      {#if hasPermission(data.user, 'vault_documents', 'update')}
        <button type="button" class="btn btn-ghost btn-sm gap-1" onclick={openVersion}>
          <Upload class="size-4" /><span class="hidden sm:inline">New Version</span>
        </button>
        <button type="button" class="btn btn-ghost btn-sm gap-1" onclick={openEdit}>
          <Pencil class="size-4" /><span class="hidden sm:inline">Edit</span>
        </button>
        {#if currentVersion && isMarkdown(currentVersion.mimetype, currentVersion.originalName) && markdownHtml !== null}
          {#if editingRaw}
            <button type="button" class="btn btn-ghost btn-sm gap-1" onclick={cancelEditRaw}>
              <X class="size-4" /><span class="hidden sm:inline">Cancel</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm gap-1" disabled={rawSaving} onclick={saveRaw}>
              <Save class="size-4" /><span>{rawSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          {:else}
            <button type="button" class="btn btn-ghost btn-sm gap-1" onclick={openEditRaw}>
              <SquarePen class="size-4" /><span class="hidden sm:inline">Edit Document</span>
            </button>
          {/if}
        {/if}
      {/if}
      <button type="button" class="btn btn-primary btn-sm gap-1" onclick={download}>
        <Download class="size-4" /><span>Download</span>
      </button>
      {#if hasPermission(data.user, 'vault_documents', 'delete')}
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteOpen = true)}><Trash2 class="size-4" /></button>
      {/if}
    </div>
  </div>

  <div class="flex gap-6 items-start">

    <!-- File preview -->
    <div class="flex-1 min-w-0">
      <div class="bg-base-200 border border-base-300 rounded-box overflow-hidden min-h-[400px] flex items-center justify-center">
        {#if previewUrl && currentVersion}
          {#if isImage(currentVersion.mimetype)}
            <div class="w-full flex flex-col">
              <div class="px-4 py-2 border-b border-base-300">
                <p class="text-xs font-medium opacity-50">{currentVersion.originalName}</p>
              </div>
              <div class="flex items-center justify-center p-4">
                <img src={previewUrl} alt={doc.name} class="max-w-full max-h-[560px] object-contain" />
              </div>
            </div>
          {:else if isPdf(currentVersion.mimetype)}
            <div class="w-full flex flex-col h-[600px]">
              <div class="px-4 py-2 border-b border-base-300 shrink-0">
                <p class="text-xs font-medium opacity-50">{currentVersion.originalName}</p>
              </div>
              <iframe src={previewUrl} title={doc.name} class="flex-1 w-full border-0"></iframe>
            </div>
          {:else if markdownHtml !== null}
            <div class="w-full flex flex-col">
              <div class="px-4 py-2 border-b border-base-300">
                <p class="text-xs font-medium opacity-50">{currentVersion.originalName}</p>
              </div>
              {#if editingRaw}
                <div class="p-4" transition:fade={{ duration: 180 }}>
                  <MessageEditor bind:html={rawEditorHtml} placeholder="Write your document content…" />
                  {#if rawError}<p class="text-xs text-error mt-2">{rawError}</p>{/if}
                </div>
              {:else}
                <div class="markdown-body p-6 overflow-y-auto max-h-[560px]" transition:fade={{ duration: 180 }}>
                  {@html markdownHtml}
                </div>
              {/if}
            </div>
          {:else}
            <div class="flex flex-col items-center gap-3 py-16 opacity-40">
              <FileText class="size-12" />
              <p class="text-sm">{currentVersion.originalName}</p>
              <p class="text-xs">{fmtSize(currentVersion.size)}</p>
            </div>
          {/if}
        {:else}
          <div class="flex flex-col items-center gap-3 py-16 opacity-30">
            <FileIcon class="size-12" />
            <p class="text-sm">No preview available</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Metadata + version history sidebar -->
    <div class="w-64 shrink-0 space-y-4">

      <!-- Metadata card -->
      <div class="bg-base-200 border border-base-300 rounded-box p-4 space-y-3">
        <div class="flex items-center gap-2">
          <span class="w-0.5 h-4 rounded-full bg-primary"></span>
          <h2 class="text-sm font-semibold">Details</h2>
        </div>
        {#if doc.description}
          <p class="text-sm opacity-70">{doc.description}</p>
        {/if}
        <dl class="space-y-1.5 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="opacity-50">Owner</dt>
            <dd class="font-medium text-right">{userName(doc.ownerId)}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="opacity-50">Folder</dt>
            <dd class="font-medium text-right">{folderName(doc.folderId)}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="opacity-50">Created</dt>
            <dd class="font-medium text-right">{fmtDate(doc.createdAt)}</dd>
          </div>
          {#if currentVersion}
            <div class="flex justify-between gap-2">
              <dt class="opacity-50">Size</dt>
              <dd class="font-medium text-right">{fmtSize(currentVersion.size)}</dd>
            </div>
          {/if}
        </dl>
        {#if (doc.tags ?? []).length > 0}
          <div class="flex flex-wrap gap-1 pt-1">
            {#each doc.tags as tag}
              <span class="badge badge-xs badge-ghost">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Version history card -->
      <div class="bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-base-300">
          <Clock class="size-3.5 opacity-50" />
          <h2 class="text-sm font-semibold">Version History</h2>
        </div>
        <ul class="divide-y divide-base-300">
          {#each versions as v (v.id)}
            {@const isCurrent = v.id === currentVersionId}
            <li class="px-4 py-2.5 flex items-start gap-2 {isCurrent ? 'bg-base-300/30' : ''}">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">v{v.versionNumber}</span>
                  {#if isCurrent}
                    <span class="badge badge-xs badge-success">current</span>
                  {/if}
                </div>
                <p class="text-xs opacity-50 mt-0.5">{fmtDate(v.createdAt)} · {userName(v.uploadedBy)}</p>
                {#if v.note}<p class="text-xs opacity-60 mt-0.5 italic">{v.note}</p>{/if}
              </div>
              {#if !isCurrent && hasPermission(data.user, 'vault_documents', 'update')}
                <button
                  type="button"
                  class="btn btn-ghost btn-xs shrink-0 mt-0.5"
                  title="Set as current"
                  onclick={() => setCurrentVersion(v.id)}
                >
                  <Check class="size-3" />
                </button>
              {/if}
            </li>
          {:else}
            <li class="px-4 py-4 text-xs opacity-40 text-center">No versions yet.</li>
          {/each}
        </ul>
      </div>

    </div>
  </div>
</div>

<!-- Edit metadata modal -->
{#if editOpen}
  <Modal size="md" label="Edit Document">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Edit Document</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editOpen = false)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if editError}<aside class="alert alert-error p-3 rounded text-sm">{editError}</aside>{/if}
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Name *</label>
        <input type="text" class="input w-full" bind:value={editForm.name} maxlength="200" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Folder</label>
          <select class="select w-full" bind:value={editForm.folderId}>
            <option value="">None (root)</option>
            {#each data.folders as f}
              <option value={f.id}>{f.name}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Visibility</label>
          <select class="select w-full" bind:value={editForm.visibility}>
            <option value="staff">Staff</option>
            <option value="admin_only">Admin only</option>
            <option value="customer">Customer-visible</option>
          </select>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Owner</label>
        <select class="select w-full" bind:value={editForm.ownerId}>
          {#each data.users as u}
            <option value={u.id}>{u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.username}</option>
          {/each}
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Tags</label>
        <input type="text" class="input w-full" bind:value={editForm.tags} placeholder="comma-separated" />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</label>
        <textarea class="textarea w-full" bind:value={editForm.description} rows="2"></textarea>
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (editOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={editSaving} onclick={saveEdit}>
        {editSaving ? 'Saving…' : 'Save'}
      </button>
    </footer>
  </Modal>
{/if}

<!-- Upload new version modal -->
{#if versionOpen}
  <Modal size="sm" label="Upload New Version">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Upload New Version</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (versionOpen = false)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-4">
      {#if versionError}<aside class="alert alert-error p-3 rounded text-sm">{versionError}</aside>{/if}
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">File *</label>
        <input type="file" class="file-input w-full" onchange={(e) => { versionFile = (e.target as HTMLInputElement).files?.[0] ?? null; }} />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Version Note</label>
        <input type="text" class="input w-full" bind:value={versionNote} placeholder="e.g. Updated Q3 figures" maxlength="300" />
      </div>
      <p class="text-xs opacity-50">This file will become the current version automatically.</p>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (versionOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={versionUploading} onclick={submitVersion}>
        {versionUploading ? 'Uploading…' : 'Upload Version'}
      </button>
    </footer>
  </Modal>
{/if}

<!-- Delete confirm modal -->
{#if deleteOpen}
  <Modal size="sm" label="Delete Document">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Delete Document</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteOpen = false)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-3">
      {#if deleteError}<aside class="alert alert-error p-3 rounded text-sm">{deleteError}</aside>{/if}
      <p class="text-sm">Permanently delete <span class="font-semibold">{doc.name}</span> and all {versions.length} version{versions.length !== 1 ? 's' : ''}? This cannot be undone.</p>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (deleteOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-error btn-outline" disabled={deleting} onclick={confirmDelete}>
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </footer>
  </Modal>
{/if}

<style>
  /* Markdown renderer — uses DaisyUI CSS vars so all themes are respected */
  .markdown-body { color: var(--color-base-content); font-size: 0.875rem; line-height: 1.7; }
  .markdown-body :global(> *:first-child) { margin-top: 0; }
  .markdown-body :global(> *:last-child)  { margin-bottom: 0; }

  /* Headings */
  .markdown-body :global(h1) { font-family: var(--display); font-size: 1.75rem; font-weight: 700; line-height: 1.2; margin: 0 0 1rem; }
  .markdown-body :global(h2) { font-family: var(--display); font-size: 1.375rem; font-weight: 600; line-height: 1.3; margin: 1.5rem 0 0.625rem; border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent); padding-bottom: 0.25rem; }
  .markdown-body :global(h3) { font-family: var(--display); font-size: 1.125rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
  .markdown-body :global(h4), .markdown-body :global(h5), .markdown-body :global(h6) { font-family: var(--display); font-size: 1rem; font-weight: 600; margin: 1rem 0 0.375rem; }

  /* Body text */
  .markdown-body :global(p) { margin-bottom: 0.875rem; }
  .markdown-body :global(strong) { font-weight: 700; }
  .markdown-body :global(em) { font-style: italic; }
  .markdown-body :global(del) { text-decoration: line-through; opacity: 0.6; }

  /* Links */
  .markdown-body :global(a) { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; }
  .markdown-body :global(a:hover) { opacity: 0.8; }

  /* Lists */
  .markdown-body :global(ul) { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.875rem; }
  .markdown-body :global(ol) { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.875rem; }
  .markdown-body :global(li) { margin-bottom: 0.25rem; }
  .markdown-body :global(li > ul), .markdown-body :global(li > ol) { margin-top: 0.25rem; margin-bottom: 0; }
  .markdown-body :global(li input[type="checkbox"]) { margin-right: 0.4rem; }

  /* Blockquote */
  .markdown-body :global(blockquote) {
    border-left: 3px solid var(--color-primary);
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    background: color-mix(in srgb, var(--color-base-content) 4%, transparent);
    border-radius: 0 0.25rem 0.25rem 0;
    opacity: 0.85;
  }

  /* Inline code */
  .markdown-body :global(code) {
    font-family: var(--mono);
    font-size: 0.82em;
    background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
    padding: 0.1em 0.35em;
    border-radius: 0.25rem;
  }

  /* Code blocks */
  .markdown-body :global(pre) {
    background: color-mix(in srgb, var(--color-base-content) 7%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    overflow-x: auto;
    margin-bottom: 1rem;
    line-height: 1.55;
  }
  .markdown-body :global(pre code) { background: none; padding: 0; font-size: 0.8125rem; }

  /* Divider */
  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
    margin: 1.5rem 0;
  }

  /* Images */
  .markdown-body :global(img) { max-width: 100%; border-radius: 0.375rem; margin: 0.5rem 0; }

  /* Tables */
  .markdown-body :global(table) { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.8125rem; }
  .markdown-body :global(thead) { background: var(--color-neutral); color: var(--color-neutral-content); }
  .markdown-body :global(th) { padding: 0.5rem 0.75rem; font-weight: 600; text-align: left; }
  .markdown-body :global(td) {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  }
  .markdown-body :global(tr:nth-child(even) td) {
    background: color-mix(in srgb, var(--color-base-content) 3%, transparent);
  }
  .markdown-body :global(tbody tr:last-child td) { border-bottom: none; }
</style>
