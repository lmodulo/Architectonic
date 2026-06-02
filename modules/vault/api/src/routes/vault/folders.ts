import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'vault_folders';

const VISIBILITY_VALUES = ['staff', 'admin_only', 'customer'] as const;

function mapFolder(d: any) {
  return {
    ...d,
    id:       d._id.toString(),
    _id:      undefined,
    ownerId:  d.ownerId?.toString(),
    parentId: d.parentId?.toString() ?? null
  };
}

export default async function foldersRoutes(app: FastifyInstance) {

  // GET /vault/folders — list all folders for the workspace (flat list, tree building on client)
  app.get<{
    Querystring: { parentId?: string }
  }>('/', {
    preHandler: app.requirePermission('vault_folders', 'read'),
    schema: {
      summary: 'List vault folders',
      querystring: {
        type: 'object',
        properties: { parentId: { type: 'string' } }
      }
    }
  }, async (req) => {
    const db   = app.mongo.db!;
    const role = req.session.role as string | undefined;
    const workspaceId = new ObjectId(req.session.workspaceId!);

    const filter: Record<string, unknown> = { workspaceId };

    if (role === 'customer') {
      filter.visibility = 'customer';
    } else if (role !== 'owner' && role !== 'admin') {
      filter.visibility = { $in: ['staff', 'customer'] };
    }

    if (req.query.parentId) {
      filter.parentId = req.query.parentId === 'root' ? null : new ObjectId(req.query.parentId);
    }

    const folders = await db.collection(COL).find(filter).sort({ name: 1 }).toArray();
    return folders.map(mapFolder);
  });

  // POST /vault/folders — create folder
  app.post<{
    Body: {
      name:       string;
      parentId?:  string | null;
      visibility: string;
      ownerId?:   string;
    }
  }>('/', {
    preHandler: app.requirePermission('vault_folders', 'create'),
    schema: {
      summary: 'Create a vault folder',
      body: {
        type: 'object',
        required: ['name', 'visibility'],
        properties: {
          name:       { type: 'string', minLength: 1, maxLength: 200 },
          parentId:   { type: ['string', 'null'] },
          visibility: { type: 'string', enum: [...VISIBILITY_VALUES] },
          ownerId:    { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const { name, parentId = null, visibility, ownerId } = req.body;
    const db  = app.mongo.db!;
    const now = new Date();
    const workspaceId = new ObjectId(req.session.workspaceId!);

    const doc = {
      workspaceId,
      name:       name.trim(),
      parentId:   parentId ? new ObjectId(parentId) : null,
      visibility,
      ownerId:    ownerId ? new ObjectId(ownerId) : new ObjectId(req.session.userId!),
      createdAt:  now,
      updatedAt:  now
    };

    const result = await db.collection(COL).insertOne(doc);
    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_folder.create',
      resourceId: result.insertedId.toString(),
      meta:       { name, visibility },
      ip:         req.ip
    });
    reply.code(201);
    return { id: result.insertedId.toString() };
  });

  // PATCH /vault/folders/:id — update name, visibility, or owner
  app.patch<{
    Params: { id: string };
    Body: {
      name?:       string;
      visibility?: string;
      ownerId?:    string;
      parentId?:   string | null;
    }
  }>('/:id', {
    preHandler: app.requirePermission('vault_folders', 'update'),
    schema: {
      summary: 'Update a vault folder',
      body: { type: 'object' }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const workspaceId = new ObjectId(req.session.workspaceId!);
    const { name, visibility, ownerId, parentId } = req.body;

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined)       $set.name       = name.trim();
    if (visibility !== undefined) $set.visibility = visibility;
    if (ownerId !== undefined)    $set.ownerId    = new ObjectId(ownerId);
    if (parentId !== undefined)   $set.parentId   = parentId ? new ObjectId(parentId) : null;

    const result = await db.collection(COL).updateOne({ _id, workspaceId }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Folder not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_folder.update',
      resourceId: req.params.id,
      meta:       { fields: Object.keys($set).filter(k => k !== 'updatedAt') },
      ip:         req.ip
    });
    return { updated: true };
  });

  // DELETE /vault/folders/:id — reject if folder contains documents
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('vault_folders', 'delete'),
    schema: { summary: 'Delete a vault folder (must be empty)' }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const workspaceId = new ObjectId(req.session.workspaceId!);

    const docCount = await db.collection('vault_documents').countDocuments({
      workspaceId,
      folderId: _id
    });
    if (docCount > 0) {
      return reply.conflict('Folder still contains documents. Move or delete them first.');
    }

    const childCount = await db.collection(COL).countDocuments({
      workspaceId,
      parentId: _id
    });
    if (childCount > 0) {
      return reply.conflict('Folder has subfolders. Remove them first.');
    }

    const result = await db.collection(COL).deleteOne({ _id, workspaceId });
    if (result.deletedCount === 0) return reply.notFound('Folder not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'vault_folder.delete',
      resourceId: req.params.id,
      ip:         req.ip
    });
    return { deleted: true };
  });
}
