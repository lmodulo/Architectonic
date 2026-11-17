// The photos and videos in an open event form ($lib/components/EventMediaEditor.svelte), and their uploads.
//
// Files upload as soon as they're picked, one at a time, in chunks (/api/calendar-events/media; the API's
// routes/calendar-events/media.ts), so a large video stays under the web server's body limit and shows its progress.
// Nothing changes on the event until the form is saved: the save sends `ids` (the finished files, in order), which
// attaches the new ones and drops any the event had that were removed here. Closing the form without saving
// deletes this session's uploads (`dispose`); the API also deletes unattached uploads after a day.
import { normalizeMedia, type EventMedia } from './calendarEvents';

/** What the file picker offers (the API checks each file's bytes as well) */
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,.mp4';
/** As the API's MAX_PER_EVENT */
export const MAX_MEDIA = 50;

const IMAGE = /^image\/(jpeg|png|webp|gif|avif)$/;
const RETRIES = 4;

export type MediaEntry = {
  key: string;
  /** the stored file, once uploaded (or from the event) */
  item: EventMedia | null;
  kind: 'image' | 'video';
  name: string;
  /** a local preview (object URL) while it uploads */
  preview: string;
  /** 0 to 1 */
  progress: number;
  error: string;
};

type Pending = { file: File; uploadId: string | null; xhr: XMLHttpRequest | null };

let keys = 0;

