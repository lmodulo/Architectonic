import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export default fp(async function rateLimitPlugin(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Too many requests. Try again in ${context.after}.`
    })
  });
});
