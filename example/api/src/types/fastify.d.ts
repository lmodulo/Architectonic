import type { FastifyRequest, FastifyReply } from 'fastify';
import type { WebSocket } from 'ws';
import type { NotificationPayload } from '../lib/notifications/dispatch.js';

type Action = 'create' | 'read' | 'update' | 'delete';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (
      resource: string,
      action:   Action
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    wsConnections: Map<string, Set<WebSocket>>;
    notify: (payload: NotificationPayload) => Promise<void>;
  }
}
