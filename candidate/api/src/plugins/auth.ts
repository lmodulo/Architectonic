import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

export type Action = 'create' | 'read' | 'update' | 'delete';

export default fp(async function authPlugin(app: FastifyInstance) {

  app.decorate('requireAuth', async function(req: FastifyRequest, reply: FastifyReply) {
    if (!req.session.userId) {
      return reply.unauthorized('Authentication required');
    }
  });

  app.decorate('requirePermission', function(resource: string, action: Action) {
    return async function(req: FastifyRequest, reply: FastifyReply) {
      if (!req.session.userId) {
        return reply.unauthorized('Authentication required');
      }
      const db   = app.mongo.db!;
      const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId) });
      if (!user) return reply.unauthorized('User not found');

      const role = await db.collection('roles').findOne({ name: user.role });
      const perm = role?.permissions?.[resource];
      if (!perm || !perm[action]) {
        return reply.forbidden(`Missing permission: ${resource}:${action}`);
      }
    };
  });
});
