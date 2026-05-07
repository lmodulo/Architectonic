import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

interface RoleBody {
  name?:        string;
  label?:       string;
  permissions?: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>;
}

export default async function rolesRoutes(app: FastifyInstance) {

  // GET /roles
  app.get('/', {
    preHandler: app.requirePermission('roles', 'read'),
    schema: { summary: 'List all roles' }
  }, async (_req, _reply) => {
    const roles = await app.mongo.db!.collection('roles')
      .find({})
      .sort({ name: 1 })
      .toArray();
    return roles.map(r => ({
      id:          r._id.toString(),
      name:        r.name,
      label:       r.label,
      permissions: r.permissions ?? {},
      createdAt:   r.createdAt
    }));
  });

  // POST /roles
  app.post<{ Body: RoleBody }>('/', {
    preHandler: app.requirePermission('roles', 'create'),
    schema: {
      summary: 'Create a new role',
      body: {
        type: 'object',
        required: ['name', 'label'],
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 50 },
          label:       { type: 'string', minLength: 1, maxLength: 100 },
          permissions: { type: 'object' }
        }
      }
    }
  }, async (req, reply) => {
    const { name, label, permissions = {} } = req.body;
    const col = app.mongo.db!.collection('roles');

    const existing = await col.findOne({ name });
    if (existing) return reply.conflict('Role name already exists');

    const now    = new Date();
    const result = await col.insertOne({ name, label, permissions, createdAt: now, updatedAt: now });

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'role.create', resourceId: result.insertedId.toString(), meta: { name, label }, ip: req.ip });

    reply.code(201);
    return { id: result.insertedId.toString(), name, label, permissions };
  });

  // GET /roles/:id
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('roles', 'read'),
    schema: { summary: 'Get a role by ID' }
  }, async (req, reply) => {
    const role = await app.mongo.db!.collection('roles').findOne({ _id: new ObjectId(req.params.id) });
    if (!role) return reply.notFound('Role not found');
    return { id: role._id.toString(), name: role.name, label: role.label, permissions: role.permissions ?? {} };
  });

  // PATCH /roles/:id
  app.patch<{ Params: { id: string }; Body: RoleBody }>('/:id', {
    preHandler: app.requirePermission('roles', 'update'),
    schema: {
      summary: 'Update a role label or permissions',
      body: {
        type: 'object',
        properties: {
          label:       { type: 'string', minLength: 1, maxLength: 100 },
          permissions: { type: 'object' }
        }
      }
    }
  }, async (req, reply) => {
    if (req.body.name) return reply.badRequest('Role name cannot be changed after creation');

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.label)       updates.label       = req.body.label;
    if (req.body.permissions) updates.permissions = req.body.permissions;

    const result = await app.mongo.db!.collection('roles').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );
    if (result.matchedCount === 0) return reply.notFound('Role not found');

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'role.update', resourceId: req.params.id, ip: req.ip });

    return { updated: true };
  });

  // DELETE /roles/:id
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('roles', 'delete'),
    schema: { summary: 'Delete a role (fails if users assigned)' }
  }, async (req, reply) => {
    const db   = app.mongo.db!;
    const role = await db.collection('roles').findOne({ _id: new ObjectId(req.params.id) });
    if (!role) return reply.notFound('Role not found');

    const assignedCount = await db.collection('users').countDocuments({ role: role.name });
    if (assignedCount > 0) {
      return reply.conflict(`Cannot delete: ${assignedCount} user(s) still assigned to this role`);
    }

    await db.collection('roles').deleteOne({ _id: new ObjectId(req.params.id) });

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'role.delete', resourceId: req.params.id, meta: { name: role.name }, ip: req.ip });

    reply.code(204).send();
  });
}
