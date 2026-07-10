import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

// Folio search deliberately excludes finance_expenses and finance_subscriptions —
// internal back-office records, not the kind of thing staff jump to via a quick
// top-nav search. Vault is also out of scope for this endpoint.
export default async function searchRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: app.requireAuth }, async (req, reply) => {
    const { q } = req.query as Record<string, string>;

    if (!q || !q.trim()) {
      return reply.send({
        milestones: [], sprints: [], jobs: [], tasks: [],
        contacts: [], companies: [], deals: [],
        invoices: [], estimates: [], contracts: [], calendarEvents: [],
      });
    }

    const db     = app.mongo.db!;
    const term   = q.trim();
    const userId = req.session.userId!;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { role: 1 } });
    const role = user ? await db.collection('roles').findOne({ name: user.role }, { projection: { permissions: 1 } }) : null;
    const permsObj = (role?.permissions ?? {}) as Record<string, Record<string, boolean>>;
    const can = (resource: string) => permsObj[resource]?.['read'] === true;

    const [
      milestones, sprints, jobs, tasks, contacts, companies, deals,
      invoices, estimates, contractResults, calendarEvents,
    ] = await Promise.all([
      can('agile_milestones')
        ? db.collection('agile_milestones')
            .find({ $text: { $search: term } }, { projection: { title: 1, status: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('agile_milestones')
        ? db.collection('agile_sprints')
            .find({ title: { $regex: term, $options: 'i' } }, { projection: { title: 1, status: 1, milestoneId: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('agile_milestones')
        ? (() => {
            const numMatch = term.match(/^(?:JOB-)?(\d+)$/i);
            const jobQuery = numMatch
              ? { jobNumber: parseInt(numMatch[1]) }
              : { $text: { $search: term } };
            return db.collection('agile_jobs')
              .find(jobQuery, { projection: { title: 1, status: 1, jobNumber: 1 } })
              .limit(5).toArray();
          })()
        : Promise.resolve([]),

      can('agile_milestones')
        ? db.collection('agile_tasks')
            .find({ title: { $regex: term, $options: 'i' } }, { projection: { title: 1, status: 1, priority: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('crm_contacts')
        ? db.collection('crm_contacts')
            .find({ $text: { $search: term } }, { projection: { firstName: 1, lastName: 1, status: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('crm_contacts')
        ? db.collection('crm_companies')
            .find({ $text: { $search: term } }, { projection: { name: 1, type: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('crm_contacts')
        ? db.collection('crm_deals')
            .find({ $text: { $search: term } }, { projection: { title: 1, stage: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('finance_invoices')
        ? (() => {
            const numMatch = term.match(/^(?:INV-)?(\d+)$/i);
            if (!numMatch) return Promise.resolve([]);
            const num = parseInt(numMatch[1], 10);
            return db.collection('finance_invoices')
              .find({ invoiceNumber: { $regex: `^(INV-)?0*${num}$`, $options: 'i' } }, { projection: { invoiceNumber: 1, status: 1 } })
              .limit(5).toArray();
          })()
        : Promise.resolve([]),

      can('finance_invoices')
        ? (() => {
            const numMatch = term.match(/^(?:EST-)?(\d+)$/i);
            const estQuery = numMatch
              ? { estimateNumber: { $regex: `^(EST-)?0*${parseInt(numMatch[1], 10)}$`, $options: 'i' } }
              : { $text: { $search: term } };
            return db.collection('finance_estimates')
              .find(estQuery, { projection: { title: 1, estimateNumber: 1, status: 1 } })
              .limit(5).toArray();
          })()
        : Promise.resolve([]),

      can('contracts')
        ? db.collection('contracts')
            .find({ $text: { $search: term } }, { projection: { title: 1, status: 1 } })
            .limit(5).toArray()
        : Promise.resolve([]),

      can('calendar_events')
        ? (() => {
            const filter: Record<string, unknown> = { $text: { $search: term } };
            if (permsObj['calendar_events']?.['create'] !== true) {
              filter.$or = [{ ownerId: new ObjectId(userId) }, { sharedWith: new ObjectId(userId) }];
            }
            return db.collection('calendar_events')
              .find(filter, { projection: { title: 1, status: 1 } })
              .limit(5).toArray();
          })()
        : Promise.resolve([]),
    ]);

    return reply.send({
      milestones: milestones.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      sprints:    sprints.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      jobs:       jobs.map(d => ({ _id: d.jobNumber ? `JOB-${d.jobNumber}` : d._id.toString(), title: d.title as string, status: d.status as string })),
      tasks:      tasks.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      contacts:   contacts.map(d => ({ _id: d._id.toString(), title: `${d.firstName} ${d.lastName}`, status: d.status as string })),
      companies:  companies.map(d => ({ _id: d._id.toString(), title: d.name as string, status: d.type as string })),
      deals:      deals.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.stage as string })),
      invoices:       invoices.map(d => ({ _id: d._id.toString(), title: d.invoiceNumber as string, status: d.status as string })),
      estimates:      estimates.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      contracts:      contractResults.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
      calendarEvents: calendarEvents.map(d => ({ _id: d._id.toString(), title: d.title as string, status: d.status as string })),
    });
  });

}
