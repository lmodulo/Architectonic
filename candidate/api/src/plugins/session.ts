import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import fastifySession from '@fastify/session';
import MongoStore from 'connect-mongo';

const SESSION_MAX_AGE_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_MS / 1000; // connect-mongo uses seconds

async function sessionPlugin(app: FastifyInstance) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be set and at least 32 characters long');
  }

  const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI ?? 'mongodb://localhost:27017/appdb',
    collectionName: 'sessions',
    ttl: SESSION_MAX_AGE_SEC
  });

  await app.register(fastifySession, {
    secret,
    cookieName: 'session',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS
    },
    store,
    saveUninitialized: false
  });
}

export default fp(sessionPlugin);
