<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { goto, invalidateAll } from '$app/navigation';
  import {
    ArrowLeft, Download, Upload, Pencil, Check, X, Clock, FileText, FileImage,
    File, ChevronRight, Trash2
  } from 'lucide-svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

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

  // ── Preview URL ────────────────────────────────────────────────────────────
  let previewUrl = $state<string | null>(null);

  async function loadPreview() {
    try {
      const res = await fetch(`/api/vault/documents/${doc.id}/file`);
      if (res.ok) { const d = await res.json(); previewUrl = d.url; }
    } catch { /* non-fatal */ }
  }

  $effect(() => { if (doc.id) loadPreview(); });

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
      const result = await res.json();
      // Refresh versions list
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

<div class="space-y-6">
  <!-- Back + actions header -->
  <div class="flex items-start justify-between gap-4">
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
      <div class="card bg-base-100 border border-base-200 overflow-hidden min-h-[400px] flex items-center justify-center">
        {#if previewUrl && currentVersion}
          {#if isImage(currentVersion.mimetype)}
            <img src={previewUrl} alt={doc.name} class="max-w-full max-h-[600px] object-contain p-4" />
          {:else if isPdf(currentVersion.mimetype)}
            <iframe src={previewUrl} title={doc.name} class="w-full h-[600px] border-0"></iframe>
          {:else}
            <div class="flex flex-col items-center gap-3 py-16 opacity-40">
              <FileText class="size-12" />
              <p class="text-sm">{currentVersion.originalName}</p>
              <p class="text-xs">{fmtSize(currentVersion.size)}</p>
            </div>
          {/if}
        {:else}
          <div class="flex flex-col items-center gap-3 py-16 opacity-30">
            <File class="size-12" />
            <p class="text-sm">No preview available</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Metadata + version history sidebar -->
    <div class="w-64 shrink-0 space-y-4">

      <!-- Metadata card -->
      <div class="card bg-base-100 border border-base-200 p-4 space-y-3">
        <h2 class="text-sm font-semibold">Details</h2>
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
      <div class="card bg-base-100 border border-base-200 overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-base-200">
          <Clock class="size-3.5 opacity-50" />
          <h2 class="text-sm font-semibold">Version History</h2>
        </div>
        <ul class="divide-y divide-base-200">
          {#each versions as v (v.id)}
            {@const isCurrent = v.id === currentVersionId}
            <li class="px-4 py-2.5 flex items-start gap-2 {isCurrent ? 'bg-base-200/40' : ''}">
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
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-lg shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Edit Document</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (editOpen = false)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if editError}<div role="alert" class="alert alert-error text-sm">{editError}</div>{/if}
        <div class="form-control gap-1">
          <span class="label-text font-medium">Name <span class="text-error">*</span></span>
          <input type="text" class="input input-bordered" bind:value={editForm.name} maxlength="200" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control gap-1">
            <span class="label-text font-medium">Folder</span>
            <select class="select select-bordered" bind:value={editForm.folderId}>
              <option value="">None (root)</option>
              {#each data.folders as f}
                <option value={f.id}>{f.name}</option>
              {/each}
            </select>
          </div>
          <div class="form-control gap-1">
            <span class="label-text font-medium">Visibility</span>
            <select class="select select-bordered" bind:value={editForm.visibility}>
              <option value="staff">Staff</option>
              <option value="admin_only">Admin only</option>
              <option value="customer">Customer-visible</option>
            </select>
          </div>
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Owner</span>
          <select class="select select-bordered" bind:value={editForm.ownerId}>
            {#each data.users as u}
              <option value={u.id}>{u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.username}</option>
            {/each}
          </select>
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Tags</span>
          <input type="text" class="input input-bordered" bind:value={editForm.tags} placeholder="comma-separated" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Description</span>
          <textarea class="textarea textarea-bordered" bind:value={editForm.description} rows="2"></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (editOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={editSaving} onclick={saveEdit}>
          {editSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Upload new version modal -->
{#if versionOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Upload New Version</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (versionOpen = false)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if versionError}<div role="alert" class="alert alert-error text-sm">{versionError}</div>{/if}
        <div class="form-control gap-1">
          <span class="label-text font-medium">File <span class="text-error">*</span></span>
          <input type="file" class="file-input file-input-bordered w-full" onchange={(e) => { versionFile = (e.target as HTMLInputElement).files?.[0] ?? null; }} />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Version Note</span>
          <input type="text" class="input input-bordered" bind:value={versionNote} placeholder="e.g. Updated Q3 figures" maxlength="300" />
        </div>
        <p class="text-xs opacity-50">This file will become the current version automatically.</p>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (versionOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={versionUploading} onclick={submitVersion}>
          {versionUploading ? 'Uploading…' : 'Upload Version'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete confirm modal -->
{#if deleteOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-sm shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Delete Document</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (deleteOpen = false)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-3">
        {#if deleteError}<div role="alert" class="alert alert-error text-sm">{deleteError}</div>{/if}
        <p class="text-sm">Permanently delete <span class="font-semibold">{doc.name}</span> and all {versions.length} version{versions.length !== 1 ? 's' : ''}? This cannot be undone.</p>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-error btn-outline" disabled={deleting} onclick={confirmDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}
