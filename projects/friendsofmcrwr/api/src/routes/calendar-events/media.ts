// Photos and MP4 videos on calendar events.
//
// A file is uploaded before it belongs to an event, so the event form can take files while it is still being filled
// in: POST /calendar-events/media starts an upload, PUT /calendar-events/media/:id?offset=N sends it in chunks (each
// under the web server's 10 MB body limit, so a large video needs no special server setup), and the last chunk stores
// it. The event's create or update then lists the files it keeps (`media`: ids, in order): those are attached to
// it and copied onto the event document, and any the event had before that aren't listed are deleted.
// A file that is never attached (the form was cancelled) is deleted a day later.
//
// What a file is comes from its first bytes, not from its name or the browser's word: JPEG, PNG, WebP, GIF and AVIF
// photos, and MP4 video. Stored names are random, so a file on a private event can't be found by guessing.
import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { randomUUID } from 'crypto';
import { mkdir, open, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { storage } from '../../lib/storage.js';

export const MEDIA = 'calendar_event_media';

const MB = 1024 * 1024;
/** Each chunk's size: under the web server's BODY_SIZE_LIMIT (10M in docker-compose.yml) */
const CHUNK = 8 * MB;
const IMAGE_MAX = 20 * MB;
const VIDEO_MAX = 250 * MB;
/** Photos and videos on one event */
export const MAX_PER_EVENT = 50;
/** Uploads not attached to an event within this long are deleted */
const ABANDONED_MS = 24 * 60 * 60 * 1000;
const TMP = join(tmpdir(), 'calendar-event-media');
const FOLDER = 'calendar-events';

export type MediaKind = 'image' | 'video';

export interface MediaDoc {
  _id: ObjectId;
  status: 'uploading' | 'ready';
  /** null until an event's save attaches it */
  eventId: ObjectId | null;
  kind: MediaKind;
  mimetype: string;
  /** the uploader's file name, for the admin (shown nowhere public) */
  name: string;
  size: number;
  received: number;
  url: string | null;
  createdBy: ObjectId;
  createdAt: Date;
}

/** The copy kept on the event document */
export interface EventMedia {
  id: string;
  kind: MediaKind;
  url: string;
  mimetype: string;
  name: string;
  size: number;
}

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
};

const ACCEPTED = 'Only photos (JPEG, PNG, WebP, GIF or AVIF) and MP4 videos can be added';

/** The kind the browser says a file is, from its type or else its name; null when it isn't one we take */
function declaredKind(type: string, name: string): MediaKind | null {
  const unknown = !type || type === 'application/octet-stream';
  if (Object.hasOwn(IMAGE_TYPES, type) || (unknown && /\.(jpe?g|png|webp|gif|avif)$/i.test(name))) return 'image';
  if (type === 'video/mp4' || (unknown && /\.mp4$/i.test(name))) return 'video';
  return null;
}

type Sniffed = { kind: MediaKind; mimetype: string; ext: string } | { error: string };

/** What the file really is, from its first bytes */
function sniff(b: Buffer): Sniffed {
  const ascii = (start: number, end: number) => b.toString('latin1', start, end);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'image', mimetype: 'image/jpeg', ext: 'jpg' };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { kind: 'image', mimetype: 'image/png', ext: 'png' };
  }
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return { kind: 'image', mimetype: 'image/gif', ext: 'gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { kind: 'image', mimetype: 'image/webp', ext: 'webp' };
  if (ascii(4, 8) === 'ftyp') {
    // An ISO media file: its brands say which kind (the major brand, then the compatible ones to the box's end)
    const boxEnd = Math.min(b.readUInt32BE(0), b.length);
    const brands = [ascii(8, 12)];
    for (let i = 16; i + 4 <= boxEnd; i += 4) brands.push(ascii(i, i + 4));
    if (brands.includes('avif') || brands.includes('avis')) return { kind: 'image', mimetype: 'image/avif', ext: 'avif' };
    const major = brands[0];
    if (major === 'qt  ') return { error: 'This is a QuickTime (.mov) video. Export it as MP4 and add that' };
    if (/^(heic|heix|heim|heis|hevc|hevx|mif1|msf1)$/.test(major)) {
      return { error: 'HEIC photos can\'t be shown in most browsers. Save it as JPEG and add that' };
    }
    if (/^(M4A |M4B |M4P )$/.test(major)) return { error: 'This is an audio file, not a video' };
    if (/^3g/.test(major)) return { error: '3GP videos aren\'t supported. Convert it to MP4 and add that' };
    return { kind: 'video', mimetype: 'video/mp4', ext: 'mp4' };
  }
  return { error: ACCEPTED };
}

const tmpPath = (id: ObjectId) => join(TMP, `${id.toString()}.part`);

