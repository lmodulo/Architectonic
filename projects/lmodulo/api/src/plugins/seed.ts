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
    value: 'L Modulo',
    type: 'string',
    label: 'Brand Name',
    description: 'Text shown in the app header (mutually exclusive with Brand Logo)'
  },
  {
    key: 'brand.logo',
    value: '/logo.svg',
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
  // Demo customer (converted client)
  { username: 'customer', email: 'customer@lmodulo.com', password: 'c-password', firstName: 'Customer', lastName: 'Demo', role: 'customer' },
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
        content: '<p>Live walkthrough of the Agile module for prospective customers. Joe and Alex presenting; Sam on standby for technical questions.</p>',
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
        content: '<p>Target cutoff date for the Agile milestone release. Code freeze at EOD.</p>',
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

    // ── Teams ─────────────────────────────────────────────────────────
    const teamsColl = db.collection('teams');
    await teamsColl.deleteMany({ name: { $in: ['Product', 'Engineering'] } });
    const SEED_TEAMS = [
      { name: 'Backend',  description: 'API design, data layer, and infrastructure',          members: [joeId, ownerId, alexId, jordanId] },
      { name: 'Frontend', description: 'UI, component library, and client-side performance',  members: [kyleId, adminId, samId, rileyId] },
    ];
    for (const t of SEED_TEAMS) {
      await teamsColl.updateOne(
        { name: t.name },
        { $set: { description: t.description, members: t.members, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
    }
    const backendTeamDoc  = await teamsColl.findOne({ name: 'Backend' });
    const frontendTeamDoc = await teamsColl.findOne({ name: 'Frontend' });
    const backendTeamId   = backendTeamDoc?._id  ?? null;
    const frontendTeamId  = frontendTeamDoc?._id ?? null;

    // ── Agile demo snapshot ───────────────────────────────────────────
    // Skip if any milestones already exist (idempotent)
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

    // ── CRM demo snapshot ─────────────────────────────────────────────
    // Skip if any companies already exist (idempotent)
    const crmCompaniesColl = db.collection('crm_companies');
    if (!await crmCompaniesColl.countDocuments()) {

      // ── Company IDs ──────────────────────────────────────────────────
      const coVertex   = new ObjectId(); // Vertex Systems  — Customer (long-time)
      const coTech     = new ObjectId(); // TechFusion Inc  — Prospect
      const coBluePeak = new ObjectId(); // BluePeak Agency — Prospect
      const coOrion    = new ObjectId(); // Orion Labs      — Partner
      const coCivic    = new ObjectId(); // CivicBridge     — Prospect (lost)
      const coMeridian = new ObjectId(); // Meridian Digital — Customer (new)

      await crmCompaniesColl.insertMany([
        {
          _id: coVertex,
          name: 'Vertex Systems', domain: 'vertexsystems.io',
          industry: 'Enterprise', size: '200+', type: 'Customer',
          description: 'Large enterprise software company that adopted the platform after a Q3 procurement review.',
          website: 'https://vertexsystems.io',
          assignedTo: joeId, tags: ['enterprise', 'paid', 'priority'],
          healthScore: 88, dealCount: 1,
          createdBy: joeId, updatedBy: joeId,
          createdAt: d(-96), updatedAt: d(-65),
        },
        {
          _id: coTech,
          name: 'TechFusion Inc', domain: 'techfusion.dev',
          industry: 'SaaS', size: '51-200', type: 'Prospect',
          description: 'Fast-growing product team evaluating the platform for internal sprint management. Q2 pilot in progress.',
          website: 'https://techfusion.dev',
          assignedTo: alexId, tags: ['saas', 'pilot', 'high-priority'],
          healthScore: 74, dealCount: 2,
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-15), updatedAt: d(-1),
        },
        {
          _id: coBluePeak,
          name: 'BluePeak Agency', domain: 'bluepeakagency.com',
          industry: 'Agency', size: '11-50', type: 'Prospect',
          description: 'Creative agency looking to replace spreadsheet-based project tracking. Met at the ProductCon conference.',
          website: 'https://bluepeakagency.com',
          assignedTo: alexId, tags: ['agency', 'conference', 'smb'],
          healthScore: 45, dealCount: 1,
          createdBy: alexId, updatedBy: null,
          createdAt: d(-3), updatedAt: d(-3),
        },
        {
          _id: coOrion,
          name: 'Orion Labs', domain: 'orionlabs.io',
          industry: 'Startup', size: '11-50', type: 'Partner',
          description: 'Dev-tools startup partnering on API integrations. Provides early feedback on developer-facing features.',
          website: 'https://orionlabs.io',
          assignedTo: kyleId, tags: ['partner', 'api', 'early-adopter'],
          healthScore: 65, dealCount: 1,
          createdBy: kyleId, updatedBy: kyleId,
          createdAt: d(-62), updatedAt: d(-28),
        },
        {
          _id: coCivic,
          name: 'CivicBridge', domain: 'civicbridge.gov',
          industry: 'Government', size: '51-200', type: 'Prospect',
          description: 'Municipal software division that evaluated the platform but could not meet on-premises data sovereignty requirements.',
          website: 'https://civicbridge.gov',
          assignedTo: joeId, tags: ['government', 'compliance', 'lost'],
          healthScore: 0, dealCount: 1,
          createdBy: joeId, updatedBy: joeId,
          createdAt: d(-28), updatedAt: d(-10),
        },
        {
          _id: coMeridian,
          name: 'Meridian Digital', domain: 'meridiandigital.co',
          industry: 'Agency', size: '11-50', type: 'Customer',
          description: 'Boutique digital agency recently converted to a paying customer. First project is a website platform rebuild.',
          website: 'https://meridiandigital.co',
          assignedTo: alexId, tags: ['agency', 'new-client', 'smb'],
          healthScore: 72, dealCount: 1,
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-28), updatedAt: d(-12),
        },
      ]);

      // ── Contact IDs ──────────────────────────────────────────────────
      const ctMarcus  = new ObjectId(); // Vertex Systems   — Decision Maker
      const ctPriya   = new ObjectId(); // Vertex Systems   — Technical
      const ctDana    = new ObjectId(); // TechFusion Inc   — Champion
      const ctTyler   = new ObjectId(); // TechFusion Inc   — Finance
      const ctKwame   = new ObjectId(); // TechFusion Inc   — Technical
      const ctCarmen  = new ObjectId(); // BluePeak Agency  — Champion
      const ctFinn    = new ObjectId(); // Orion Labs       — Technical
      const ctEleanor = new ObjectId(); // CivicBridge      — Decision Maker
      const ctJames   = new ObjectId(); // Meridian Digital — Champion

      await db.collection('crm_contacts').insertMany([
        {
          _id: ctMarcus,
          firstName: 'Marcus', lastName: 'Webb',
          email: 'marcus.webb@vertexsystems.io', phone: '+1 415 555 0182',
          role: 'Decision Maker', status: 'Active', source: 'Inbound',
          companyId: coVertex, assignedTo: joeId,
          linkedInUrl: 'https://linkedin.com/in/marcuswebb',
          timezone: 'America/Los_Angeles', tags: ['executive', 'sponsor'],
          createdBy: joeId, updatedBy: joeId,
          createdAt: d(-96), updatedAt: d(-65),
        },
        {
          _id: ctPriya,
          firstName: 'Priya', lastName: 'Sharma',
          email: 'priya.sharma@vertexsystems.io', phone: '+1 415 555 0194',
          role: 'Technical', status: 'Active', source: 'Inbound',
          companyId: coVertex, assignedTo: alexId,
          linkedInUrl: 'https://linkedin.com/in/priyasharma-eng',
          timezone: 'America/Los_Angeles', tags: ['engineering-lead'],
          createdBy: joeId, updatedBy: alexId,
          createdAt: d(-95), updatedAt: d(-70),
        },
        {
          _id: ctDana,
          firstName: 'Dana', lastName: 'Kowalski',
          email: 'dana@techfusion.dev', phone: '+1 512 555 0237',
          role: 'Champion', status: 'Prospect', source: 'Inbound',
          companyId: coTech, assignedTo: alexId,
          linkedInUrl: '', timezone: 'America/Chicago', tags: ['pilot-lead'],
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-15), updatedAt: d(-5),
        },
        {
          _id: ctTyler,
          firstName: 'Tyler', lastName: 'Osei',
          email: 'tyler.osei@techfusion.dev', phone: '+1 512 555 0251',
          role: 'Finance', status: 'Prospect', source: 'Inbound',
          companyId: coTech, assignedTo: alexId,
          linkedInUrl: '', timezone: 'America/Chicago', tags: ['budget-owner'],
          createdBy: alexId, updatedBy: null,
          createdAt: d(-8), updatedAt: d(-8),
        },
        {
          _id: ctKwame,
          firstName: 'Kwame', lastName: 'Asante',
          email: 'kwame@techfusion.dev', phone: '',
          role: 'Technical', status: 'Prospect', source: 'Inbound',
          companyId: coTech, assignedTo: alexId,
          linkedInUrl: 'https://linkedin.com/in/kwameasante',
          timezone: 'America/Chicago', tags: ['api-evaluator'],
          createdBy: alexId, updatedBy: null,
          createdAt: d(-8), updatedAt: d(-8),
        },
        {
          _id: ctCarmen,
          firstName: 'Carmen', lastName: 'Reyes',
          email: 'carmen@bluepeakagency.com', phone: '+1 303 555 0128',
          role: 'Champion', status: 'Prospect', source: 'Conference',
          companyId: coBluePeak, assignedTo: alexId,
          linkedInUrl: '', timezone: 'America/Denver', tags: ['productcon'],
          createdBy: alexId, updatedBy: null,
          createdAt: d(-3), updatedAt: d(-3),
        },
        {
          _id: ctFinn,
          firstName: 'Finn', lastName: 'Nakamura',
          email: 'finn@orionlabs.io', phone: '+1 206 555 0175',
          role: 'Technical', status: 'Partner', source: 'Referral',
          companyId: coOrion, assignedTo: kyleId,
          linkedInUrl: 'https://linkedin.com/in/finnnakamura',
          timezone: 'America/Los_Angeles', tags: ['api', 'partner-dev'],
          createdBy: kyleId, updatedBy: kyleId,
          createdAt: d(-62), updatedAt: d(-28),
        },
        {
          _id: ctEleanor,
          firstName: 'Eleanor', lastName: 'Strom',
          email: 'eleanor.strom@civicbridge.gov', phone: '+1 651 555 0109',
          role: 'Decision Maker', status: 'Churned', source: 'Outreach',
          companyId: coCivic, assignedTo: joeId,
          linkedInUrl: '', timezone: 'America/Chicago', tags: ['compliance', 'lost'],
          createdBy: joeId, updatedBy: joeId,
          createdAt: d(-28), updatedAt: d(-10),
        },
        {
          _id: ctJames,
          firstName: 'James', lastName: 'Hartley',
          email: 'james@meridiandigital.co', phone: '+1 720 555 0148',
          role: 'Champion', status: 'Active', source: 'Referral',
          companyId: coMeridian, assignedTo: alexId,
          linkedInUrl: '', timezone: 'America/Denver', tags: ['new-client', 'decision-maker'],
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-28), updatedAt: d(-12),
        },
      ]);

      // ── Deal IDs ─────────────────────────────────────────────────────
      const dlVertex   = new ObjectId(); // Vertex Systems   — Enterprise License  — Closed Won
      const dlTech1    = new ObjectId(); // TechFusion Inc   — Team Plan Q2 Pilot  — Proposal
      const dlTech2    = new ObjectId(); // TechFusion Inc   — API Access Add-on   — Negotiation
      const dlBluePeak = new ObjectId(); // BluePeak Agency  — Starter Plan        — Discovery
      const dlOrion    = new ObjectId(); // Orion Labs       — Integration Partner — Closed Won
      const dlCivic    = new ObjectId(); // CivicBridge      — Government Edition  — Closed Lost
      const dlMeridian = new ObjectId(); // Meridian Digital — Website Platform    — Closed Won

      await db.collection('crm_deals').insertMany([
        {
          _id: dlVertex,
          title: 'Vertex Systems — Enterprise License',
          companyId: coVertex, contactIds: [ctMarcus, ctPriya],
          stage: 'Closed Won', type: 'New Business',
          value: 48000, currency: 'USD', probability: 100,
          expectedCloseDate: d(-70),
          description: 'Annual enterprise license for 200+ seat deployment. Includes priority support and onboarding.',
          assignedTo: joeId, lostReason: null,
          createdBy: joeId, updatedBy: joeId,
          createdAt: d(-95), updatedAt: d(-70),
        },
        {
          _id: dlTech1,
          title: 'TechFusion — Q2 Pilot (Team Plan)',
          companyId: coTech, contactIds: [ctDana, ctTyler],
          stage: 'Proposal', type: 'New Business',
          value: 18000, currency: 'USD', probability: 65,
          expectedCloseDate: d(35),
          description: 'Team Plan for 30 seats. Pilot kicks off after the v1.1 demo. Dana is the internal champion; Tyler controls budget sign-off.',
          assignedTo: alexId, lostReason: null,
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-15), updatedAt: d(-5),
        },
        {
          _id: dlTech2,
          title: 'TechFusion — API Access Add-on',
          companyId: coTech, contactIds: [ctKwame],
          stage: 'Negotiation', type: 'Upsell',
          value: 6000, currency: 'USD', probability: 50,
          expectedCloseDate: d(14),
          description: 'REST API access for Kwame\'s integration team to embed task tracking in their own tools.',
          assignedTo: alexId, lostReason: null,
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-8), updatedAt: d(-1),
        },
        {
          _id: dlBluePeak,
          title: 'BluePeak Agency — Starter Plan',
          companyId: coBluePeak, contactIds: [ctCarmen],
          stage: 'Discovery', type: 'New Business',
          value: 8400, currency: 'USD', probability: 20,
          expectedCloseDate: d(60),
          description: 'Agency tier for 15 seats. Evaluating against a competitor. Carmen wants to see the Agile in a live walkthrough before committing.',
          assignedTo: alexId, lostReason: null,
          createdBy: alexId, updatedBy: null,
          createdAt: d(-3), updatedAt: d(-3),
        },
        {
          _id: dlOrion,
          title: 'Orion Labs — Integration Partnership',
          companyId: coOrion, contactIds: [ctFinn],
          stage: 'Closed Won', type: 'Partnership',
          value: 0, currency: 'USD', probability: 100,
          expectedCloseDate: d(-30),
          description: 'Technology partnership: Orion Labs builds and maintains the Zapier/webhook integration layer in exchange for early API access and co-marketing.',
          assignedTo: kyleId, lostReason: null,
          createdBy: kyleId, updatedBy: kyleId,
          createdAt: d(-62), updatedAt: d(-30),
        },
        {
          _id: dlCivic,
          title: 'CivicBridge — Government Edition',
          companyId: coCivic, contactIds: [ctEleanor],
          stage: 'Closed Lost', type: 'New Business',
          value: 36000, currency: 'USD', probability: 0,
          expectedCloseDate: d(-45),
          description: 'On-premises deployment for 80-seat municipal team. Evaluation failed: data sovereignty requirements mandate air-gapped hosting we cannot currently support.',
          assignedTo: joeId, lostReason: 'On-premises / air-gapped hosting requirement not supported',
          createdBy: joeId, updatedBy: joeId,
          createdAt: d(-28), updatedAt: d(-10),
        },
        {
          _id: dlMeridian,
          title: 'Meridian Digital — Website Platform Build',
          companyId: coMeridian, contactIds: [ctJames],
          stage: 'Closed Won', type: 'New Business',
          value: 12000, currency: 'USD', probability: 100,
          expectedCloseDate: d(-12),
          description: 'Website platform rebuild for a 20-person digital agency. Phase 1 covers architecture, design, and initial build. Referred in by Orion Labs.',
          assignedTo: alexId, lostReason: null,
          createdBy: alexId, updatedBy: alexId,
          createdAt: d(-28), updatedAt: d(-12),
        },
      ]);

      // ── Activities ───────────────────────────────────────────────────
      await db.collection('crm_activities').insertMany([

        // ── Vertex Systems ────────────────────────────────────────────
        {
          type: 'Email', title: 'Inbound response — Vertex Systems',
          body: 'Marcus replied to our inbound interest form. Requested a product walkthrough call for the following week.',
          entityType: 'company', entityId: coVertex,
          scheduledAt: d(-95), completedAt: d(-95), outcome: 'Productive',
          assignedTo: joeId, createdBy: joeId, updatedBy: joeId,
          createdAt: d(-96), updatedAt: d(-95),
        },
        {
          type: 'Call', title: 'Discovery call — Marcus Webb',
          body: 'Covered pain points: no visibility into sprint velocity, multiple disconnected tools. Marcus confirmed they have budget and want an enterprise deal by end of quarter.',
          entityType: 'contact', entityId: ctMarcus,
          scheduledAt: dh(-85, 10), completedAt: dh(-85, 11), outcome: 'Productive',
          assignedTo: joeId, createdBy: joeId, updatedBy: joeId,
          createdAt: d(-86), updatedAt: d(-85),
        },
        {
          type: 'Meeting', title: 'Technical deep-dive — Priya Sharma',
          body: 'Priya evaluated the API schema and MongoDB aggregation design. Main concern: can we export sprint data to their internal BI tool? Confirmed yes via CSV endpoint.',
          entityType: 'contact', entityId: ctPriya,
          scheduledAt: dh(-80, 14), completedAt: dh(-80, 16), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-81), updatedAt: d(-80),
        },
        {
          type: 'Email', title: 'Proposal sent — Vertex Systems Enterprise License',
          body: 'Sent proposal covering annual enterprise license ($48k), SLA terms, and onboarding timeline. Marcus confirmed receipt; legal flagged minor indemnity clause for review.',
          entityType: 'deal', entityId: dlVertex,
          scheduledAt: d(-76), completedAt: d(-76), outcome: 'Productive',
          assignedTo: joeId, createdBy: joeId, updatedBy: joeId,
          createdAt: d(-76), updatedAt: d(-76),
        },
        {
          type: 'Call', title: 'Deal close — Vertex Systems',
          body: 'Marcus gave verbal sign-off. Legal approved with minor indemnity amendment. Contract to be signed by EOW. $48k ARR.',
          entityType: 'deal', entityId: dlVertex,
          scheduledAt: dh(-70, 15), completedAt: dh(-70, 15), outcome: 'Productive',
          assignedTo: joeId, createdBy: joeId, updatedBy: joeId,
          createdAt: d(-71), updatedAt: d(-70),
        },
        {
          type: 'Meeting', title: 'Onboarding kickoff — Vertex Systems',
          body: 'Walked Priya\'s team through Docker setup, roles/permissions, and Agile. Committed to 60-day check-in. They\'re starting with the Backend team as the pilot group.',
          entityType: 'company', entityId: coVertex,
          scheduledAt: dh(-65, 10), completedAt: dh(-65, 12), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-66), updatedAt: d(-65),
        },

        // ── Orion Labs ────────────────────────────────────────────────
        {
          type: 'Call', title: 'Partnership intro — Finn Nakamura, Orion Labs',
          body: 'Finn reached out via a mutual referral. They want to build a Zapier integration layer. Agreed to move to a formal partnership agreement.',
          entityType: 'contact', entityId: ctFinn,
          scheduledAt: dh(-58, 11), completedAt: dh(-58, 12), outcome: 'Productive',
          assignedTo: kyleId, createdBy: kyleId, updatedBy: kyleId,
          createdAt: d(-59), updatedAt: d(-58),
        },
        {
          type: 'Email', title: 'Partnership agreement signed — Orion Labs',
          body: 'Partnership terms confirmed: Orion builds and maintains the Zapier integration layer; we provide early API access, sandbox environment, and co-marketing. Finn confirmed acceptance.',
          entityType: 'deal', entityId: dlOrion,
          scheduledAt: d(-30), completedAt: d(-30), outcome: 'Productive',
          assignedTo: kyleId, createdBy: kyleId, updatedBy: kyleId,
          createdAt: d(-31), updatedAt: d(-30),
        },

        // ── CivicBridge ───────────────────────────────────────────────
        {
          type: 'Call', title: 'Discovery call — Eleanor Strom, CivicBridge',
          body: 'Eleanor\'s team manages 80+ city workers across 4 departments. Hard requirement: all data must stay on municipal servers (air-gapped). We can\'t support this in v1.x.',
          entityType: 'contact', entityId: ctEleanor,
          scheduledAt: dh(-22, 10), completedAt: dh(-22, 11), outcome: 'Productive',
          assignedTo: joeId, createdBy: joeId, updatedBy: joeId,
          createdAt: d(-23), updatedAt: d(-22),
        },
        {
          type: 'Email', title: 'CivicBridge — closing deal as lost',
          body: 'Eleanor confirmed they cannot proceed without on-premises hosting. Closing this deal. May revisit if we ship a self-hosted tier in v3.0.',
          entityType: 'deal', entityId: dlCivic,
          scheduledAt: d(-10), completedAt: d(-10), outcome: 'N/A',
          assignedTo: joeId, createdBy: joeId, updatedBy: joeId,
          createdAt: d(-10), updatedAt: d(-10),
        },

        // ── TechFusion ────────────────────────────────────────────────
        {
          type: 'Email', title: 'TechFusion inbound — pilot interest',
          body: 'Dana reached out via the website. Their team of 30 engineers uses a mix of Notion and Jira but finds them too heavy. Looking for a leaner agile tracker.',
          entityType: 'company', entityId: coTech,
          scheduledAt: d(-15), completedAt: d(-15), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-15), updatedAt: d(-15),
        },
        {
          type: 'Call', title: 'Intro call — Dana Kowalski, TechFusion',
          body: 'Dana runs their sprint planning process. Pain point: no single view connecting milestones to daily tasks. Demo\'d the Agile overview — strong positive reaction. Scheduling a full product demo.',
          entityType: 'contact', entityId: ctDana,
          scheduledAt: dh(-12, 10), completedAt: dh(-12, 11), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-13), updatedAt: d(-12),
        },
        {
          type: 'Demo', title: 'Product demo — TechFusion full walkthrough',
          body: 'Full demo: milestones → sprints → jobs → tasks, board view, timeline. Tyler joined mid-way and asked about SSO and audit logs — noted for v1.2 roadmap. Dana wants to run a 30-day pilot.',
          entityType: 'deal', entityId: dlTech1,
          scheduledAt: dh(-8, 14), completedAt: dh(-8, 16), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-9), updatedAt: d(-8),
        },
        {
          type: 'Email', title: 'API access upsell — Kwame Asante, TechFusion',
          body: 'Kwame reached out directly after the demo. Wants REST API access to embed task status in their internal tooling. Sent pricing for the API add-on ($500/mo).',
          entityType: 'contact', entityId: ctKwame,
          scheduledAt: d(-8), completedAt: d(-8), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-8), updatedAt: d(-8),
        },
        {
          type: 'Email', title: 'Proposal sent — TechFusion Q2 Pilot',
          body: 'Sent Team Plan proposal for 30 seats at $18k/yr. Included pilot terms: 30-day full access, then billing begins. Tyler needs CFO approval — expecting a decision within 2 weeks.',
          entityType: 'deal', entityId: dlTech1,
          scheduledAt: d(-5), completedAt: d(-5), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-5), updatedAt: d(-5),
        },
        {
          type: 'Call', title: 'TechFusion check-in — pilot prep',
          body: 'Dana confirmed CFO review is in progress. She\'s prepping her team\'s onboarding checklist. Discussed the upcoming v1.1 demo — she\'ll bring 3 additional team leads.',
          entityType: 'contact', entityId: ctDana,
          scheduledAt: dh(-1, 11), completedAt: dh(-1, 12), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-1), updatedAt: d(-1),
        },
        {
          // Matches the 'Customer Demo — v1.1 Preview' calendar event at d(18)
          type: 'Demo', title: 'v1.1 Prospect Demo — TechFusion',
          body: 'Live walkthrough of the complete v1.1 Agile for TechFusion\'s extended team (Dana + 3 team leads). Joe and Alex presenting. Engineering to have demo environment fully seeded beforehand (see Sprint 5 job).',
          entityType: 'deal', entityId: dlTech1,
          scheduledAt: dh(18, 14), completedAt: null, outcome: 'N/A',
          assignedTo: joeId, createdBy: joeId, updatedBy: null,
          createdAt: d(-7), updatedAt: d(-7),
        },

        // ── BluePeak Agency ───────────────────────────────────────────
        {
          type: 'Meeting', title: 'ProductCon intro — Carmen Reyes, BluePeak',
          body: 'Met Carmen at the ProductCon booth. She manages projects for a 40-person creative agency and is evaluating us against Teamwork Projects. Exchanged contact details — following up this week.',
          entityType: 'contact', entityId: ctCarmen,
          scheduledAt: d(-3), completedAt: d(-3), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: null,
          createdAt: d(-3), updatedAt: d(-3),
        },
        {
          type: 'Note', title: 'BluePeak — competitor context',
          body: 'Carmen mentioned they\'re evaluating against Teamwork Projects. Key differentiators to emphasise: native Agile, no per-feature pricing, open-source scaffold for their dev team.',
          entityType: 'company', entityId: coBluePeak,
          scheduledAt: null, completedAt: null, outcome: 'N/A',
          assignedTo: alexId, createdBy: alexId, updatedBy: null,
          createdAt: d(-2), updatedAt: d(-2),
        },

        // ── Meridian Digital ─────────────────────────────────────────
        {
          type: 'Call', title: 'Discovery call — James Hartley, Meridian Digital',
          body: 'Referral from Finn at Orion Labs. James runs ops for a 20-person digital agency looking to rebuild their client website platform. Budget confirmed, timeline is Q3. Sent a brief scope outline after the call.',
          entityType: 'contact', entityId: ctJames,
          scheduledAt: dh(-26, 10), completedAt: dh(-26, 11), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-27), updatedAt: d(-26),
        },
        {
          type: 'Email', title: 'Proposal sent — Meridian Digital Website Platform Build',
          body: 'Sent EST-0006 covering Phase 1: discovery & architecture, design, and initial build (60h total at $150/h + tax). James confirmed receipt same day.',
          entityType: 'deal', entityId: dlMeridian,
          scheduledAt: d(-20), completedAt: d(-20), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-20), updatedAt: d(-20),
        },
        {
          type: 'Call', title: 'Deal close — Meridian Digital',
          body: 'James accepted the estimate and confirmed contract. Portal access granted same day. First invoice to follow once kickoff is complete.',
          entityType: 'deal', entityId: dlMeridian,
          scheduledAt: dh(-12, 14), completedAt: dh(-12, 15), outcome: 'Productive',
          assignedTo: alexId, createdBy: alexId, updatedBy: alexId,
          createdAt: d(-13), updatedAt: d(-12),
        },
      ]);

      // ── Folio: customer users + invoices + welcome messages ──────────
      // (intentionally outside the CRM guard so it seeds even when CRM data already exists)

    } // end CRM snapshot

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

    // ── Contracts ─────────────────────────────────────────────────────
    const contractsColl = db.collection('contracts');
    if (!await contractsColl.countDocuments()) {
      const [coVertexDoc, coTechDoc, coBluePeakDoc, coOrionDoc, coCivicDoc] = await Promise.all([
        db.collection('crm_companies').findOne({ name: 'Vertex Systems' }),
        db.collection('crm_companies').findOne({ name: 'TechFusion Inc' }),
        db.collection('crm_companies').findOne({ name: 'BluePeak Agency' }),
        db.collection('crm_companies').findOne({ name: 'Orion Labs' }),
        db.collection('crm_companies').findOne({ name: 'CivicBridge' }),
      ]);
      const coVertex   = (coVertexDoc as any)?._id   ?? new ObjectId();
      const coTech     = (coTechDoc as any)?._id     ?? new ObjectId();
      const coBluePeak = (coBluePeakDoc as any)?._id ?? new ObjectId();
      const coOrion    = (coOrionDoc as any)?._id    ?? new ObjectId();
      const coCivic    = (coCivicDoc as any)?._id    ?? new ObjectId();

      await contractsColl.insertMany([
        {
          title: 'Master Service Agreement — Vertex Systems',
          type: 'msa', status: 'signed', content: '',
          companyId: coVertex, contactIds: [], dealId: null, estimateId: null,
          value: 48000, currency: 'USD',
          effectiveDate: d(-90), expiryDate: d(275),
          signers: [
            { name: 'Marcus Webb',  email: 'marcus.webb@vertexsystems.io', role: 'client',   status: 'signed', signedAt: d(-88) },
            { name: 'Joe Nicora',   email: 'joenicora@me.com',             role: 'provider', status: 'signed', signedAt: d(-89) },
          ],
          attachments: [], createdBy: joeId,
          createdAt: d(-95), updatedAt: d(-88),
        },
        {
          title: 'Platform Onboarding SOW — Vertex Systems',
          type: 'sow', status: 'signed', content: '',
          companyId: coVertex, contactIds: [], dealId: null, estimateId: null,
          value: 18000, currency: 'USD',
          effectiveDate: d(-60), expiryDate: d(28),
          signers: [
            { name: 'Priya Sharma', email: 'priya.sharma@vertexsystems.io', role: 'client',   status: 'signed', signedAt: d(-57) },
            { name: 'Joe Nicora',   email: 'joenicora@me.com',              role: 'provider', status: 'signed', signedAt: d(-58) },
          ],
          attachments: [], createdBy: joeId,
          createdAt: d(-62), updatedAt: d(-57),
        },
        {
          title: 'Non-Disclosure Agreement — TechFusion Inc',
          type: 'nda', status: 'signed', content: '',
          companyId: coTech, contactIds: [], dealId: null, estimateId: null,
          value: null, currency: 'USD',
          effectiveDate: d(-45), expiryDate: d(320),
          signers: [
            { name: 'Dana Kowalski', email: 'dana@techfusion.dev',  role: 'client',   status: 'signed', signedAt: d(-43) },
            { name: 'Alex Chen',     email: 'alex@lmodulo.com',     role: 'provider', status: 'signed', signedAt: d(-44) },
          ],
          attachments: [], createdBy: alexId,
          createdAt: d(-48), updatedAt: d(-43),
        },
        {
          title: 'Q2 Pilot Engagement SOW — TechFusion Inc',
          type: 'sow', status: 'pending_signature', content: '',
          companyId: coTech, contactIds: [], dealId: null, estimateId: null,
          value: 22500, currency: 'USD',
          effectiveDate: d(3), expiryDate: d(93),
          signers: [
            { name: 'Dana Kowalski', email: 'dana@techfusion.dev',       role: 'client', status: 'pending', signedAt: null },
            { name: 'Tyler Osei',    email: 'tyler.osei@techfusion.dev', role: 'client', status: 'pending', signedAt: null },
          ],
          attachments: [], createdBy: alexId,
          createdAt: d(-3), updatedAt: d(-1),
        },
        {
          title: 'Brand Refresh & Design System SOW — BluePeak Agency',
          type: 'sow', status: 'active', content: '',
          companyId: coBluePeak, contactIds: [], dealId: null, estimateId: null,
          value: 12000, currency: 'USD',
          effectiveDate: d(-20), expiryDate: d(22),
          signers: [
            { name: 'Carmen Reyes', email: 'carmen@bluepeakagency.com', role: 'client',   status: 'signed', signedAt: d(-18) },
            { name: 'Alex Chen',    email: 'alex@lmodulo.com',          role: 'provider', status: 'signed', signedAt: d(-19) },
          ],
          attachments: [], createdBy: alexId,
          createdAt: d(-22), updatedAt: d(-18),
        },
        {
          title: 'Partnership Non-Disclosure Agreement — Orion Labs',
          type: 'nda', status: 'signed', content: '',
          companyId: coOrion, contactIds: [], dealId: null, estimateId: null,
          value: null, currency: 'USD',
          effectiveDate: d(-30), expiryDate: d(335),
          signers: [
            { name: 'Finn Nakamura', email: 'finn@orionlabs.io',    role: 'client',   status: 'signed', signedAt: d(-28) },
            { name: 'Kyle Nicora',   email: 'kylenicora@me.com',    role: 'provider', status: 'signed', signedAt: d(-29) },
          ],
          attachments: [], createdBy: kyleId,
          createdAt: d(-32), updatedAt: d(-28),
        },
        {
          title: 'Enterprise Platform Implementation SOW — CivicBridge',
          type: 'sow', status: 'voided', content: '',
          companyId: coCivic, contactIds: [], dealId: null, estimateId: null,
          value: 34000, currency: 'USD',
          effectiveDate: null, expiryDate: null,
          signers: [],
          attachments: [], createdBy: joeId,
          createdAt: d(-25), updatedAt: d(-10),
        },
        {
          title: 'Master Service Agreement — New Client (Draft)',
          type: 'msa', status: 'draft', content: '',
          companyId: null, contactIds: [], dealId: null, estimateId: null,
          value: null, currency: 'USD',
          effectiveDate: null, expiryDate: null,
          signers: [],
          attachments: [], createdBy: joeId,
          createdAt: d(-1), updatedAt: d(-1),
        },
      ]);
    }

    // ── Contract templates ─────────────────────────────────────────────
    const contractTemplates = db.collection('contract_templates');
    if (!await contractTemplates.countDocuments()) {
      await contractTemplates.insertMany([
        {
          name: 'Master Service Agreement',
          type: 'msa',
          description: 'Governs the ongoing service relationship — use this as the foundation for all client engagements.',
          variables: ['clientName', 'clientAddress', 'providerName', 'providerAddress', 'effectiveDate', 'governingLaw'],
          isDefault: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          content: `<h1>Master Service Agreement</h1>
<p>This Master Service Agreement ("<strong>Agreement</strong>") is entered into as of <strong>{{effectiveDate}}</strong> ("<strong>Effective Date</strong>") by and between:</p>
<p><strong>{{providerName}}</strong>, ("<strong>Provider</strong>"), located at {{providerAddress}};</p>
<p>and</p>
<p><strong>{{clientName}}</strong> ("<strong>Client</strong>"), located at {{clientAddress}}.</p>
<h2>1. Scope of Services</h2>
<p>Provider will perform the services described in one or more Statements of Work ("<strong>SOW</strong>") or project orders executed by both parties and incorporated herein by reference. Each SOW is subject to the terms of this Agreement.</p>
<h2>2. Intellectual Property Ownership</h2>
<p>All work product, deliverables, code, designs, and creative assets produced by Provider specifically for Client under a SOW shall become the exclusive property of Client upon receipt of full payment for the applicable SOW. Provider retains ownership of all pre-existing tools, frameworks, and methodologies used in the creation of deliverables ("<strong>Provider IP</strong>"), and grants Client a non-exclusive, royalty-free license to use such Provider IP as embedded in the deliverables. Provider may display completed work as portfolio unless Client has requested a Non-Disclosure Agreement covering that engagement.</p>
<h2>3. Confidentiality</h2>
<p>Each party agrees to hold the other party's Confidential Information in strict confidence, to use it only for purposes of this Agreement, and not to disclose it to any third party without prior written consent. "Confidential Information" means any non-public business, technical, or financial information disclosed by one party to the other. This obligation does not apply to information that is or becomes publicly available through no fault of the receiving party, was independently developed, or is required to be disclosed by law.</p>
<h2>4. Term and Termination</h2>
<p>This Agreement commences on the Effective Date and continues until terminated. Either party may terminate this Agreement or any SOW by providing thirty (30) days' written notice. Client shall pay for all work performed up to the effective date of termination.</p>
<h2>5. Payment Terms</h2>
<p>Invoices are due within thirty (30) days of the invoice date ("<strong>Net 30</strong>"). Overdue balances accrue interest at <strong>1.5% per month (18% per annum)</strong> from the due date until paid. Client shall be responsible for all costs of collection, including reasonable attorneys' fees, incurred by Provider in collecting overdue amounts.</p>
<h2>6. Maintenance and Support</h2>
<p>Unless specified in a separate SOW or retainer agreement, post-delivery support is billed at Provider's then-current hourly rate. Defects in deliverables caused directly by Provider's work will be remedied at no charge within the warranty period specified in the applicable SOW.</p>
<h2>7. Limitation of Liability</h2>
<p>In no event shall either party be liable for indirect, incidental, special, or consequential damages arising from this Agreement. Provider's total cumulative liability for any claims arising from this Agreement shall not exceed the total fees paid by Client to Provider in the twelve (12) months preceding the event giving rise to the claim.</p>
<h2>8. Independent Contractor</h2>
<p>Provider is an independent contractor. Nothing in this Agreement creates an employment, partnership, joint venture, or agency relationship between the parties.</p>
<h2>9. Governing Law</h2>
<p>This Agreement shall be governed by the laws of <strong>{{governingLaw}}</strong>, without regard to conflict-of-law principles.</p>
<h2>10. Entire Agreement</h2>
<p>This Agreement, together with all executed SOWs and attachments, constitutes the entire agreement between the parties regarding its subject matter and supersedes all prior discussions and agreements. No modification is effective unless signed by both parties. If any provision is found unenforceable, the remaining provisions continue in full force.</p>`,
        },
        {
          name: 'Statement of Work',
          type: 'sow',
          description: 'Defines scope, deliverables, timeline, and fees for a specific project engagement.',
          variables: ['clientName', 'providerName', 'effectiveDate', 'projectTitle', 'projectFees', 'paymentSchedule', 'supportRate', 'warrantyDays', 'changeOrderRate'],
          isDefault: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          content: `<h1>Statement of Work</h1>
<p>This Statement of Work ("<strong>SOW</strong>") is entered into as of <strong>{{effectiveDate}}</strong> by and between <strong>{{providerName}}</strong> ("<strong>Provider</strong>") and <strong>{{clientName}}</strong> ("<strong>Client</strong>"), and is incorporated into the Master Service Agreement between the parties.</p>
<h2>1. Project Title</h2>
<p><strong>{{projectTitle}}</strong></p>
<h2>2. Project Scope</h2>
<p>Provider will design, develop, and deliver the following:</p>
<ul>
  <li>[Deliverable 1 — describe clearly]</li>
  <li>[Deliverable 2 — describe clearly]</li>
  <li>[Deliverable 3 — describe clearly]</li>
</ul>
<p><strong>Out of scope:</strong> The following are explicitly excluded from this SOW and would require a separate change order:</p>
<ul>
  <li>[Exclusion 1]</li>
  <li>[Exclusion 2]</li>
</ul>
<h2>3. Deliverables and Acceptance Criteria</h2>
<p>Each deliverable is considered accepted when Client confirms in writing that it meets the criteria described below:</p>
<ul>
  <li><strong>Deliverable 1:</strong> [Acceptance criteria]</li>
  <li><strong>Deliverable 2:</strong> [Acceptance criteria]</li>
</ul>
<p>Client will provide written acceptance or a list of material defects within seven (7) business days of delivery. Failure to respond within this period constitutes acceptance.</p>
<h2>4. Timeline and Milestones</h2>
<ul>
  <li><strong>[Date]:</strong> Project kickoff</li>
  <li><strong>[Date]:</strong> Deliverable 1 — first draft</li>
  <li><strong>[Date]:</strong> Client review and feedback</li>
  <li><strong>[Date]:</strong> Final delivery</li>
</ul>
<p>Timeline is contingent on timely receipt of materials, feedback, and approvals from Client.</p>
<h2>5. Project Fees</h2>
<p>Total project fees: <strong>{{projectFees}}</strong></p>
<p>Payment schedule: {{paymentSchedule}}</p>
<p>Invoices are due Net 30. Late payments accrue interest at 1.5%/month as set forth in the Master Service Agreement.</p>
<h2>6. Maintenance and Support</h2>
<p>Provider warrants that deliverables will be free from defects caused by Provider's work for <strong>{{warrantyDays}} days</strong> following final acceptance. During this warranty period, Provider will correct qualifying defects at no additional charge.</p>
<p>Post-warranty support and ongoing maintenance are available at <strong>{{supportRate}}/hour</strong>, or may be covered under a separate retainer agreement. Emergency response (response within 4 business hours) is available at a 50% premium.</p>
<h2>7. Change Orders</h2>
<p>Any changes to scope, timeline, or deliverables require a written change order signed by both parties prior to the work being performed. Change orders will be priced at <strong>{{changeOrderRate}}/hour</strong> unless otherwise agreed in writing.</p>
<h2>8. Incorporation</h2>
<p>This SOW is subject to and incorporates by reference the terms of the Master Service Agreement between the parties. In the event of any conflict, the terms of this SOW shall prevail for the specific engagement described herein.</p>`,
        },
        {
          name: 'Non-Disclosure Agreement',
          type: 'nda',
          description: 'Mutual confidentiality agreement — use before sharing sensitive information with prospects, partners, or contractors.',
          variables: ['clientName', 'clientAddress', 'providerName', 'providerAddress', 'effectiveDate', 'ndaTerm', 'governingLaw'],
          isDefault: true,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          content: `<h1>Non-Disclosure Agreement</h1>
<p>This Non-Disclosure Agreement ("<strong>Agreement</strong>") is entered into as of <strong>{{effectiveDate}}</strong> (the "<strong>Effective Date</strong>") by and between:</p>
<p><strong>{{providerName}}</strong>, located at {{providerAddress}} ("<strong>Party A</strong>");</p>
<p>and</p>
<p><strong>{{clientName}}</strong>, located at {{clientAddress}} ("<strong>Party B</strong>").</p>
<p>Each party may be referred to herein individually as a "<strong>Party</strong>" or collectively as the "<strong>Parties</strong>."</p>
<h2>1. Purpose</h2>
<p>The Parties wish to explore a potential business relationship (the "<strong>Purpose</strong>") and, in connection therewith, may disclose to one another certain confidential and proprietary information. This Agreement governs the protection of such information.</p>
<h2>2. Definition of Confidential Information</h2>
<p>"<strong>Confidential Information</strong>" means any non-public information disclosed by one Party ("<strong>Disclosing Party</strong>") to the other ("<strong>Receiving Party</strong>") in connection with the Purpose, whether disclosed verbally, in writing, or by any other means, and whether or not marked as "confidential." This includes, without limitation: business plans, financial data, technical designs, source code, client lists, pricing, and trade secrets.</p>
<h2>3. Obligations of the Receiving Party</h2>
<p>The Receiving Party agrees to:</p>
<ol>
  <li>Hold all Confidential Information in strict confidence using at least the same degree of care it uses to protect its own confidential information (but no less than reasonable care);</li>
  <li>Use Confidential Information solely for the Purpose;</li>
  <li>Not disclose Confidential Information to any third party without the prior written consent of the Disclosing Party, except to employees, contractors, or advisors with a need to know who are bound by confidentiality obligations no less restrictive than those herein;</li>
  <li>Promptly notify the Disclosing Party of any unauthorized use or disclosure of Confidential Information upon becoming aware of it.</li>
</ol>
<h2>4. Exclusions</h2>
<p>The obligations in Section 3 do not apply to information that:</p>
<ol>
  <li>Is or becomes publicly available through no breach of this Agreement;</li>
  <li>Was rightfully known to the Receiving Party without restriction before disclosure;</li>
  <li>Is rightfully received by the Receiving Party from a third party without restriction;</li>
  <li>Is independently developed by the Receiving Party without use of Confidential Information; or</li>
  <li>Is required to be disclosed by law, regulation, or court order — provided the Receiving Party gives the Disclosing Party prompt prior written notice (where permitted) and cooperates in seeking a protective order.</li>
</ol>
<h2>5. Term</h2>
<p>This Agreement commences on the Effective Date and the confidentiality obligations herein remain in effect for <strong>{{ndaTerm}} years</strong> thereafter, unless the parties agree in writing to extend them.</p>
<h2>6. Return and Destruction of Materials</h2>
<p>Upon written request by the Disclosing Party or upon termination of discussions, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof, and certify destruction in writing upon request.</p>
<h2>7. Remedies</h2>
<p>The Parties acknowledge that any breach of this Agreement may cause irreparable harm for which monetary damages would be an inadequate remedy. Accordingly, the Disclosing Party shall be entitled to seek injunctive or other equitable relief without the requirement of posting a bond or other security.</p>
<h2>8. No License or Obligation</h2>
<p>Nothing in this Agreement grants either Party any rights in or to the other Party's Confidential Information except as expressly stated herein. This Agreement does not obligate either Party to enter into any further agreement or business relationship.</p>
<h2>9. Governing Law</h2>
<p>This Agreement shall be governed by the laws of <strong>{{governingLaw}}</strong>, without regard to conflict-of-law principles.</p>`,
        },
      ]);
    }

  });
});
