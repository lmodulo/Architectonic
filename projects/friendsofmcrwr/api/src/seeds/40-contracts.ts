// Demo data — Contracts: agreements and templates.
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
}
