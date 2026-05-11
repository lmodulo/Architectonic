<svelte:head>
  <title>Nexus CRM — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Nexus CRM</h1>
    <p class="text-base opacity-70 leading-relaxed">
      Nexus is a lightweight CRM built for agile development shops. It tracks the full client lifecycle — from first contact through closed deal — and ties every interaction back to an activity log. The module lives at <code class="bg-base-300 px-1 rounded text-xs">/crm</code> and follows the same permission model and UI conventions as the Agile module.
    </p>
  </div>

  <!-- Data model overview -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>Company          ← an organization (prospect, customer, partner, vendor)
  └── Contact    ← an individual person linked to a company
  └── Deal       ← an active opportunity or engagement
        └── Activity  ← a logged interaction (call, email, meeting, demo, note, task)</code></pre>
    <p class="text-sm opacity-70 leading-relaxed">
      Activities are polymorphic — they can be linked to a company, contact, or deal via <code class="bg-base-300 px-1 rounded text-xs">entityType</code> + <code class="bg-base-300 px-1 rounded text-xs">entityId</code>. All four entities are independent collections; relationships are stored as ObjectId references.
    </p>
  </div>

  <!-- Companies -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Companies</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      A company is the top-level CRM entity. Each company carries a computed <strong>health score</strong> (0–100) derived from its open deal value and how recently an activity was logged against it — no manual input required.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">name</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Company name (required)</td></tr>
          <tr><td class="font-mono text-xs">domain</td><td class="text-xs opacity-60">string (unique)</td><td class="text-sm opacity-70">e.g. <code class="bg-base-300 px-1 rounded text-xs">acme.com</code> — sparse unique index</td></tr>
          <tr><td class="font-mono text-xs">industry</td><td class="text-xs opacity-60">SaaS | Enterprise | Startup | Agency | Government | Other</td><td class="text-sm opacity-70">Sector classification</td></tr>
          <tr><td class="font-mono text-xs">size</td><td class="text-xs opacity-60">1-10 | 11-50 | 51-200 | 200+</td><td class="text-sm opacity-70">Headcount band</td></tr>
          <tr><td class="font-mono text-xs">type</td><td class="text-xs opacity-60">Prospect | Customer | Partner | Vendor</td><td class="text-sm opacity-70">Relationship type</td></tr>
          <tr><td class="font-mono text-xs">assignedTo</td><td class="text-xs opacity-60">userId</td><td class="text-sm opacity-70">Team member responsible for this account</td></tr>
          <tr><td class="font-mono text-xs">tags</td><td class="text-xs opacity-60">string[]</td><td class="text-sm opacity-70">Free-form labels</td></tr>
          <tr><td class="font-mono text-xs">healthScore</td><td class="text-xs opacity-60">number 0–100 (computed)</td><td class="text-sm opacity-70">Deal value score (max 70) + activity recency score (max 30)</td></tr>
        </tbody>
      </table>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-1">
      <p class="font-semibold">Health Score formula</p>
      <pre class="text-xs opacity-70 leading-relaxed"><code>dealScore     = min(70, totalOpenDealValue / 10_000)
recencyScore  = 30  if lastActivity ≤ 7 days ago
              = 20  if lastActivity ≤ 30 days ago
              = 10  if lastActivity ≤ 90 days ago
              = 0   otherwise
