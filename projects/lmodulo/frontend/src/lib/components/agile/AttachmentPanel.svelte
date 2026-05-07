<script lang="ts">
  import { Paperclip, Trash2, FileText, UploadCloud } from 'lucide-svelte';
  import { fmtDate } from '$lib/utils/agile';
  import type { AgileAttachment } from '$lib/utils/agile';

  let {
    attachments = $bindable<AgileAttachment[]>([]),
    uploadUrl,
    deleteUrlFn,
    canDelete = false,
  }: {
    attachments?: AgileAttachment[];
    uploadUrl: string;
    deleteUrlFn: (filename: string) => string;
    canDelete?: boolean;
  } = $props();

  let fileInput: HTMLInputElement;
  let uploading   = $state(false);
  let pendingFile = $state<File | null>(null);
  let uploadError = $state('');
  let dragOver    = $state(false);
  let dragCounter = 0;

  function openPicker() {
    uploadError = '';
    fileInput.click();
  }

  function onFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file   = target.files?.[0];
    target.value = '';
    if (!file) return;
    handleFile(file);
  }

  function handleFile(file: File) {
    const safe      = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
    const duplicate = attachments.some(a => a.name === safe);
    if (duplicate) {
      pendingFile = file;
    } else {
      doUpload(file);
    }
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    dragOver = true;
  }

  function onDragLeave() {
    dragCounter--;
    if (dragCounter === 0) dragOver = false;
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    dragOver    = false;
    const file  = e.dataTransfer?.files?.[0];
    if (!file) return;
    uploadError = '';
    handleFile(file);
  }

  function cancelPending() {
    pendingFile  = null;
    uploadError  = '';
  }

  async function confirmReplace() {
    if (!pendingFile) return;
    const file  = pendingFile;
    pendingFile = null;
    await doUpload(file);
  }

  async function doUpload(file: File) {
    uploading   = true;
    uploadError = '';
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(uploadUrl, { method: 'POST', body: form });
      const d   = await res.json().catch(() => ({}));
      if (!res.ok) { uploadError = (d as any).message ?? 'Upload failed'; return; }
      attachments = (d as any).attachments ?? attachments;
    } catch { uploadError = 'Network error'; }
    finally { uploading = false; }
  }

  async function removeAttachment(filename: string) {
    const res = await fetch(deleteUrlFn(filename), { method: 'DELETE' });
    if (res.ok) {
      attachments = attachments.filter(a => a.name !== filename);
    }
  }
</script>

<input bind:this={fileInput} type="file" class="hidden" onchange={onFileSelect} />

<div class="space-y-2">
  {#if attachments.length === 0}
    <p class="text-xs opacity-40 text-center py-2">No attachments yet.</p>
  {:else}
    <ul class="space-y-1.5">
      {#each attachments as att (att.name)}
        <li class="flex items-center gap-2 text-sm p-2 rounded bg-base-300/40 hover:bg-base-300/60 transition-colors">
          <FileText class="size-4 shrink-0 opacity-50" />
          <a href={att.url} target="_blank" rel="noreferrer" class="flex-1 truncate font-medium hover:underline">{att.name}</a>
          {#if att.uploadedAt}
            <span class="text-xs opacity-40 shrink-0">{fmtDate(att.uploadedAt)}</span>
          {/if}
          {#if canDelete}
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100 shrink-0"
              onclick={() => removeAttachment(att.name)}
              aria-label="Remove {att.name}"
            >
              <Trash2 class="size-3.5" />
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Drop zone -->
  <button
    type="button"
    class="w-full rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors cursor-pointer focus:outline-none
      {dragOver
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-base-300/60 hover:border-base-300 hover:bg-base-300/20 text-base-content/40 hover:text-base-content/60'}"
    ondragenter={onDragEnter}
    ondragleave={onDragLeave}
    ondragover={onDragOver}
    ondrop={onDrop}
    onclick={openPicker}
    disabled={uploading}
  >
    <UploadCloud class="size-6 mx-auto mb-1.5 {dragOver ? 'text-primary' : 'opacity-40'}" />
    {#if uploading}
      <p class="text-xs font-medium">Uploading…</p>
    {:else if dragOver}
      <p class="text-xs font-semibold">Drop to upload</p>
    {:else}
      <p class="text-xs font-medium">Drop a file here or <span class="underline">click to browse</span></p>
    {/if}
  </button>

  {#if pendingFile}
    {@const safe = pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file'}
    <aside class="rounded border border-warning/40 bg-warning/10 p-3 text-sm space-y-2">
      <p class="opacity-80">
        A file named <code class="text-xs bg-base-300 px-1 rounded">{safe}</code> already exists and will be replaced.
      </p>
      <div class="flex gap-2">
        <button type="button" class="btn btn-warning btn-xs" onclick={confirmReplace}>Replace</button>
        <button type="button" class="btn btn-ghost btn-xs" onclick={cancelPending}>Cancel</button>
      </div>
    </aside>
  {/if}

  {#if uploadError}
    <p class="text-xs text-error">{uploadError}</p>
  {/if}
</div>
