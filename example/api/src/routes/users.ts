import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

const COLLECTION = 'users';

export default async function usersRoutes(app: FastifyInstance) {

  // GET /users
  app.get('/', {
    preHandler: app.requirePermission('users', 'read')
  }, async (_req, _reply) => {
    const users = await app.mongo.db!.collection(COLLECTION)
      .find({}, { projection: { passwordHash: 0 } })
      .toArray();
    return users.map(u => ({
      id:        u._id.toString(),
      username:  u.username,
      email:     u.email,
      firstName: u.firstName ?? '',
      lastName:  u.lastName  ?? '',
      role:      u.role ?? 'viewer',
      createdAt: u.createdAt
    }));
  });

  // PATCH /users/:id — update user profile fields
  app.patch<{ Params: { id: string }; Body: { username?: string; email?: string; firstName?: string; lastName?: string } }>('/:id', {
    preHandler: app.requirePermission('users', 'update'),
    schema: {
      body: {
        type: 'object',
        properties: {
          username:  { type: 'string', minLength: 2, maxLength: 50 },
          email:     { type: 'string' },
          firstName: { type: 'string', maxLength: 50 },
          lastName:  { type: 'string', maxLength: 50 }
        }
      }
    }
  }, async (req, reply) => {
    const { username, email, firstName, lastName } = req.body;
    const db = app.mongo.db!;
    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (username  !== undefined) $set.username  = username.trim();
    if (email     !== undefined) $set.email     = email.trim();
    if (firstName !== undefined) $set.firstName = firstName.trim();
    if (lastName  !== undefined) $set.lastName  = lastName.trim();

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set }
    );
    if (result.matchedCount === 0) return reply.notFound('User not found');
    return { updated: true };
  });

  // DELETE /users/:id — remove a user
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('users', 'delete')
  }, async (req, reply) => {
    const result = await app.mongo.db!.collection(COLLECTION).deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount === 0) return reply.notFound('User not found');
    return { deleted: true };
  });

  // PATCH /users/:id/role — assign a role to a user
  app.patch<{ Params: { id: string }; Body: { role: string } }>('/:id/role', {
    preHandler: app.requirePermission('users', 'update'),
    schema: {
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (req, reply) => {
    const { role } = req.body;
    const db       = app.mongo.db!;

    const roleDoc = await db.collection('roles').findOne({ name: role });
    if (!roleDoc) return reply.notFound(`Role '${role}' does not exist`);

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('User not found');

    return { updated: true, role };
  });
}