/** Deletes an upload: its temp file, its stored file and its record */
async function discard(db: NonNullable<FastifyInstance['mongo']['db']>, doc: Pick<MediaDoc, '_id' | 'url'>) {
  await rm(tmpPath(doc._id), { force: true }).catch(() => {});
  if (doc.url) await storage.remove(doc.url);
  await db.collection(MEDIA).deleteOne({ _id: doc._id });
}

/** Deletes uploads that never made it onto an event */
async function sweep(db: NonNullable<FastifyInstance['mongo']['db']>) {
  const cutoff = new Date(Date.now() - ABANDONED_MS);
  const stale = await db.collection<MediaDoc>(MEDIA)
    .find({ eventId: null, createdAt: { $lt: cutoff } }, { projection: { _id: 1, url: 1 } })
    .limit(100).toArray();
  for (const doc of stale) await discard(db, doc);
}

export function publicMedia(doc: MediaDoc): EventMedia {
  return { id: doc._id.toString(), kind: doc.kind, url: doc.url ?? '', mimetype: doc.mimetype, name: doc.name, size: doc.size };
}

/**
 * The files an event's save lists (`media`, ids in order), checked: each must be a finished upload that's either
 * already on this event or one the saving user uploaded and no event has yet. Returns them in the listed order.
 */
export async function resolveMedia(
  app: FastifyInstance,
  value: unknown,
  eventId: ObjectId | null,
  userId: ObjectId,
): Promise<MediaDoc[]> {
  if (!Array.isArray(value)) throw app.httpErrors.badRequest('media must be a list of ids');
  const ids = [...new Set(value.map(String))];
  if (ids.length > MAX_PER_EVENT) throw app.httpErrors.badRequest(`An event can have up to ${MAX_PER_EVENT} photos and videos`);
  if (!ids.every(id => ObjectId.isValid(id))) throw app.httpErrors.badRequest('Invalid media id');
  if (ids.length === 0) return [];

  const docs = await app.mongo.db!.collection<MediaDoc>(MEDIA)
    .find({ _id: { $in: ids.map(id => new ObjectId(id)) } }).toArray();
  const byId = new Map(docs.map(d => [d._id.toString(), d]));
  return ids.map(id => {
    const doc = byId.get(id);
    const usable = doc && doc.status === 'ready' && doc.url && (
      (eventId && doc.eventId?.equals(eventId)) || (!doc.eventId && doc.createdBy.equals(userId))
    );
    if (!usable) throw app.httpErrors.badRequest('A photo or video is no longer available. Remove it and add it again');
    return doc;
  });
}

/** After an event's save: attaches its files, and deletes the ones it had before and no longer lists */
export async function attachMedia(db: NonNullable<FastifyInstance['mongo']['db']>, eventId: ObjectId, docs: MediaDoc[]) {
  const ids = docs.map(d => d._id);
  if (ids.length) await db.collection(MEDIA).updateMany({ _id: { $in: ids } }, { $set: { eventId } });
  const dropped = await db.collection<MediaDoc>(MEDIA)
    .find({ eventId, _id: { $nin: ids } }, { projection: { _id: 1, url: 1 } }).toArray();
  for (const doc of dropped) await discard(db, doc);
}

/** When an event is deleted: its files go too */
export async function deleteEventMedia(db: NonNullable<FastifyInstance['mongo']['db']>, eventId: ObjectId) {
  const docs = await db.collection<MediaDoc>(MEDIA).find({ eventId }, { projection: { _id: 1, url: 1 } }).toArray();
  for (const doc of docs) await discard(db, doc);
}

