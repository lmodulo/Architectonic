declare module 'fastify' {
  interface Session {
    userId?: string;
    username?: string;
    email?: string;
  }
}
