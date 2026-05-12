import type { FastifyInstance } from 'fastify';

// Ensures required MongoDB indexes exist at startup.
// createIndex is idempotent — safe to run on every boot.
export default async function ensureIndexes(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db = app.mongo.db!;
    await db.collection('users').createIndex({ email: 1 },    { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('roles').createIndex({ name: 1 },     { unique: true });
    // sessions TTL index is managed automatically by connect-mongo

    // messages
    await db.collection('messages').createIndex({ threadId: 1, createdAt: 1 });
    await db.collection('messages').createIndex({ from: 1, createdAt: -1 });

    // message_state
    await db.collection('message_state').createIndex({ userId: 1, deleted: 1, read: 1 });
    await db.collection('message_state').createIndex({ messageId: 1, userId: 1 }, { unique: true });

    // settings
    await db.collection('settings').createIndex({ key: 1 }, { unique: true });

    // audit_logs
    await db.collection('audit_logs').createIndex({ createdAt: -1 });
    await db.collection('audit_logs').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('audit_logs').createIndex({ action: 1, createdAt: -1 });

    // products
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ status: 1, createdAt: -1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex(
      { name: 'text', description: 'text', tags: 'text' },
      { weights: { name: 10, tags: 5, description: 1 } }
    );

    // categories
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
    await db.collection('categories').createIndex({ order: 1 });

    // orders
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('orders').createIndex({ status: 1, createdAt: -1 });

    // notifications
    await db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ userId: 1, groupKey: 1 });
    await db.collection('notifications').createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90-day TTL

    // notification_preferences
    await db.collection('notification_preferences').createIndex({ userId: 1 }, { unique: true });

    // events
    await db.collection('events').createIndex({ startDate: 1 });
    await db.collection('events').createIndex({ endDate: 1 });
    await db.collection('events').createIndex({ title: 'text' });

    // agile_milestones
    await db.collection('agile_milestones').createIndex({ status: 1, createdAt: -1 });
    await db.collection('agile_milestones').createIndex({ createdBy: 1 });
    await db.collection('agile_milestones').createIndex({ startDate: 1, endDate: 1 });
    await db.collection('agile_milestones').createIndex({ title: 'text', strategicGoal: 'text' });

    // agile_sprints
    await db.collection('agile_sprints').createIndex({ milestoneId: 1, sprintNumber: 1 });
    await db.collection('agile_sprints').createIndex({ milestoneId: 1, status: 1 });
    await db.collection('agile_sprints').createIndex({ startDate: 1, endDate: 1 });

    // agile_jobs
    await db.collection('agile_jobs').createIndex({ sprintId: 1, status: 1 });
    await db.collection('agile_jobs').createIndex({ sprintId: 1, category: 1 });
    await db.collection('agile_jobs').createIndex({ dependencyIds: 1 });
    await db.collection('agile_jobs').createIndex({ title: 'text' });

    // agile_tasks
    await db.collection('agile_tasks').createIndex({ jobId: 1, status: 1 });
    await db.collection('agile_tasks').createIndex({ assignedTo: 1, status: 1 });
    await db.collection('agile_tasks').createIndex({ assignedTo: 1, dueDate: 1 });
    await db.collection('agile_tasks').createIndex({ jobId: 1, priority: 1 });

    // teams
    await db.collection('teams').createIndex({ name: 1 }, { unique: true });
    await db.collection('teams').createIndex({ members: 1 });

    // crm_contacts
    await db.collection('crm_contacts').createIndex({ companyId: 1, status: 1 });
    await db.collection('crm_contacts').createIndex({ assignedTo: 1, status: 1 });
    await db.collection('crm_contacts').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('crm_contacts').createIndex({ status: 1, createdAt: -1 });
    await db.collection('crm_contacts').createIndex({ tags: 1 });
    await db.collection('crm_contacts').createIndex(
      { firstName: 'text', lastName: 'text', email: 'text' },
      { weights: { email: 10, firstName: 5, lastName: 5 } }
    );

    // crm_companies
    await db.collection('crm_companies').createIndex({ type: 1, createdAt: -1 });
    await db.collection('crm_companies').createIndex({ industry: 1 });
    await db.collection('crm_companies').createIndex({ assignedTo: 1 });
    await db.collection('crm_companies').createIndex({ domain: 1 }, { unique: true, sparse: true });
    await db.collection('crm_companies').createIndex({ tags: 1 });
    await db.collection('crm_companies').createIndex(
      { name: 'text', description: 'text', domain: 'text' },
      { weights: { name: 10, domain: 5, description: 1 } }
    );

    // crm_deals
    await db.collection('crm_deals').createIndex({ companyId: 1, stage: 1 });
    await db.collection('crm_deals').createIndex({ contactIds: 1 });
    await db.collection('crm_deals').createIndex({ assignedTo: 1, stage: 1 });
    await db.collection('crm_deals').createIndex({ stage: 1, expectedCloseDate: 1 });
    await db.collection('crm_deals').createIndex({ expectedCloseDate: 1 });
    await db.collection('crm_deals').createIndex({ createdAt: -1 });
    await db.collection('crm_deals').createIndex({ title: 'text', description: 'text' });

    // crm_activities
    await db.collection('crm_activities').createIndex({ entityType: 1, entityId: 1, createdAt: -1 });
    await db.collection('crm_activities').createIndex({ assignedTo: 1, scheduledAt: 1 });
    await db.collection('crm_activities').createIndex({ type: 1, createdAt: -1 });
    await db.collection('crm_activities').createIndex({ scheduledAt: 1 });
    await db.collection('crm_activities').createIndex({ completedAt: 1 });
    await db.collection('crm_activities').createIndex({ createdAt: -1 });

    // finance_invoices
    await db.collection('finance_invoices').createIndex({ customerId: 1, status: 1 });
    await db.collection('finance_invoices').createIndex({ companyId: 1 });
    await db.collection('finance_invoices').createIndex({ invoiceNumber: 1 }, { unique: true });
    await db.collection('finance_invoices').createIndex({ status: 1, dueDate: 1 });
    await db.collection('finance_invoices').createIndex({ createdAt: -1 });

    // finance_payments
    await db.collection('finance_payments').createIndex({ invoiceId: 1 });
    await db.collection('finance_payments').createIndex({ customerId: 1 });
    await db.collection('finance_payments').createIndex({ createdAt: -1 });

    // recurring invoice scheduler
    await db.collection('finance_invoices').createIndex(
      { 'recurrence.enabled': 1, 'recurrence.nextDate': 1 }
    );

    // finance_subscriptions
    await db.collection('finance_subscriptions').createIndex({ status: 1, nextBillingDate: 1 });
    await db.collection('finance_subscriptions').createIndex({ customerId: 1 });
    await db.collection('finance_subscriptions').createIndex({ companyId: 1 });
    await db.collection('finance_subscriptions').createIndex({ createdAt: -1 });
  });
}
