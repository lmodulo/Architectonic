import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { storage } from '../../lib/storage.js';

const COL_DOCS = 'vault_documents';
const COL_VER  = 'vault_document_versions';

const VISIBILITY_VALUES = ['staff', 'admin_only', 'customer'] as const;

function mapDoc(d: any) {
  return {
    ...d,
    id:               d._id.toString(),
    _id:              undefined,
    workspaceId:      d.workspaceId?.toString(),
    folderId:         d.folderId?.toString() ?? null,
    ownerId:          d.ownerId?.toString(),
    currentVersionId: d.currentVersionId?.toString() ?? null
  };
}

function mapVersion(v: any) {
  return {
    ...v,
    id:          v._id.toString(),
    _id:         undefined,
    documentId:  v.documentId?.toString(),
    uploadedBy:  v.uploadedBy?.toString()
  };
}

function visibilityFilter(role: string | undefined): Record<string, unknown> {
  if (role === 'customer')          return { visibility: 'customer' };
  if (role === 'owner' || role === 'admin') return {};
  return { visibility: { $in: ['staff', 'customer'] } };
}

export default async function documentsRoutes(app: FastifyInstance) {

  // GET /vault/documents — list with filters and pagination
  app.get<{
    Querystring: {
      folderId?:   string;
      visibility?: string;
      q?:          string;
      tags?:       string;
      limit?:      number;
      skip?:       number;
    }
  }>('/', {
    preHandler: app.requirePermission('vault_documents', 'read'),
    schema: {
      summary: 'List vault documents',
      querystring: {
        type: 'object',
        properties: {
          folderId:   { type: 'string' },
          visibility: { type: 'string', enum: [...VISIBILITY_VALUES] },
          q:          { type: 'string' },
          tags:       { type: 'string' },
          limit:      { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          skip:       { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (req) => {
    const { folderId, visibility, q, tags, limit = 50, skip = 0 } = req.query;
    const db   = app.mongo.db!;
    const role = req.session.role as string | undefined;
    const workspaceId = new ObjectId(req.session.workspaceId!);

    const filter: Record<string, unknown> = { workspaceId, ...visibilityFilter(role) };

    if (folderId) {
      filter.folderId = folderId === 'root' ? null : new ObjectId(folderId);
    }
    if (visibility && (role === 'owner' || role === 'admin')) {
      filter.visibility = visibility;
    }
    if (tags) {
      filter.tags = { $in: tags.split(',').map(t => t.trim()).filter(Boolean) };
    }

    let cursor;
    if (q?.trim()) {
      filter.$text = { $search: q.trim() };
      cursor = db.collection(COL_DOCS)
        .find(filter, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      cursor = db.collection(COL_DOCS).find(filter).sort({ updatedAt: -1 });
    }

    const [docs, total] = await Promise.all([
      cursor.skip(skip).limit(limit).toArray(),
      db.collection(COL_DOCS).countDocuments(filter)
    ]);

    return { documents: docs.map(mapDoc), total, skip, limit };
  });

  // POST /vault/documents — upload a document (multipart: file + metadata fields)
  app.post('/', {
    preHandler: app.requirePermission('vault_documents', 'create'),
    schema: { summary: 'Upload a new vault document' }
  }, async (req, reply) => {
    const db   = app.mongo.db!;
    const now  = new Date();
    const workspaceId = new ObjectId(req.session.workspaceId!);

    const parts = req.parts();
    let fileData: { filename: string; buffer: Buffer; mimetype: string; size: number } | null = null;
    let name        = '';
    let description = '';
    let visibility  = 'staff';
    let ownerId     = req.session.userId!;
    let folderId: string | null = null;
    let tags: string[] = [];
    let note        = '';

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        fileData = { filename: part.filename, buffer, mimetype: part.mimetype, size: buffer.length };
      } else {
        const val = (part as any).value as string;
        switch (part.fieldname) {
          case 'name':        name        = val; break;
          case 'description': description = val; break;
          case 'visibility':  visibility  = val; break;
          case 'ownerId':     ownerId     = val; break;
          case 'folderId':    folderId    = val || null; break;
          case 'tags':        tags        = val ? val.split(',').map(t => t.trim()).filter(Boolean) : []; break;
          case 'note':        note        = val; break;
        }
      }
    }

    if (!fileData) return reply.badRequest('No file provided');
    if (!name.trim()) name = fileData.filename;

    const docId = new ObjectId();
    const verId = new ObjectId();

    const storageKey = `vault/${workspaceId.toString()}/${docId.toString()}`;
    const url = await storage.save(fileData.filename, fileData.buffer, fileData.mimetype, storageKey);

    const version = {
      _id:           verId,
      workspaceId,
      documentId:    docId,
      versionNumber: 1,
      storageKey,
      url,
      mimetype:      fileData.mimetype,
      size:          fileData.size,
      originalName:  fileData.filename,
      uploadedBy:    new ObjectId(req.session.userId!),
      note:          note || '',
      createdAt:     now
    };

    const doc = {
      _id:              docId,
      workspaceId,
      folderId:         folderId ? new ObjectId(folderId) : null,
      name:             name.trim(),
      description:      description || '',
      visibility:       VISIBILITY_VALUES.includes(visibility as any) ? visibility : 'staff',
      ownerId:          new ObjectId(ownerId),
      currentVersionId: verId,
      tags,
      createdAt:        now,
      updatedAt:        now
    };

    await db.collection(COL_VER).insertOne(version);
    await db.collection(COL_DOCS).insertOne(doc);

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_document.upload',
      resourceId: docId.toString(),
      meta:       { name: doc.name, visibility, mimetype: fileData.mimetype, size: fileData.size },
      ip:         req.ip
    });
    reply.code(201);
    return { id: docId.toString() };
  });

  // GET /vault/documents/:id — get a single document
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('vault_documents', 'read'),
    schema: { summary: 'Get a vault document' }
  }, async (req, reply) => {
    const db   = app.mongo.db!;
    const role = req.session.role as string | undefined;
    const workspaceId = new ObjectId(req.session.workspaceId!);
    const _id  = new ObjectId(req.params.id);

    const filter: Record<string, unknown> = { _id, workspaceId, ...visibilityFilter(role) };
    const doc = await db.collection(COL_DOCS).findOne(filter);
    if (!doc) return reply.notFound('Document not found');
    return mapDoc(doc);
  });

  // PATCH /vault/documents/:id — update metadata
  app.patch<{
    Params: { id: string };
    Body: {
      name?:             string;
      description?:      string;
      visibility?:       string;
      ownerId?:          string;
      folderId?:         string | null;
      tags?:             string[];
      currentVersionId?: string;
    }
  }>('/:id', {
    preHandler: app.requirePermission('vault_documents', 'update'),
    schema: {
      summary: 'Update vault document metadata',
      body: { type: 'object' }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const workspaceId = new ObjectId(req.session.workspaceId!);
    const { name, description, visibility, ownerId, folderId, tags, currentVersionId } = req.body;

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined)             $set.name             = name.trim();
    if (description !== undefined)      $set.description      = description;
    if (visibility !== undefined)       $set.visibility       = visibility;
    if (ownerId !== undefined)          $set.ownerId          = new ObjectId(ownerId);
    if (folderId !== undefined)         $set.folderId         = folderId ? new ObjectId(folderId) : null;
    if (tags !== undefined)             $set.tags             = tags;
    if (currentVersionId !== undefined) $set.currentVersionId = new ObjectId(currentVersionId);

    const result = await db.collection(COL_DOCS).updateOne({ _id, workspaceId }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Document not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_document.update',
      resourceId: req.params.id,
      meta:       { fields: Object.keys($set).filter(k => k !== 'updatedAt') },
      ip:         req.ip
    });
    return { updated: true };
  });

  // DELETE /vault/documents/:id — delete document and all versions
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('vault_documents', 'delete'),
    schema: { summary: 'Delete a vault document and all its versions' }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const workspaceId = new ObjectId(req.session.workspaceId!);

    const doc = await db.collection(COL_DOCS).findOne({ _id, workspaceId });
    if (!doc) return reply.notFound('Document not found');

    // Remove all stored files
    const versions = await db.collection(COL_VER).find({ documentId: _id }).toArray();
    await Promise.all(versions.map(v => storage.remove(v.url)));

    await db.collection(COL_VER).deleteMany({ documentId: _id });
    await db.collection(COL_DOCS).deleteOne({ _id });

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_document.delete',
      resourceId: req.params.id,
      meta:       { name: doc.name, versionCount: versions.length },
      ip:         req.ip
    });
    return { deleted: true };
  });

  // GET /vault/documents/:id/file — redirect to the current version's URL
  app.get<{ Params: { id: string } }>('/:id/file', {
    preHandler: app.requirePermission('vault_documents', 'read'),
    schema: { summary: 'Get download URL for current document version' }
  }, async (req, reply) => {
    const db   = app.mongo.db!;
    const role = req.session.role as string | undefined;
    const workspaceId = new ObjectId(req.session.workspaceId!);
    const _id  = new ObjectId(req.params.id);

    const filter: Record<string, unknown> = { _id, workspaceId, ...visibilityFilter(role) };
    const doc = await db.collection(COL_DOCS).findOne(filter);
    if (!doc) return reply.notFound('Document not found');
    if (!doc.currentVersionId) return reply.notFound('No version available');

    const version = await db.collection(COL_VER).findOne({ _id: doc.currentVersionId });
    if (!version) return reply.notFound('Version not found');

    return { url: version.url, mimetype: version.mimetype, originalName: version.originalName };
  });

  // GET /vault/documents/:id/versions — list version history
  app.get<{ Params: { id: string } }>('/:id/versions', {
    preHandler: app.requirePermission('vault_documents', 'read'),
    schema: { summary: 'List version history for a document' }
  }, async (req, reply) => {
    const db   = app.mongo.db!;
    const role = req.session.role as string | undefined;
    const workspaceId = new ObjectId(req.session.workspaceId!);
    const _id  = new ObjectId(req.params.id);

    const filter: Record<string, unknown> = { _id, workspaceId, ...visibilityFilter(role) };
    const doc = await db.collection(COL_DOCS).findOne(filter);
    if (!doc) return reply.notFound('Document not found');

    const versions = await db.collection(COL_VER)
      .find({ documentId: _id })
      .sort({ versionNumber: -1 })
      .toArray();

    return {
      currentVersionId: doc.currentVersionId?.toString() ?? null,
      versions: versions.map(mapVersion)
    };
  });

  // POST /vault/documents/:id/versions — upload a new version
  app.post<{ Params: { id: string } }>('/:id/versions', {
    preHandler: app.requirePermission('vault_documents', 'update'),
    schema: { summary: 'Upload a new version of a vault document' }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const workspaceId = new ObjectId(req.session.workspaceId!);
    const _id = new ObjectId(req.params.id);

    const doc = await db.collection(COL_DOCS).findOne({ _id, workspaceId });
    if (!doc) return reply.notFound('Document not found');

    const parts = req.parts();
    let fileData: { filename: string; buffer: Buffer; mimetype: string; size: number } | null = null;
    let note = '';

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        fileData = { filename: part.filename, buffer, mimetype: part.mimetype, size: buffer.length };
      } else if (part.fieldname === 'note') {
        note = (part as any).value as string;
      }
    }

    if (!fileData) return reply.badRequest('No file provided');

    const lastVersion = await db.collection(COL_VER)
      .findOne({ documentId: _id }, { sort: { versionNumber: -1 } });
    const nextNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const verId = new ObjectId();
    const storageKey = `vault/${workspaceId.toString()}/${_id.toString()}`;
    const url = await storage.save(fileData.filename, fileData.buffer, fileData.mimetype, storageKey);

    const version = {
      _id:           verId,
      workspaceId,
      documentId:    _id,
      versionNumber: nextNumber,
      storageKey,
      url,
      mimetype:      fileData.mimetype,
      size:          fileData.size,
      originalName:  fileData.filename,
      uploadedBy:    new ObjectId(req.session.userId!),
      note:          note || '',
      createdAt:     now
    };

    await db.collection(COL_VER).insertOne(version);
    await db.collection(COL_DOCS).updateOne(
      { _id },
      { $set: { currentVersionId: verId, updatedAt: now } }
    );

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_document.version_upload',
      resourceId: _id.toString(),
      meta:       { versionNumber: nextNumber, mimetype: fileData.mimetype, size: fileData.size },
      ip:         req.ip
    });
    reply.code(201);
    return { id: verId.toString(), versionNumber: nextNumber };
  });
}
