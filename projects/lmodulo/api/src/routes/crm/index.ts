import type { FastifyInstance } from 'fastify';
import contactsRoutes   from './contacts.js';
import companiesRoutes  from './companies.js';
import dealsRoutes      from './deals.js';
import activitiesRoutes from './activities.js';

export default async function crmRoutes(app: FastifyInstance) {
  await app.register(contactsRoutes,   { prefix: '/contacts'   });
  await app.register(companiesRoutes,  { prefix: '/companies'  });
  await app.register(dealsRoutes,      { prefix: '/deals'      });
  await app.register(activitiesRoutes, { prefix: '/activities' });
}