healthScore   = round(dealScore + recencyScore)</code></pre>
      <p class="text-xs opacity-50">Computed via MongoDB aggregation on every read — not stored.</p>
    </div>
  </div>

  <!-- Contacts -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Contacts</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Contacts are individual people. A contact can be linked to a company via <code class="bg-base-300 px-1 rounded text-xs">companyId</code> and optionally to multiple deals via <code class="bg-base-300 px-1 rounded text-xs">contactIds</code> on the deal. Email addresses are globally unique (sparse index).
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">firstName / lastName</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Required</td></tr>
          <tr><td class="font-mono text-xs">email</td><td class="text-xs opacity-60">string (unique)</td><td class="text-sm opacity-70">Sparse unique — optional but must be globally unique when present</td></tr>
          <tr><td class="font-mono text-xs">phone</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Optional direct line</td></tr>
          <tr><td class="font-mono text-xs">role</td><td class="text-xs opacity-60">Decision Maker | Champion | Technical | Finance | Other</td><td class="text-sm opacity-70">Their buying-process role</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">Prospect | Active | Churned | Partner</td><td class="text-sm opacity-70">Relationship lifecycle state</td></tr>
          <tr><td class="font-mono text-xs">source</td><td class="text-xs opacity-60">Inbound | Referral | Conference | Outreach | Other</td><td class="text-sm opacity-70">How this contact was acquired</td></tr>
          <tr><td class="font-mono text-xs">companyId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Their employer — company name joined on read</td></tr>
          <tr><td class="font-mono text-xs">assignedTo</td><td class="text-xs opacity-60">userId</td><td class="text-sm opacity-70">Account owner</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Deals -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Deals</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Deals represent active sales opportunities or engagements. They move through six stages. When a stage changes, the API automatically sets <code class="bg-base-300 px-1 rounded text-xs">probability</code> unless the client sends an explicit override. Moving to <em>Closed Lost</em> requires a <code class="bg-base-300 px-1 rounded text-xs">lostReason</code>.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">title</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Deal name (required)</td></tr>
          <tr><td class="font-mono text-xs">companyId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">The company this deal is with</td></tr>
          <tr><td class="font-mono text-xs">contactIds</td><td class="text-xs opacity-60">ObjectId[]</td><td class="text-sm opacity-70">Stakeholders involved in this deal</td></tr>
          <tr><td class="font-mono text-xs">stage</td><td class="text-xs opacity-60">Discovery | Proposal | Negotiation | Contract | Closed Won | Closed Lost</td><td class="text-sm opacity-70">Pipeline stage</td></tr>
          <tr><td class="font-mono text-xs">value</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Deal value in the given currency (default USD)</td></tr>
          <tr><td class="font-mono text-xs">probability</td><td class="text-xs opacity-60">number 0–100</td><td class="text-sm opacity-70">Auto-set by stage; can be manually overridden</td></tr>
          <tr><td class="font-mono text-xs">type</td><td class="text-xs opacity-60">New Business | Upsell | Renewal | Partnership</td><td class="text-sm opacity-70">Deal classification</td></tr>
          <tr><td class="font-mono text-xs">expectedCloseDate</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">Projected close date</td></tr>
          <tr><td class="font-mono text-xs">lostReason</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Required when stage is Closed Lost</td></tr>
        </tbody>
      </table>
    </div>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Stage</th><th>Auto Probability</th></tr></thead>
        <tbody>
          <tr><td>Discovery</td><td>10%</td></tr>
          <tr><td>Proposal</td><td>30%</td></tr>
          <tr><td>Negotiation</td><td>60%</td></tr>
          <tr><td>Contract</td><td>85%</td></tr>
          <tr><td>Closed Won</td><td>100%</td></tr>
          <tr><td>Closed Lost</td><td>0%</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Activities -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Activities</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Activities are a unified log of all client interactions. They are linked to any entity (company, contact, or deal) via the polymorphic <code class="bg-base-300 px-1 rounded text-xs">entityType</code> + <code class="bg-base-300 px-1 rounded text-xs">entityId</code> pair. An activity without a linked entity is a standalone log entry.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">type</td><td class="text-xs opacity-60">Call | Email | Meeting | Demo | Note | Task</td><td class="text-sm opacity-70">Activity category</td></tr>
          <tr><td class="font-mono text-xs">title</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Brief subject or description (required)</td></tr>
          <tr><td class="font-mono text-xs">body</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Freeform notes</td></tr>
          <tr><td class="font-mono text-xs">entityType</td><td class="text-xs opacity-60">contact | company | deal</td><td class="text-sm opacity-70">Entity this activity is linked to</td></tr>
          <tr><td class="font-mono text-xs">entityId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">The specific record being referenced</td></tr>
          <tr><td class="font-mono text-xs">scheduledAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">When the activity is planned</td></tr>
          <tr><td class="font-mono text-xs">completedAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">Set via PATCH to mark complete</td></tr>
          <tr><td class="font-mono text-xs">outcome</td><td class="text-xs opacity-60">Answered | No-show | Left Voicemail | Productive | N/A</td><td class="text-sm opacity-70">Result of the activity</td></tr>
          <tr><td class="font-mono text-xs">assignedTo</td><td class="text-xs opacity-60">userId</td><td class="text-sm opacity-70">Who is responsible for completing it</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Views -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Views</h2>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Overview</p>
        <p class="text-sm opacity-60 leading-relaxed">Dashboard with four KPI cards (open deals, pipeline value, closed-won revenue, activities this week), a pipeline funnel chart, and a recent activity feed. Available at <code class="bg-base-300 px-1 rounded text-xs">/crm</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Pipeline Kanban</p>
        <p class="text-sm opacity-60 leading-relaxed">Six stage columns. Drag deal cards between columns to change stage. Dropping into Closed Lost opens a modal to capture the lost reason before the PATCH fires. Column totals show aggregate deal value. Available at <code class="bg-base-300 px-1 rounded text-xs">/crm/pipeline</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Contacts &amp; Companies lists</p>
        <p class="text-sm opacity-60 leading-relaxed">Searchable, filterable lists with debounced client-side search hitting the API. Companies show a health score bar inline. Available at <code class="bg-base-300 px-1 rounded text-xs">/crm/contacts</code> and <code class="bg-base-300 px-1 rounded text-xs">/crm/companies</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Detail pages</p>
        <p class="text-sm opacity-60 leading-relaxed">Company, contact, and deal detail pages each show inline editable fields, linked entities, and a scoped activity feed. Breadcrumbs use the level color system: Company → <span class="badge badge-xs badge-primary">primary</span>, Contact → <span class="badge badge-xs badge-secondary">secondary</span>, Deal → <span class="badge badge-xs badge-success">success</span>, Activity → <span class="badge badge-xs badge-accent">accent</span>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Reports</p>
        <p class="text-sm opacity-60 leading-relaxed">Four pure-SVG charts: pipeline funnel by stage, activity volume by type, monthly revenue trend (last 6 months), and summary KPI cards. No charting libraries. Available at <code class="bg-base-300 px-1 rounded text-xs">/crm/reports</code>.</p>
      </div>
    </div>
  </div>

  <!-- API -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Endpoint</th><th>Permission</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/contacts</td><td class="text-xs opacity-60">crm_contacts:read</td><td class="text-sm opacity-70">List with search, status, role, companyId filters</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/crm/contacts</td><td class="text-xs opacity-60">crm_contacts:create</td><td class="text-sm opacity-70">Create contact</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/contacts/:id</td><td class="text-xs opacity-60">crm_contacts:read</td><td class="text-sm opacity-70">Single contact with companyName joined</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/crm/contacts/:id</td><td class="text-xs opacity-60">crm_contacts:update</td><td class="text-sm opacity-70">Partial update</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/crm/contacts/:id</td><td class="text-xs opacity-60">crm_contacts:delete</td><td class="text-sm opacity-70">Delete contact</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/companies</td><td class="text-xs opacity-60">crm_companies:read</td><td class="text-sm opacity-70">List with healthScore computed; search, type, industry filters</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/crm/companies</td><td class="text-xs opacity-60">crm_companies:create</td><td class="text-sm opacity-70">Create company</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/companies/:id</td><td class="text-xs opacity-60">crm_companies:read</td><td class="text-sm opacity-70">Single company with healthScore, dealCount</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/crm/companies/:id</td><td class="text-xs opacity-60">crm_companies:update</td><td class="text-sm opacity-70">Partial update</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/crm/companies/:id</td><td class="text-xs opacity-60">crm_companies:delete</td><td class="text-sm opacity-70">Delete company</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/deals</td><td class="text-xs opacity-60">crm_deals:read</td><td class="text-sm opacity-70">List; stage, companyId, assignedTo, closingBefore, excludeLost filters</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/crm/deals</td><td class="text-xs opacity-60">crm_deals:create</td><td class="text-sm opacity-70">Create deal; auto-sets probability from stage</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/deals/:id</td><td class="text-xs opacity-60">crm_deals:read</td><td class="text-sm opacity-70">Single deal with companyName joined</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/crm/deals/:id</td><td class="text-xs opacity-60">crm_deals:update</td><td class="text-sm opacity-70">Partial update; stage change auto-updates probability; lostReason required for Closed Lost</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/crm/deals/:id</td><td class="text-xs opacity-60">crm_deals:delete</td><td class="text-sm opacity-70">Delete deal</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/crm/activities</td><td class="text-xs opacity-60">crm_activities:read</td><td class="text-sm opacity-70">List; entityType+entityId, type, assignedTo, open filters</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/crm/activities</td><td class="text-xs opacity-60">crm_activities:create</td><td class="text-sm opacity-70">Create activity</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/crm/activities/:id</td><td class="text-xs opacity-60">crm_activities:update</td><td class="text-sm opacity-70">Update; send <code class="bg-base-300 px-1 rounded text-xs">completedAt</code> to mark complete</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/crm/activities/:id</td><td class="text-xs opacity-60">crm_activities:delete</td><td class="text-sm opacity-70">Delete activity</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Role</th><th>contacts</th><th>companies</th><th>deals</th><th>activities</th></tr></thead>
        <tbody>
          <tr><td>owner / admin</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td></tr>
          <tr><td>lead</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">CRU</td></tr>
          <tr><td>contributor</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">CRU</td></tr>
          <tr><td>viewer</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td></tr>
          <tr><td>customer</td><td class="text-xs opacity-70">—</td><td class="text-xs opacity-70">—</td><td class="text-xs opacity-70">—</td><td class="text-xs opacity-70">—</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70">Contributors can log activities against any entity but cannot create or edit contacts, companies, or deals. Customers have no access to any CRM data.</p>
  </div>

</div>