function kindOf(file: File): 'image' | 'video' | null {
  if (IMAGE.test(file.type)) return 'image';
  if (file.type === 'video/mp4' || (!file.type && /\.mp4$/i.test(file.name))) return 'video';
  return null;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function message(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return body?.message || fallback;
}

/** Busy (rate limited) or a server hiccup: worth trying again */
const transient = (status: number) => status === 429 || status >= 500;

/** How long to wait before try number `tries`: the server's Retry-After when it gave one, else 2, 4, 8… seconds */
const backoff = (tries: number, retryAfter: number) => (retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** tries);

/** One chunk by XHR, for its upload progress. Resolves with the status and parsed body; rejects on a network error. */
function sendChunk(
  xhr: XMLHttpRequest,
  url: string,
  chunk: Blob,
  onProgress: (loaded: number) => void,
): Promise<{ status: number; body: Record<string, unknown>; retryAfter: number }> {
  return new Promise((resolve, reject) => {
    xhr.open('PUT', url);
    xhr.setRequestHeader('content-type', 'application/octet-stream');
    xhr.responseType = 'json';
    xhr.upload.onprogress = e => onProgress(e.loaded);
    xhr.onload = () => resolve({
      status: xhr.status,
      body: (xhr.response ?? {}) as Record<string, unknown>,
      retryAfter: Number(xhr.getResponseHeader('retry-after')) || 0,
    });
    xhr.onerror = () => reject(new Error('The connection was lost'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    xhr.send(chunk);
  });
}

export class EventMediaUploads {
  entries = $state<MediaEntry[]>([]);
  readonly #eventId: string | null;
  readonly #pending = new Map<string, Pending>();
  /** ids this form uploaded (not yet on the event) */
  readonly #fresh = new Set<string>();
  /** ids a save is attaching, which `dispose` must leave alone */
  #keep = new Set<string>();
  #running = false;
  #disposed = false;

  constructor(media: EventMedia[], eventId: string | null) {
    this.#eventId = eventId;
    this.entries = media.map(item => ({
      key: `m${keys++}`, item, kind: item.kind, name: item.name ?? '', preview: '', progress: 1, error: '',
    }));
  }

  /** Files still uploading (the form waits for them before it saves) */
  get busy(): boolean {
    return this.entries.some(e => !e.item && !e.error);
  }

  /** The finished files, in order, for the save */
  get ids(): string[] {
    return this.entries.flatMap(e => (e.item ? [e.item.id] : []));
  }

  get full(): boolean {
    return this.entries.length >= MAX_MEDIA;
  }

  add(files: Iterable<File>) {
    for (const file of files) {
      if (this.full) break;
      const kind = kindOf(file);
      const key = `m${keys++}`;
      this.entries.push({
        key, item: null, kind: kind ?? 'image', name: file.name,
        preview: kind ? URL.createObjectURL(file) : '',
        progress: 0,
        error: kind ? '' : 'Only photos (JPEG, PNG, WebP, GIF or AVIF) and MP4 videos can be added',
      });
      if (kind) this.#pending.set(key, { file, uploadId: null, xhr: null });
    }
    void this.#run();
  }

  remove(key: string) {
    const entry = this.entries.find(e => e.key === key);
    if (!entry) return;
    this.entries = this.entries.filter(e => e.key !== key);
    if (entry.preview) URL.revokeObjectURL(entry.preview);
    const pending = this.#pending.get(key);
    if (pending) {
      this.#pending.delete(key);
      pending.xhr?.abort();
      if (pending.uploadId) this.#discard(pending.uploadId);
    } else if (entry.item && this.#fresh.has(entry.item.id)) {
      // Uploaded in this form and never saved: nothing else will want it
      this.#discard(entry.item.id);
    }
    // A file already on the event stays until the form is saved without it
  }

  /** Moves an entry one place earlier (-1) or later (+1) */
  move(key: string, by: -1 | 1) {
    const i = this.entries.findIndex(e => e.key === key);
    const j = i + by;
    if (i < 0 || j < 0 || j >= this.entries.length) return;
    const next = [...this.entries];
    [next[i], next[j]] = [next[j], next[i]];
    this.entries = next;
  }

  /** Called with the ids a save is sending, before it's sent; [] again if the save fails */
  keep(ids: string[]) {
    this.#keep = new Set(ids);
  }

  /** The form closed: stops uploads and deletes this session's files that no save took */
  dispose() {
    this.#disposed = true;
    for (const pending of this.#pending.values()) {
      pending.xhr?.abort();
      if (pending.uploadId) this.#discard(pending.uploadId);
    }
    this.#pending.clear();
    for (const id of this.#fresh) if (!this.#keep.has(id)) this.#discard(id);
    for (const e of this.entries) if (e.preview) URL.revokeObjectURL(e.preview);
  }

  #discard(id: string) {
    void fetch(`/api/calendar-events/media/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  async #run() {
    if (this.#running) return;
    this.#running = true;
    try {
      while (!this.#disposed) {
        const entry = this.entries.find(e => !e.item && !e.error && this.#pending.has(e.key));
        if (!entry) break;
        await this.#upload(entry, this.#pending.get(entry.key)!);
      }
    } finally {
      this.#running = false;
    }
  }

  async #upload(entry: MediaEntry, pending: Pending) {
    const { file } = pending;
    const gone = () => this.#disposed || this.#pending.get(entry.key) !== pending;
    try {
      let start: Response;
      for (let tries = 1; ; tries++) {
        start = await fetch('/api/calendar-events/media', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: file.name, size: file.size, type: file.type, eventId: this.#eventId }),
        }).catch(() => new Response(null, { status: 503 }));
        if (!transient(start.status) || tries > RETRIES || gone()) break;
        await wait(backoff(tries, Number(start.headers.get('retry-after')) || 0));
      }
      if (gone()) return;
      if (!start.ok) throw new Error(await message(start, 'The upload could not start'));
      const { id, chunkSize } = (await start.json()) as { id: string; chunkSize: number };
      pending.uploadId = id;
      if (gone()) return this.#discard(id);

      let offset = 0;
      let tries = 0;
      while (offset < file.size) {
        if (gone()) return;
        const end = Math.min(offset + chunkSize, file.size);
        pending.xhr = new XMLHttpRequest();
        let res: Awaited<ReturnType<typeof sendChunk>>;
        try {
          res = await sendChunk(pending.xhr, `/api/calendar-events/media/${id}?offset=${offset}`, file.slice(offset, end),
            loaded => { entry.progress = Math.min((offset + loaded) / file.size, 0.99); });
        } catch (err) {
          if (gone() || (err instanceof DOMException && err.name === 'AbortError')) return;
          if (++tries > RETRIES) throw err;
          await wait(backoff(tries, 0));
          continue;
        }
        if (res.status === 409 && typeof res.body.received === 'number') {
          offset = res.body.received; // the API has a different amount: carry on from there
          continue;
        }
        if (transient(res.status)) {
          if (++tries > RETRIES) throw new Error(String(res.body.message ?? 'The upload failed'));
          await wait(backoff(tries, res.retryAfter));
          continue;
        }
        if (res.status >= 400) {
          // A file the API refused (not a photo or MP4, too large) is already gone from it
          if (res.status === 415 || res.status === 413) pending.uploadId = null;
          throw new Error(String(res.body.message ?? 'The upload failed'));
        }
        tries = 0;
        if (res.body.item) {
          const [item] = normalizeMedia([res.body.item]);
          if (!item) throw new Error('The upload failed');
          if (gone()) return this.#discard(item.id);
          this.#fresh.add(item.id);
          this.#pending.delete(entry.key);
          entry.item = item;
          entry.kind = item.kind;
          entry.progress = 1;
          return;
        }
        offset = typeof res.body.received === 'number' ? res.body.received : end;
        entry.progress = Math.min(offset / file.size, 0.99);
      }
    } catch (err) {
      if (gone()) return;
      entry.error = err instanceof Error ? err.message : 'The upload failed';
      this.#pending.delete(entry.key);
      if (pending.uploadId) this.#discard(pending.uploadId);
    } finally {
      pending.xhr = null;
    }
  }
}
