import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { IncomingHttpHeaders } from 'node:http';
import rateLimit from '@fastify/rate-limit';
import { identifyCaller, MIN_SECRET_LENGTH } from '../lib/callerKey.js';

// The parts of a request the rate limit's key needs
type Req = { headers: IncomingHttpHeaders; ip: string };

export default fp(async function rateLimitPlugin(app: FastifyInstance) {
  // Shared with the web server, which uses it to say which visitor each call is for (see lib/callerKey.ts)
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    app.log.warn('INTERNAL_API_SECRET is not set: all visitors share the web server\'s rate limit');
  } else if (secret.length < MIN_SECRET_LENGTH) {
    app.log.warn(`INTERNAL_API_SECRET is shorter than ${MIN_SECRET_LENGTH} characters and is ignored: all visitors share the web server's rate limit`);
  }

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    // These two also apply to routes with their own limits (the auth routes), so login attempts are
    // counted per visitor too.
    keyGenerator: (req: Req) => {
      const caller = identifyCaller(req.headers, secret);
      return caller.kind === 'visitor' ? caller.address : req.ip;
    },
    allowList: (req: Req) => identifyCaller(req.headers, secret).kind === 'web',
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Too many requests. Try again in ${context.after}.`
    })
  });
});
