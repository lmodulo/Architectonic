import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

interface TeamBody {
  name?:        string;
  description?: string;
}

export default async function teamsRoutes(app: FastifyInstance) {

  // GET /teams — list all teams with member count
  app.get('/', {
    preHandler: app.requirePermission('teams', 'read'),
    schema: { summary: 'List all teams' }
  }, async (_req, _reply) => {
    const teams = await app.mongo.db!.collection('teams').find({}).sort({ name: 1 }).toArray();
    return teams.map(t => ({
      id:          t._id.toString(),
      name:        t.name,
      description: t.description ?? '',
      memberCount: (t.members ?? []).length,
      createdAt:   t.createdAt
    }));
  });

  // GET /teams/mine — teams the current user belongs to (auth only, no permission gate)
  app.get('/mine', {
    preHandler: app.requireAuth,
    schema: { summary: 'Get teams for the current user' }
  }, async (req, _reply) => {
    const userId = new ObjectId(req.session.userId!);
    const teams  = await app.mongo.db!.collection('teams')
      .find({ members: userId })
      .sort({ name: 1 })
      .toArray();
    return teams.map(t => ({
      id:          t._id.toString(),
      name:        t.name,
      description: t.description ?? '',
      memberCount: (t.members ?? []).length
    }));
  });

  // POST /teams — create a team
  app.post<{ Body: TeamBody }>('/', {
    preHandler: app.requirePermission('teams', 'create'),
    schema: {
      summary: 'Create a new team',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 }
        }
      }
    }
  }, async (req, reply) => {
    const { name, description = '' } = req.body;
    const col = app.mongo.db!.collection('teams');

    const existing = await col.findOne({ name });
    if (existing) return reply.conflict('Team name already exists');

    const now    = new Date();
    const result = await col.insertOne({ name, description, members: [], createdAt: now, updatedAt: now });

    logAudit(app.mongo.db!, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'team.create',
      resourceId: result.insertedId.toString(),
      meta:       { name },
      ip:         req.ip
    });

    reply.code(201);
    return { id: result.insertedId.toString(), name, description, memberCount: 0 };
  });

  // GET /teams/:id — get team with full member objects
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('teams', 'read'),
    schema: { summary: 'Get a team by ID with member details' }
  }, async (req, reply) => {
    const team = await app.mongo.db!.collection('teams').findOne({ _id: new ObjectId(req.params.id) });
    if (!team) return reply.notFound('Team not found');

    const rawIds: (string | ObjectId)[] = team.members ?? [];
    const memberIds = rawIds.map(id => new ObjectId(id));
    const members   = memberIds.length > 0
      ? await app.mongo.db!.collection('users')
          .find(
            { _id: { $in: memberIds } },
            { projection: { passwordHash: 0, resetToken: 0, resetTokenExpires: 0 } }
          )
          .toArray()
      : [];

    return {
      id:          team._id.toString(),
      name:        team.name,
      description: team.description ?? '',
      members:     members.map(m => ({
        id:          m._id.toString(),
        username:    m.username,
        firstName:   m.firstName ?? '',
        lastName:    m.lastName ?? '',
        avatarUrl:   m.avatarUrl ?? '',
        avatarColor: m.avatarColor ?? '',
        email:       m.email
      })),
      createdAt: team.createdAt
    };
  });

  // PATCH /teams/:id — update name/description
  app.patch<{ Params: { id: string }; Body: TeamBody }>('/:id', {
    preHandler: app.requirePermission('teams', 'update'),
    schema: {
      summary: 'Update a team',
      body: {
        type: 'object',
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 }
        }
      }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const col = db.collection('teams');

    if (req.body.name) {
      const conflict = await col.findOne({ name: req.body.name, _id: { $ne: new ObjectId(req.params.id) } });
      if (conflict) return reply.conflict('Team name already exists');
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.name        !== undefined) updates.name        = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;

    const result = await col.updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    if (result.matchedCount === 0) return reply.notFound('Team not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'team.update',
      resourceId: req.params.id,
      ip:         req.ip
    });

    return { updated: true };
  });

  // DELETE /teams/:id — delete team
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('teams', 'delete'),
    schema: { summary: 'Delete a team' }
  }, async (req, reply) => {
    const result = await app.mongo.db!.collection('teams').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return reply.notFound('Team not found');

    logAudit(app.mongo.db!, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'team.delete',
      resourceId: req.params.id,
      ip:         req.ip
    });

    reply.code(204).send();
  });

  // POST /teams/:id/members — add a user to a team
  app.post<{ Params: { id: string }; Body: { userId: string } }>('/:id/members', {
    preHandler: app.requirePermission('teams', 'update'),
    schema: {
      summary: 'Add a member to a team',
      body: {
        type: 'object',
        required: ['userId'],
        properties: { userId: { type: 'string' } }
      }
    }
  }, async (req, reply) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.body.userId);

    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return reply.notFound('User not found');

    const result = await db.collection('teams').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $addToSet: { members: userId }, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('Team not found');

    return { added: true };
  });

  // DELETE /teams/:id/members/:userId — remove a user from a team
  app.delete<{ Params: { id: string; userId: string } }>('/:id/members/:userId', {
    preHandler: app.requirePermission('teams', 'update'),
    schema: { summary: 'Remove a member from a team' }
  }, async (req, reply) => {
    const result = await app.mongo.db!.collection('teams').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { members: new ObjectId(req.params.userId) }, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('Team not found');

    return { removed: true };
  });
}
