import type { FastifyInstance } from 'fastify';
import milestonesRoutes from './milestones.js';
import sprintsRoutes    from './sprints.js';
import jobsRoutes       from './jobs.js';
import tasksRoutes      from './tasks.js';
import commentsRoutes   from './comments.js';

export default async function agileRoutes(app: FastifyInstance) {
  await app.register(milestonesRoutes, { prefix: '/milestones' });
  await app.register(sprintsRoutes,    { prefix: '/sprints'    });
  await app.register(jobsRoutes,       { prefix: '/jobs'       });
  await app.register(tasksRoutes,      { prefix: '/tasks'      });
  await app.register(commentsRoutes,   { prefix: '/comments'   });
}
