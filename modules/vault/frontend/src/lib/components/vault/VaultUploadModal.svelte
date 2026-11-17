<script lang="ts">
  // The Vault's "Upload Document" dialog (/vault). One file (any type, up to the API's 10 MB multipart cap) goes to
  // POST /api/vault/documents with its details; `onuploaded` gets the new document's id.
  import { onMount, untrack } from 'svelte';
  import { slide } from 'svelte/transition';
  import {
    X, Upload, FileUp, File as FileIcon, FileText, FileImage, FileSpreadsheet, FileArchive, FilePlay, FileMusic,
    UsersRound, Globe, ShieldCheck,
  } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import VaultTagInput from './VaultTagInput.svelte';

  type FolderOption = { id: string; name: string; parentId?: string | null };
  type Person = { id: string; firstName?: string; lastName?: string; username?: string };

  let {
    folders,
    users,
    userId,
    role,
    folderId = null,
    tagSuggestions = [],
    onclose,
    onuploaded,
  }: {
    folders: FolderOption[];
    users: Person[];
    userId: string;
    /** the signed-in user's workspace role: only owners and admins can see (so make) admin-only documents */
    role: string;
    folderId?: string | null;
    tagSuggestions?: string[];
    /** `cancelled`: an upload was stopped part way, so the server may or may not have the document */
    onclose: (cancelled: boolean) => void;
    onuploaded: (id: string) => void;
  } = $props();

  /** As the API's @fastify/multipart fileSize limit (and adapter-node's BODY_SIZE_LIMIT in production) */
  const MAX_BYTES = 10 * 1024 * 1024;

  // ── Form ──────────────────────────────────────────────────────────────────
  let file        = $state<File | null>(null);
  let name        = $state('');
  let description = $state('');
  // The dialog is made fresh each time it opens, so it starts from the props' values then
  let folder      = $state(untrack(() => folderId) ?? '');
  let ownerId     = $state(untrack(() => userId));
  let visibility  = $state('staff');
  let tags        = $state<string[]>([]);

  let fileError = $state('');
  let nameError = $state('');
  let error     = $state('');
  let dragging  = $state(false);
  let uploading = $state(false);
  let progress  = $state(0);
  /** The whole file has been sent and the server is storing it: too late to cancel */
  const saving  = $derived(uploading && progress >= 1);

  let picker  = $state<HTMLInputElement | null>(null);
  let zone    = $state<HTMLButtonElement | null>(null);
  let nameBox = $state<HTMLInputElement | null>(null);
  let xhr: XMLHttpRequest | null = null;
  /** The name last filled in from a file, so picking another file replaces it unless it was edited */
  let autoName = '';

  const VISIBILITY = $derived([
    { value: 'staff',      label: 'Staff',      hint: "Everyone on your team. Customers can't see it.", icon: UsersRound },
    { value: 'customer',   label: 'Customers',  hint: 'Your team, plus customers in their client portal.', icon: Globe },
    ...(role === 'owner' || role === 'admin'
      ? [{ value: 'admin_only', label: 'Admin only', hint: 'Only owners and admins.', icon: ShieldCheck }]
      : []),
  ]);

  /** Folders in tree order, children indented under their parent */
  const folderOptions = $derived.by(() => {
    const out: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    const walk = (parent: string | null, depth: number) => {
      for (const f of folders) {
        if ((f.parentId ?? null) !== parent || seen.has(f.id)) continue;
        seen.add(f.id);
        out.push({ id: f.id, label: `${' '.repeat(depth)}${f.name}` });
        walk(f.id, depth + 1);
      }
    };
    walk(null, 0);
    // A folder whose parent isn't listed (one this user can't see)
    for (const f of folders) if (!seen.has(f.id)) out.push({ id: f.id, label: f.name });
    return out;
  });

  const people = $derived(
    [...users].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : personName(a).localeCompare(personName(b)))),
  );

  function personName(u: Person) {
    return u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : (u.username ?? '');
  }

  // ── The chosen file ───────────────────────────────────────────────────────
  const ext = $derived(file?.name.includes('.') ? file.name.split('.').pop()!.toUpperCase().slice(0, 6) : '');

  const kind = $derived.by(() => {
    if (!file) return null;
    const t = file.type;
    const e = ext.toLowerCase();
    if (t.startsWith('image/')) return { icon: FileImage, tone: 'bg-info/15 text-info' };
    if (t === 'application/pdf' || e === 'pdf') return { icon: FileText, tone: 'bg-error/15 text-error' };
    if (/sheet|excel|csv/.test(t) || ['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(e))
      return { icon: FileSpreadsheet, tone: 'bg-success/15 text-success' };
    if (t.startsWith('video/')) return { icon: FilePlay, tone: 'bg-secondary/15 text-secondary' };
    if (t.startsWith('audio/')) return { icon: FileMusic, tone: 'bg-secondary/15 text-secondary' };
    if (/zip|compressed|tar|rar|7z/.test(t) || ['zip', 'rar', '7z', 'tar', 'gz'].includes(e))
      return { icon: FileArchive, tone: 'bg-warning/15 text-warning' };
    if (t.startsWith('text/') || /word|document|rtf|presentation|powerpoint/.test(t))
      return { icon: FileText, tone: 'bg-primary/15 text-primary' };
    return { icon: FileIcon, tone: 'bg-base-300 text-base-content' };
  });

  let thumb = $state('');
  $effect(() => {
    const f = file;
    if (!f || !/^image\/(png|jpe?g|gif|webp|avif|svg\+xml|bmp)$/.test(f.type)) { thumb = ''; return; }
    const url = URL.createObjectURL(f);
    thumb = url;
    return () => URL.revokeObjectURL(url);
  });

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function choose(f: File | null | undefined) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      fileError = `${f.name} is ${fmtSize(f.size)}. Files can be up to 10 MB.`;
      return;
    }
    if (f.size === 0) {
      fileError = `${f.name} is empty.`;
      return;
    }
    fileError = '';
    error = '';
    file = f;
    const base = f.name.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!name.trim() || name === autoName) {
      name = base;
      nameError = '';
    }
    autoName = base;
  }

  function browse() {
    picker?.click();
  }

  function clearFile() {
    file = null;
    if (name === autoName) name = '';
    autoName = '';
    // The drop zone replaces the file card; focus it once it's in the page
    setTimeout(() => zone?.focus());
  }

  // Dropping anywhere on the dialog picks the file, so a near miss never makes the browser open it instead
  function dragover(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    if (!uploading) dragging = true;
  }

  function dragleave(e: DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) dragging = false;
  }

  function drop(e: DragEvent) {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    dragging = false;
    if (!uploading) choose(e.dataTransfer.files[0]);
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  function send(body: FormData): Promise<{ status: number; message: string; id: string }> {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      xhr = x;
      x.open('POST', '/api/vault/documents');
      x.upload.onprogress = e => { if (e.lengthComputable) progress = Math.min(e.loaded / e.total, 0.99); };
      // All of it sent (a small file may never report progress before this)
      x.upload.onload = () => { progress = 1; };
      x.onload = () => {
        let parsed: { id?: string; message?: string } = {};
        try { parsed = JSON.parse(x.responseText); } catch { /* not JSON (e.g. the web server's own 413) */ }
        resolve({ status: x.status, message: parsed.message ?? '', id: parsed.id ?? '' });
      };
      x.onerror = () => reject(new Error('The connection was lost. Check it and try again.'));
      x.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
      x.send(body);
    });
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (uploading) return;
    fileError = file ? '' : 'Choose a file to upload.';
    nameError = name.trim() ? '' : 'Give the document a name.';
    if (fileError) return zone?.focus();
    if (nameError) return nameBox?.focus();

    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('description', description.trim());
    fd.append('visibility', visibility);
    fd.append('ownerId', ownerId || userId);
    fd.append('folderId', folder);
    fd.append('tags', tags.join(','));
    fd.append('file', file!);

    uploading = true;
    progress = 0;
    error = '';
    try {
      const res = await send(fd);
      if (res.status >= 200 && res.status < 300 && res.id) return onuploaded(res.id);
      error = res.status === 413
        ? 'This file is larger than the 10 MB limit.'
        : res.message || `The upload failed (error ${res.status}). Try again.`;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      error = err instanceof Error ? err.message : 'The upload failed. Try again.';
    } finally {
      uploading = false;
      xhr = null;
    }
  }

  function close() {
    if (saving) return;
    const cancelled = uploading;
    xhr?.abort();
    onclose(cancelled);
  }

  function keydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !e.defaultPrevented) close();
  }

  onMount(() => {
    const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    zone?.focus();
    return () => back?.focus();
  });
