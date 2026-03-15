import type { FastifyRequest, FastifyReply } from 'fastify';

type Action = 'create' | 'read' | 'update' | 'delete';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (
      resource: string,
      action:   Action
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
