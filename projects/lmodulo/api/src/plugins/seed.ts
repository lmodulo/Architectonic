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
    value: 'ARCHITECTONIC',
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

interface SeedUser {
  username:  string;
  email:     string;
  password:  string;
  firstName: string;
  lastName:  string;
  role:      string;
}

const SEED_USERS: SeedUser[] = [
  // Dev users
  { username: 'jnicora', email: 'joenicora@me.com',   password: 'j-password',     firstName: 'Joe',    lastName: 'Nicora', role: 'owner'       },
  { username: 'knicora', email: 'kylenicora@me.com',  password: 'k-password',     firstName: 'Kyle',   lastName: 'Nicora', role: 'admin'       },
  // Demo team
  { username: 'owner',   email: 'owner@lmodulo.com',  password: 'owner-password', firstName: 'Owner',  lastName: '',       role: 'owner'       },
  { username: 'admin',   email: 'admin@lmodulo.com',  password: 'admin-password', firstName: 'Admin',  lastName: '',       role: 'admin'       },
  { username: 'alex',    email: 'alex@lmodulo.com',   password: 'alex-password',  firstName: 'Alex',   lastName: 'Chen',   role: 'lead'        },
  { username: 'jordan',  email: 'jordan@lmodulo.com', password: 'jordan-password',firstName: 'Jordan', lastName: 'Rivera', role: 'contributor' },
  { username: 'sam',     email: 'sam@lmodulo.com',    password: 'sam-password',   firstName: 'Sam',    lastName: 'Park',   role: 'contributor' },
  { username: 'riley',   email: 'riley@lmodulo.com',  password: 'riley-password', firstName: 'Riley',  lastName: 'Morgan', role: 'contributor' },
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
    for (const u of SEED_USERS) {
      const existing = await users.findOne({ username: u.username });
      if (!existing) {
        const passwordHash = await bcrypt.hash(u.password, 12);
        await users.insertOne({
          username:    u.username,
          email:       u.email,
          passwordHash,
          firstName:   u.firstName,
          lastName:    u.lastName,
          role:        u.role,
          avatarUrl:   '',
          avatarColor: '',
          createdAt:   now,
          updatedAt:   now,
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

    // ── User IDs + date helpers ───────────────────────────────────────
    const team = await users
      .find({ username: { $in: ['jnicora', 'knicora', 'alex', 'jordan', 'sam', 'riley'] } })
      .toArray();
    const uid = (name: string): ObjectId => team.find((u: any) => u.username === name)!._id;
    const joeId    = uid('jnicora');
    const kyleId   = uid('knicora');
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

    // ── Calendar events (refreshed on every startup) ──────────────────
    const calendarEvents = db.collection('calendar_events');
    await calendarEvents.deleteMany({});
    await calendarEvents.insertMany([

      // ── Historical sprint ceremonies ──────────────────────────────
      {
        title: 'Sprint 1 Planning',
        content: '<p>Kick off Sprint 1 — Foundation. Align on auth setup, MongoDB config, and API scaffold scope. Capacity: 120 pts.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-98, 9), endDate: dh(-98, 11), singleDay: true, allDay: false,
        location: 'Main Conference Room',
        tags: ['sprint', 'planning'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-100), updatedAt: d(-100),
      },
      {
        title: 'Sprint 1 Retrospective',
        content: '<p>Went well: rapid API scaffold delivery. Improve: Docker hot-reload setup consumed too much ramp time. Action: document Docker workflow in CLAUDE.md.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-85, 14), endDate: dh(-85, 16), singleDay: true, allDay: false,
        location: 'Team Meeting Room',
        tags: ['sprint', 'retrospective'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-86), updatedAt: d(-86),
      },
      {
        title: 'Sprint 2 Planning',
        content: '<p>Sprint 2 — Core Features. Goal: user management, RBAC, and settings module. Capacity: 120 pts.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-84, 9), endDate: dh(-84, 11), singleDay: true, allDay: false,
        location: 'Main Conference Room',
        tags: ['sprint', 'planning'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-85), updatedAt: d(-85),
      },
      {
        title: 'All-Hands: Q1 Engineering Review',
        content: '<p>Team walkthrough of v1.0 progress, current blockers, and Q2 roadmap preview. All team members required.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-70, 10), endDate: dh(-70, 13), singleDay: true, allDay: false,
        location: 'Boardroom',
        tags: ['all-hands', 'quarterly'],
        status: 'active', visibility: 'public',
        ownerId: joeId, sharedWith: [kyleId, alexId, jordanId, samId, rileyId],
        createdBy: joeId, updatedBy: null,
        createdAt: d(-77), updatedAt: d(-77),
      },
      {
        title: 'Sprint 2 Retrospective',
        content: '<p>Highlights: permissions system exceeded scope expectations. Improvement: two merge conflicts from parallel feature branches. Action: enforce PR review minimum before merge.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-57, 14), endDate: dh(-57, 16), singleDay: true, allDay: false,
        location: 'Team Meeting Room',
        tags: ['sprint', 'retrospective'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-58), updatedAt: d(-58),
      },
      {
        title: 'Sprint 3 Planning',
        content: '<p>Sprint 3 — Data Layer. Build all agile collection APIs: milestones, sprints, jobs, tasks. Capacity: 120 pts.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-49, 9), endDate: dh(-49, 11), singleDay: true, allDay: false,
        location: 'Main Conference Room',
        tags: ['sprint', 'planning'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-50), updatedAt: d(-50),
      },
      {
        title: '1:1 — Joe & Alex',
        content: '<p>Monthly check-in. Agenda: sprint progress update, team resourcing for v1.1, v2.0 timeline discussion.</p>',
        eventType: 'personal',
        startDate: dh(-42, 10), endDate: dh(-42, 11), singleDay: true, allDay: false,
        location: '',
        tags: ['1:1', 'management'],
        status: 'active', visibility: 'shared',
        ownerId: joeId, sharedWith: [alexId],
        createdBy: joeId, updatedBy: null,
        createdAt: d(-45), updatedAt: d(-45),
      },
      {
        title: 'Sprint 3 Retrospective',
        content: '<p>Went well: full API coverage ahead of schedule. Improve: dependency documentation hard to visualise in code review. Action: add dependency graph view to sprint board.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-29, 14), endDate: dh(-29, 16), singleDay: true, allDay: false,
        location: 'Team Meeting Room',
        tags: ['sprint', 'retrospective'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-30), updatedAt: d(-30),
      },
      {
        title: 'Sprint 4 Planning',
        content: '<p>Sprint 4 — UI Layer. Build Overview, Board (Kanban), and Timeline (Gantt) views. Capacity: 100 pts.</p>',
        eventType: 'upcoming_event',
        startDate: dh(-28, 9), endDate: dh(-28, 11), singleDay: true, allDay: false,
        location: 'Main Conference Room',
        tags: ['sprint', 'planning'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-29), updatedAt: d(-29),
      },

      // ── Time off ──────────────────────────────────────────────────
      {
        title: 'Jordan — Time Off',
        content: '<p>Out of office. Async only — slow response expected.</p>',
        eventType: 'personal',
        startDate: d(-14), endDate: d(-12), singleDay: false, allDay: true,
        location: '',
        tags: ['time-off'],
        status: 'active', visibility: 'shared',
        ownerId: jordanId, sharedWith: [alexId],
        createdBy: jordanId, updatedBy: null,
        createdAt: d(-21), updatedAt: d(-21),
      },

      // ── Daily standups — current sprint week ──────────────────────
      {
        title: 'Daily Standup',
        content: '<p>Jordan: still researching Safari pointer-events workaround. Sam: slide-out panel 80% done. Riley: no blockers, reviewing PRs.</p>',
        eventType: 'standup',
        startDate: dh(-4, 9), endDate: dh(-4, 9), singleDay: true, allDay: false,
        location: 'Standup Channel',
        tags: ['standup', 'daily'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-4), updatedAt: d(-4),
      },
      {
        title: 'Daily Standup',
        content: '<p>Jordan: pointer-events spike complete, writing up findings. Sam: slide-out panel PR opened for review. Riley: reviewing Jordan\'s spike doc.</p>',
        eventType: 'standup',
        startDate: dh(-3, 9), endDate: dh(-3, 9), singleDay: true, allDay: false,
        location: 'Standup Channel',
        tags: ['standup', 'daily'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
      {
        title: 'Daily Standup',
        content: '<p>Jordan: Kanban spike PR ready. Sam: backdrop click handler merged, panel complete. Riley: all PR reviews done, picking up timeline research.</p>',
        eventType: 'standup',
        startDate: dh(-2, 9), endDate: dh(-2, 9), singleDay: true, allDay: false,
        location: 'Standup Channel',
        tags: ['standup', 'daily'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-2), updatedAt: d(-2),
      },
      {
        title: 'Daily Standup',
        content: '<p>Team: finalising sprint 4 loose ends before end-of-sprint review. Kanban spike approved — drag-and-drop unblocked for Sprint 5.</p>',
        eventType: 'standup',
        startDate: dh(-1, 9), endDate: dh(-1, 9), singleDay: true, allDay: false,
        location: 'Standup Channel',
        tags: ['standup', 'daily'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-1), updatedAt: d(-1),
      },

      // ── Upcoming ──────────────────────────────────────────────────
      {
        title: 'Kanban Drag-and-Drop Spike Review',
        content: '<p>Jordan and Sam to present pointer-events prototype findings from the Kanban research spike.</p>',
        eventType: 'upcoming_event',
        startDate: d(3), endDate: d(3), singleDay: true, allDay: false,
        location: 'Team Standup Channel',
        tags: ['kanban', 'research'],
        status: 'active', visibility: 'shared',
        ownerId: jordanId, sharedWith: [alexId, samId],
        createdBy: jordanId, updatedBy: null,
        createdAt: d(-1), updatedAt: d(-1),
      },
      {
        title: '1:1 — Joe & Alex',
        content: '<p>Monthly check-in. Agenda: sprint 4 wrap-up, sprint 5 scope confirmation, v1.1 release sign-off discussion.</p>',
        eventType: 'personal',
        startDate: dh(5, 10), endDate: dh(5, 11), singleDay: true, allDay: false,
        location: '',
        tags: ['1:1', 'management'],
        status: 'active', visibility: 'shared',
        ownerId: joeId, sharedWith: [alexId],
        createdBy: joeId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
      {
        title: 'Sprint 4 Retrospective',
        content: '<p>Review what went well and areas to improve before Sprint 5 begins. Output: 2–3 team improvement actions for the next sprint.</p>',
        eventType: 'upcoming_event',
        startDate: dh(6, 14), endDate: dh(6, 16), singleDay: true, allDay: false,
        location: 'Team Meeting Room',
        tags: ['sprint', 'retrospective'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
      {
        title: 'Sprint 4 Review & Demo',
        content: '<p>Demonstrate completed Sprint 4 deliverables to stakeholders. All team members present.</p>',
        eventType: 'upcoming_event',
        startDate: d(7), endDate: d(7), singleDay: true, allDay: true,
        location: 'Main Conference Room',
        tags: ['sprint', 'review', 'demo'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
      {
        title: 'Sprint 5 Planning',
        content: '<p>Sprint 5 — Polish & Release. Scope: E2E tests, performance audit, release docs. Capacity: 80 pts. Sam on vacation from d+14.</p>',
        eventType: 'upcoming_event',
        startDate: dh(8, 9), endDate: dh(8, 11), singleDay: true, allDay: false,
        location: 'Main Conference Room',
        tags: ['sprint', 'planning'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-1), updatedAt: d(-1),
      },
      {
        title: 'Kyle — Product Walkthrough',
        content: '<p>Kyle walks through the v1.1 feature set and gathers admin-role feedback before customer demo preparation.</p>',
        eventType: 'project_scope',
        startDate: dh(9, 14), endDate: dh(9, 16), singleDay: true, allDay: false,
        location: 'Engineering Office',
        tags: ['product', 'review'],
        status: 'active', visibility: 'shared',
        ownerId: kyleId, sharedWith: [alexId, samId],
        createdBy: kyleId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
      {
        title: 'Architecture Decision: Analytics Pipeline',
        content: '<p>Review and agree on the data aggregation approach for v2.0 analytics features before Sprint 6 scope is locked.</p>',
        eventType: 'project_scope',
        startDate: d(14), endDate: d(14), singleDay: true, allDay: false,
        location: 'Engineering Office',
        tags: ['architecture', 'analytics'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-2), updatedAt: d(-2),
      },
      {
        title: 'Sam — Vacation',
        content: '<p>Out of office. No async expected during this period.</p>',
        eventType: 'personal',
        startDate: d(14), endDate: d(21), singleDay: false, allDay: true,
        location: '',
        tags: ['time-off', 'vacation'],
        status: 'active', visibility: 'shared',
        ownerId: samId, sharedWith: [alexId],
        createdBy: samId, updatedBy: null,
        createdAt: d(-14), updatedAt: d(-14),
      },
      {
        title: 'Customer Demo — v1.1 Preview',
        content: '<p>Live walkthrough of the Agile Tracker module for prospective customers. Joe and Alex presenting; Sam on standby for technical questions.</p>',
        eventType: 'upcoming_event',
        startDate: dh(18, 14), endDate: dh(18, 16), singleDay: true, allDay: false,
        location: 'Video Call',
        tags: ['customer', 'demo'],
        status: 'active', visibility: 'public',
        ownerId: joeId, sharedWith: [kyleId, alexId, samId],
        createdBy: joeId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
      {
        title: 'v1.1 Release Deadline',
        content: '<p>Target cutoff date for the Agile Tracker milestone release. Code freeze at EOD.</p>',
        eventType: 'deadline',
        startDate: d(21), endDate: d(21), singleDay: true, allDay: true,
        location: '',
        tags: ['release', 'deadline'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
      {
        title: 'Sprint 5 Retrospective',
        content: '<p>End-of-sprint retrospective for Sprint 5 — Polish & Release. Output feeds directly into v2.0 planning kickoff.</p>',
        eventType: 'upcoming_event',
        startDate: dh(20, 14), endDate: dh(20, 16), singleDay: true, allDay: false,
        location: 'Team Meeting Room',
        tags: ['sprint', 'retrospective'],
        status: 'active', visibility: 'shared',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
      {
        title: 'v2.0 Planning Workshop',
        content: '<p>Full-day planning session to scope and prioritize the Reporting & Analytics milestone. All team members required.</p>',
        eventType: 'upcoming_event',
        startDate: d(28), endDate: d(29), singleDay: false, allDay: true,
        location: 'Offsite Venue',
        tags: ['planning', 'milestone'],
        status: 'active', visibility: 'public',
        ownerId: alexId, sharedWith: [jordanId, samId, rileyId],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-7), updatedAt: d(-7),
      },
      {
        title: 'All-Hands: Q2 Engineering Review',
        content: '<p>Full-team retrospective on v1.x delivery and preview of the v2.0 analytics roadmap. All team members required.</p>',
        eventType: 'upcoming_event',
        startDate: dh(35, 10), endDate: dh(35, 13), singleDay: true, allDay: false,
        location: 'Boardroom',
        tags: ['all-hands', 'quarterly'],
        status: 'active', visibility: 'public',
        ownerId: joeId, sharedWith: [kyleId, alexId, jordanId, samId, rileyId],
        createdBy: joeId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
    ]);

    // ── Agile demo snapshot ───────────────────────────────────────────
    // Skip if any milestones already exist (idempotent)
    const milestones = db.collection('agile_milestones');
    if (await milestones.countDocuments()) return;

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
  });
});