</script>

<svelte:window onkeydown={keydown} />

<!-- z 60: above the chat assistant button (z-50), which would otherwise cover Upload on a phone -->
<Modal size="lg" label="Upload Document" z={60}>
  <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
    <h2 class="text-lg font-semibold">Upload Document</h2>
    <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Close" disabled={saving} onclick={close}>
      <X class="size-5" />
    </button>
  </header>

  <form
    id="vault-upload"
    class="p-6 overflow-y-auto flex-1"
    novalidate
    onsubmit={submit}
    ondragover={dragover}
    ondragleave={dragleave}
    ondrop={drop}
  >
    <fieldset class="space-y-5 min-w-0" disabled={uploading}>
      <!-- File -->
      <div class="space-y-1">
        <span class="block text-xs font-medium opacity-60 uppercase tracking-wide" id="vu-file-label">File</span>
        <div
          class="relative rounded-box transition-colors {file
            ? 'border border-base-300 bg-base-100'
            : `border-2 border-dashed ${fileError ? 'border-error/60' : 'border-base-300'} bg-base-100/60`}
            {dragging ? '!border-primary !bg-primary/5' : ''}"
        >
          {#if file && kind}
            {@const Icon = kind.icon}
            <div class="flex items-center gap-3 p-3" transition:slide={{ duration: 200 }}>
              <div class="size-12 shrink-0 rounded-field overflow-hidden flex items-center justify-center {thumb ? 'bg-base-300' : kind.tone}">
                {#if thumb}
                  <img src={thumb} alt="" class="size-full object-cover" />
                {:else}
                  <Icon class="size-6" />
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                {#if uploading}
                  <progress class="progress progress-primary w-full h-1.5 block mt-2" value={progress} max="1"
                    aria-label="Uploading {file.name}"></progress>
                {:else}
                  <p class="text-xs opacity-50 mt-0.5">{fmtSize(file.size)}{ext ? ` · ${ext}` : ''}</p>
                {/if}
              </div>
              <button type="button" class="btn btn-ghost btn-sm" onclick={browse}>Replace</button>
              <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Remove {file.name}" onclick={clearFile}>
                <X class="size-4" />
              </button>
            </div>
          {:else}
            <div transition:slide={{ duration: 200 }}>
              <button
                bind:this={zone}
                type="button"
                class="w-full flex flex-col items-center gap-2 px-4 py-7 text-center rounded-box cursor-pointer hover:bg-base-content/[.03] transition-colors"
                aria-labelledby="vu-file-label vu-file-cta"
                aria-describedby="vu-file-hint{fileError ? ' vu-file-error' : ''}"
                onclick={browse}
              >
                <span class="flex items-center justify-center size-11 rounded-full transition-colors {dragging ? 'bg-primary text-primary-content' : 'bg-base-300'}">
                  <FileUp class="size-5" />
                </span>
                <span class="text-sm" id="vu-file-cta">
                  {#if dragging}
                    <span class="font-medium text-primary">Drop to add it</span>
                  {:else}
                    <span class="font-medium underline underline-offset-2">Choose a file</span> or drag it here
                  {/if}
                </span>
                <span class="text-xs opacity-50" id="vu-file-hint">PDFs, Office documents, images or any other file, up to 10 MB</span>
              </button>
            </div>
          {/if}
        </div>
        {#if fileError}
          <p class="text-xs text-error" id="vu-file-error" role="alert" transition:slide={{ duration: 150 }}>{fileError}</p>
        {/if}
        <input bind:this={picker} type="file" class="hidden" tabindex="-1" aria-hidden="true"
          onchange={(e) => { choose(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
      </div>

      <!-- Name -->
      <div class="space-y-1">
        <label class="block text-xs font-medium opacity-60 uppercase tracking-wide" for="vu-name">Name</label>
        <input
          bind:this={nameBox}
          id="vu-name"
          type="text"
          class="input w-full {nameError ? 'input-error' : ''}"
          maxlength="200"
          placeholder="e.g. Safety Policy 2026"
          aria-invalid={nameError ? 'true' : undefined}
          aria-describedby={nameError ? 'vu-name-error' : undefined}
          bind:value={name}
          oninput={() => { if (name.trim()) nameError = ''; }}
        />
        {#if nameError}
          <p class="text-xs text-error" id="vu-name-error" transition:slide={{ duration: 150 }}>{nameError}</p>
        {/if}
      </div>

      <!-- Where, and whose -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-xs font-medium opacity-60 uppercase tracking-wide" for="vu-folder">Folder</label>
          <select id="vu-folder" class="select w-full" bind:value={folder}>
            <option value="">No folder</option>
            {#each folderOptions as f (f.id)}
              <option value={f.id}>{f.label}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-medium opacity-60 uppercase tracking-wide" for="vu-owner">Owner</label>
          <select id="vu-owner" class="select w-full" bind:value={ownerId}>
            {#each people as u (u.id)}
              <option value={u.id}>{personName(u)}{u.id === userId ? ' (you)' : ''}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Who can see it -->
      <fieldset class="space-y-1 min-w-0">
        <legend class="block text-xs font-medium opacity-60 uppercase tracking-wide mb-1">Who can see it</legend>
        <div class="grid grid-cols-1 gap-2 {VISIBILITY.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}">
          {#each VISIBILITY as v (v.value)}
            {@const Icon = v.icon}
            {@const on = visibility === v.value}
            <label
              class="flex items-start gap-3 p-3 rounded-box border cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary
                bg-base-100 {on ? 'border-primary ring-1 ring-primary' : 'border-base-300 hover:border-base-content/25'}"
            >
              <!-- Named by its title alone, with the explanation as its description -->
              <input type="radio" class="radio radio-primary radio-sm mt-0.5 shrink-0" name="vu-visibility" value={v.value}
                aria-labelledby="vu-vis-{v.value}" aria-describedby="vu-vis-{v.value}-hint" bind:group={visibility} />
              <span class="min-w-0">
                <span class="flex items-center gap-1.5 text-sm font-medium">
                  <Icon class="size-4 shrink-0 {on ? 'text-primary' : 'opacity-60'}" /><span id="vu-vis-{v.value}">{v.label}</span>
                </span>
                <span class="block text-xs opacity-60 mt-0.5 leading-snug" id="vu-vis-{v.value}-hint">{v.hint}</span>
              </span>
            </label>
          {/each}
        </div>
      </fieldset>

      <!-- Tags -->
      <div class="space-y-1">
        <label class="block text-xs font-medium opacity-60 uppercase tracking-wide" for="vu-tags">Tags</label>
        <VaultTagInput id="vu-tags" bind:tags suggestions={tagSuggestions} disabled={uploading} />
        <p class="text-xs opacity-50">Press Enter after each tag. Search finds documents by name or tag.</p>
      </div>

      <!-- Description -->
      <div class="space-y-1">
        <label class="block text-xs font-medium opacity-60 uppercase tracking-wide" for="vu-description">
          Description <span class="normal-case tracking-normal opacity-70">(optional)</span>
        </label>
        <textarea id="vu-description" class="textarea w-full" rows="3" maxlength="2000"
          placeholder="What's in it, who it's for, when it applies…" bind:value={description}></textarea>
      </div>
    </fieldset>
  </form>

  <footer class="px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
    {#if error}
      <div transition:slide={{ duration: 200 }}>
        <div role="alert" class="alert alert-error text-sm py-2 mb-3">{error}</div>
      </div>
    {/if}
    <div class="flex justify-end gap-3">
      <button type="button" class="btn btn-ghost" disabled={saving} onclick={close}>Cancel</button>
      <button type="submit" form="vault-upload" class="btn btn-primary min-w-36" disabled={uploading}>
        {#if uploading}
          <span class="loading loading-spinner loading-xs"></span>
          {saving ? 'Saving…' : `Uploading ${Math.round(progress * 100)}%`}
        {:else}
          <Upload class="size-4" />Upload
        {/if}
      </button>
    </div>
  </footer>
</Modal>
