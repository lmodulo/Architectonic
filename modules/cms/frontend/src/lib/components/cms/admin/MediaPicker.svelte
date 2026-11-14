<script lang="ts">
  // Chooses Vault images for the page builder. One instance serves the whole page and opens when a
  // component calls `media.pick()` (lib/cms/media.svelte.ts). Lists web images only (never SVG or
  // admin-only) from /api/cms/media, by folder or search, 24 at a time; uploads go to Vault's
  // "Website Media" folder through Vault's own proxy, with progress.
  import { fade, scale, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { tick, untrack } from 'svelte';
  import { X, Search, Upload, Check, Folder, Images, Info } from 'lucide-svelte';
  import { cmsApi } from '$lib/cms/admin';
  import {
    getMediaContext, toImageRef, uploadFolder, uploadImage, uploadProblem, UPLOAD_ACCEPT, MEDIA_FOLDER_NAME,
    type MediaFolder,
  } from '$lib/cms/media.svelte';
  import { ms } from '$lib/cms/motion';
  import type { MediaItem } from '$lib/cms/types';

  const media = getMediaContext()!;
  const req = $derived(media.request);
  const PAGE = 24;
  const uid = $props.id();

  let folders = $state<MediaFolder[]>([]);
  let mediaFolderId = $state<string | null>(null);
  /** '' = all images, 'root' = not in a folder, or a folder id */
  let folderId = $state('');
  let q = $state('');
  let items = $state<MediaItem[]>([]);
  let total = $state(0);
  let loading = $state(false);
  let error = $state('');
  let selected = $state<MediaItem[]>([]);
  let alt = $state('');
  let uploads = $state<{ name: string; progress: number }[]>([]);
  let uploadErrors = $state<string[]>([]);
  let confirming = $state(false);

  let dialog: HTMLElement | undefined = $state();
  let searchInput: HTMLInputElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();
  let opener: HTMLElement | null = null;
  let seq = 0;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  // Folders in tree order, indented
  const folderRows = $derived.by(() => {
    const out: { id: string; name: string; depth: number }[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const f of folders.filter(f => f.parentId === parentId)) { out.push({ id: f.id, name: f.name, depth }); walk(f.id, depth + 1); }
    };
    walk(null, 0);
    return out;
  });

  $effect(() => {
    if (!req) return;
    untrack(() => {
      opener = document.activeElement as HTMLElement | null;
      folderId = '';
      q = '';
      items = [];
      total = 0;
      selected = [];
      alt = '';
      uploadErrors = [];
      error = '';
      loadFolders();
      load();
    });
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    tick().then(() => searchInput?.focus());
    return () => {
      root.style.overflow = previous;
      clearTimeout(searchTimer);
      opener?.focus();
    };
  });

  async function loadFolders() {
    const res = await cmsApi<{ folders: MediaFolder[]; mediaFolderId: string | null }>('media/folders');
    if (res.ok && res.data) { folders = res.data.folders; mediaFolderId = res.data.mediaFolderId; }
  }

  async function load(append = false) {
    const mine = ++seq;
    loading = true;
    error = '';
    const params = new URLSearchParams({ limit: String(PAGE), skip: String(append ? items.length : 0) });
    if (folderId) params.set('folderId', folderId);
    if (q.trim()) params.set('q', q.trim());
    const res = await cmsApi<{ available: boolean; items: MediaItem[]; total: number }>(`media?${params}`);
    if (mine !== seq) return;
    loading = false;
    if (!res.ok || !res.data) { error = res.message; return; }
    if (!res.data.available) { error = 'Install the Vault module to add images.'; return; }
    items = append ? [...items, ...res.data.items] : res.data.items;
    total = res.data.total;
  }

  function onSearch(v: string) {
    q = v;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => load(), 300);
  }

  function chooseFolder(id: string) {
    folderId = id;
    load();
  }

  const isSelected = (it: MediaItem) => selected.some(s => s.id === it.id);
  function toggle(it: MediaItem) {
    if (!req) return;
    if (req.multiple) selected = isSelected(it) ? selected.filter(s => s.id !== it.id) : [...selected, it];
    else selected = isSelected(it) ? [] : [it];
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length || !req) return;
    uploadErrors = [];
    const files = [...list].filter(f => {
      const p = uploadProblem(f);
      if (p) uploadErrors.push(p);
      return !p;
    });
    if (fileInput) fileInput.value = '';
    if (!files.length) return;
    uploads = files.map(f => ({ name: f.name, progress: 0 }));
    const folder = await uploadFolder(media.access);
    for (const [i, f] of files.entries()) {
      try {
        const item = await uploadImage(f, folder, p => { if (uploads[i]) uploads[i].progress = p; });
        items = [item, ...items.filter(x => x.id !== item.id)];
        total += 1;
        selected = req.multiple ? [...selected, item] : [item];
      } catch (e) {
        uploadErrors = [...uploadErrors, (e as Error).message];
      }
    }
    uploads = [];
    loadFolders();
  }

  async function confirm() {
    if (!selected.length || confirming) return;
    confirming = true;
    const text = req?.withAlt && !req.multiple ? alt.trim() : '';
    const refs = await Promise.all(selected.map(it => toImageRef(it, text)));
    confirming = false;
    media.finish(refs);
  }

  const cancel = () => media.finish(null);

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); return; }
    if (e.key !== 'Tab' || !dialog) return;
    const f = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])')]
      .filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  const folderLabel = $derived(
    folderId === '' ? 'All images' : folderId === 'root' ? 'Not in a folder' : folders.find(f => f.id === folderId)?.name ?? 'Folder',
  );
