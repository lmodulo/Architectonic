// Demo data — Agile: milestones, sprints, jobs, tasks, comments, time entries.
// Ported from projects/lmodulo's seed. Loaded only when SEED_DEMO_DATA=true (see $lib/demo.ts in the API);
// every block inserts only into empty collections. Cross-module links are name lookups that
// no-op when the other module isn't installed. File prefix sets the run order (CRM first).
import { ObjectId } from 'mongodb';
import type { DemoContext } from '../lib/demo.js';

export default async function seed({ db, now }: DemoContext): Promise<void> {
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

  // lmodulo's Backend/Frontend teams map to the scaffold's Engineering/Product teams
  const backendTeamId  = (await db.collection('teams').findOne({ name: 'Engineering' }))?._id ?? null;
  const frontendTeamId = (await db.collection('teams').findOne({ name: 'Product' }))?._id ?? null;

  const milestones = db.collection('agile_milestones');
  if (!await milestones.countDocuments()) {

  // ── Milestone IDs ─────────────────────────────────────────────────
  const m1Id = new ObjectId(); // v1.0 Core Platform   — Completed
  const m2Id = new ObjectId(); // v1.1 Agile   — Active
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
      title: 'v1.1 – Agile',
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
      teamId: backendTeamId,
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
      teamId: backendTeamId,
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
      teamId: backendTeamId,
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
      teamId: frontendTeamId,
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
      teamId: frontendTeamId,
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
      teamId: backendTeamId,
      startDate: d(28), endDate: d(56),
      calendarEventIds: [],
      createdBy: alexId, updatedBy: null,
      createdAt: d(-3), updatedAt: d(-3),
    },
  ]);

  // ── Job IDs ───────────────────────────────────────────────────────
  const j1_1 = new ObjectId(); // Auth system
  const j1_2 = new ObjectId(); // MongoDB setup
  const j1_3 = new ObjectId(); // Fastify scaffold
  const j2_1 = new ObjectId(); // User management
  const j2_2 = new ObjectId(); // Role-based permissions
  const j2_3 = new ObjectId(); // Settings module
  const j2_4 = new ObjectId(); // Bug: session expiry
  const j3_1 = new ObjectId(); // Milestone CRUD API
  const j3_2 = new ObjectId(); // Sprint CRUD API
  const j3_3 = new ObjectId(); // Jobs & Tasks API
  const j3_4 = new ObjectId(); // Permissions wiring
  const j4_1 = new ObjectId(); // Overview UI        — Done
  const j4_2 = new ObjectId(); // Sprint detail page  — Review
  const j4_3 = new ObjectId(); // Board / Kanban      — In Progress (blocked)
  const j4_4 = new ObjectId(); // Timeline / Gantt    — Backlog
  const j4_5 = new ObjectId(); // Bug: nav active     — Done
  const j5_1 = new ObjectId(); // E2E tests
  const j5_2 = new ObjectId(); // Performance audit
  const j5_3 = new ObjectId(); // Release docs
  const j5_4 = new ObjectId(); // Demo env: TechFusion pilot
  const j6_1 = new ObjectId(); // Velocity dashboard
  const j6_2 = new ObjectId(); // Burndown charts

  const jobs = db.collection('agile_jobs');
  await jobs.insertMany([
    // ── Sprint 1 — Foundation ─────────────────────────────────────
    {
      _id: j1_1, jobNumber: 1, sprintId: s1Id, teamId: backendTeamId,
      title: 'Auth system',
      description: 'Session-cookie auth: login, logout, /me endpoint, and bcrypt password hashing.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-98), endDate: d(-91),
      calendarEventIds: [], createdBy: alexId, updatedBy: alexId,
      createdAt: d(-100), updatedAt: d(-91),
    },
    {
      _id: j1_2, jobNumber: 2, sprintId: s1Id, teamId: backendTeamId,
      title: 'MongoDB setup & base indexes',
      description: 'Docker volume, Fastify MongoDB plugin, and base collection indexes.',
      category: 'Tech Debt', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-98), endDate: d(-88),
      calendarEventIds: [], createdBy: alexId, updatedBy: rileyId,
      createdAt: d(-100), updatedAt: d(-88),
    },
    {
      _id: j1_3, jobNumber: 3, sprintId: s1Id, teamId: backendTeamId,
      title: 'Fastify API scaffold',
      description: 'Plugin registration pattern, route file convention, health check, and error handling.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j1_2],
      startDate: d(-90), endDate: d(-84),
      calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
      createdAt: d(-91), updatedAt: d(-84),
    },
    // ── Sprint 2 — Core Features ──────────────────────────────────
    {
      _id: j2_1, jobNumber: 4, sprintId: s2Id, teamId: backendTeamId,
      title: 'User management CRUD',
      description: 'Paginated user list, create/edit/delete endpoints, and Manage Users frontend page.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-84), endDate: d(-70),
      calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
      createdAt: d(-85), updatedAt: d(-70),
    },
    {
      _id: j2_2, jobNumber: 5, sprintId: s2Id, teamId: backendTeamId,
      title: 'Role-based permissions',
      description: 'Permissions data model, requirePermission Fastify preHandler, and Roles management UI.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j2_1],
      startDate: d(-80), endDate: d(-63),
      calendarEventIds: [], createdBy: alexId, updatedBy: samId,
      createdAt: d(-81), updatedAt: d(-63),
    },
    {
      _id: j2_3, jobNumber: 6, sprintId: s2Id, teamId: backendTeamId,
      title: 'Settings module',
      description: 'Settings CRUD API with upsert and admin settings page with live preview.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-75), endDate: d(-63),
      calendarEventIds: [], createdBy: alexId, updatedBy: rileyId,
      createdAt: d(-76), updatedAt: d(-63),
    },
    {
      _id: j2_4, jobNumber: 7, sprintId: s2Id, teamId: backendTeamId,
      title: 'Fix: session token expiry race condition',
      description: 'Users occasionally logged out immediately after login on slow connections.',
      category: 'Bug', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-65), endDate: d(-63),
      calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
      createdAt: d(-66), updatedAt: d(-63),
    },
    // ── Sprint 3 — Data Layer ─────────────────────────────────────
    {
      _id: j3_1, jobNumber: 8, sprintId: s3Id, teamId: backendTeamId,
      title: 'Milestone CRUD API',
      description: 'Schema validation, aggregation pipeline for rollup fields (completionPct, sprintCount), CRUD routes.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-49), endDate: d(-38),
      calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
      createdAt: d(-50), updatedAt: d(-38),
    },
    {
      _id: j3_2, jobNumber: 9, sprintId: s3Id, teamId: backendTeamId,
      title: 'Sprint CRUD API',
      description: 'sprintNumber auto-counter per milestone, capacity tracking, and date-range constraints.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j3_1],
      startDate: d(-45), endDate: d(-35),
      calendarEventIds: [], createdBy: alexId, updatedBy: samId,
      createdAt: d(-46), updatedAt: d(-35),
    },
    {
      _id: j3_3, jobNumber: 10, sprintId: s3Id, teamId: backendTeamId,
      title: 'Jobs & Tasks API',
      description: 'Job dependency graph, task effort tracking, cascading completion rules, blocked-by validation.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [j3_2],
      startDate: d(-42), endDate: d(-28),
      calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
      createdAt: d(-43), updatedAt: d(-28),
    },
    {
      _id: j3_4, jobNumber: 11, sprintId: s3Id, teamId: backendTeamId,
      title: 'Permissions: agile resources',
      description: 'Add agile_* resource keys to permissions.json and wire requirePermission to all agile routes.',
      category: 'Tech Debt', status: 'Done', blocked: false, dependencyIds: [j3_3],
      startDate: d(-32), endDate: d(-28),
      calendarEventIds: [], createdBy: alexId, updatedBy: rileyId,
      createdAt: d(-33), updatedAt: d(-28),
    },
    // ── Sprint 4 — UI Layer ───────────────────────────────────────
    {
      _id: j4_1, jobNumber: 12, sprintId: s4Id, teamId: frontendTeamId,
      title: 'Overview & Milestones UI',
      description: 'MilestoneCard component, role-aware KPI dashboard, New Milestone modal, and status/priority filters.',
      category: 'Feature', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-28), endDate: d(-14),
      calendarEventIds: [], createdBy: alexId, updatedBy: samId,
      createdAt: d(-29), updatedAt: d(-14),
    },
    {
      _id: j4_2, jobNumber: 13, sprintId: s4Id, teamId: frontendTeamId,
      title: 'Sprint detail page',
      description: 'Sprint header with stats, job list with inline task expansion, and task slide-out detail panel.',
      category: 'Feature', status: 'Review', blocked: false, dependencyIds: [j4_1],
      startDate: d(-18), endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: samId,
      createdAt: d(-19), updatedAt: d(-2),
    },
    {
      _id: j4_3, jobNumber: 14, sprintId: s4Id, teamId: frontendTeamId,
      title: 'Board view (Kanban)',
      description: 'Kanban columns per task status with drag-and-drop between columns and filter toolbar.',
      category: 'Feature', status: 'In Progress', blocked: true, dependencyIds: [j4_1],
      startDate: d(-20), endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: jordanId,
      createdAt: d(-21), updatedAt: d(-3),
    },
    {
      _id: j4_4, jobNumber: 15, sprintId: s4Id, teamId: frontendTeamId,
      title: 'Timeline view (Gantt)',
      description: 'SVG Gantt chart showing milestone/sprint/job lanes with date zoom and today marker.',
      category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [j4_1],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: null,
      createdAt: d(-14), updatedAt: d(-14),
    },
    {
      _id: j4_5, jobNumber: 16, sprintId: s4Id, teamId: frontendTeamId,
      title: 'Fix: agile tab active state for child routes',
      description: 'Overview tab was not highlighting when navigating to /agile/milestones or /agile/sprints.',
      category: 'Bug', status: 'Done', blocked: false, dependencyIds: [],
      startDate: d(-5), endDate: d(-4),
      calendarEventIds: [], createdBy: rileyId, updatedBy: rileyId,
      createdAt: d(-5), updatedAt: d(-4),
    },
    // ── Sprint 5 — Polish & Release ───────────────────────────────
    {
      _id: j5_1, jobNumber: 17, sprintId: s5Id, teamId: frontendTeamId,
      title: 'E2E test coverage',
      description: 'Playwright setup, auth flow tests, and agile CRUD happy-path tests.',
      category: 'Research', status: 'Backlog', blocked: false, dependencyIds: [],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: null,
      createdAt: d(-10), updatedAt: d(-10),
    },
    {
      _id: j5_2, jobNumber: 18, sprintId: s5Id, teamId: backendTeamId,
      title: 'Performance audit',
      description: 'MongoDB explain-plan review for aggregation queries and frontend bundle size reduction.',
      category: 'Tech Debt', status: 'Backlog', blocked: false, dependencyIds: [],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: null,
      createdAt: d(-10), updatedAt: d(-10),
    },
    {
      _id: j5_3, jobNumber: 19, sprintId: s5Id, teamId: frontendTeamId,
      title: 'Release documentation',
      description: 'API endpoint reference and Docker deployment guide for the v1.1 release.',
      category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: null,
      createdAt: d(-7), updatedAt: d(-7),
    },
    {
      _id: j5_4, jobNumber: 20, sprintId: s5Id, teamId: frontendTeamId,
      title: 'Set up TechFusion pilot environment',
      description: 'Configure a clean demo instance with representative data for the v1.1 prospect walkthrough. Coordinate with sales on which views to highlight.',
      category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: joeId, updatedBy: null,
      createdAt: d(-3), updatedAt: d(-3),
    },
    // ── Sprint 6 — Analytics Foundation ──────────────────────────
    {
      _id: j6_1, jobNumber: 21, sprintId: s6Id, teamId: backendTeamId,
      title: 'Velocity dashboard',
      description: 'Per-sprint velocity SVG chart using historical sprint actual hours.',
      category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: null,
      createdAt: d(-2), updatedAt: d(-2),
    },
    {
      _id: j6_2, jobNumber: 22, sprintId: s6Id, teamId: backendTeamId,
      title: 'Burndown charts',
      description: 'Sprint burndown SVG with ideal vs actual lines and lightweight polling.',
      category: 'Feature', status: 'Backlog', blocked: false, dependencyIds: [],
      startDate: null, endDate: null,
      calendarEventIds: [], createdBy: alexId, updatedBy: null,
      createdAt: d(-2), updatedAt: d(-2),
    },
  ]);

  // Seed job counter to the highest seeded jobNumber
  await db.collection('agile_counters').updateOne(
    { type: 'job' },
    { $max: { seq: 22 } },
    { upsert: true }
  );

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
    // ── J5.4 TechFusion demo env — Backlog ────────────────────────
    t(j5_4, 'Seed demo data for TechFusion walkthrough',      samId, 3, 0, 3, 'High',   'Backlog', '', d(14), -3, -3, joeId, null),
    t(j5_4, 'Smoke-test all agile and CRM views in demo env', null,  2, 0, 2, 'Medium', 'Backlog', '', d(16), -3, -3, joeId, null),
    // ── J6.1 Velocity dashboard — Backlog ─────────────────────────
    t(j6_1, 'Sprint velocity SVG chart component',           null, 8, 0, 8, 'High', 'Backlog', '', null, -2, -2, alexId, null),
    t(j6_1, 'Historical sprint data aggregation endpoint',   null, 6, 0, 6, 'High', 'Backlog', '', null, -2, -2, alexId, null),
    // ── J6.2 Burndown — Backlog ───────────────────────────────────
    t(j6_2, 'Burndown SVG with ideal vs actual lines',       null, 8, 0, 8, 'High',   'Backlog', '', null, -2, -2, alexId, null),
    t(j6_2, 'Lightweight polling hook for live updates',     null, 4, 0, 4, 'Medium', 'Backlog', '', null, -2, -2, alexId, null),
  ]);

  // ── Comments ──────────────────────────────────────────────────────
  const comments = db.collection('agile_comments');
  await comments.insertMany([
    // j1_1 — Auth system: bcrypt decision
    { jobId: j1_1, text: 'We benchmarked bcrypt vs Argon2. Went with bcryptjs — better Node compatibility on ARM/x86 without native bindings, and the 12-round target (~100ms on prod hardware) gives a meaningful brute-force floor.', createdBy: alexId,   updatedBy: null, createdAt: d(-98), updatedAt: d(-98) },
    { jobId: j1_1, text: 'Confirmed — tested on the Raspberry Pi dev board too. No native compilation issues.', createdBy: jordanId, updatedBy: null, createdAt: d(-97), updatedAt: d(-97) },

    // j2_2 — RBAC: design decision thread
    { jobId: j2_2, text: 'Considered storing permissions inline on each user document vs on the role document. Went with inline on the role — avoids a join on every /auth/me call and keeps the read path simple.', createdBy: alexId,  updatedBy: null, createdAt: d(-80), updatedAt: d(-80) },
    { jobId: j2_2, text: 'The permissions.json approach makes adding new resources trivial — just add the key, update the role docs via upsert. No DB migration needed.', createdBy: rileyId, updatedBy: null, createdAt: d(-79), updatedAt: d(-79) },
    { jobId: j2_2, text: 'Worth noting: the per-action boolean map (read/create/update/delete) is flexible enough to support partial admin roles without schema changes.', createdBy: samId,   updatedBy: null, createdAt: d(-78), updatedAt: d(-78) },

    // j2_4 — Bug fix: session race
    { jobId: j2_4, text: 'Root cause: Fastify was serialising the session object before the Set-Cookie header was flushed under high concurrency. Fixed by awaiting session.save() explicitly before reply.send().', createdBy: jordanId, updatedBy: null, createdAt: d(-64), updatedAt: d(-64) },
    { jobId: j2_4, text: 'Good catch. Adding this to the known-issues doc so future contributors understand why we have the explicit await — it looks redundant at first glance.', createdBy: alexId, updatedBy: null, createdAt: d(-63), updatedAt: d(-63) },

    // j3_3 — Jobs & Tasks: cascading complexity
    { jobId: j3_3, text: 'Cascading completion enforcement was more involved than estimated — jobs with mixed-status tasks need a separate aggregation pass to compute the correct rollup.', createdBy: rileyId, updatedBy: null, createdAt: d(-32), updatedAt: d(-32) },
    { jobId: j3_3, text: 'Makes sense — let\'s document the aggregation pipeline in the route file so it\'s clear to contributors why the extra pass exists.', createdBy: alexId, updatedBy: null, createdAt: d(-31), updatedAt: d(-31) },

    // j4_1 — Overview UI: completion
    { jobId: j4_1, text: 'KPI dashboard is looking great — the role-aware card visibility works cleanly. Nice to see the permission check at the component level rather than the route level.', createdBy: alexId, updatedBy: null, createdAt: d(-15), updatedAt: d(-15) },
    { jobId: j4_1, text: 'Thanks — I used hasPermission() directly in the template rather than guarding the whole page. Keeps the UX smooth for viewers who still need to see the read-only state.', createdBy: samId, updatedBy: null, createdAt: d(-14), updatedAt: d(-14) },

    // j4_2 — Sprint detail: slide-out feedback
    { jobId: j4_2, text: 'Slide-out panel looks great. One thing: it doesn\'t close when you click outside — should we add that before we send it to review?', createdBy: rileyId, updatedBy: null, createdAt: d(-7), updatedAt: d(-7) },
    { jobId: j4_2, text: 'Good catch — adding a backdrop click handler now. Should be in the PR within the hour.', createdBy: samId, updatedBy: null, createdAt: d(-6), updatedAt: d(-6) },

    // j4_3 — Kanban: blocked drag-and-drop thread
    { jobId: j4_3, text: 'The HTML5 drag API is really flaky on Safari — pointer events approach looks cleaner but we need to prototype it first.', createdBy: jordanId, updatedBy: null, createdAt: d(-20), updatedAt: d(-20) },
    { jobId: j4_3, text: 'Agreed. I found a minimal pointer-events demo that works across all browsers. Will share the spike in the next standup.', createdBy: samId,    updatedBy: null, createdAt: d(-18), updatedAt: d(-18) },
    { jobId: j4_3, text: 'What\'s the realistic ETA for unblocking this? Want to make sure we\'re not slipping the Sprint 5 demo scope.', createdBy: joeId,    updatedBy: null, createdAt: d(-5),  updatedAt: d(-5)  },
    { jobId: j4_3, text: 'Spike results in — pointer-events polyfill works cleanly. Estimate 3 days to implement once Sprint 5 starts. Kanban will be fully unblocked.', createdBy: jordanId, updatedBy: null, createdAt: d(-3), updatedAt: d(-3) },
    { jobId: j4_3, text: 'Unblocking this is a priority for Sprint 5 — cap the remaining work at 5 points and slot it into the first week.', createdBy: alexId, updatedBy: null, createdAt: d(-2), updatedAt: d(-2) },

    // j4_4 — Timeline: scope discussion
    { jobId: j4_4, text: 'Before we start, should we scope this as a full Gantt (with per-job dependency arrows) or just horizontal swim-lane bars per milestone/sprint? Arrows would add significant SVG complexity.', createdBy: alexId,   updatedBy: null, createdAt: d(-14), updatedAt: d(-14) },
    { jobId: j4_4, text: 'Lane-only for v1.1, dependency arrows in v2.0. The SVG math for curved bezier arrows across swim lanes isn\'t trivial and we\'re already tight on capacity.', createdBy: jordanId, updatedBy: null, createdAt: d(-13), updatedAt: d(-13) },
    { jobId: j4_4, text: 'Agreed. Locking scope to milestone/sprint lanes with a today-marker and basic zoom. Job-level detail can be a drill-down in v2.0.', createdBy: alexId,   updatedBy: null, createdAt: d(-13), updatedAt: d(-13) },

    // j5_1 — E2E: framework choice
    { jobId: j5_1, text: 'Recommending Playwright over Cypress: native SvelteKit dev server integration, multi-browser support out of the box, and better network interception for our API proxy routes.', createdBy: jordanId, updatedBy: null, createdAt: d(-10), updatedAt: d(-10) },
    { jobId: j5_1, text: '+1 on Playwright. We can parallelise the auth and agile test suites from the start without additional config.', createdBy: rileyId, updatedBy: null, createdAt: d(-9), updatedAt: d(-9) },

    // j6_1 — Velocity: requirements from Joe
    { jobId: j6_1, text: 'For the velocity chart, I need to see per-sprint actual vs estimated hours side by side — not just task count. That\'s what the stakeholders will ask about in the Q2 review.', createdBy: joeId,  updatedBy: null, createdAt: d(-2), updatedAt: d(-2) },
    { jobId: j6_1, text: 'Noted — the sprint aggregation endpoint already tracks estimateHours and actualHours at the task level. We\'ll roll those up per sprint for the chart data.', createdBy: alexId, updatedBy: null, createdAt: d(-1), updatedAt: d(-1) },
  ]);

  // ── Time entries ─────────────────────────────────────────────────
  const timeEntries = db.collection('time_entries');
  if (!await timeEntries.countDocuments()) {
    const taskDocs = await tasks.find({
      title: {
        $in: [
          'Sprint schema & sprintNumber auto-counter',
          'Sprint CRUD with capacity tracking',
          'Sprint–milestone date constraint enforcement',
          'Job schema with dependency graph support',
          'Job CRUD with blocked-by validation',
          'Task CRUD with effort tracking',
          'Cascading completion rule enforcement',
          'Add agile_* keys to permissions.json',
          'Wire requirePermission to all agile routes',
          'MilestoneCard component',
          'Role-aware KPI dashboard',
          'New Milestone modal + status/priority filters',
          'Sprint header stats bar',
          'Job list with inline task expansion',
          'Task slide-out detail panel',
          'Code review: sprint UI components',
          'Kanban column layout by status',
          'Drag-and-drop cards between columns',
          'Fix Overview tab active state for child routes',
        ],
      },
    }).toArray();
    const tid = (title: string) => taskDocs.find(tk => tk.title === title)!._id;
    const te = (
      userId: ObjectId,
      taskId: ObjectId,
      jobId: ObjectId,
      sprintId: ObjectId,
      milestoneId: ObjectId,
      date: string,
      durationMinutes: number,
      billable = true,
      note = '',
    ) => ({
      userId, taskId, jobId, sprintId, milestoneId,
      date, durationMinutes, billable, note,
      timerRunning: false,
      timerStartedAt: null,
      createdAt: new Date(`${date}T09:00:00.000Z`),
      updatedAt: new Date(`${date}T09:00:00.000Z`),
    });

    await timeEntries.insertMany([
      // ── Sprint 3 — last 2 weeks (d-42 → d-28) ────────────────────
      // alex: Job schema (j3_3) → Permissions keys (j3_4)
      te(alexId, tid('Job schema with dependency graph support'), j3_3, s3Id, m2Id, ds(-42), 180),
      te(alexId, tid('Job schema with dependency graph support'), j3_3, s3Id, m2Id, ds(-41), 120),
      te(alexId, tid('Job schema with dependency graph support'), j3_3, s3Id, m2Id, ds(-40), 180),
      te(alexId, tid('Job schema with dependency graph support'), j3_3, s3Id, m2Id, ds(-39), 120),
      te(alexId, tid('Add agile_* keys to permissions.json'),    j3_4, s3Id, m2Id, ds(-33),  60),
      te(alexId, tid('Add agile_* keys to permissions.json'),    j3_4, s3Id, m2Id, ds(-32),  60),

      // jordan: Sprint CRUD (j3_2) → Job CRUD (j3_3)
      te(jordanId, tid('Sprint CRUD with capacity tracking'),  j3_2, s3Id, m2Id, ds(-42), 180),
      te(jordanId, tid('Sprint CRUD with capacity tracking'),  j3_2, s3Id, m2Id, ds(-40), 180),
      te(jordanId, tid('Job CRUD with blocked-by validation'), j3_3, s3Id, m2Id, ds(-41), 180),
      te(jordanId, tid('Job CRUD with blocked-by validation'), j3_3, s3Id, m2Id, ds(-39), 120),
      te(jordanId, tid('Job CRUD with blocked-by validation'), j3_3, s3Id, m2Id, ds(-38), 180),
      te(jordanId, tid('Job CRUD with blocked-by validation'), j3_3, s3Id, m2Id, ds(-36), 180),
      te(jordanId, tid('Job CRUD with blocked-by validation'), j3_3, s3Id, m2Id, ds(-34), 180),
      te(jordanId, tid('Job CRUD with blocked-by validation'), j3_3, s3Id, m2Id, ds(-33), 120),

      // sam: Sprint constraints (j3_2) → Task CRUD (j3_3)
      te(samId, tid('Sprint–milestone date constraint enforcement'), j3_2, s3Id, m2Id, ds(-42), 120),
      te(samId, tid('Sprint–milestone date constraint enforcement'), j3_2, s3Id, m2Id, ds(-40), 120),
      te(samId, tid('Task CRUD with effort tracking'), j3_3, s3Id, m2Id, ds(-41), 120),
      te(samId, tid('Task CRUD with effort tracking'), j3_3, s3Id, m2Id, ds(-39), 180),
      te(samId, tid('Task CRUD with effort tracking'), j3_3, s3Id, m2Id, ds(-37), 180),
      te(samId, tid('Task CRUD with effort tracking'), j3_3, s3Id, m2Id, ds(-35), 120),
      te(samId, tid('Task CRUD with effort tracking'), j3_3, s3Id, m2Id, ds(-32), 180),
      te(samId, tid('Task CRUD with effort tracking'), j3_3, s3Id, m2Id, ds(-30), 120),

      // riley: Sprint schema (j3_2) → Cascading rules (j3_3) → Permissions wiring (j3_4)
      te(rileyId, tid('Sprint schema & sprintNumber auto-counter'),  j3_2, s3Id, m2Id, ds(-42), 120),
      te(rileyId, tid('Sprint schema & sprintNumber auto-counter'),  j3_2, s3Id, m2Id, ds(-41), 120),
      te(rileyId, tid('Cascading completion rule enforcement'),      j3_3, s3Id, m2Id, ds(-40),  60),
      te(rileyId, tid('Cascading completion rule enforcement'),      j3_3, s3Id, m2Id, ds(-38), 180),
      te(rileyId, tid('Cascading completion rule enforcement'),      j3_3, s3Id, m2Id, ds(-36), 180),
      te(rileyId, tid('Cascading completion rule enforcement'),      j3_3, s3Id, m2Id, ds(-34), 180),
      te(rileyId, tid('Cascading completion rule enforcement'),      j3_3, s3Id, m2Id, ds(-31), 180),
      te(rileyId, tid('Wire requirePermission to all agile routes'), j3_4, s3Id, m2Id, ds(-32), 120),
      te(rileyId, tid('Wire requirePermission to all agile routes'), j3_4, s3Id, m2Id, ds(-30), 120),
      te(rileyId, tid('Wire requirePermission to all agile routes'), j3_4, s3Id, m2Id, ds(-29), 120),
      te(rileyId, tid('Wire requirePermission to all agile routes'), j3_4, s3Id, m2Id, ds(-28), 120),

      // ── Sprint 4 — full sprint (d-28 → d-1) ──────────────────────
      // sam: MilestoneCard (j4_1) → KPI dashboard (j4_1) → Sprint header (j4_2) → Slide-out (j4_2)
      te(samId, tid('MilestoneCard component'),        j4_1, s4Id, m2Id, ds(-28), 180),
      te(samId, tid('MilestoneCard component'),        j4_1, s4Id, m2Id, ds(-27), 180),
      te(samId, tid('MilestoneCard component'),        j4_1, s4Id, m2Id, ds(-26), 120),
      te(samId, tid('Role-aware KPI dashboard'),       j4_1, s4Id, m2Id, ds(-25), 180),
      te(samId, tid('Role-aware KPI dashboard'),       j4_1, s4Id, m2Id, ds(-24), 180),
      te(samId, tid('Role-aware KPI dashboard'),       j4_1, s4Id, m2Id, ds(-22), 180),
      te(samId, tid('Role-aware KPI dashboard'),       j4_1, s4Id, m2Id, ds(-21), 180),
      te(samId, tid('Sprint header stats bar'),        j4_2, s4Id, m2Id, ds(-18), 180),
      te(samId, tid('Sprint header stats bar'),        j4_2, s4Id, m2Id, ds(-17),  60),
      te(samId, tid('Task slide-out detail panel'),    j4_2, s4Id, m2Id, ds(-14), 180),
      te(samId, tid('Task slide-out detail panel'),    j4_2, s4Id, m2Id, ds(-13), 120),
      te(samId, tid('Task slide-out detail panel'),    j4_2, s4Id, m2Id, ds(-11), 120),
      te(samId, tid('Task slide-out detail panel'),    j4_2, s4Id, m2Id, ds(-10),  60),
      te(samId, tid('Task slide-out detail panel'),    j4_2, s4Id, m2Id, ds( -8),  60),

      // riley: New Milestone modal (j4_1) → Kanban columns (j4_3) → Nav bug (j4_5)
      te(rileyId, tid('New Milestone modal + status/priority filters'), j4_1, s4Id, m2Id, ds(-26), 180),
      te(rileyId, tid('New Milestone modal + status/priority filters'), j4_1, s4Id, m2Id, ds(-25), 180),
      te(rileyId, tid('New Milestone modal + status/priority filters'), j4_1, s4Id, m2Id, ds(-24), 180),
      te(rileyId, tid('New Milestone modal + status/priority filters'), j4_1, s4Id, m2Id, ds(-22),  60),
      te(rileyId, tid('New Milestone modal + status/priority filters'), j4_1, s4Id, m2Id, ds(-21), 120),
      te(rileyId, tid('New Milestone modal + status/priority filters'), j4_1, s4Id, m2Id, ds(-20),  60),
      te(rileyId, tid('Kanban column layout by status'),                j4_3, s4Id, m2Id, ds(-21), 180),
      te(rileyId, tid('Kanban column layout by status'),                j4_3, s4Id, m2Id, ds(-20), 180),
      te(rileyId, tid('Kanban column layout by status'),                j4_3, s4Id, m2Id, ds(-19), 180),
      te(rileyId, tid('Kanban column layout by status'),                j4_3, s4Id, m2Id, ds(-17), 120),
      te(rileyId, tid('Kanban column layout by status'),                j4_3, s4Id, m2Id, ds(-16), 120),
      te(rileyId, tid('Kanban column layout by status'),                j4_3, s4Id, m2Id, ds(-15),  60),
      te(rileyId, tid('Fix Overview tab active state for child routes'), j4_5, s4Id, m2Id, ds(-5), 60),

      // jordan: Job list (j4_2) → Drag-and-drop spike (j4_3)
      te(jordanId, tid('Job list with inline task expansion'),   j4_2, s4Id, m2Id, ds(-17), 180),
      te(jordanId, tid('Job list with inline task expansion'),   j4_2, s4Id, m2Id, ds(-16), 180),
      te(jordanId, tid('Job list with inline task expansion'),   j4_2, s4Id, m2Id, ds(-15), 180),
      te(jordanId, tid('Job list with inline task expansion'),   j4_2, s4Id, m2Id, ds(-14), 180),
      te(jordanId, tid('Job list with inline task expansion'),   j4_2, s4Id, m2Id, ds(-13), 180),
      te(jordanId, tid('Drag-and-drop cards between columns'),   j4_3, s4Id, m2Id, ds(-20), 180),
      te(jordanId, tid('Drag-and-drop cards between columns'),   j4_3, s4Id, m2Id, ds(-19), 180),
      te(jordanId, tid('Drag-and-drop cards between columns'),   j4_3, s4Id, m2Id, ds(-18), 180),
      te(jordanId, tid('Drag-and-drop cards between columns'),   j4_3, s4Id, m2Id, ds(-17), 180, true, 'Switching to pointer-events — Safari HTML5 drag API incompatible'),

      // alex: Code review (j4_2)
      te(alexId, tid('Code review: sprint UI components'), j4_2, s4Id, m2Id, ds(-2), 60),
      te(alexId, tid('Code review: sprint UI components'), j4_2, s4Id, m2Id, ds(-1), 60),
    ]);
  }

  } // end agile snapshot

  // ── Link milestones to CRM clients ───────────────────────────────
  // Idempotent: updateOne only writes when both sides exist; safe to run every boot.
  const [coVertexSeed, coTechSeed] = await Promise.all([
    db.collection('crm_companies').findOne({ name: 'Vertex Systems' }),
    db.collection('crm_companies').findOne({ name: 'TechFusion Inc' }),
  ]);
  if (coVertexSeed) {
    await db.collection('agile_milestones').updateOne(
      { title: 'v1.0 – Core Platform', clientId: { $exists: false } },
      { $set: { clientId: coVertexSeed._id } }
    );
  }
  if (coTechSeed) {
    await db.collection('agile_milestones').updateOne(
      { title: 'v1.1 – Agile', clientId: { $exists: false } },
      { $set: { clientId: coTechSeed._id } }
    );
  }
}
