// Demo data — Folio: invoices, estimates, subscriptions, expenses, client users + messages.
// Ported from projects/lmodulo's seed. Loaded only when SEED_DEMO_DATA=true (see $lib/demo.ts in the API);
// every block inserts only into empty collections. Cross-module links are name lookups that
// no-op when the other module isn't installed. File prefix sets the run order (CRM first).
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import type { DemoContext } from '../lib/demo.js';

export default async function seed({ db, now, workspaceId }: DemoContext): Promise<void> {
  const users = db.collection('users');

  // ── User IDs + date helpers ───────────────────────────────────────
  const team = await users
    .find({ username: { $in: ['jnicora', 'knicora', 'owner', 'admin', 'alex', 'jordan', 'sam', 'riley'] } })
    .toArray();
  const uid = (name: string): ObjectId => team.find((u: any) => u.username === name)!._id;
  const joeId    = uid('jnicora');
  const kyleId   = uid('knicora');
  const ownerId  = uid('owner');
  const adminId  = uid('admin');
  const alexId   = uid('alex');
  const jordanId = uid('jordan');
  const samId    = uid('sam');
  const rileyId  = uid('riley');

  // Day offset from now, normalised to 09:00
  const d = (offsetDays: number): Date => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(9, 0, 0, 0);
    return dt;
  };

  // Day offset with explicit hour
  const dh = (offsetDays: number, hour: number): Date => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hour, 0, 0, 0);
    return dt;
  };

  // ISO date string at day offset (for time_entries.date)
  const ds = (offsetDays: number): string => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    return dt.toISOString().slice(0, 10);
  };

  const milestones = db.collection('agile_milestones');

  const financeInvColl = db.collection('finance_invoices');
  if (!await financeInvColl.countDocuments()) {

    // Look up CRM company IDs from the DB (CRM may have been seeded in a prior run)
    const [coVertexDoc, coTechDoc, coBluePeakDoc, coMeridianDoc] = await Promise.all([
      db.collection('crm_companies').findOne({ name: 'Vertex Systems' }),
      db.collection('crm_companies').findOne({ name: 'TechFusion Inc' }),
      db.collection('crm_companies').findOne({ name: 'BluePeak Agency' }),
      db.collection('crm_companies').findOne({ name: 'Meridian Digital' }),
    ]);
    const coVertex   = coVertexDoc?._id   as ObjectId;
    const coTech     = coTechDoc?._id     as ObjectId;
    const coBluePeak = coBluePeakDoc?._id as ObjectId;
    const coMeridian = coMeridianDoc?._id as ObjectId;

    if (!coVertex || !coTech || !coBluePeak || !coMeridian) {
      console.warn('[seed] Folio: CRM companies not found — skipping finance seed');
    } else {

      // Customer users — paying/active customers only (Discovery-stage prospects excluded)
      // cvId → Marcus Powell (Vertex Systems  — Enterprise Customer, long-time)
      // ctId → Priya Nair   (TechFusion Inc   — Pilot customer, Q2 deal in Proposal)
      // cmId → James Hartley (Meridian Digital — New customer, just onboarded)
      const cvId = new ObjectId();
      const ctId = new ObjectId();
      const cmId = new ObjectId();
      const customerPasswordHash = await bcrypt.hash('ClientPass1!', 12);

      for (const [cusId, username, email, firstName, lastName, companyId] of [
        [cvId, 'client.vertex',    'client@vertexsystems.io',  'Marcus', 'Powell',  coVertex  ],
        [ctId, 'client.techfusion','client@techfusion.io',     'Priya',  'Nair',    coTech    ],
        [cmId, 'client.meridian',  'client@meridiandigital.co','James',  'Hartley', coMeridian],
      ] as [ObjectId, string, string, string, string, ObjectId][]) {
        const existing = await users.findOne({ email });
        if (!existing) {
          await users.insertOne({
            _id: cusId, username, email,
            passwordHash: customerPasswordHash,
            firstName, lastName,
            role: 'customer', companyId,
            avatarUrl: '', avatarColor: '',
            createdAt: now, updatedAt: now,
          });
          // Scaffold roles live on the workspace membership, not the user document
          if (workspaceId) {
            await db.collection('workspace_members').updateOne(
              { workspaceId, userId: cusId },
              { $setOnInsert: { workspaceId, userId: cusId, createdAt: now }, $set: { role: 'customer', updatedAt: now } },
              { upsert: true }
            );
          }
        }
      }

      // Invoice seed helper
      const inv = (
        invoiceNumber: string, customerId: ObjectId, companyId: ObjectId,
        items: Array<{desc: string; qty: number; price: number}>,
        taxRate: number, status: string, daysOffset: number, dueOffset: number,
        notes: string,
      ) => {
        const lineItems = items.map(i => ({
          description: i.desc, quantity: i.qty, unitPrice: i.price,
          amount: i.qty * i.price,
        }));
        const subtotal  = lineItems.reduce((s, i) => s + i.amount, 0);
        const taxAmount = subtotal * (taxRate / 100);
        const total     = subtotal + taxAmount;
        return {
          invoiceNumber, customerId, companyId, lineItems,
          subtotal, taxRate, taxAmount, total,
          currency: 'USD', status, notes,
          dueDate:   d(dueOffset),
          createdBy: adminId,
          createdAt: d(daysOffset),
          updatedAt: d(daysOffset),
          ...(status === 'paid' ? { paidAt: d(daysOffset + 5) } : {}),
        };
      };

      await financeInvColl.insertMany([

        // ── Vertex Systems — Enterprise Customer ($48k ARR, Closed Won) ───
        // INV-0001: v1.0 Core Platform milestone delivery (Sprints 1 & 2)
        inv('INV-0001', cvId, coVertex, [
          { desc: 'v1.0 Core Platform — Milestone Delivery (Sprints 1 & 2)', qty: 1, price: 8500 },
          { desc: 'Production Deployment & Environment Setup',                qty: 1, price: 500  },
        ], 8, 'paid', -90, -60,
          'Covers v1.0 – Core Platform milestone: Foundation (Sprint 1: auth, MongoDB, Fastify scaffold) and Core Features (Sprint 2: user management, RBAC, settings). Delivered per Enterprise License agreement (Vertex Systems, $48k ARR). Primary contact: Marcus Webb.'),

        // INV-0002: Enterprise retainer + Sprint 3 Data Layer progress billing
        inv('INV-0002', cvId, coVertex, [
          { desc: 'Enterprise Platform Retainer — Monthly',           qty: 1, price: 6000 },
          { desc: 'Sprint 3: Data Layer API — Progress Billing',      qty: 1, price: 500  },
        ], 8, 'paid', -60, -30,
          'Monthly enterprise retainer (Priority Support SLA). Includes a progress credit for Sprint 3 (Data Layer: milestone/sprint/job/task CRUD APIs) under the v1.1 – Agile milestone. Priya Sharma (Technical lead) confirmed delivery scope.'),

        // INV-0003: Sprint 4 UI Layer progress billing (v1.1 Agile)
        inv('INV-0003', cvId, coVertex, [
          { desc: 'Sprint 4: UI Layer — Overview & Milestones UI (Done)',    qty: 28, price: 175 },
          { desc: 'Sprint 4: UI Layer — Sprint Detail & Board Views (WIP)',  qty: 12, price: 175 },
          { desc: 'Code Review & QA — Sprint 4 Component Reviews',          qty: 8,  price: 150 },
        ], 8, 'sent', -30, 15,
          'Sprint 4 (UI Layer) progress billing under v1.1 – Agile milestone. Covers: Overview & Milestones UI (Done), Sprint detail page (Review), and Board/Kanban (In Progress — Safari pointer-events spike in flight). Timeline/Gantt view billed upon completion.'),

        // INV-0004: Annual API Access License (from Priya's technical evaluation requirement)
        inv('INV-0004', cvId, coVertex, [
          { desc: 'API Access — Annual License (REST + Webhooks)', qty: 1, price: 2500 },
        ], 8, 'overdue', -45, -10,
          'Annual REST API access tier. Originally scoped during Priya Sharma\'s technical deep-dive: CSV export and programmatic sprint data access for Vertex\'s internal BI tooling. Part of Enterprise License ($48k ARR). Payment overdue — follow up with Marcus Webb.'),

        // ── TechFusion Inc — Prospect Pilot ($18k Q2 Pilot in Proposal) ──
        // INV-0008: Pre-pilot v1.0 integration work (paid, oldest)
        inv('INV-0008', ctId, coTech, [
          { desc: 'v1.0 Platform Integration Development',         qty: 80, price: 150 },
          { desc: 'Project Management — v1.0 Core Platform scope', qty: 1,  price: 2000 },
        ], 5, 'paid', -75, -45,
          'Pre-pilot engagement scoped before TechFusion\'s formal evaluation. Custom development work aligned with v1.0 – Core Platform milestone (Foundation + Core Features). Completed prior to Dana Kowalski\'s inbound lead (d-15) and Q2 Pilot deal.'),

        // INV-0007: Team Plan retainer during pilot ramp-up (overdue)
        inv('INV-0007', ctId, coTech, [
          { desc: 'Monthly Retainer — Team Plan (30 seats)',   qty: 1, price: 3000 },
          { desc: 'Sprint Planning Facilitation — 2 sessions', qty: 2, price: 500  },
        ], 5, 'overdue', -50, -5,
          'Team Plan retainer for TechFusion pilot ramp-up. Sprint planning sessions aligned with Sprint 3 (Data Layer) and Sprint 4 (UI Layer) milestones. Tyler Osei (Finance/budget owner) is responsible for payment approval — CFO review still in progress for the Q2 Pilot deal ($18k).'),

        // INV-0006: Sprint 4 demo prep & consulting (sent)
        inv('INV-0006', ctId, coTech, [
          { desc: 'Sprint 4 Live Walkthrough & Configuration (16h)', qty: 16, price: 200 },
          { desc: 'Data Migration — Notion/Jira Export Processing',  qty: 4,  price: 150 },
        ], 5, 'sent', -15, 20,
          'Consulting engagement supporting TechFusion\'s Sprint 4 (UI Layer) evaluation: live walkthrough of Board (Kanban), Sprint detail, and Milestones views. Data migration assistance for Notion/Jira exports (Kwame Asante\'s integration team requirement). Part of Q2 Pilot deal — Dana Kowalski confirmed scope.'),

        // INV-0005: Q2 Pilot onboarding package (draft, pending CFO sign-off)
        inv('INV-0005', ctId, coTech, [
          { desc: 'Q2 Pilot Onboarding & Setup — 30 seats',          qty: 8, price: 200 },
          { desc: 'Agile User Guide — Documentation Package', qty: 1, price: 500 },
        ], 5, 'draft', -20, 25,
          'Pre-billing draft for TechFusion Q2 Pilot (Team Plan, 30 seats, $18k/yr). Awaiting CFO approval per Tyler Osei. Dana Kowalski confirmed onboarding scope following the full product demo (Sprint 4 UI Layer walkthrough). To be issued once the Q2 Pilot deal moves to Closed Won.'),

      ]);

      // Welcome messages for each customer
      // Vertex: sent on onboarding day (~90 days ago) — long-time client
      // TechFusion: sent when pilot access was granted (~75 days ago)
      // Meridian: sent on portal access day (~7 days ago) — new client
      const adminUser = await users.findOne({ username: 'admin' });
      if (adminUser) {
        for (const [cusId, firstName, companyName, sentAt] of [
          [cvId, 'Marcus', 'Vertex Systems',   d(-90)],
          [ctId, 'Priya',  'TechFusion Inc',   d(-75)],
          [cmId, 'James',  'Meridian Digital', d(-7) ],
        ] as [ObjectId, string, string, Date][]) {
          const msgId = new ObjectId();
          const msgBody = `<p>Hi ${firstName},</p><p>Welcome to the Client Portal! Your account is ready.</p><ul><li>View invoices and payment history</li><li>Make secure payments online</li><li>Message our team directly</li></ul><p>Reply here if you have any questions.</p><p>Best regards,<br />${adminUser.firstName || adminUser.username}</p>`;
          await db.collection('messages').insertOne({
            _id: msgId, threadId: msgId, parentId: null,
            from: adminUser._id, to: [cusId], cc: [],
            subject: `Welcome to the Client Portal — ${companyName}`,
            body: msgBody, attachments: [], createdAt: sentAt,
          });
          await db.collection('message_state').insertMany([
            { messageId: msgId, userId: adminUser._id, read: true,  readAt: sentAt, archived: false, deleted: false },
            { messageId: msgId, userId: cusId,         read: false, readAt: null,   archived: false, deleted: false },
          ]);
        }
      }

      // ── finance_expenses ─────────────────────────────────────────────
      const exp1Id = new ObjectId(); const exp2Id = new ObjectId();
      const exp3Id = new ObjectId(); const exp4Id = new ObjectId();
      const exp5Id = new ObjectId(); const exp6Id = new ObjectId();
      const exp7Id = new ObjectId(); const exp8Id = new ObjectId();

      const expNum = (n: number) => `EXP-${String(n).padStart(4, '0')}`;

      await db.collection('finance_expenses').insertMany([
        {
          _id: exp1Id, expenseNumber: expNum(1),
          description: 'Digital Ocean monthly hosting — production + staging droplets',
          vendor: 'DigitalOcean', category: 'hosting',
          amount: 420, currency: 'USD',
          expenseDate: d(-60), status: 'paid',
          billable: false, companyId: null, milestoneId: null,
          notes: 'Covers two Droplets (prod/staging) and managed MongoDB cluster for Q1.',
          receiptUrl: null,
          createdBy: joeId, createdAt: d(-60), updatedAt: d(-60),
        },
        {
          _id: exp2Id, expenseNumber: expNum(2),
          description: 'GitHub Copilot Business — 5 team seats',
          vendor: 'GitHub', category: 'software',
          amount: 190, currency: 'USD',
          expenseDate: d(-45), status: 'paid',
          billable: false, companyId: null, milestoneId: null,
          notes: '5 seats × $19/mo. Approved at Sprint 3 kickoff.',
          receiptUrl: null,
          createdBy: kyleId, createdAt: d(-45), updatedAt: d(-45),
        },
        {
          _id: exp3Id, expenseNumber: expNum(3),
          description: 'Branding contractor — logo & brand asset suite',
          vendor: 'Studio Lark', category: 'contractor',
          amount: 2400, currency: 'USD',
          expenseDate: d(-80), status: 'paid',
          billable: true, companyId: coVertex, milestoneId: null,
          notes: 'Full brand identity package billed back to Vertex Systems (Enterprise License). Included SVG logo, favicon, and brand guide.',
          receiptUrl: null,
          createdBy: alexId, createdAt: d(-80), updatedAt: d(-80),
        },
        {
          _id: exp4Id, expenseNumber: expNum(4),
          description: 'AWS credits — TechFusion demo environment',
          vendor: 'Amazon Web Services', category: 'hosting',
          amount: 340, currency: 'USD',
          expenseDate: d(-20), status: 'paid',
          billable: true, companyId: coTech, milestoneId: null,
          notes: 'Isolated AWS environment provisioned for TechFusion Q2 Pilot demo (Sprint 4 walkthrough). Billable to TechFusion.',
          receiptUrl: null,
          createdBy: alexId, createdAt: d(-20), updatedAt: d(-20),
        },
        {
          _id: exp5Id, expenseNumber: expNum(5),
          description: 'ProductCon — flights & hotel',
          vendor: 'Delta / Marriott', category: 'travel',
          amount: 1850, currency: 'USD',
          expenseDate: d(-70), status: 'paid',
          billable: false, companyId: null, milestoneId: null,
          notes: 'Attended ProductCon where BluePeak Agency contact (Carmen Reyes) was sourced. Round-trip flight + 2 nights.',
          receiptUrl: null,
          createdBy: joeId, createdAt: d(-70), updatedAt: d(-70),
        },
        {
          _id: exp6Id, expenseNumber: expNum(6),
          description: 'Client dinner — Vertex Systems kickoff',
          vendor: 'Nobu', category: 'meals',
          amount: 310, currency: 'USD',
          expenseDate: d(-50), status: 'paid',
          billable: true, companyId: coVertex, milestoneId: null,
          notes: 'Kickoff dinner with Marcus Webb and Priya Sharma following contract signature. Billed back to Vertex enterprise account.',
          receiptUrl: null,
          createdBy: joeId, createdAt: d(-50), updatedAt: d(-50),
        },
        {
          _id: exp7Id, expenseNumber: expNum(7),
          description: 'MacBook Pro 14" — Riley onboarding',
          vendor: 'Apple', category: 'equipment',
          amount: 2499, currency: 'USD',
          expenseDate: d(-15), status: 'pending',
          billable: false, companyId: null, milestoneId: null,
          notes: 'Hardware for new contributor (Riley). Awaiting finance approval before reimbursement.',
          receiptUrl: null,
          createdBy: kyleId, createdAt: d(-15), updatedAt: d(-15),
        },
        {
          _id: exp8Id, expenseNumber: expNum(8),
          description: 'Q2 office supplies — paper, printer cartridges, whiteboard markers',
          vendor: 'Staples', category: 'other',
          amount: 85, currency: 'USD',
          expenseDate: d(-5), status: 'draft',
          billable: false, companyId: null, milestoneId: null,
          notes: '',
          receiptUrl: null,
          createdBy: samId, createdAt: d(-5), updatedAt: d(-5),
        },
      ]);

      // ── finance_estimates ────────────────────────────────────────────
      const est1Id = new ObjectId(); const est2Id = new ObjectId();
      const est3Id = new ObjectId(); const est4Id = new ObjectId();
      const est5Id = new ObjectId(); const est6Id = new ObjectId();
      const inv9Id  = new ObjectId();
      const inv10Id = new ObjectId();

      const estNum = (n: number) => `EST-${String(n).padStart(4, '0')}`;

      const estDoc = (
        id: ObjectId, estimateNumber: string,
        title: string, customerId: ObjectId, companyId: ObjectId,
        items: Array<{ desc: string; qty: number; price: number }>,
        taxRate: number, status: string,
        daysOffset: number, validUntilOffset: number | null,
        notes: string, invoiceId: ObjectId | null = null,
      ) => {
        const lineItems = items.map(i => ({
          description: i.desc, quantity: i.qty, unitPrice: i.price,
          amount: i.qty * i.price,
        }));
        const subtotal  = lineItems.reduce((s, i) => s + i.amount, 0);
        const taxAmount = subtotal * (taxRate / 100);
        const total     = subtotal + taxAmount;
        return {
          _id: id, estimateNumber, title,
          customerId, companyId, lineItems,
          subtotal, taxRate, taxAmount, total,
          currency: 'USD', status,
          validUntil: validUntilOffset !== null ? d(validUntilOffset) : null,
          notes, invoiceId,
          createdBy: adminId,
          createdAt: d(daysOffset), updatedAt: d(daysOffset),
        };
      };

      await db.collection('finance_estimates').insertMany([
        // EST-0001: Vertex — Q3 platform enhancements — sent, awaiting response
        estDoc(est1Id, estNum(1), 'Q3 Platform Enhancements', cvId, coVertex, [
          { desc: 'v2.0 Reporting & Analytics — Scoping & Architecture',   qty: 20, price: 175 },
          { desc: 'Velocity & Burndown Dashboards — Build & Test',         qty: 32, price: 175 },
          { desc: 'Export Infrastructure — CSV/PDF report generation',     qty: 8,  price: 175 },
          { desc: 'QA & Stakeholder Review Sessions',                      qty: 4,  price: 150 },
        ], 8, 'sent', -18, 30,
        'Scoped for Vertex Systems Q3 roadmap under the v2.0 Reporting & Analytics milestone. Covers sprint velocity dashboards and CSV/PDF export infrastructure. Valid for 30 days. Primary contact: Marcus Webb.'),

        // EST-0002: TechFusion — API integration package — draft
        estDoc(est2Id, estNum(2), 'API Integration Package', ctId, coTech, [
          { desc: 'REST API Custom Endpoint Development (12 endpoints)',    qty: 24, price: 150 },
          { desc: 'Webhook Configuration & Testing',                       qty: 8,  price: 150 },
          { desc: 'API Documentation & Postman Collection',                qty: 4,  price: 125 },
          { desc: 'Integration QA — Kwame Asante review sessions (3×2h)', qty: 6,  price: 150 },
        ], 5, 'draft', -5, 45,
        "Draft scoped for TechFusion's integration requirements (Kwame Asante's team). Pending Kwame's review of the Postman mock collection before sending."),

        // EST-0003: TechFusion — data migration sprint — accepted + converted to INV-0009
        estDoc(est3Id, estNum(3), 'Data Migration Sprint', ctId, coTech, [
          { desc: 'Notion/Jira Export Processing & Schema Mapping',  qty: 16, price: 150 },
          { desc: 'Data Validation & Import Pipeline Build',          qty: 12, price: 150 },
          { desc: 'Stakeholder Walkthrough & Sign-off Session',       qty: 2,  price: 150 },
        ], 5, 'accepted', -35, 0,
        'Accepted by Dana Kowalski. Covers full data migration from Notion/Jira for TechFusion Q2 Pilot. Converted to invoice INV-0009.', inv9Id),

        // EST-0004: Vertex — starter onboarding pack — declined (scope reduced)
        estDoc(est4Id, estNum(4), 'Starter Onboarding Pack', cvId, coVertex, [
          { desc: 'Onboarding Workshop (4h facilitated session)',  qty: 1, price: 1200 },
          { desc: 'Custom Getting Started Guide — Vertex Edition', qty: 1, price: 800  },
          { desc: 'Admin Training Session (2h)',                   qty: 1, price: 400  },
          { desc: 'Video Walkthrough Recording & Editing',         qty: 1, price: 600  },
        ], 8, 'declined', -55, -5,
        'Declined by Marcus Webb — Vertex opted to handle onboarding internally using the standard docs. Scope reduced at contract review.'),

        // EST-0005: Vertex — v2.0 Analytics Module full scope — expired (validUntil passed)
        estDoc(est5Id, estNum(5), 'v2.0 Analytics Module — Full Scope', cvId, coVertex, [
          { desc: 'Analytics Architecture & Data Modelling',           qty: 24, price: 175 },
          { desc: 'Velocity, Burndown & Throughput Dashboards',        qty: 40, price: 175 },
          { desc: 'Custom Reporting Engine — Filters, Groups, Export', qty: 32, price: 175 },
          { desc: 'Enterprise Dashboard Configuration & Training',     qty: 8,  price: 150 },
        ], 8, 'expired', -75, -10,
        'Expired — valid until passed without signature. Superseded by EST-0001 (reduced Q3 scope). Originally scoped at Vertex Q2 planning session.'),

        // EST-0006: Meridian Digital — Website Platform Build Phase 1 — accepted → INV-0010
        estDoc(est6Id, estNum(6), 'Website Platform Build — Phase 1', cmId, coMeridian, [
          { desc: 'Discovery & Architecture — Phase 1 (20h)', qty: 20, price: 150 },
          { desc: 'Design & Initial Build — Phase 1 (40h)',   qty: 40, price: 150 },
        ], 8, 'accepted', -20, 10,
        'Accepted by James Hartley. Covers Phase 1 of the Meridian Digital website platform rebuild. Converted to INV-0010.', inv10Id),
      ]);

      // INV-0009 — draft converted from EST-0003 (Data Migration Sprint, TechFusion)
      await financeInvColl.insertOne({
        _id: inv9Id,
        invoiceNumber: 'INV-0009',
        customerId: ctId, companyId: coTech,
        estimateId: est3Id,
        lineItems: [
          { description: 'Notion/Jira Export Processing & Schema Mapping',  quantity: 16, unitPrice: 150, amount: 2400 },
          { description: 'Data Validation & Import Pipeline Build',          quantity: 12, unitPrice: 150, amount: 1800 },
          { description: 'Stakeholder Walkthrough & Sign-off Session',       quantity: 2,  unitPrice: 150, amount: 300  },
        ],
        subtotal: 4500, taxRate: 5, taxAmount: 225, total: 4725,
        currency: 'USD', status: 'draft',
        notes: 'Converted from EST-0003 (Data Migration Sprint). Awaiting final hour log confirmation from Kwame Asante before sending.',
        dueDate: d(20),
        createdBy: adminId, createdAt: d(-35), updatedAt: d(-35),
      });

      // INV-0010 — sent, converted from EST-0006 (Website Platform Build, Meridian Digital)
      await financeInvColl.insertOne({
        _id: inv10Id,
        invoiceNumber: 'INV-0010',
        customerId: cmId, companyId: coMeridian,
        estimateId: est6Id,
        lineItems: [
          { description: 'Discovery & Architecture — Phase 1 (20h)', quantity: 20, unitPrice: 150, amount: 3000 },
          { description: 'Design & Initial Build — Phase 1 (40h)',   quantity: 40, unitPrice: 150, amount: 6000 },
        ],
        subtotal: 9000, taxRate: 8, taxAmount: 720, total: 9720,
        currency: 'USD', status: 'sent',
        notes: 'Converted from EST-0006. First invoice for Meridian Digital — Website Platform Build, Phase 1. Contact: James Hartley.',
        dueDate: d(21),
        createdBy: adminId, createdAt: d(-7), updatedAt: d(-7),
      });

      // ── finance_subscriptions ────────────────────────────────────────
      const sub1Id = new ObjectId(); // Vertex Monthly Retainer
      const sub2Id = new ObjectId(); // TechFusion Monthly Retainer

      await db.collection('finance_subscriptions').insertMany([
        {
          _id: sub1Id,
          name: 'Vertex Monthly Retainer',
          customerId: cvId, companyId: coVertex,
          lineItems: [
            { description: 'Monthly Platform Retainer — Enterprise (40h included)', quantity: 1, unitPrice: 6000, amount: 6000 },
          ],
          taxRate: 8, currency: 'USD',
          billingCycle: 'monthly',
          startDate: d(-90), nextBillingDate: d(1), endDate: null,
          dueDateOffsetDays: 14,
          status: 'active',
          notes: 'Enterprise retainer for Vertex Systems. Includes 40 billable hours/month; unused hours roll over (capped at 20h). Overage billed at $150/h.',
          retainerEnabled: true, retainerHours: 40,
          rolloverEnabled: true, rolloverCap: 20, overageRate: 150,
          createdBy: adminId, createdAt: d(-90), updatedAt: d(-1),
        },
        {
          _id: sub2Id,
          name: 'TechFusion Monthly Retainer',
          customerId: ctId, companyId: coTech,
          lineItems: [
            { description: 'Monthly Retainer — Team Plan Pilot (20h included)', quantity: 1, unitPrice: 3000, amount: 3000 },
          ],
          taxRate: 5, currency: 'USD',
          billingCycle: 'monthly',
          startDate: d(-60), nextBillingDate: d(1), endDate: null,
          dueDateOffsetDays: 14,
          status: 'active',
          notes: 'Team Plan retainer for TechFusion Q2 Pilot. 20 billable hours/month; no rollover. Overage billed at $125/h.',
          retainerEnabled: true, retainerHours: 20,
          rolloverEnabled: false, rolloverCap: null, overageRate: 125,
          createdBy: adminId, createdAt: d(-60), updatedAt: d(-1),
        },
      ]);

      // ── finance_retainer_periods ─────────────────────────────────────
      const rp1Id = new ObjectId(); const rp2Id = new ObjectId();
      const rp3Id = new ObjectId(); const rp4Id = new ObjectId();
      const rp5Id = new ObjectId();

      // Resolve existing invoice _ids for closed-period links
      const inv1Doc = await financeInvColl.findOne({ invoiceNumber: 'INV-0001' });
      const inv2Doc = await financeInvColl.findOne({ invoiceNumber: 'INV-0002' });
      const inv7Doc = await financeInvColl.findOne({ invoiceNumber: 'INV-0007' });

      await db.collection('finance_retainer_periods').insertMany([

        // ── Vertex (sub1Id) ───────────────────────────────────────────
        // P1 (d-90 → d-61): 42h used — 2h overage at $150/h
        {
          _id: rp1Id, subscriptionId: sub1Id, companyId: coVertex,
          periodStart: d(-90), periodEnd: d(-61),
          hoursBase: 40, hoursRolledOver: 0, hoursIncluded: 40, hoursUsed: 42,
          hoursUsedAt: d(-62), status: 'closed', invoiceId: inv1Doc?._id ?? null,
          createdAt: d(-90), updatedAt: d(-62),
        },
        // P2 (d-60 → d-31): 35h used — 5h rollover to P3 (rolloverCap: 20h)
        {
          _id: rp2Id, subscriptionId: sub1Id, companyId: coVertex,
          periodStart: d(-60), periodEnd: d(-31),
          hoursBase: 40, hoursRolledOver: 0, hoursIncluded: 40, hoursUsed: 35,
          hoursUsedAt: d(-32), status: 'closed', invoiceId: inv2Doc?._id ?? null,
          createdAt: d(-60), updatedAt: d(-32),
        },
        // P3 (d-30 → d-1): current open period — hoursUsed computed live from time_entries
        {
          _id: rp3Id, subscriptionId: sub1Id, companyId: coVertex,
          periodStart: d(-30), periodEnd: d(-1),
          hoursBase: 40, hoursRolledOver: 5, hoursIncluded: 45, hoursUsed: 0,
          hoursUsedAt: null, status: 'open', invoiceId: null,
          createdAt: d(-30), updatedAt: d(-30),
        },

        // ── TechFusion (sub2Id) ───────────────────────────────────────
        // P1 (d-60 → d-31): 18h used — 2h unused, no rollover
        {
          _id: rp4Id, subscriptionId: sub2Id, companyId: coTech,
          periodStart: d(-60), periodEnd: d(-31),
          hoursBase: 20, hoursRolledOver: 0, hoursIncluded: 20, hoursUsed: 18,
          hoursUsedAt: d(-32), status: 'closed', invoiceId: inv7Doc?._id ?? null,
          createdAt: d(-60), updatedAt: d(-32),
        },
        // P2 (d-30 → d-1): current open period — hoursUsed computed live
        {
          _id: rp5Id, subscriptionId: sub2Id, companyId: coTech,
          periodStart: d(-30), periodEnd: d(-1),
          hoursBase: 20, hoursRolledOver: 0, hoursIncluded: 20, hoursUsed: 0,
          hoursUsedAt: null, status: 'open', invoiceId: null,
          createdAt: d(-30), updatedAt: d(-30),
        },
      ]);

    } // end finance snapshot (inner coVertex guard)

  } // end finance snapshot

  // ── Finance supplemental seed (separate guards) ────────────────────
  // Seeds expenses, estimates, and subscriptions independently so they
  // work even when the invoice collection already existed from a prior boot.
  {
    const [coVertexFin, coTechFin] = await Promise.all([
      db.collection('crm_companies').findOne({ name: 'Vertex Systems' }),
      db.collection('crm_companies').findOne({ name: 'TechFusion Inc' }),
    ]);
    const cvUserFin = await users.findOne({ email: 'client@vertexsystems.io' });
    const ctUserFin = await users.findOne({ email: 'client@techfusion.io' });

    if (coVertexFin && coTechFin && cvUserFin && ctUserFin) {
      const cvId        = cvUserFin._id   as ObjectId;
      const ctId        = ctUserFin._id   as ObjectId;
      const finCoVertex = coVertexFin._id as ObjectId;
      const finCoTech   = coTechFin._id   as ObjectId;

      // ── Expenses ───────────────────────────────────────────────────
      if (!await db.collection('finance_expenses').countDocuments()) {
        const expNum = (n: number) => `EXP-${String(n).padStart(4, '0')}`;
        await db.collection('finance_expenses').insertMany([
          {
            expenseNumber: expNum(1),
            description: 'Digital Ocean monthly hosting — production + staging droplets',
            vendor: 'DigitalOcean', category: 'hosting',
            amount: 420, currency: 'USD',
            expenseDate: d(-60), status: 'paid',
            billable: false, companyId: null, milestoneId: null,
            notes: 'Covers two Droplets (prod/staging) and managed MongoDB cluster for Q1.',
            receiptUrl: null,
            createdBy: joeId, createdAt: d(-60), updatedAt: d(-60),
          },
          {
            expenseNumber: expNum(2),
            description: 'GitHub Copilot Business — 5 team seats',
            vendor: 'GitHub', category: 'software',
            amount: 190, currency: 'USD',
            expenseDate: d(-45), status: 'paid',
            billable: false, companyId: null, milestoneId: null,
            notes: '5 seats × $19/mo. Approved at Sprint 3 kickoff.',
            receiptUrl: null,
            createdBy: kyleId, createdAt: d(-45), updatedAt: d(-45),
          },
          {
            expenseNumber: expNum(3),
            description: 'Branding contractor — logo & brand asset suite',
            vendor: 'Studio Lark', category: 'contractor',
            amount: 2400, currency: 'USD',
            expenseDate: d(-80), status: 'paid',
            billable: true, companyId: finCoVertex, milestoneId: null,
            notes: 'Full brand identity package billed back to Vertex Systems (Enterprise License). Included SVG logo, favicon, and brand guide.',
            receiptUrl: null,
            createdBy: alexId, createdAt: d(-80), updatedAt: d(-80),
          },
          {
            expenseNumber: expNum(4),
            description: 'AWS credits — TechFusion demo environment',
            vendor: 'Amazon Web Services', category: 'hosting',
            amount: 340, currency: 'USD',
            expenseDate: d(-20), status: 'paid',
            billable: true, companyId: finCoTech, milestoneId: null,
            notes: 'Isolated AWS environment provisioned for TechFusion Q2 Pilot demo (Sprint 4 walkthrough). Billable to TechFusion.',
            receiptUrl: null,
            createdBy: alexId, createdAt: d(-20), updatedAt: d(-20),
          },
          {
            expenseNumber: expNum(5),
            description: 'ProductCon — flights & hotel',
            vendor: 'Delta / Marriott', category: 'travel',
            amount: 1850, currency: 'USD',
            expenseDate: d(-70), status: 'paid',
            billable: false, companyId: null, milestoneId: null,
            notes: 'Attended ProductCon where BluePeak Agency contact (Carmen Reyes) was sourced. Round-trip flight + 2 nights.',
            receiptUrl: null,
            createdBy: joeId, createdAt: d(-70), updatedAt: d(-70),
          },
          {
            expenseNumber: expNum(6),
            description: 'Client dinner — Vertex Systems kickoff',
            vendor: 'Nobu', category: 'meals',
            amount: 310, currency: 'USD',
            expenseDate: d(-50), status: 'paid',
            billable: true, companyId: finCoVertex, milestoneId: null,
            notes: 'Kickoff dinner with Marcus Webb and Priya Sharma following contract signature. Billed back to Vertex enterprise account.',
            receiptUrl: null,
            createdBy: joeId, createdAt: d(-50), updatedAt: d(-50),
          },
          {
            expenseNumber: expNum(7),
            description: 'MacBook Pro 14" — Riley onboarding',
            vendor: 'Apple', category: 'equipment',
            amount: 2499, currency: 'USD',
            expenseDate: d(-15), status: 'pending',
            billable: false, companyId: null, milestoneId: null,
            notes: 'Hardware for new contributor (Riley). Awaiting finance approval before reimbursement.',
            receiptUrl: null,
            createdBy: kyleId, createdAt: d(-15), updatedAt: d(-15),
          },
          {
            expenseNumber: expNum(8),
            description: 'Q2 office supplies — paper, printer cartridges, whiteboard markers',
            vendor: 'Staples', category: 'other',
            amount: 85, currency: 'USD',
            expenseDate: d(-5), status: 'draft',
            billable: false, companyId: null, milestoneId: null,
            notes: '',
            receiptUrl: null,
            createdBy: samId, createdAt: d(-5), updatedAt: d(-5),
          },
        ]);
      }

      // ── Estimates ──────────────────────────────────────────────────
      if (!await db.collection('finance_estimates').countDocuments()) {
        const est1Id = new ObjectId(); const est2Id = new ObjectId();
        const est3Id = new ObjectId(); const est4Id = new ObjectId();
        const est5Id = new ObjectId();

        const existingInv9 = await financeInvColl.findOne({ invoiceNumber: 'INV-0009' });
        const inv9Id = (existingInv9?._id as ObjectId | undefined) ?? new ObjectId();

        const estNum = (n: number) => `EST-${String(n).padStart(4, '0')}`;

        const estDoc = (
          id: ObjectId, estimateNumber: string,
          title: string, customerId: ObjectId, companyId: ObjectId,
          items: Array<{ desc: string; qty: number; price: number }>,
          taxRate: number, status: string,
          daysOffset: number, validUntilOffset: number | null,
          notes: string, invoiceId: ObjectId | null = null,
        ) => {
          const lineItems = items.map(i => ({
            description: i.desc, quantity: i.qty, unitPrice: i.price,
            amount: i.qty * i.price,
          }));
          const subtotal  = lineItems.reduce((s, i) => s + i.amount, 0);
          const taxAmount = subtotal * (taxRate / 100);
          const total     = subtotal + taxAmount;
          return {
            _id: id, estimateNumber, title,
            customerId, companyId, lineItems,
            subtotal, taxRate, taxAmount, total,
            currency: 'USD', status,
            validUntil: validUntilOffset !== null ? d(validUntilOffset) : null,
            notes, invoiceId,
            createdBy: adminId,
            createdAt: d(daysOffset), updatedAt: d(daysOffset),
          };
        };

        await db.collection('finance_estimates').insertMany([
          estDoc(est1Id, estNum(1), 'Q3 Platform Enhancements', cvId, finCoVertex, [
            { desc: 'v2.0 Reporting & Analytics — Scoping & Architecture',   qty: 20, price: 175 },
            { desc: 'Velocity & Burndown Dashboards — Build & Test',         qty: 32, price: 175 },
            { desc: 'Export Infrastructure — CSV/PDF report generation',     qty: 8,  price: 175 },
            { desc: 'QA & Stakeholder Review Sessions',                      qty: 4,  price: 150 },
          ], 8, 'sent', -18, 30,
          'Scoped for Vertex Systems Q3 roadmap under the v2.0 Reporting & Analytics milestone. Covers sprint velocity dashboards and CSV/PDF export infrastructure. Valid for 30 days. Primary contact: Marcus Webb.'),

          estDoc(est2Id, estNum(2), 'API Integration Package', ctId, finCoTech, [
            { desc: 'REST API Custom Endpoint Development (12 endpoints)',    qty: 24, price: 150 },
            { desc: 'Webhook Configuration & Testing',                       qty: 8,  price: 150 },
            { desc: 'API Documentation & Postman Collection',                qty: 4,  price: 125 },
            { desc: 'Integration QA — Kwame Asante review sessions (3×2h)', qty: 6,  price: 150 },
          ], 5, 'draft', -5, 45,
          "Draft scoped for TechFusion's integration requirements (Kwame Asante's team). Pending Kwame's review of the Postman mock collection before sending."),

          estDoc(est3Id, estNum(3), 'Data Migration Sprint', ctId, finCoTech, [
            { desc: 'Notion/Jira Export Processing & Schema Mapping',  qty: 16, price: 150 },
            { desc: 'Data Validation & Import Pipeline Build',          qty: 12, price: 150 },
            { desc: 'Stakeholder Walkthrough & Sign-off Session',       qty: 2,  price: 150 },
          ], 5, 'accepted', -35, 0,
          'Accepted by Dana Kowalski. Covers full data migration from Notion/Jira for TechFusion Q2 Pilot. Converted to invoice INV-0009.', inv9Id),

          estDoc(est4Id, estNum(4), 'Starter Onboarding Pack', cvId, finCoVertex, [
            { desc: 'Onboarding Workshop (4h facilitated session)',  qty: 1, price: 1200 },
            { desc: 'Custom Getting Started Guide — Vertex Edition', qty: 1, price: 800  },
            { desc: 'Admin Training Session (2h)',                   qty: 1, price: 400  },
            { desc: 'Video Walkthrough Recording & Editing',         qty: 1, price: 600  },
          ], 8, 'declined', -55, -5,
          'Declined by Marcus Webb — Vertex opted to handle onboarding internally using the standard docs. Scope reduced at contract review.'),

          estDoc(est5Id, estNum(5), 'v2.0 Analytics Module — Full Scope', cvId, finCoVertex, [
            { desc: 'Analytics Architecture & Data Modelling',           qty: 24, price: 175 },
            { desc: 'Velocity, Burndown & Throughput Dashboards',        qty: 40, price: 175 },
            { desc: 'Custom Reporting Engine — Filters, Groups, Export', qty: 32, price: 175 },
            { desc: 'Enterprise Dashboard Configuration & Training',     qty: 8,  price: 150 },
          ], 8, 'expired', -75, -10,
          'Expired — valid until passed without signature. Superseded by EST-0001 (reduced Q3 scope). Originally scoped at Vertex Q2 planning session.'),
        ]);

        if (!existingInv9) {
          await financeInvColl.insertOne({
            _id: inv9Id,
            invoiceNumber: 'INV-0009',
            customerId: ctId, companyId: finCoTech,
            estimateId: est3Id,
            lineItems: [
              { description: 'Notion/Jira Export Processing & Schema Mapping',  quantity: 16, unitPrice: 150, amount: 2400 },
              { description: 'Data Validation & Import Pipeline Build',          quantity: 12, unitPrice: 150, amount: 1800 },
              { description: 'Stakeholder Walkthrough & Sign-off Session',       quantity: 2,  unitPrice: 150, amount: 300  },
            ],
            subtotal: 4500, taxRate: 5, taxAmount: 225, total: 4725,
            currency: 'USD', status: 'draft',
            notes: 'Converted from EST-0003 (Data Migration Sprint). Awaiting final hour log confirmation from Kwame Asante before sending.',
            dueDate: d(20),
            createdBy: adminId, createdAt: d(-35), updatedAt: d(-35),
          });
        }
      }

      // ── Subscriptions ──────────────────────────────────────────────
      if (!await db.collection('finance_subscriptions').countDocuments()) {
        const sub1Id = new ObjectId();
        const sub2Id = new ObjectId();

        await db.collection('finance_subscriptions').insertMany([
          {
            _id: sub1Id,
            name: 'Vertex Monthly Retainer',
            customerId: cvId, companyId: finCoVertex,
            lineItems: [
              { description: 'Monthly Platform Retainer — Enterprise (40h included)', quantity: 1, unitPrice: 6000, amount: 6000 },
            ],
            taxRate: 8, currency: 'USD',
            billingCycle: 'monthly',
            startDate: d(-90), nextBillingDate: d(1), endDate: null,
            dueDateOffsetDays: 14,
            status: 'active',
            notes: 'Enterprise retainer for Vertex Systems. Includes 40 billable hours/month; unused hours roll over (capped at 20h). Overage billed at $150/h.',
            retainerEnabled: true, retainerHours: 40,
            rolloverEnabled: true, rolloverCap: 20, overageRate: 150,
            createdBy: adminId, createdAt: d(-90), updatedAt: d(-1),
          },
          {
            _id: sub2Id,
            name: 'TechFusion Monthly Retainer',
            customerId: ctId, companyId: finCoTech,
            lineItems: [
              { description: 'Monthly Retainer — Team Plan Pilot (20h included)', quantity: 1, unitPrice: 3000, amount: 3000 },
            ],
            taxRate: 5, currency: 'USD',
            billingCycle: 'monthly',
            startDate: d(-60), nextBillingDate: d(1), endDate: null,
            dueDateOffsetDays: 14,
            status: 'active',
            notes: 'Team Plan retainer for TechFusion Q2 Pilot. 20 billable hours/month; no rollover. Overage billed at $125/h.',
            retainerEnabled: true, retainerHours: 20,
            rolloverEnabled: false, rolloverCap: null, overageRate: 125,
            createdBy: adminId, createdAt: d(-60), updatedAt: d(-1),
          },
        ]);

        const rp1Id = new ObjectId(); const rp2Id = new ObjectId();
        const rp3Id = new ObjectId(); const rp4Id = new ObjectId();
        const rp5Id = new ObjectId();

        const inv1Doc = await financeInvColl.findOne({ invoiceNumber: 'INV-0001' });
        const inv2Doc = await financeInvColl.findOne({ invoiceNumber: 'INV-0002' });
        const inv7Doc = await financeInvColl.findOne({ invoiceNumber: 'INV-0007' });

        await db.collection('finance_retainer_periods').insertMany([
          {
            _id: rp1Id, subscriptionId: sub1Id, companyId: finCoVertex,
            periodStart: d(-90), periodEnd: d(-61),
            hoursBase: 40, hoursRolledOver: 0, hoursIncluded: 40, hoursUsed: 42,
            hoursUsedAt: d(-62), status: 'closed', invoiceId: inv1Doc?._id ?? null,
            createdAt: d(-90), updatedAt: d(-62),
          },
          {
            _id: rp2Id, subscriptionId: sub1Id, companyId: finCoVertex,
            periodStart: d(-60), periodEnd: d(-31),
            hoursBase: 40, hoursRolledOver: 0, hoursIncluded: 40, hoursUsed: 35,
            hoursUsedAt: d(-32), status: 'closed', invoiceId: inv2Doc?._id ?? null,
            createdAt: d(-60), updatedAt: d(-32),
          },
          {
            _id: rp3Id, subscriptionId: sub1Id, companyId: finCoVertex,
            periodStart: d(-30), periodEnd: d(-1),
            hoursBase: 40, hoursRolledOver: 5, hoursIncluded: 45, hoursUsed: 0,
            hoursUsedAt: null, status: 'open', invoiceId: null,
            createdAt: d(-30), updatedAt: d(-30),
          },
          {
            _id: rp4Id, subscriptionId: sub2Id, companyId: finCoTech,
            periodStart: d(-60), periodEnd: d(-31),
            hoursBase: 20, hoursRolledOver: 0, hoursIncluded: 20, hoursUsed: 18,
            hoursUsedAt: d(-32), status: 'closed', invoiceId: inv7Doc?._id ?? null,
            createdAt: d(-60), updatedAt: d(-32),
          },
          {
            _id: rp5Id, subscriptionId: sub2Id, companyId: finCoTech,
            periodStart: d(-30), periodEnd: d(-1),
            hoursBase: 20, hoursRolledOver: 0, hoursIncluded: 20, hoursUsed: 0,
            hoursUsedAt: null, status: 'open', invoiceId: null,
            createdAt: d(-30), updatedAt: d(-30),
          },
        ]);
      }

    }
  }
}
