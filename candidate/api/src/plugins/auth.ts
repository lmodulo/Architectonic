import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

export type Action = 'create' | 'read' | 'update' | 'delete';

export default fp(async function authPlugin(app: FastifyInstance) {

  app.decorate('requireAuth', async function(req: FastifyRequest, reply: FastifyReply) {
    if (!req.session.userId) {
      return reply.unauthorized('Authentication required');
    }
    // Auto-resolve workspaceId into session on first request after login
    if (!req.session.workspaceId) {
      const membership = await app.mongo.db!.collection('workspace_members').findOne(
        { userId: new ObjectId(req.session.userId) },
        { projection: { workspaceId: 1 } }
      );
      if (membership) {
        req.session.workspaceId = (membership.workspaceId as ObjectId).toString();
        await req.session.save();
      }
    }
  });

  app.decorate('requirePermission', function(resource: string, action: Action) {
    return async function(req: FastifyRequest, reply: FastifyReply) {
      if (!req.session.userId) {
        return reply.unauthorized('Authentication required');
      }
      const db     = app.mongo.db!;
      const userId = new ObjectId(req.session.userId);

      // Find membership for the active workspace (fall back to first membership)
      let membership: { role: string; workspaceId: unknown } | null = null;
      if (req.session.workspaceId) {
        membership = await db.collection('workspace_members').findOne(
          { workspaceId: new ObjectId(req.session.workspaceId), userId },
          { projection: { role: 1, workspaceId: 1 } }
        ) as typeof membership;
      }
      if (!membership) {
        membership = await db.collection('workspace_members').findOne(
          { userId },
          { projection: { role: 1, workspaceId: 1 } }
        ) as typeof membership;
        if (membership && !req.session.workspaceId) {
          req.session.workspaceId = String(membership.workspaceId);
          await req.session.save();
        }
      }

      if (!membership) return reply.forbidden('No workspace membership found');

      const role = await db.collection('roles').findOne({ name: membership.role });
      const perm = role?.permissions?.[resource];
      if (!perm || !perm[action]) {
        return reply.forbidden(`Missing permission: ${resource}:${action}`);
      }
    };
  });
});
