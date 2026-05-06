import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fp from 'fastify-plugin';
import { ObjectId } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));

const perms = JSON.parse(
  readFileSync(join(__dirname, '../data/permissions.json'), 'utf8')
) as Record<string, Record<string, Record<string, boolean>>>;

const DEFAULT_SETTINGS = [
  {
    key: 'brand.name',
    value: '',
    type: 'string',
    label: 'Brand Name',
    description: 'Text shown in the app header (mutually exclusive with Brand Logo)'
  },
  {
    key: 'brand.logo',
    value: '',
    type: 'string',
    label: 'Brand Logo',
    description: 'Logo image URL shown in the header (managed via the logo upload UI; mutually exclusive with Brand Name)'
  },
  {
    key: 'app.registration_open',
    value: true,
    type: 'boolean',
    label: 'Open Registration',
    description: 'Allow new users to self-register without an invitation'
  },
  {
    key: 'theme.mode',
    value: 'light',
    type: 'select',
    label: 'Default Theme',
    description: 'Application color scheme for new sessions',
    options: ['light', 'dark']
  },
  {
    key: 'chat.enabled',
    value: true,
    type: 'boolean',
    label: 'AI Assistant',
    description: 'Show the AI chat assistant panel for authenticated users'
  }
];

const ROLES: [string, string][] = [
  ['owner',       'Owner'],
  ['admin',       'Administrator'],
  ['lead',        'Lead'],
  ['contributor', 'Contributor'],
  ['viewer',      'Viewer'],
  ['customer',    'Customer'],
];

// [username, firstName, lastName, role]
const SEED_USERS: [string, string, string, string][] = [
  ['owner',  'Owner',  '',       'owner'],
  ['admin',  'Admin',  '',       'admin'],
  ['alex',   'Alex',   'Chen',   'lead'],
  ['jordan', 'Jordan', 'Rivera', 'contributor'],
  ['sam',    'Sam',    'Park',   'contributor'],
  ['riley',  'Riley',  'Morgan', 'contributor'],
];