</script>

{#if req}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" transition:fade={{ duration: ms(200) }} onclick={cancel}></div>
  <div class="fixed inset-0 z-[61] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
    <div
      bind:this={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="{uid}-title"
      tabindex="-1"
      class="pointer-events-auto bg-base-200 border border-base-300 rounded-box w-full max-w-5xl h-[min(92vh,52rem)] flex flex-col shadow-2xl"
      transition:scale={{ duration: ms(300), start: 0.95, easing: cubicOut }}
      onkeydown={onKeydown}
    >
      <header class="flex items-center gap-3 px-4 py-3 border-b border-base-300">
        <Images class="size-5 opacity-70" />
        <h2 id="{uid}-title" class="text-base font-semibold flex-1">{req.title}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Close" onclick={cancel}><X class="size-5" /></button>
      </header>

      <div class="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-base-300">
        <label class="input input-sm flex items-center gap-2 flex-1 min-w-48">
          <Search class="size-4 opacity-60" />
          <input bind:this={searchInput} type="search" class="grow" placeholder="Search by name or tag" aria-label="Search images" value={q} oninput={e => onSearch(e.currentTarget.value)} />
        </label>
        <select class="select select-sm sm:hidden flex-1 min-w-40" aria-label="Folder" value={folderId} onchange={e => chooseFolder(e.currentTarget.value)}>
          <option value="">All images</option>
          <option value="root">Not in a folder</option>
          {#each folderRows as f (f.id)}<option value={f.id}>{'— '.repeat(f.depth)}{f.name}</option>{/each}
        </select>
        {#if media.access.canUpload}
          <input bind:this={fileInput} type="file" class="hidden" accept={UPLOAD_ACCEPT} multiple={req.multiple} onchange={e => onFiles(e.currentTarget.files)} />
          <button type="button" class="btn btn-sm btn-primary" disabled={uploads.length > 0} onclick={() => fileInput?.click()}>
            <Upload class="size-4" />Upload
          </button>
        {/if}
      </div>

      <p class="flex items-start gap-2 px-4 py-2 text-xs opacity-70 border-b border-base-300">
        <Info class="size-3.5 shrink-0 mt-px" />
        <span>Images placed on pages are publicly visible.{media.access.canUpload ? ` Uploads go to the Vault folder "${MEDIA_FOLDER_NAME}" (PNG, JPEG, GIF, WebP or AVIF, up to 10 MB).` : ''}</span>
      </p>

      {#if uploads.length || uploadErrors.length}
        <div class="px-4 py-2 flex flex-col gap-1.5 border-b border-base-300" transition:slide={{ duration: ms(200) }}>
          {#each uploads as u (u.name)}
            <div class="flex items-center gap-3 text-xs">
              <span class="truncate w-48">{u.name}</span>
              <progress class="progress progress-primary flex-1" value={Math.round(u.progress * 100)} max="100" aria-label="Uploading {u.name}"></progress>
            </div>
          {/each}
          {#each uploadErrors as m}<p class="text-xs text-error" role="alert">{m}</p>{/each}
        </div>
      {/if}

      <div class="flex-1 min-h-0 flex">
        <nav class="hidden sm:flex flex-col gap-0.5 w-52 shrink-0 overflow-y-auto border-r border-base-300 p-2" aria-label="Vault folders">
          {#each [{ id: '', name: 'All images', depth: 0 }, { id: 'root', name: 'Not in a folder', depth: 0 }, ...folderRows] as f (f.id)}
            <button
              type="button"
              class="flex items-center gap-2 text-left text-sm rounded-field px-2 py-1.5 transition-colors {folderId === f.id ? 'bg-base-300 font-semibold' : 'hover:bg-base-300/60'}"
              style="padding-left: {0.5 + f.depth * 0.9}rem"
              aria-pressed={folderId === f.id}
              onclick={() => chooseFolder(f.id)}
            >
              {#if f.id === ''}<Images class="size-3.5 shrink-0 opacity-60" />{:else}<Folder class="size-3.5 shrink-0 opacity-60" />{/if}
              <span class="truncate">{f.name}</span>
              {#if f.id && f.id === mediaFolderId}<span class="badge badge-xs badge-ghost ml-auto">site</span>{/if}
            </button>
          {/each}
        </nav>

        <div class="flex-1 min-w-0 overflow-y-auto p-3" aria-busy={loading}>
          <p class="sr-only" aria-live="polite">{loading ? 'Loading images' : `${total} image${total === 1 ? '' : 's'} in ${folderLabel}`}</p>
          {#if error}
            <div role="alert" class="alert alert-error text-sm py-2" transition:slide={{ duration: ms(200) }}>{error}</div>
          {:else if !loading && !items.length}
            <div class="h-full flex flex-col items-center justify-center gap-2 text-center p-8" in:fade={{ duration: ms(150) }}>
              <Images class="size-8 opacity-40" />
              <p class="text-sm opacity-70">{q ? 'No images match your search.' : 'No images here yet.'}</p>
              {#if media.access.canUpload && !q}<p class="text-xs opacity-60">Upload one, or add images to Vault.</p>{/if}
            </div>
          {:else}
            <ul class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {#each items as it (it.id)}
                <li in:fade={{ duration: ms(150) }}>
                  <button
                    type="button"
                    class="group relative block w-full rounded-field overflow-hidden bg-base-300 outline-offset-2 transition-[outline-color] {isSelected(it) ? 'outline-2 outline outline-primary' : 'outline outline-1 outline-transparent hover:outline-base-content/30'}"
                    aria-pressed={isSelected(it)}
                    aria-label={it.name}
                    title={it.name}
                    onclick={() => toggle(it)}
                    ondblclick={() => { if (!req.multiple) { selected = [it]; confirm(); } }}
                  >
                    <img src={it.url} alt="" loading="lazy" decoding="async" class="block w-full aspect-square object-cover" />
                    <span class="block truncate px-1.5 py-1 text-[11px] text-left bg-base-100/90">{it.name}</span>
                    {#if isSelected(it)}
                      <span class="absolute top-1.5 right-1.5 size-6 rounded-full bg-primary text-primary-content grid place-items-center shadow" transition:scale={{ duration: ms(150), start: 0.6 }}>
                        <Check class="size-4" />
                      </span>
                    {/if}
                  </button>
                </li>
              {/each}
            </ul>
            {#if items.length < total}
              <div class="flex justify-center pt-3">
                <button type="button" class="btn btn-sm btn-ghost" disabled={loading} onclick={() => load(true)}>
                  {#if loading}<span class="loading loading-spinner loading-xs"></span>{/if}
                  Show more ({total - items.length} left)
                </button>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <footer class="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-base-300">
        {#if req.withAlt && !req.multiple}
          <label class="flex flex-col gap-1 flex-1 min-w-56" for="{uid}-alt">
            <span class="text-xs font-medium">Alt text <span class="font-normal opacity-60">(describes the image for people who can't see it)</span></span>
            <input id="{uid}-alt" class="input input-sm w-full" bind:value={alt} maxlength="500" placeholder="e.g. Volunteers planting trees by the river" disabled={!selected.length} />
          </label>
        {:else}
          <span class="text-sm opacity-70 flex-1">{selected.length ? `${selected.length} selected` : req.multiple ? 'Select one or more images' : 'Select an image'}</span>
        {/if}
        <div class="flex items-center gap-2 ml-auto">
          <button type="button" class="btn btn-sm btn-ghost" onclick={cancel}>Cancel</button>
          <button type="button" class="btn btn-sm btn-primary" disabled={!selected.length || confirming || uploads.length > 0} onclick={confirm}>
            {#if confirming}<span class="loading loading-spinner loading-xs"></span>{/if}
            {req.multiple ? `Add ${selected.length || ''} image${selected.length === 1 ? '' : 's'}` : 'Use image'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}
