// Images from Vault in the page builder: who may pick and upload, the shared picker request, the
// map of images that can be shown, and uploads. cms never imports Vault's code: it browses through
// /api/cms/media (its own API, reading Vault's collections) and uploads through Vault's own
// /api/vault/folders and /api/vault/documents proxies, so Vault keeps its checks and audit log.
import { getContext, setContext } from 'svelte';
import { hasPermission, type UserWithPermissions } from '$lib/permissions';
import { cmsApi } from './admin';
import type { ImageRef, MediaItem, MediaMap } from './types';

/** Vault's proxy streams the body: a larger file makes it fail with a 500 rather than a 413. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/avif';
const UPLOAD_TYPES = /^image\/(png|jpeg|gif|webp|avif)$/;
export const MEDIA_FOLDER_NAME = 'Website Media';

export interface MediaAccess {
  /** the Vault module is installed (its permissions exist) */
  installed: boolean;
  canPick: boolean;
  canUpload: boolean;
  canCreateFolder: boolean;
  /** may store the Website Media folder id in the site settings */
  canSaveSettings: boolean;
  /** why images can't be added, for the UI; null when they can */
  reason: string | null;
}

export function mediaAccess(user: UserWithPermissions | null | undefined): MediaAccess {
  const installed = !!user?.permissions && 'vault_documents' in user.permissions;
  const canPick = installed && hasPermission(user, 'vault_documents', 'read') && hasPermission(user, 'cms_pages', 'update');
  return {
    installed,
    canPick,
    canUpload: canPick && hasPermission(user, 'vault_documents', 'create'),
    canCreateFolder: hasPermission(user, 'vault_folders', 'create'),
    canSaveSettings: hasPermission(user, 'cms_nodes', 'update'),
    reason: !installed ? 'Install the Vault module to add images.' : !canPick ? 'You need access to Vault to add images.' : null,
  };
}

/** Why a file can't be uploaded, or null. */
export function uploadProblem(file: File): string | null {
  if (!UPLOAD_TYPES.test(file.type)) return `"${file.name}" isn't a PNG, JPEG, GIF, WebP or AVIF image.`;
  if (file.size > MAX_UPLOAD_BYTES) return `"${file.name}" is larger than 10 MB.`;
  return null;
}

/** The image's natural size, stored with the page so the browser can reserve its space. */
export function imageSize(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? { w: img.naturalWidth, h: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function toImageRef(item: { id: string; url: string }, alt = ''): Promise<ImageRef> {
  const size = await imageSize(item.url);
  return { vaultId: item.id, src: item.url, alt, ...(size ? { w: size.w, h: size.h } : {}) };
}

export interface MediaFolder { id: string; name: string; parentId: string | null }

/**
 * The folder uploads go to: the one in the site settings if it still exists, else a top-level
 * "Website Media" folder (created when allowed, and remembered in the settings), else Vault's root.
 */
export async function uploadFolder(access: MediaAccess): Promise<string | null> {
  const res = await cmsApi<{ folders: MediaFolder[]; mediaFolderId: string | null }>('media/folders');
  if (!res.ok || !res.data) return null;
  const { folders, mediaFolderId } = res.data;
  if (mediaFolderId && folders.some(f => f.id === mediaFolderId)) return mediaFolderId;
  let id = folders.find(f => !f.parentId && f.name === MEDIA_FOLDER_NAME)?.id ?? null;
  if (!id && access.canCreateFolder) {
    try {
      const r = await fetch('/api/vault/folders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: MEDIA_FOLDER_NAME, visibility: 'staff', parentId: null }),
      });
      if (r.ok) id = ((await r.json()) as { id: string }).id;
    } catch { /* upload to the root instead */ }
  }
  if (id && id !== mediaFolderId && access.canSaveSettings) await cmsApi('settings', { method: 'PATCH', body: { mediaFolderId: id } });
  return id;
}

/** Uploads one file to Vault (XHR, for progress), then fetches it as a media item. */
export function uploadImage(file: File, folderId: string | null, onProgress?: (fraction: number) => void): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('name', file.name.replace(/\.[^.]+$/, '') || file.name);
    form.append('visibility', 'staff');
    form.append('tags', 'website');
    if (folderId) form.append('folderId', folderId);
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/vault/documents');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onerror = () => reject(new Error(`"${file.name}" couldn't be uploaded. Check your connection and try again.`));
    xhr.onload = async () => {
      let body: { id?: string; message?: string } = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status < 200 || xhr.status >= 300 || !body.id) {
        reject(new Error(body.message ? `"${file.name}": ${body.message}` : `"${file.name}" couldn't be uploaded (status ${xhr.status}).`));
        return;
      }
      const item = await cmsApi<MediaItem>(`media/${body.id}`);
      if (item.ok && item.data) resolve(item.data);
      else reject(new Error(`"${file.name}" was saved in Vault but can't be used on the website. ${item.message}`));
    };
    xhr.send(form);
  });
}

// ── The builder's shared media state ─────────────────────────────────────────────────────

export interface PickRequest {
  multiple: boolean;
  /** ask for alt text (single images in text) */
  withAlt: boolean;
  title: string;
  resolve: (images: ImageRef[] | null) => void;
}

const KEY = Symbol('cms-media');

export class MediaContext {
  /** images that can be shown: the page's resolved media plus anything picked or uploaded since */
  known = $state<MediaMap>({});
  /** the open picker, if any (one MediaPicker serves the whole page) */
  request = $state<PickRequest | null>(null);
  /** files being uploaded from a paste or drop into text */
  uploading = $state(0);

  constructor(readonly access: MediaAccess, media: MediaMap) {
    this.known = { ...media };
  }

  isMissing(vaultId: string): boolean {
    return !this.known[vaultId];
  }

  remember(refs: ImageRef[]) {
    for (const r of refs) this.known[r.vaultId] = { url: r.src };
  }

  /** Opens the picker; resolves with the chosen images, or null if cancelled. */
  pick(opts: { multiple?: boolean; withAlt?: boolean; title?: string } = {}): Promise<ImageRef[] | null> {
    this.request?.resolve(null);
    return new Promise(resolve => {
      this.request = {
        multiple: opts.multiple === true,
        withAlt: opts.withAlt === true,
        title: opts.title ?? (opts.multiple ? 'Add images' : 'Choose an image'),
        resolve,
      };
    });
  }

  finish(images: ImageRef[] | null) {
    const r = this.request;
    this.request = null;
    if (images) this.remember(images);
    r?.resolve(images);
  }

  /** Uploads files (pasted or dropped into text) to the Website Media folder. */
  async uploadFiles(files: File[]): Promise<{ images: ImageRef[]; errors: string[] }> {
    const errors: string[] = [];
    const ok = files.filter(f => { const p = uploadProblem(f); if (p) errors.push(p); return !p; });
    if (!ok.length) return { images: [], errors };
    this.uploading += ok.length;
    const images: ImageRef[] = [];
    try {
      const folder = await uploadFolder(this.access);
      for (const f of ok) {
        try {
          images.push(await toImageRef(await uploadImage(f, folder)));
        } catch (e) {
          errors.push((e as Error).message);
        } finally {
          this.uploading--;
        }
      }
    } catch {
      this.uploading = 0;
    }
    this.remember(images);
    return { images, errors };
  }
}

export const setMediaContext = (m: MediaContext) => setContext(KEY, m);
export const getMediaContext = () => getContext<MediaContext | undefined>(KEY);