export default fp(async function seedPlugin(app: any) {
  app.addHook('onReady', async () => {
    const db  = app.mongo.db!;
    const now = new Date();

    // ── Roles ─────────────────────────────────────────────────────────
    const roles = db.collection('roles');
    for (const [name, label] of ROLES) {
      const permissions = perms[name] ?? {};
      await roles.updateOne(
        { name },
        {
          $setOnInsert: { name, createdAt: now },
          $set:         { label, permissions, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // ── Users ─────────────────────────────────────────────────────────
    const users = db.collection('users');
    for (const [username, firstName, lastName, role] of SEED_USERS) {
      const existing = await users.findOne({ username });
      if (!existing) {
        const email        = `${username}@lmodulo.com`;
        const password     = `${username}-password`;
        const passwordHash = await bcrypt.hash(password, 12);
        await users.insertOne({
          username, email, password, passwordHash,
          firstName, lastName, role,
          createdAt: now, updatedAt: now,
        });
      }
    }

    // ── Settings ──────────────────────────────────────────────────────
    const settings = db.collection('settings');
    for (const s of DEFAULT_SETTINGS) {
      await settings.updateOne(
        { key: s.key },
        {
          $setOnInsert: { value: s.value, createdAt: now, updatedBy: null },
          $set:         { type: s.type, label: s.label, description: s.description, options: (s as any).options ?? null, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // ── Agile demo snapshot ───────────────────────────────────────────
    // Skip if any milestones already exist (idempotent)
    const milestones = db.collection('agile_milestones');
    if (await milestones.countDocuments()) return;

    const team = await users
      .find({ username: { $in: ['alex', 'jordan', 'sam', 'riley'] } })
      .toArray();
    const uid = (name: string): ObjectId => team.find((u: any) => u.username === name)!._id;
    const alexId   = uid('alex');
    const jordanId = uid('jordan');
    const samId    = uid('sam');
    const rileyId  = uid('riley');

    // offset in calendar days from seed time, normalised to 09:00
    const d = (offsetDays: number): Date => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + offsetDays);
      dt.setHours(9, 0, 0, 0);
      return dt;
    };

    // ── Milestone IDs ─────────────────────────────────────────────────
    const m1Id = new ObjectId(); // v1.0 Core Platform   — Completed
    const m2Id = new ObjectId(); // v1.1 Agile Tracker   — Active
    const m3Id = new ObjectId(); // v2.0 Analytics       — Planning

    await milestones.insertMany([
      {
        _id: m1Id,
        title: 'v1.0 – Core Platform',
        description: 'Authentication, user management, RBAC, settings, and in-app messaging.',
        strategicGoal: 'Deliver a production-ready scaffold teams can fork and ship from day one.',
        priority: 'High', status: 'Completed',
        startDate: d(-98), endDate: d(-56),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-100), updatedAt: d(-56),
      },
      {
        _id: m2Id,
        title: 'v1.1 – Agile Tracker',
        description: 'Milestones, sprints, jobs, and tasks with full permission gating.',
        strategicGoal: 'Enable teams to plan and track work end-to-end within the platform.',
        priority: 'High', status: 'Active',
        startDate: d(-49), endDate: d(14),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-50), updatedAt: d(-1),
      },
      {
        _id: m3Id,
        title: 'v2.0 – Reporting & Analytics',
        description: 'Velocity dashboards, burndown charts, and delivery risk signals.',
        strategicGoal: 'Give leads real-time visibility into team velocity and delivery risk.',
        priority: 'Medium', status: 'Planning',
        startDate: d(28), endDate: d(98),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
    ]);

    // ── Sprint IDs ────────────────────────────────────────────────────
    const s1Id = new ObjectId(); // M1 · Foundation       — Completed
    const s2Id = new ObjectId(); // M1 · Core Features    — Completed
    const s3Id = new ObjectId(); // M2 · Data Layer       — Completed
    const s4Id = new ObjectId(); // M2 · UI Layer         — Active
    const s5Id = new ObjectId(); // M2 · Polish & Release — Planning
    const s6Id = new ObjectId(); // M3 · Analytics Fnd    — Planning

    const sprints = db.collection('agile_sprints');
    await sprints.insertMany([
      {
        _id: s1Id, milestoneId: m1Id, sprintNumber: 1,
        title: 'Foundation',
        description: 'Auth, database setup, and Fastify API scaffold.',
        capacity: 120, status: 'Completed',
        startDate: d(-98), endDate: d(-84),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-100), updatedAt: d(-84),
      },
      {
        _id: s2Id, milestoneId: m1Id, sprintNumber: 2,
        title: 'Core Features',
        description: 'User management, role-based permissions, and settings.',
        capacity: 120, status: 'Completed',
        startDate: d(-84), endDate: d(-56),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-85), updatedAt: d(-56),
      },
      {
        _id: s3Id, milestoneId: m2Id, sprintNumber: 1,
        title: 'Data Layer',
        description: 'All agile collection CRUD APIs with validation and aggregation.',
        capacity: 120, status: 'Completed',
        startDate: d(-49), endDate: d(-28),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-50), updatedAt: d(-28),
      },
      {
        _id: s4Id, milestoneId: m2Id, sprintNumber: 2,
        title: 'UI Layer',
        description: 'SvelteKit frontend for all agile views — overview, board, timeline.',
        capacity: 100, status: 'Active',
        startDate: d(-28), endDate: d(7),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-29), updatedAt: d(-1),
      },
      {
        _id: s5Id, milestoneId: m2Id, sprintNumber: 3,
        title: 'Polish & Release',
        description: 'E2E tests, performance audit, and release documentation.',
        capacity: 80, status: 'Planning',
        startDate: d(7), endDate: d(21),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-14), updatedAt: d(-14),
      },
      {
        _id: s6Id, milestoneId: m3Id, sprintNumber: 1,
        title: 'Analytics Foundation',
        description: 'Core chart components and aggregation pipelines for reporting.',
        capacity: 120, status: 'Planning',
        startDate: d(28), endDate: d(56),
        calendarEventIds: [],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
    ]);

    // ── Job IDs ───────────────────────────────────────────────────────
    // S1 — Foundation (all Done)
    const j1_1 = new ObjectId(); // Auth system
    const j1_2 = new ObjectId(); // MongoDB setup
    const j1_3 = new ObjectId(); // Fastify scaffold
    // S2 — Core Features (all Done)
    const j2_1 = new ObjectId(); // User management
    const j2_2 = new ObjectId(); // Role-based permissions
    const j2_3 = new ObjectId(); // Settings module
    const j2_4 = new ObjectId(); // Bug: session expiry
    // S3 — Data Layer (all Done)
    const j3_1 = new ObjectId(); // Milestone CRUD API
    const j3_2 = new ObjectId(); // Sprint CRUD API
    const j3_3 = new ObjectId(); // Jobs & Tasks API
    const j3_4 = new ObjectId(); // Permissions wiring
    // S4 — UI Layer (mixed)
    const j4_1 = new ObjectId(); // Overview UI        — Done
    const j4_2 = new ObjectId(); // Sprint detail page  — Review
    const j4_3 = new ObjectId(); // Board / Kanban      — In Progress (blocked task)
    const j4_4 = new ObjectId(); // Timeline / Gantt    — Backlog
    const j4_5 = new ObjectId(); // Bug: nav active     — Done
    // S5 — Polish (all Backlog)
    const j5_1 = new ObjectId(); // E2E tests
    const j5_2 = new ObjectId(); // Performance audit
    const j5_3 = new ObjectId(); // Release docs
    // S6 — Analytics (all Backlog)
    const j6_1 = new ObjectId(); // Velocity dashboard
    const j6_2 = new ObjectId(); // Burndown charts

    const jobs = db.collection('agile_jobs');
    await jobs.insertMany([
      // ── Sprint 1 — Foundation ─────────────────────────────────────
      {
        _id: j1_1, sprintId: s1Id,
        title: 'Auth system',
        description: 'Session-cookie auth: login, logout, /me endpoint, and bcrypt password hashing.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-98), endDate: d(-91),
        calendarEventIds: [], createdBy: alexId, updatedBy: alexId,
        createdAt: d(-100), updatedAt: d(-91),
      },
      {
        _id: j1_2, sprintId: s1Id,
        title: 'MongoDB setup & base indexes',
        description: 'Docker volume, Fastify MongoDB plugin, and base collection indexes.',
        category: 'Tech Debt', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-98), endDate: d(-88),
        calendarEventIds: [], createdBy: alexId, updatedBy: rileyId,
        createdAt: d(-100), updatedAt: d(-88),
      },
      {
        _id: j1_3, sprintId: s1Id,
        title: 'Fastify API scaffold',
        description: 'Plugin registration pattern, route file convention, health check, and error handling.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j1_2],
        startDate: d(-90), endDate: d(-84),
        calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
        createdAt: d(-91), updatedAt: d(-84),
      },
      // ── Sprint 2 — Core Features ──────────────────────────────────
      {
        _id: j2_1, sprintId: s2Id,
        title: 'User management CRUD',
        description: 'Paginated user list, create/edit/delete endpoints, and Manage Users frontend page.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-84), endDate: d(-70),
        calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
        createdAt: d(-85), updatedAt: d(-70),
      },
      {
        _id: j2_2, sprintId: s2Id,
        title: 'Role-based permissions',
        description: 'Permissions data model, requirePermission Fastify preHandler, and Roles management UI.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j2_1],
        startDate: d(-80), endDate: d(-63),
        calendarEventIds: [], createdBy: alexId, updatedBy: samId,
        createdAt: d(-81), updatedAt: d(-63),
      },
      {
        _id: j2_3, sprintId: s2Id,
        title: 'Settings module',
        description: 'Settings CRUD API with upsert and admin settings page with live preview.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-75), endDate: d(-63),
        calendarEventIds: [], createdBy: alexId, updatedBy: rileyId,
        createdAt: d(-76), updatedAt: d(-63),
      },
      {
        _id: j2_4, sprintId: s2Id,
        title: 'Fix: session token expiry race condition',
        description: 'Users occasionally logged out immediately after login on slow connections.',
        category: 'Bug', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-65), endDate: d(-63),
        calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
        createdAt: d(-66), updatedAt: d(-63),
      },
      // ── Sprint 3 — Data Layer ─────────────────────────────────────
      {
        _id: j3_1, sprintId: s3Id,
        title: 'Milestone CRUD API',
        description: 'Schema validation, aggregation pipeline for rollup fields (completionPct, sprintCount), CRUD routes.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-49), endDate: d(-38),
        calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
        createdAt: d(-50), updatedAt: d(-38),
      },
      {
        _id: j3_2, sprintId: s3Id,
        title: 'Sprint CRUD API',
        description: 'sprintNumber auto-counter per milestone, capacity tracking, and date-range constraints.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j3_1],
        startDate: d(-45), endDate: d(-35),
        calendarEventIds: [], createdBy: alexId, updatedBy: samId,
        createdAt: d(-46), updatedAt: d(-35),
      },
      {
        _id: j3_3, sprintId: s3Id,
        title: 'Jobs & Tasks API',
        description: 'Job dependency graph, task effort tracking, cascading completion rules, blocked-by validation.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j3_2],
        startDate: d(-42), endDate: d(-28),
        calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
        createdAt: d(-43), updatedAt: d(-28),
      },
      {
        _id: j3_4, sprintId: s3Id,
        title: 'Permissions: agile resources',
        description: 'Add agile_* resource keys to permissions.json and wire requirePermission to all agile routes.',
        category: 'Tech Debt', status: 'Done', blocked: false, dependencyIds: [j3_3],
        startDate: d(-32), endDate: d(-28),
        calendarEventIds: [], createdBy: alexId, updatedBy: rileyId,
        createdAt: d(-33), updatedAt: d(-28),
      },
      // ── Sprint 4 — UI Layer ───────────────────────────────────────
      {
        _id: j4_1, sprintId: s4Id,
        title: 'Overview & Milestones UI',
        description: 'MilestoneCard component, role-aware KPI dashboard, New Milestone modal, and status/priority filters.',
        category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-28), endDate: d(-14),
        calendarEventIds: [], createdBy: alexId, updatedBy: samId,
        createdAt: d(-29), updatedAt: d(-14),
      },
      {
        _id: j4_2, sprintId: s4Id,
        title: 'Sprint detail page',
        description: 'Sprint header with stats, job list with inline task expansion, and task slide-out detail panel.',
        category: 'Feature', status: 'Review', blocked: false, dependencyIds: [j4_1],
        startDate: d(-18), endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: samId,
        createdAt: d(-19), updatedAt: d(-2),
      },
      {
        _id: j4_3, sprintId: s4Id,
        title: 'Board view (Kanban)',
        description: 'Kanban columns per task status with drag-and-drop between columns and filter toolbar.',
        category: 'Feature', status: 'In Progress', blocked: true, dependencyIds: [j4_1],
        startDate: d(-20), endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
        createdAt: d(-21), updatedAt: d(-3),
      },
      {
        _id: j4_4, sprintId: s4Id,
        title: 'Timeline view (Gantt)',
        description: 'SVG Gantt chart showing milestone/sprint/job lanes with date zoom and today marker.',
        category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [j4_1],
        startDate: null, endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: null,
        createdAt: d(-14), updatedAt: d(-14),
      },
      {
        _id: j4_5, sprintId: s4Id,
        title: 'Fix: agile tab active state for child routes',
        description: 'Overview tab was not highlighting when navigating to /agile/milestones or /agile/sprints.',
        category: 'Bug', status: 'Done', blocked: false, dependencyIds: [],
        startDate: d(-5), endDate: d(-4),
        calendarEventIds: [], createdBy: rileyId, updatedBy: rileyId,
        createdAt: d(-5), updatedAt: d(-4),
      },
      // ── Sprint 5 — Polish & Release ───────────────────────────────
      {
        _id: j5_1, sprintId: s5Id,
        title: 'E2E test coverage',
        description: 'Playwright setup, auth flow tests, and agile CRUD happy-path tests.',
        category: 'Research', status: 'Backlog', blocked: false, dependencyIds: [],
        startDate: null, endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: null,
        createdAt: d(-10), updatedAt: d(-10),
      },
      {
        _id: j5_2, sprintId: s5Id,
        title: 'Performance audit',
        description: 'MongoDB explain-plan review for aggregation queries and frontend bundle size reduction.',
        category: 'Tech Debt', status: 'Backlog', blocked: false, dependencyIds: [],
        startDate: null, endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: null,
        createdAt: d(-10), updatedAt: d(-10),
      },
      {
        _id: j5_3, sprintId: s5Id,
        title: 'Release documentation',
        description: 'API endpoint reference and Docker deployment guide for the v1.1 release.',
        category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
        startDate: null, endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
      // ── Sprint 6 — Analytics Foundation ──────────────────────────
      {
        _id: j6_1, sprintId: s6Id,
        title: 'Velocity dashboard',
        description: 'Per-sprint velocity SVG chart using historical sprint actual hours.',
        category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
        startDate: null, endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: null,
        createdAt: d(-2), updatedAt: d(-2),
      },
      {
        _id: j6_2, sprintId: s6Id,
        title: 'Burndown charts',
        description: 'Sprint burndown SVG with ideal vs actual lines and lightweight polling.',
        category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
        startDate: null, endDate: null,
        calendarEventIds: [], createdBy: alexId, updatedBy: null,
        createdAt: d(-2), updatedAt: d(-2),
      },
    ]);

    // ── Tasks ─────────────────────────────────────────────────────────
    const t = (
      jobId: ObjectId,
      title: string,
      assignedTo: ObjectId | null,
      estimateHours: number,
      actualHours: number,
      remainingHours: number,
      priority: string,
      status: string,
      blockedReason: string,
      dueDate: Date | null,
      createdAtOffset: number,
      updatedAtOffset: number,
      createdBy: ObjectId,
      updatedBy: ObjectId | null,
    ) => ({
      jobId, title, description: '',
      assignedTo, estimateHours, actualHours, remainingHours,
      priority, status, blockedReason, dueDate,
      calendarEventIds: [],
      createdBy, updatedBy,
      createdAt: d(createdAtOffset), updatedAt: d(updatedAtOffset),
    });

    const tasks = db.collection('agile_tasks');
    await tasks.insertMany([
      // ── J1.1 Auth system ─────────────────────────────────────────
      t(j1_1, 'Design session auth flow',                       alexId,   4,  5, 0, 'High',   'Done', '', null, -99, -94, alexId, alexId),
      t(j1_1, 'Login & logout Fastify endpoints',               jordanId, 8,  9, 0, 'High',   'Done', '', null, -99, -92, alexId, jordanId),
      t(j1_1, 'Session middleware & bcrypt hashing',            jordanId, 6,  6, 0, 'High',   'Done', '', null, -99, -93, alexId, jordanId),
      t(j1_1, 'SvelteKit login page & hooks.server.ts guard',   samId,    6,  7, 0, 'Medium', 'Done', '', null, -99, -91, alexId, samId),
      // ── J1.2 MongoDB setup ────────────────────────────────────────
      t(j1_2, 'Configure MongoDB docker volume & plugin',       rileyId,  3,  2, 0, 'Medium', 'Done', '', null, -99, -93, alexId, rileyId),
      t(j1_2, 'Create base collection indexes',                 rileyId,  4,  4, 0, 'Medium', 'Done', '', null, -97, -89, alexId, rileyId),
      // ── J1.3 Fastify scaffold ─────────────────────────────────────
      t(j1_3, 'Plugin registration pattern',                    alexId,   4,  5, 0, 'High',   'Done', '', null, -91, -86, alexId, alexId),
      t(j1_3, 'Route file & prefix convention',                 jordanId, 4,  4, 0, 'Medium', 'Done', '', null, -90, -86, alexId, jordanId),
      t(j1_3, 'Health check endpoint & error handler',          rileyId,  3,  3, 0, 'Low',    'Done', '', null, -90, -85, alexId, rileyId),
      // ── J2.1 User management ──────────────────────────────────────
      t(j2_1, 'User list API with pagination',                  jordanId, 8,  8, 0, 'High',   'Done', '', null, -84, -77, alexId, jordanId),
      t(j2_1, 'Create/edit/delete user endpoints',              jordanId, 8,  9, 0, 'High',   'Done', '', null, -84, -75, alexId, jordanId),
      t(j2_1, 'Manage Users frontend page',                     samId,   10, 12, 0, 'High',   'Done', '', null, -82, -70, alexId, samId),
      // ── J2.2 Role-based permissions ───────────────────────────────
      t(j2_2, 'Permissions data model & JSON schema',           alexId,   4,  4, 0, 'High',   'Done', '', null, -80, -77, alexId, alexId),
      t(j2_2, 'requirePermission Fastify preHandler',           jordanId, 6,  6, 0, 'High',   'Done', '', null, -79, -70, alexId, jordanId),
      t(j2_2, 'Roles management frontend page',                 samId,    8,  8, 0, 'Medium', 'Done', '', null, -78, -64, alexId, samId),
      // ── J2.3 Settings ────────────────────────────────────────────
      t(j2_3, 'Settings CRUD API with upsert pattern',          rileyId,  6,  6, 0, 'Medium', 'Done', '', null, -75, -68, alexId, rileyId),
      t(j2_3, 'Settings admin page with live preview',          rileyId,  6,  7, 0, 'Medium', 'Done', '', null, -73, -63, alexId, rileyId),
      // ── J2.4 Bug: session expiry ──────────────────────────────────
      t(j2_4, 'Reproduce & fix session expiry race condition',  jordanId, 2,  3, 0, 'Critical','Done','', d(-63), -65, -63, alexId, jordanId),
      // ── J3.1 Milestone CRUD ───────────────────────────────────────
      t(j3_1, 'Milestone schema validation & route setup',      alexId,   3,  3, 0, 'High',   'Done', '', null, -49, -44, alexId, alexId),
      t(j3_1, 'CRUD endpoints with aggregation for rollups',    jordanId, 8,  9, 0, 'High',   'Done', '', null, -48, -39, alexId, jordanId),
      t(j3_1, 'Date range validation middleware',               jordanId, 3,  4, 0, 'Medium', 'Done', '', null, -46, -38, alexId, jordanId),
      // ── J3.2 Sprint CRUD ──────────────────────────────────────────
      t(j3_2, 'Sprint schema & sprintNumber auto-counter',      rileyId,  4,  4, 0, 'High',   'Done', '', null, -45, -40, alexId, rileyId),
      t(j3_2, 'Sprint CRUD with capacity tracking',             jordanId, 6,  7, 0, 'High',   'Done', '', null, -44, -37, alexId, jordanId),
      t(j3_2, 'Sprint–milestone date constraint enforcement',   samId,    4,  5, 0, 'Medium', 'Done', '', null, -43, -35, alexId, samId),
      // ── J3.3 Jobs & Tasks ─────────────────────────────────────────
      t(j3_3, 'Job schema with dependency graph support',       alexId,   4,  4, 0, 'High',   'Done', '', null, -43, -39, alexId, alexId),
      t(j3_3, 'Job CRUD with blocked-by validation',            jordanId, 8,  8, 0, 'High',   'Done', '', null, -42, -33, alexId, jordanId),
      t(j3_3, 'Task CRUD with effort tracking',                 samId,    8,  9, 0, 'High',   'Done', '', null, -41, -30, alexId, samId),
      t(j3_3, 'Cascading completion rule enforcement',          rileyId,  6,  7, 0, 'Medium', 'Done', '', null, -40, -28, alexId, rileyId),
      // ── J3.4 Permissions wiring ───────────────────────────────────
      t(j3_4, 'Add agile_* keys to permissions.json',          alexId,   2,  2, 0, 'High',   'Done', '', null, -33, -31, alexId, alexId),
      t(j3_4, 'Wire requirePermission to all agile routes',    rileyId,  4,  4, 0, 'High',   'Done', '', null, -32, -28, alexId, rileyId),
      // ── J4.1 Overview UI — Done ───────────────────────────────────
      t(j4_1, 'MilestoneCard component',                       samId,    6,  7, 0, 'High',   'Done', '', null, -28, -21, alexId, samId),
      t(j4_1, 'Role-aware KPI dashboard',                      samId,    8,  8, 0, 'High',   'Done', '', null, -27, -18, alexId, samId),
      t(j4_1, 'New Milestone modal + status/priority filters',  rileyId,  6,  6, 0, 'Medium', 'Done', '', null, -26, -14, alexId, rileyId),
      // ── J4.2 Sprint detail — Review ───────────────────────────────
      t(j4_2, 'Sprint header stats bar',                       samId,    4,  4, 0, 'Medium', 'Done',        '', null,   -18, -12, alexId, samId),
      t(j4_2, 'Job list with inline task expansion',           jordanId, 8, 10, 0, 'High',   'Done',        '', null,   -17,  -7, alexId, jordanId),
      t(j4_2, 'Task slide-out detail panel',                   samId,    6,  4, 2, 'High',   'In Progress', '', d(3),   -14,  -1, alexId, samId),
      t(j4_2, 'Code review: sprint UI components',             alexId,   2,  0, 2, 'Medium', 'Review',      '', d(2),    -2,  -1, alexId, samId),
      // ── J4.3 Board — blocked task ─────────────────────────────────
      t(j4_3, 'Kanban column layout by status',                rileyId,  6,  6, 0, 'High',   'Done',
        '', null, -21, -12, alexId, rileyId),
      t(j4_3, 'Drag-and-drop cards between columns',           jordanId, 8,  3, 5, 'High',   'Blocked',
        'Safari drag API is incompatible with our pointer-events approach — needs a research spike before we can continue.',
        d(5), -20, -3, alexId, jordanId),
      t(j4_3, 'Board filter toolbar',                          samId,    4,  0, 4, 'Low',    'Backlog',
        '', null, -18, -18, alexId, null),
      // ── J4.4 Timeline — Backlog ───────────────────────────────────
      t(j4_4, 'SVG Gantt chart with milestone/sprint lanes',   jordanId, 12, 0, 12, 'High',   'Backlog', '', null, -14, -14, alexId, null),
      t(j4_4, 'Date range zoom controls',                      rileyId,   6, 0,  6, 'Medium', 'Backlog', '', null, -14, -14, alexId, null),
      t(j4_4, 'Today marker and drag-resize spans',            samId,     8, 0,  8, 'Low',    'Backlog', '', null, -14, -14, alexId, null),
      // ── J4.5 Bug: nav active state — Done ────────────────────────
      t(j4_5, 'Fix Overview tab active state for child routes', rileyId, 1, 1, 0, 'Low', 'Done', '', null, -5, -4, rileyId, rileyId),
      // ── J5.1 E2E tests — Backlog ──────────────────────────────────
      t(j5_1, 'Playwright project setup',                      null, 4, 0, 4, 'Medium', 'Backlog', '', null, -10, -10, alexId, null),
      t(j5_1, 'Auth flow E2E tests',                           null, 6, 0, 6, 'Medium', 'Backlog', '', null, -10, -10, alexId, null),
      t(j5_1, 'Agile CRUD happy-path E2E tests',               null, 8, 0, 8, 'Medium', 'Backlog', '', null, -10, -10, alexId, null),
      // ── J5.2 Performance — Backlog ────────────────────────────────
      t(j5_2, 'MongoDB aggregation explain-plan review',       null, 4, 0, 4, 'Medium', 'Backlog', '', null, -10, -10, alexId, null),
      t(j5_2, 'Frontend bundle size audit',                    null, 3, 0, 3, 'Low',    'Backlog', '', null, -10, -10, alexId, null),
      // ── J5.3 Docs — Backlog ───────────────────────────────────────
      t(j5_3, 'API endpoint reference documentation',          null, 4, 0, 4, 'Low',    'Backlog', '', null,  -7,  -7, alexId, null),
      t(j5_3, 'Docker deployment guide',                       null, 3, 0, 3, 'Low',    'Backlog', '', null,  -7,  -7, alexId, null),
      // ── J6.1 Velocity dashboard — Backlog ─────────────────────────
      t(j6_1, 'Sprint velocity SVG chart component',           null, 8, 0, 8, 'High', 'Backlog', '', null, -2, -2, alexId, null),
      t(j6_1, 'Historical sprint data aggregation endpoint',   null, 6, 0, 6, 'High', 'Backlog', '', null, -2, -2, alexId, null),
      // ── J6.2 Burndown — Backlog ───────────────────────────────────
      t(j6_2, 'Burndown SVG with ideal vs actual lines',       null, 8, 0, 8, 'High',   'Backlog', '', null, -2, -2, alexId, null),
      t(j6_2, 'Lightweight polling hook for live updates',     null, 4, 0, 4, 'Medium', 'Backlog', '', null, -2, -2, alexId, null),
    ]);
  });
});
