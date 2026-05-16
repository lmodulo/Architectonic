import type { FastifyInstance } from 'fastify';

export default async function searchRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: app.requireAuth }, async (req, reply) => {
    const { q } = req.query as Record<string, string>;

    if (!q || !q.trim()) {
      return reply.send({ milestones: [], sprints: [], jobs: [], tasks: [], contacts: [], companies: [], deals: [] });
    }

    const db = app.mongo.db!;
    const term = q.trim();

    const [milestones, sprints, jobs, tasks, contacts, companies, deals] = await Promise.all([
      db.collection('agile_milestones')
        .find({ $text: { $search: term } }, { projection: { title: 1, status: 1 } })
        .limit(5).toArray(),

      db.collection('agile_sprints')
        .find({ title: { $regex: term, $options: 'i' } }, { projection: { title: 1, status: 1, milestoneId: 1 } })
        .limit(5).toArray(),

      db.collection('agile_jobs')
        .find({ $text: { $search: term } }, { projection: { title: 1, status: 1 } })
        .limit(5).toArray(),

      db.collection('agile_tasks')
        .find({ title: { $regex: term, $options: 'i' } }, { projection: { title: 1, status: 1, priority: 1 } })
        .limit(5).toArray(),

      db.collection('crm_contacts')
        .find({ $text: { $search: term } }, { projection: { firstName: 1, lastName: 1, status: 1 } })
        .limit(5).toArray(),

      db.collection('crm_companies')
        .find({ $text: { $search: term } }, { projection: { name: 1, type: 1 } })
        .limit(5).toArray(),

      db.collection('crm_deals')
        .find({ $text: { $search: term } }, { projection: { title: 1, stage: 1 } })
        .limit(5).toArray(),
    ]);

    return reply.send({
      milestones: milestones.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      sprints:    sprints.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      jobs:       jobs.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      tasks:      tasks.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      contacts:   contacts.map(d => ({ _id: d._id.toString(), title: `${d.firstName} ${d.lastName}`, status: d.status as string })),
      companies:  companies.map(d => ({ _id: d._id.toString(), title: d.name as string, status: d.type as string })),
      deals:      deals.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.stage as string })),
    });
  });

}
