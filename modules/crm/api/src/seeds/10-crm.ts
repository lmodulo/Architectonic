// Demo data — CRM (Nexus): companies, contacts, deals, activities.
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

  const milestones = db.collection('agile_milestones');

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
        email: 'marcus.webb@vertexsystems.io', phone: '+14155550182',
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
        email: 'priya.sharma@vertexsystems.io', phone: '+14155550194',
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
        email: 'dana@techfusion.dev', phone: '+15125550237',
        role: 'Champion', status: 'Prospect', source: 'Inbound',
        companyId: coTech, assignedTo: alexId,
        linkedInUrl: '', timezone: 'America/Chicago', tags: ['pilot-lead'],
        createdBy: alexId, updatedBy: alexId,
        createdAt: d(-15), updatedAt: d(-5),
      },
      {
        _id: ctTyler,
        firstName: 'Tyler', lastName: 'Osei',
        email: 'tyler.osei@techfusion.dev', phone: '+15125550251',
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
        email: 'carmen@bluepeakagency.com', phone: '+13035550128',
        role: 'Champion', status: 'Prospect', source: 'Conference',
        companyId: coBluePeak, assignedTo: alexId,
        linkedInUrl: '', timezone: 'America/Denver', tags: ['productcon'],
        createdBy: alexId, updatedBy: null,
        createdAt: d(-3), updatedAt: d(-3),
      },
      {
        _id: ctFinn,
        firstName: 'Finn', lastName: 'Nakamura',
        email: 'finn@orionlabs.io', phone: '+12065550175',
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
        email: 'eleanor.strom@civicbridge.gov', phone: '+16515550109',
        role: 'Decision Maker', status: 'Churned', source: 'Outreach',
        companyId: coCivic, assignedTo: joeId,
        linkedInUrl: '', timezone: 'America/Chicago', tags: ['compliance', 'lost'],
        createdBy: joeId, updatedBy: joeId,
        createdAt: d(-28), updatedAt: d(-10),
      },
      {
        _id: ctJames,
        firstName: 'James', lastName: 'Hartley',
        email: 'james@meridiandigital.co', phone: '+17205550148',
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
}
