import type { FastifyInstance, InjectOptions } from 'fastify';

export async function loginAs(
  app: FastifyInstance,
  email: string,
  password: string
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`loginAs failed: ${res.statusCode} ${res.body}`);
  }
  const setCookie = res.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0] : (setCookie ?? '');
  const match = raw.match(/session=([^;]+)/);
  return match ? `session=${match[1]}` : '';
}

export function authedRequest(
  app: FastifyInstance,
  sessionCookie: string,
  opts: InjectOptions
) {
  return app.inject({
    ...opts,
    headers: {
      ...(opts.headers as Record<string, string> | undefined),
      cookie: sessionCookie,
    },
  });
}