export default async function calendarMediaRoutes(app: FastifyInstance) {
  // Chunks arrive as raw bytes. Only within this plugin, so other routes keep Fastify's defaults.
  app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer', bodyLimit: CHUNK }, (_req, body, done) => {
    done(null, body);
  });

  function parseId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) throw app.httpErrors.badRequest('Invalid ID');
    return new ObjectId(id);
  }

  // POST /calendar-events/media — start an upload: { name, size, type, eventId? } → { id, chunkSize }
  // Adding to an existing event needs calendar_events:update, to a new one calendar_events:create.
  app.post('/', { preHandler: app.requireAuth }, async (req, reply) => {
    const db = app.mongo.db!;
    const { name, size, type, eventId } = (req.body ?? {}) as Record<string, unknown>;

    let event: ObjectId | null = null;
    if (eventId) {
      event = parseId(String(eventId));
      if (!(await db.collection('calendar_events').countDocuments({ _id: event }))) return reply.notFound('Event not found');
    }
    await app.requirePermission('calendar_events', event ? 'update' : 'create')(req, reply);
    if (reply.sent) return reply;

    const fileName = String(name ?? '').trim().slice(0, 200) || 'file';
    const bytes = Number(size);
    if (!Number.isInteger(bytes) || bytes <= 0) throw app.httpErrors.badRequest('The file is empty');
    const kind = declaredKind(String(type ?? ''), fileName);
    if (!kind) return reply.unsupportedMediaType(ACCEPTED);
    if (kind === 'image' && bytes > IMAGE_MAX) return reply.payloadTooLarge(`Photos can be up to ${IMAGE_MAX / MB} MB`);
    if (kind === 'video' && bytes > VIDEO_MAX) return reply.payloadTooLarge(`Videos can be up to ${VIDEO_MAX / MB} MB`);

    await sweep(db);
    await mkdir(TMP, { recursive: true });

    const doc: Omit<MediaDoc, '_id'> = {
      status: 'uploading', eventId: null, kind, mimetype: String(type ?? ''), name: fileName, size: bytes,
      received: 0, url: null, createdBy: new ObjectId(req.session.userId!), createdAt: new Date(),
    };
    const result = await db.collection(MEDIA).insertOne(doc);
    reply.status(201);
    return { id: result.insertedId.toString(), chunkSize: CHUNK };
  });

  // PUT /calendar-events/media/:id?offset=N — the next chunk (raw bytes). Answers { received } until the last one,
  // which stores the file and answers { item }. A chunk at the wrong offset gets 409 with the offset to resume from.
  app.put('/:id', { preHandler: app.requireAuth, bodyLimit: CHUNK }, async (req, reply) => {
    const db = app.mongo.db!;
    const _id = parseId((req.params as { id: string }).id);
    const offset = Number((req.query as { offset?: string }).offset);
    const chunk = req.body;
    if (!Buffer.isBuffer(chunk) || chunk.length === 0) throw app.httpErrors.badRequest('Send the chunk as application/octet-stream');

    const doc = await db.collection<MediaDoc>(MEDIA).findOne({ _id });
    if (!doc || !doc.createdBy.equals(new ObjectId(req.session.userId!))) return reply.notFound('Upload not found');
    if (doc.status === 'ready') return { item: publicMedia(doc) };
    if (offset !== doc.received) return reply.status(409).send({ message: 'Out of order', received: doc.received });
    if (offset + chunk.length > doc.size) throw app.httpErrors.badRequest('More bytes than the file has');

    if (offset === 0) {
      const found = sniff(chunk.subarray(0, 64));
      if ('error' in found) {
        await discard(db, doc);
        return reply.unsupportedMediaType(found.error);
      }
      if (found.kind === 'image' && doc.size > IMAGE_MAX) {
        await discard(db, doc);
        return reply.payloadTooLarge(`Photos can be up to ${IMAGE_MAX / MB} MB`);
      }
      await db.collection(MEDIA).updateOne({ _id }, { $set: { kind: found.kind, mimetype: found.mimetype } });
      doc.kind = found.kind;
      doc.mimetype = found.mimetype;
    }

    // Written at its offset, so a retried chunk just writes the same bytes again
    const file = await open(tmpPath(_id), offset === 0 ? 'w' : 'r+');
    try {
      await file.write(chunk, 0, chunk.length, offset);
    } finally {
      await file.close();
    }
    const received = offset + chunk.length;
    const moved = await db.collection(MEDIA).updateOne({ _id, received: offset }, { $set: { received } });
    if (moved.modifiedCount === 0) {
      const now = await db.collection<MediaDoc>(MEDIA).findOne({ _id }, { projection: { received: 1 } });
      return reply.status(409).send({ message: 'Out of order', received: now?.received ?? 0 });
    }
    if (received < doc.size) return { received };

    // The last chunk: store it under a random name with the extension its bytes call for
    const ext = doc.mimetype === 'video/mp4' ? 'mp4' : IMAGE_TYPES[doc.mimetype] ?? 'bin';
    let url: string;
    try {
      url = await storage.saveFile(`${randomUUID()}.${ext}`, tmpPath(_id), doc.mimetype, FOLDER);
    } catch (err) {
      req.log.error({ err }, '[calendar] media store failed');
      await discard(db, doc);
      return reply.internalServerError('The file could not be stored');
    }
    await rm(tmpPath(_id), { force: true });
    await db.collection(MEDIA).updateOne({ _id }, { $set: { status: 'ready', url } });
    return { item: publicMedia({ ...doc, status: 'ready', url }) };
  });

  // DELETE /calendar-events/media/:id — cancel an upload, or drop one the form no longer wants. Only the uploader's
  // own files that aren't on an event yet: a file on an event goes when the event is saved without it.
  app.delete('/:id', { preHandler: app.requireAuth }, async (req, reply) => {
    const db = app.mongo.db!;
    const _id = parseId((req.params as { id: string }).id);
    const doc = await db.collection<MediaDoc>(MEDIA).findOne({ _id });
    if (!doc || !doc.createdBy.equals(new ObjectId(req.session.userId!))) return reply.notFound('Upload not found');
    if (doc.eventId) return reply.conflict('This file is on an event. Remove it from the event and save');
    await discard(db, doc);
    reply.status(204);
  });
}
