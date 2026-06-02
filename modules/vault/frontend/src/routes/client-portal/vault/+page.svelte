<script lang="ts">
  import { Search, Download, FileText, FileImage, File } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Doc = typeof data.documents[0];

  let query = $state('');

  function folderName(id: string | null) {
    if (!id) return '—';
    return (data.folders as any[]).find(f => f.id === id)?.name ?? '—';
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

  const filtered = $derived((() => {
    if (!query.trim()) return data.documents as Doc[];
    const q = query.toLowerCase();
    return (data.documents as Doc[]).filter(d =>
      (d as any).name?.toLowerCase().includes(q) ||
      ((d as any).tags ?? []).some((t: string) => t.toLowerCase().includes(q))
    );
  })());

  async function download(doc: Doc) {
    const res = await fetch(`/api/vault/documents/${(doc as any).id}/file`);
    if (!res.ok) return;
    const { url, originalName } = await res.json();
    const a = document.createElement('a');
    a.href     = url;
    a.download = originalName ?? (doc as any).name;
    a.target   = '_blank';
    a.click();
  }
</script>

<svelte:head><title>Documents</title></svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold leading-none">Documents</h1>
    <p class="text-xs opacity-50 mt-0.5">Policies, warranties, and reference materials</p>
  </div>

  <label class="input input-bordered flex items-center gap-2 max-w-sm">
    <Search class="size-4 opacity-50" />
    <input type="search" placeholder="Search documents…" class="grow" bind:value={query} />
  </label>

  <div class="card bg-base-100 border border-base-200 overflow-hidden">
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Name</th>
          <th>Folder</th>
          <th>Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as doc (doc.id)}
          <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
            <td>
              <div class="flex items-center gap-2">
                <FileText class="size-4 opacity-40 shrink-0" />
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
            <td class="text-xs opacity-60">{folderName(doc.folderId)}</td>
            <td class="text-xs opacity-60 whitespace-nowrap">{fmtDate(doc.updatedAt)}</td>
            <td>
              <button
                type="button"
                class="btn btn-ghost btn-sm gap-1"
                onclick={() => download(doc)}
                aria-label="Download {doc.name}"
              >
                <Download class="size-4" />
                <span class="hidden sm:inline text-xs">Download</span>
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4" class="text-center opacity-40 py-8 text-sm">
              {query ? 'No documents match your search.' : 'No documents available.'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
