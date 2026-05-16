import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default async function workspacesRoutes(app: FastifyInstance) {

  // GET /workspaces — list workspaces the current user belongs to
  app.get('/', { preHandler: app.requireAuth }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const memberships = await db.collection('workspace_members')
      .find({ userId })
      .toArray();

    if (memberships.length === 0) return [];

    const workspaceIds = memberships.map(m => m.workspaceId as ObjectId);
    const workspaces   = await db.collection('workspaces')
      .find({ _id: { $in: workspaceIds } })
      .sort({ name: 1 })
      .toArray();

    return workspaces.map(ws => {
      const membership = memberships.find(m => (m.workspaceId as ObjectId).toString() === ws._id.toString());
      return {
        id:          ws._id.toString(),
        name:        ws.name,
        slug:        ws.slug,
        description: ws.description ?? '',
        logoUrl:     ws.logoUrl ?? '',
        role:        membership?.role ?? 'viewer',
        createdAt:   ws.createdAt,
      };
    });
  });

  // POST /workspaces — create a new workspace; creator becomes owner
  app.post<{ Body: { name: string; slug?: string; description?: string } }>('/', {
    preHandler: app.requireAuth,
    schema: {
      summary: 'Create a new workspace',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          slug:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 }
        }
      }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const { name, description = '' } = req.body;
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);

    const existing = await db.collection('workspaces').findOne({ slug });
    if (existing) return reply.conflict('Workspace slug already in use');

    const userId = new ObjectId(req.session.userId!);
    const result = await db.collection('workspaces').insertOne({
      name, slug, description, logoUrl: '', ownerId: userId,
      createdAt: now, updatedAt: now,
    });

    await db.collection('workspace_members').insertOne({
      workspaceId: result.insertedId,
      userId,
      role:        'owner',
      createdAt:   now,
      updatedAt:   now,
    });

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'workspace.create',
      resourceId: result.insertedId.toString(),
      meta:       { name, slug },
      ip:         req.ip,
    });

    reply.code(201);
    return { id: result.insertedId.toString(), name, slug, description, role: 'owner' };
  });

  // GET /workspaces/:id — workspace details (member-only)
  app.get<{ Params: { id: string } }>('/:id', { preHandler: app.requireAuth }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid workspace ID'); }

    const membership = await db.collection('workspace_members').findOne({
      workspaceId: oid,
      userId:      new ObjectId(req.session.userId!),
    });
    if (!membership) return reply.forbidden('Not a member of this workspace');

    const ws = await db.collection('workspaces').findOne({ _id: oid });
    if (!ws) return reply.notFound('Workspace not found');

    return {
      id:          ws._id.toString(),
      name:        ws.name,
      slug:        ws.slug,
      description: ws.description ?? '',
      logoUrl:     ws.logoUrl ?? '',
      ownerId:     ws.ownerId?.toString() ?? null,
      role:        membership.role,
      createdAt:   ws.createdAt,
      updatedAt:   ws.updatedAt,
    };
  });

  // PATCH /workspaces/:id — update workspace details (requires workspaces:update)
  app.patch<{ Params: { id: string }; Body: { name?: string; slug?: string; description?: string } }>('/:id', {
    preHandler: app.requirePermission('workspaces', 'update'),
    schema: {
      body: {
        type: 'object',
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          slug:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 }
        }
      }
    }
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid workspace ID'); }

    const { name, description } = req.body;
    const newSlug = req.body.slug ? slugify(req.body.slug) : (name ? slugify(name) : undefined);

    if (newSlug) {
      const conflict = await db.collection('workspaces').findOne({ slug: newSlug, _id: { $ne: oid } });
      if (conflict) return reply.conflict('Workspace slug already in use');
    }

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (name        !== undefined) $set.name        = name;
    if (newSlug     !== undefined) $set.slug        = newSlug;
    if (description !== undefined) $set.description = description;

    const result = await db.collection('workspaces').updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Workspace not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'workspace.update',
      resourceId: req.params.id,
      ip:         req.ip,
    });

    return { updated: true };
  });

  // DELETE /workspaces/:id — delete workspace (requires workspaces:delete)
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('workspaces', 'delete'),
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid workspace ID'); }

    const result = await db.collection('workspaces').deleteOne({ _id: oid });
    if (result.deletedCount === 0) return reply.notFound('Workspace not found');

    await db.collection('workspace_members').deleteMany({ workspaceId: oid });

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'workspace.delete',
      resourceId: req.params.id,
      ip:         req.ip,
    });

    reply.code(204).send();
  });

  // GET /workspaces/:id/members — list members with role
  app.get<{ Params: { id: string } }>('/:id/members', { preHandler: app.requireAuth }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid workspace ID'); }

    const requesterMembership = await db.collection('workspace_members').findOne({
      workspaceId: oid,
      userId:      new ObjectId(req.session.userId!),
    });
    if (!requesterMembership) return reply.forbidden('Not a member of this workspace');

    const memberships = await db.collection('workspace_members')
      .find({ workspaceId: oid })
      .toArray();

    const userIds = memberships.map(m => m.userId as ObjectId);
    const users   = await db.collection('users')
      .find({ _id: { $in: userIds } }, { projection: { passwordHash: 0 } })
      .toArray();

    return memberships.map(m => {
      const user = users.find(u => u._id.toString() === (m.userId as ObjectId).toString());
      return {
        id:          (m.userId as ObjectId).toString(),
        username:    user?.username    ?? '',
        email:       user?.email       ?? '',
        firstName:   user?.firstName   ?? '',
        lastName:    user?.lastName    ?? '',
        avatarUrl:   user?.avatarUrl   ?? '',
        avatarColor: user?.avatarColor ?? '',
        role:        m.role,
        joinedAt:    m.createdAt,
      };
    });
  });

  // POST /workspaces/:id/members — add a user to this workspace
  app.post<{ Params: { id: string }; Body: { email: string; role: string } }>('/:id/members', {
    preHandler: app.requirePermission('workspaces', 'update'),
    schema: {
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role:  { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid workspace ID'); }

    const roleDoc = await db.collection('roles').findOne({ name: req.body.role });
    if (!roleDoc) return reply.notFound(`Role '${req.body.role}' does not exist`);

    const user = await db.collection('users').findOne({ email: req.body.email.toLowerCase() });
    if (!user) return reply.notFound('User not found');

    const existing = await db.collection('workspace_members').findOne({
      workspaceId: oid,
      userId:      user._id,
    });
    if (existing) return reply.conflict('User is already a member of this workspace');

    const now = new Date();
    await db.collection('workspace_members').insertOne({
      workspaceId: oid,
      userId:      user._id,
      role:        req.body.role,
      createdAt:   now,
      updatedAt:   now,
    });

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'workspace.member_add',
      resourceId: req.params.id,
      meta:       { targetEmail: req.body.email, role: req.body.role },
      ip:         req.ip,
    });

    reply.code(201);
    return { added: true, userId: user._id.toString(), role: req.body.role };
  });

  // PATCH /workspaces/:id/members/:userId — change a member's role
  app.patch<{ Params: { id: string; userId: string }; Body: { role: string } }>('/:id/members/:userId', {
    preHandler: app.requirePermission('workspaces', 'update'),
    schema: {
      body: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', minLength: 1 } }
      }
    }
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let workspaceOid: ObjectId, userOid: ObjectId;
    try {
      workspaceOid = new ObjectId(req.params.id);
      userOid      = new ObjectId(req.params.userId);
    } catch { return reply.badRequest('Invalid ID'); }

    const roleDoc = await db.collection('roles').findOne({ name: req.body.role });
    if (!roleDoc) return reply.notFound(`Role '${req.body.role}' does not exist`);

    const result = await db.collection('workspace_members').updateOne(
      { workspaceId: workspaceOid, userId: userOid },
      { $set: { role: req.body.role, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('Membership not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'workspace.member_role_change',
      resourceId: req.params.id,
      meta:       { targetUserId: req.params.userId, role: req.body.role },
      ip:         req.ip,
    });

    return { updated: true, role: req.body.role };
  });

  // DELETE /workspaces/:id/members/:userId — remove a member
  app.delete<{ Params: { id: string; userId: string } }>('/:id/members/:userId', {
    preHandler: app.requirePermission('workspaces', 'update'),
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let workspaceOid: ObjectId, userOid: ObjectId;
    try {
      workspaceOid = new ObjectId(req.params.id);
      userOid      = new ObjectId(req.params.userId);
    } catch { return reply.badRequest('Invalid ID'); }

    const result = await db.collection('workspace_members').deleteOne({
      workspaceId: workspaceOid,
      userId:      userOid,
    });
    if (result.deletedCount === 0) return reply.notFound('Membership not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'workspace.member_remove',
      resourceId: req.params.id,
      meta:       { targetUserId: req.params.userId },
      ip:         req.ip,
    });

    return { removed: true };
  });

  // POST /workspaces/:id/switch — set this workspace as the active one in session
  app.post<{ Params: { id: string } }>('/:id/switch', { preHandler: app.requireAuth }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid workspace ID'); }

    const membership = await db.collection('workspace_members').findOne({
      workspaceId: oid,
      userId:      new ObjectId(req.session.userId!),
    });
    if (!membership) return reply.forbidden('Not a member of this workspace');

    req.session.workspaceId = oid.toString();
    await req.session.save();

    return { switched: true, workspaceId: oid.toString() };
  });
}
