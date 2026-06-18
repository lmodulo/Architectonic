<script lang="ts">
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { Search, Plus, Trash2, FolderPlus, FolderOpen, Folder, X, ChevronRight, Upload, FileText, File, FolderLock, Image, Film, Music, Code, Sheet, Archive, Braces, Terminal } from 'lucide-svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Doc    = typeof data.documents[0];
  type Folder = typeof data.folders[0];

  const PAGE_SIZE = 25;

  // ── State ──────────────────────────────────────────────────────────────────
  let folders      = $state<Folder[]>([...data.folders]);
  let documents    = $state<Doc[]>([...data.documents]);
  let totalDocs    = $state<number>(data.total);
  let currentPage  = $state(1);
  let query        = $state('');
  let selectedFolderId = $state<string | null>(null);
  let openFolders  = $state(new Set<string>());

  // ── Helpers ────────────────────────────────────────────────────────────────
  function rootFolders()    { return folders.filter(f => !f.parentId); }
  function childFolders(id: string) { return folders.filter(f => f.parentId === id); }

  function folderName(id: string | null) {
    if (!id) return 'All Documents';
    return folders.find(f => f.id === id)?.name ?? '—';
  }

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function userName(id: string) {
    const u = (data.users as any[]).find((u: any) => u.id === id);
    return u ? (u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.username) : id?.slice(-6);
  }

  const VISIBILITY_BADGE: Record<string, string> = {
    staff:      'badge-neutral',
    admin_only: 'badge-warning',
    customer:   'badge-success'
  };

  const VISIBILITY_LABEL: Record<string, string> = {
    staff:      'Staff',
    admin_only: 'Admin only',
    customer:   'Customer'
  };

  const EXT_MAP: Record<string, any> = {
    // Images
    jpg: Image, jpeg: Image, png: Image, gif: Image,
    svg: Image, webp: Image, bmp: Image, ico: Image,
    tiff: Image, tif: Image, heic: Image, avif: Image,
    // Video
    mp4: Film, mov: Film, avi: Film, mkv: Film,
    webm: Film, wmv: Film, flv: Film, m4v: Film,
    // Audio
    mp3: Music, wav: Music, ogg: Music, flac: Music,
    aac: Music, m4a: Music, wma: Music, opus: Music,
    // Shell scripts
    sh: Terminal, bash: Terminal, zsh: Terminal, fish: Terminal,
    // Code / markup
    js: Code, ts: Code, jsx: Code, tsx: Code,
    py: Code, rb: Code, go: Code, rs: Code,
    java: Code, c: Code, cpp: Code, cs: Code,
    php: Code, css: Code, scss: Code, html: Code,
    htm: Code, xml: Code, yaml: Code, yml: Code,
    sql: Code, swift: Code, kt: Code,
    // JSON / config
    json: Braces, jsonc: Braces, toml: Braces, env: Braces,
    // Spreadsheets
    xlsx: Sheet, xls: Sheet, csv: Sheet,
    numbers: Sheet, ods: Sheet, tsv: Sheet,
    // Archives
    zip: Archive, tar: Archive, gz: Archive, rar: Archive,
    '7z': Archive, bz2: Archive, xz: Archive, tgz: Archive,
    // Text / documents
    txt: FileText, md: FileText, pdf: FileText, doc: FileText, docx: FileText,
    rtf: FileText, odt: FileText, pages: FileText, tex: FileText,
  };

  function fileIcon(originalName?: string | null, mimetype?: string | null) {
    const ext = originalName?.split('.').pop()?.toLowerCase();
    if (ext && EXT_MAP[ext]) return EXT_MAP[ext];
    if (mimetype?.startsWith('image/')) return Image;
    if (mimetype?.startsWith('video/')) return Film;
    if (mimetype?.startsWith('audio/')) return Music;
    if (mimetype?.startsWith('text/'))  return FileText;
    return File;
  }

  // ── Filtered / paged list ──────────────────────────────────────────────────
  const filtered = $derived((() => {
    let list = documents;
    if (selectedFolderId !== null) list = list.filter(d => d.folderId === selectedFolderId);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        (d.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return list;
  })());

  const paged = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  $effect(() => { query; selectedFolderId; currentPage = 1; });

  async function reloadDocs() {
    const qs = new URLSearchParams({ limit: '200' });
    if (selectedFolderId) qs.set('folderId', selectedFolderId);
    const res = await fetch(`/api/vault/documents?${qs}`);
    if (res.ok) {
      const d = await res.json();
      documents = d.documents ?? [];
      totalDocs = d.total ?? 0;
    }
  }

  async function reloadFolders() {
    const res = await fetch('/api/vault/folders');
    if (res.ok) folders = await res.json();
  }

  // ── Folder tree toggle ─────────────────────────────────────────────────────
  function toggleFolder(id: string) {
    const next = new Set(openFolders);
    next.has(id) ? next.delete(id) : next.add(id);
    openFolders = next;
  }

  // ── Upload document modal ──────────────────────────────────────────────────
  let uploadOpen   = $state(false);
  let uploadFile   = $state<File | null>(null);
  let uploadForm   = $state({ name: '', description: '', visibility: 'staff', ownerId: '', folderId: selectedFolderId ?? '', tags: '', note: '' });
  let uploading    = $state(false);
  let uploadError  = $state('');

  function openUpload() {
    uploadFile  = null;
    uploadError = '';
    uploadForm  = { name: '', description: '', visibility: 'staff', ownerId: data.user?.id ?? '', folderId: selectedFolderId ?? '', tags: '', note: '' };
    uploadOpen  = true;
  }

  function onFileChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    uploadFile = f;
    if (f && !uploadForm.name) uploadForm.name = f.name.replace(/\.[^.]+$/, '');
  }

  async function submitUpload() {
    if (!uploadFile)           { uploadError = 'Select a file'; return; }
    if (!uploadForm.name.trim()) { uploadError = 'Name is required'; return; }
    uploading = true; uploadError = '';
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('name', uploadForm.name.trim());
      fd.append('description', uploadForm.description);
      fd.append('visibility', uploadForm.visibility);
      fd.append('ownerId', uploadForm.ownerId || (data.user?.id ?? ''));
      fd.append('folderId', uploadForm.folderId || '');
      fd.append('tags', uploadForm.tags);
      fd.append('note', uploadForm.note);
      const res = await fetch('/api/vault/documents', { method: 'POST', body: fd });
      if (!res.ok) { const b = await res.json().catch(() => ({})); uploadError = (b as any).message ?? 'Upload failed'; return; }
      const created = await res.json();
      uploadOpen = false;
      await reloadDocs();
      goto(`/vault/${created.id}`);
    } catch { uploadError = 'Network error'; }
    finally { uploading = false; }
  }

  // ── Create folder modal ────────────────────────────────────────────────────
  let folderOpen    = $state(false);
  let folderForm    = $state({ name: '', parentId: '', visibility: 'staff' });
  let folderSaving  = $state(false);
  let folderError   = $state('');

  function openFolderCreate() {
    folderForm  = { name: '', parentId: selectedFolderId ?? '', visibility: 'staff' };
    folderError = '';
    folderOpen  = true;
  }

  async function submitFolder() {
    if (!folderForm.name.trim()) { folderError = 'Name is required'; return; }
    folderSaving = true; folderError = '';
    try {
      const res = await fetch('/api/vault/folders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name:       folderForm.name.trim(),
          parentId:   folderForm.parentId || null,
          visibility: folderForm.visibility
        })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); folderError = (b as any).message ?? 'Create failed'; return; }
      const parentId = folderForm.parentId || null;
      await reloadFolders();
      // auto-expand parent so the new subfolder is visible
      if (parentId) {
        const next = new Set(openFolders);
        next.add(parentId);
        openFolders = next;
      }
      folderOpen = false;
    } catch { folderError = 'Network error'; }
    finally { folderSaving = false; }
  }

  // ── Delete document modal ──────────────────────────────────────────────────
  let deleteTarget  = $state<Doc | null>(null);
  let deleting      = $state(false);
  let deleteError   = $state('');

  function openDelete(d: Doc) { deleteError = ''; deleteTarget = d; }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/vault/documents/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); deleteError = (b as any).message ?? 'Delete failed'; return; }
      documents = documents.filter(d => d.id !== deleteTarget!.id);
      deleteTarget = null;
    } catch { deleteError = 'Network error'; }
    finally { deleting = false; }
  }

  // ── Delete folder modal ────────────────────────────────────────────────────
  let deleteFolderTarget = $state<Folder | null>(null);
  let deletingFolder     = $state(false);
  let deleteFolderError  = $state('');

  function openDeleteFolder(f: Folder, e: MouseEvent) {
    e.stopPropagation();
    deleteFolderError = '';
    deleteFolderTarget = f;
  }

  async function confirmDeleteFolder() {
    if (!deleteFolderTarget) return;
    deletingFolder = true; deleteFolderError = '';
    try {
      const res = await fetch(`/api/vault/folders/${deleteFolderTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); deleteFolderError = (b as any).message ?? 'Delete failed'; return; }
      if (selectedFolderId === deleteFolderTarget.id) selectedFolderId = null;
      folders = folders.filter(f => f.id !== deleteFolderTarget!.id);
      deleteFolderTarget = null;
      await reloadDocs();
    } catch { deleteFolderError = 'Network error'; }
    finally { deletingFolder = false; }
  }
</script>

<svelte:head><title>Vault</title></svelte:head>

<div class="flex flex-col gap-6">
  <!-- Page header -->
  <div class="page-heading flex items-center justify-between gap-4">
    <div class="flex items-start gap-2.5">
      <FolderLock class="size-6 shrink-0 mt-0.5" />
      <div>
        <h1 class="text-2xl font-bold leading-none">Vault</h1>
        <p class="text-xs opacity-50 mt-0.5">Documents, policies, and reference materials</p>
      </div>
    </div>
    <div class="flex gap-2 shrink-0">
      {#if hasPermission(data.user, 'vault_folders', 'create')}
        <button type="button" class="btn btn-ghost btn-sm gap-1" onclick={openFolderCreate}>
          <FolderPlus class="size-4" /><span class="hidden sm:inline">New Folder</span>
        </button>
      {/if}
      {#if hasPermission(data.user, 'vault_documents', 'create')}
        <button type="button" class="btn btn-primary btn-sm gap-1" onclick={openUpload}>
          <Upload class="size-4" /><span>Upload</span>
        </button>
      {/if}
    </div>
  </div>

  <div class="flex gap-4 items-start">

    <!-- Folder tree sidebar -->
    <div class="w-52 shrink-0 bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <button
        type="button"
        class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-base-300/40 {selectedFolderId === null ? 'font-semibold' : 'opacity-70'}"
        onclick={() => (selectedFolderId = null)}
      >
        <FolderOpen class="size-4 shrink-0" />
        <span class="truncate">All Documents</span>
      </button>

      <div class="border-t border-base-300">
        {#each rootFolders() as folder (folder.id)}
          {@const hasChildren = childFolders(folder.id).length > 0}
          {@const isOpen      = openFolders.has(folder.id)}
          {@const isSelected  = selectedFolderId === folder.id}

          <div>
            <div class="flex items-center group">
              <button
                type="button"
                class="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2 text-sm text-left transition-colors hover:bg-base-300/40 {isSelected ? 'font-semibold' : 'opacity-70 hover:opacity-100'}"
                onclick={() => (selectedFolderId = folder.id)}
              >
                {#if hasChildren}
                  <ChevronRight
                    class="size-3.5 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-90' : ''}"
                    onclick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
                  />
                {:else}
                  <span class="w-3.5 shrink-0"></span>
                {/if}
                <Folder class="size-3.5 shrink-0" />
                <span class="truncate">{folder.name}</span>
              </button>
              {#if hasPermission(data.user, 'vault_folders', 'delete')}
                <button
                  type="button"
                  class="btn btn-ghost btn-square btn-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 mr-1 shrink-0"
                  aria-label="Delete {folder.name}"
                  onclick={(e) => openDeleteFolder(folder, e)}
                ><Trash2 class="size-3" /></button>
              {/if}
            </div>

            {#if isOpen && hasChildren}
              <div transition:slide={{ duration: 150 }} class="overflow-hidden">
                {#each childFolders(folder.id) as child (child.id)}
                  <div class="flex items-center group">
                    <button
                      type="button"
                      class="flex items-center gap-1.5 flex-1 min-w-0 pl-7 pr-3 py-2 text-sm text-left transition-colors hover:bg-base-300/40 {selectedFolderId === child.id ? 'font-semibold' : 'opacity-70 hover:opacity-100'}"
                      onclick={() => (selectedFolderId = child.id)}
                    >
                      <span class="w-3.5 shrink-0"></span>
                      <Folder class="size-3.5 shrink-0" />
                      <span class="truncate">{child.name}</span>
                    </button>
                    {#if hasPermission(data.user, 'vault_folders', 'delete')}
                      <button
                        type="button"
                        class="btn btn-ghost btn-square btn-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 mr-1 shrink-0"
                        aria-label="Delete {child.name}"
                        onclick={(e) => openDeleteFolder(child, e)}
                      ><Trash2 class="size-3" /></button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <p class="text-xs opacity-40 px-3 py-2">No folders yet.</p>
        {/each}
      </div>
    </div>

    <!-- Document list -->
    <div class="flex-1 min-w-0 space-y-3">
      <div class="flex items-center gap-3">
        <label class="input input-bordered flex items-center gap-2 flex-1">
          <Search class="size-4 opacity-50" />
          <input type="search" placeholder="Search by name or tag…" class="grow" bind:value={query} />
        </label>
      </div>

      <div class="bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              {#if selectedFolderId === null}<th>Folder</th>{/if}
              <th>Visibility</th>
              <th>Owner</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each paged as doc (doc.id)}
              {@const DocIcon = fileIcon(doc.originalName, doc.mimetype)}
              <tr
                class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
                onclick={() => goto(`/vault/${doc.id}`)}
              >
                <td>
                  <div class="flex items-center gap-2">
                    <DocIcon class="size-4 opacity-40 shrink-0" />
                    <div>
                      <div class="font-medium">{doc.name}</div>
                      {#if (doc.tags ?? []).length > 0}
                        <div class="flex gap-1 mt-0.5 flex-wrap">
                          {#each doc.tags.slice(0, 3) as tag}
                            <span class="badge badge-xs badge-ghost">{tag}</span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </td>
                {#if selectedFolderId === null}
                  <td class="text-xs opacity-60">{folderName(doc.folderId)}</td>
                {/if}
                <td>
                  <span class="badge badge-sm {VISIBILITY_BADGE[doc.visibility] ?? 'badge-ghost'}">
                    {VISIBILITY_LABEL[doc.visibility] ?? doc.visibility}
                  </span>
                </td>
                <td class="text-xs opacity-60">{userName(doc.ownerId)}</td>
                <td class="text-xs opacity-60 whitespace-nowrap">{fmtDate(doc.updatedAt)}</td>
                <td>
                  {#if hasPermission(data.user, 'vault_documents', 'delete')}
                    <button
                      type="button"
                      class="btn btn-ghost btn-square btn-xs hover:btn-error"
                      aria-label="Delete {doc.name}"
                      onclick={(e) => { e.stopPropagation(); openDelete(doc); }}
                    ><Trash2 class="size-3.5" /></button>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="text-center opacity-40 py-8 text-sm">
                  {query ? 'No documents match your search.' : 'No documents in this folder yet.'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if filtered.length > PAGE_SIZE}
          <div class="border-t border-base-300 px-4 py-2">
            <Pagination
              total={filtered.length}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
              onPage={(n) => (currentPage = n)}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Upload document modal -->
{#if uploadOpen}
  <Modal size="md" label="Upload Document">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Upload Document</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (uploadOpen = false)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if uploadError}<aside class="alert alert-error p-3 rounded text-sm">{uploadError}</aside>{/if}

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">File *</label>
        <input type="file" class="file-input w-full" onchange={onFileChange} />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Display Name *</label>
        <input type="text" class="input w-full" bind:value={uploadForm.name} maxlength="200" placeholder="e.g. Safety Policy 2024" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Folder</label>
          <select class="select w-full" bind:value={uploadForm.folderId}>
            <option value="">None (root)</option>
            {#each folders as f}
              <option value={f.id}>{f.name}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Visibility</label>
          <select class="select w-full" bind:value={uploadForm.visibility}>
            <option value="staff">Staff</option>
            <option value="admin_only">Admin only</option>
            <option value="customer">Customer-visible</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Owner</label>
          <select class="select w-full" bind:value={uploadForm.ownerId}>
            {#each data.users as u}
              <option value={u.id}>{u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.username}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Tags</label>
          <input type="text" class="input w-full" bind:value={uploadForm.tags} placeholder="comma-separated: policy, hr" />
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</label>
        <textarea class="textarea w-full" bind:value={uploadForm.description} rows="2" placeholder="Optional description…"></textarea>
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (uploadOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={uploading} onclick={submitUpload}>
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </footer>
  </Modal>
{/if}

<!-- Create folder modal -->
{#if folderOpen}
  <Modal size="sm" label="New Folder">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Folder</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (folderOpen = false)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-4">
      {#if folderError}<aside class="alert alert-error p-3 rounded text-sm">{folderError}</aside>{/if}
      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Name *</label>
        <input type="text" class="input w-full" bind:value={folderForm.name} maxlength="200" placeholder="e.g. HR Policies" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Parent Folder</label>
          <select class="select w-full" bind:value={folderForm.parentId}>
            <option value="">None (root)</option>
            {#each folders as f}
              <option value={f.id}>{f.name}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Visibility</label>
          <select class="select w-full" bind:value={folderForm.visibility}>
            <option value="staff">Staff</option>
            <option value="admin_only">Admin only</option>
            <option value="customer">Customer-visible</option>
          </select>
        </div>
      </div>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (folderOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={folderSaving} onclick={submitFolder}>
        {folderSaving ? 'Creating…' : 'Create Folder'}
      </button>
    </footer>
  </Modal>
{/if}

<!-- Delete document confirm -->
{#if deleteTarget}
  <Modal size="sm" label="Delete Document">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Delete Document</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteTarget = null)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-3">
      {#if deleteError}<aside class="alert alert-error p-3 rounded text-sm">{deleteError}</aside>{/if}
      <p class="text-sm">Permanently delete <span class="font-semibold">{deleteTarget.name}</span> and all its versions? This cannot be undone.</p>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (deleteTarget = null)}>Cancel</button>
      <button type="button" class="btn btn-error" disabled={deleting} onclick={confirmDelete}>
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </footer>
  </Modal>
{/if}

<!-- Delete folder confirm -->
{#if deleteFolderTarget}
  <Modal size="sm" label="Delete Folder">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Delete Folder</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteFolderTarget = null)}><X class="size-5" /></button>
    </header>
    <div class="p-6 space-y-3">
      {#if deleteFolderError}<aside class="alert alert-error p-3 rounded text-sm">{deleteFolderError}</aside>{/if}
      <p class="text-sm">Delete folder <span class="font-semibold">{deleteFolderTarget.name}</span>? The folder must be empty before it can be removed.</p>
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (deleteFolderTarget = null)}>Cancel</button>
      <button type="button" class="btn btn-error btn-outline" disabled={deletingFolder} onclick={confirmDeleteFolder}>
        {deletingFolder ? 'Deleting…' : 'Delete Folder'}
      </button>
    </footer>
  </Modal>
{/if}
