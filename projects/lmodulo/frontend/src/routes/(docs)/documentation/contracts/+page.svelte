<svelte:head>
  <title>Contracts — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Contracts</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The Contracts module formalises the relationship between a closed deal and a billable project. Staff create MSA, SOW, NDA, or blank contracts from reusable templates, send them to one or more signers via a secure token link, and capture legally-binding e-signatures — all without a paid third-party signing service. Signed contracts are tracked in a searchable list and printable as PDF via the browser's native print dialog. The module lives at <code class="bg-base-300 px-1 rounded text-xs">/contracts</code>; the public signing page is at <code class="bg-base-300 px-1 rounded text-xs">/contracts/sign/:token</code> and requires no authentication.
    </p>
  </div>

  <!-- Data Model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>contracts              ← a specific document created from a template or blank
  └── signers[]          ← embedded snapshot of each signer's status (kept in sync)

contract_templates     ← reusable HTML templates with &#123;&#123;variable&#125;&#125; placeholders
contract_signers       ← one record per signer per send; holds the signing token + audit data</code></pre>
    <p class="text-sm opacity-70 leading-relaxed">
      Signers are stored in two places: embedded in the <code class="bg-base-300 px-1 rounded text-xs">contracts</code> document (for fast reads) and as individual documents in <code class="bg-base-300 px-1 rounded text-xs">contract_signers</code> (for the public signing flow, where only the token is known). Both are kept in sync when a signer signs or declines.
    </p>
  </div>

  <!-- contracts collection -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">contracts</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">title</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Display name, e.g. <em>ACME Corp — MSA 2026</em></td></tr>
          <tr><td class="font-mono text-xs">type</td><td class="text-xs opacity-60">msa | sow | nda | custom</td><td class="text-sm opacity-70">Contract category — drives the icon and type badge in the UI</td></tr>
          <tr><td class="font-mono text-xs">content</td><td class="text-xs opacity-60">string (HTML)</td><td class="text-sm opacity-70">Rendered HTML; <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;variable&#125;&#125;</code> placeholders should be replaced before saving</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">draft | pending_signature | signed | active | expired | voided</td><td class="text-sm opacity-70">Lifecycle state (see table below)</td></tr>
          <tr><td class="font-mono text-xs">companyId</td><td class="text-xs opacity-60">ObjectId ref?</td><td class="text-sm opacity-70">CRM company party to this contract; <em>companyName</em> joined on read</td></tr>
          <tr><td class="font-mono text-xs">dealId</td><td class="text-xs opacity-60">ObjectId ref?</td><td class="text-sm opacity-70">CRM deal that originated this contract</td></tr>
          <tr><td class="font-mono text-xs">estimateId</td><td class="text-xs opacity-60">ObjectId ref?</td><td class="text-sm opacity-70">Folio estimate linked to a SOW</td></tr>
          <tr><td class="font-mono text-xs">value</td><td class="text-xs opacity-60">number?</td><td class="text-sm opacity-70">Contract dollar value</td></tr>
          <tr><td class="font-mono text-xs">currency</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">ISO 4217, default USD</td></tr>
          <tr><td class="font-mono text-xs">effectiveDate</td><td class="text-xs opacity-60">date?</td><td class="text-sm opacity-70">When the contract takes effect</td></tr>
          <tr><td class="font-mono text-xs">expiryDate</td><td class="text-xs opacity-60">date?</td><td class="text-sm opacity-70">When the contract expires; used by the status index</td></tr>
          <tr><td class="font-mono text-xs">signers</td><td class="text-xs opacity-60">&#123; name, email, role, status, signedAt &#125;[]</td><td class="text-sm opacity-70">Embedded snapshot; updated in place when a signer signs or declines</td></tr>
          <tr><td class="font-mono text-xs">createdBy</td><td class="text-xs opacity-60">userId</td><td class="text-sm opacity-70">Staff member who created the contract; receives signing-complete emails</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold">Contract lifecycle</h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Status</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">draft</td><td class="text-sm opacity-70">Created but not yet sent — editable; visible only to staff</td></tr>
          <tr><td class="font-mono text-xs">pending_signature</td><td class="text-sm opacity-70">Send for Signature clicked — signing links emailed; contract locked from editing</td></tr>
          <tr><td class="font-mono text-xs">signed</td><td class="text-sm opacity-70">All signers have signed — set automatically when the last signer completes</td></tr>
          <tr><td class="font-mono text-xs">active</td><td class="text-sm opacity-70">Manually set by staff to indicate the contract is in force</td></tr>
          <tr><td class="font-mono text-xs">expired</td><td class="text-sm opacity-70">Past <code class="bg-base-300 px-1 rounded text-xs">expiryDate</code></td></tr>
          <tr><td class="font-mono text-xs">voided</td><td class="text-sm opacity-70">Manually voided — terminal state</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- contract_templates collection -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">contract_templates</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Templates are HTML documents with <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;variable&#125;&#125;</code> placeholders that staff replace when creating a contract. Three default templates are seeded at startup — they carry <code class="bg-base-300 px-1 rounded text-xs">isDefault: true</code> and cannot be deleted, only viewed and used as a starting point.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">name</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Display name, e.g. <em>Master Service Agreement</em></td></tr>
          <tr><td class="font-mono text-xs">type</td><td class="text-xs opacity-60">msa | sow | nda | custom</td><td class="text-sm opacity-70">Template category</td></tr>
          <tr><td class="font-mono text-xs">description</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Short summary shown in the template picker</td></tr>
          <tr><td class="font-mono text-xs">content</td><td class="text-xs opacity-60">string (HTML)</td><td class="text-sm opacity-70">Full HTML body; pre-populated in Step 3 of the New Contract wizard</td></tr>
          <tr><td class="font-mono text-xs">variables</td><td class="text-xs opacity-60">string[]</td><td class="text-sm opacity-70">List of placeholder names extracted from content, shown as code chips on the template card</td></tr>
          <tr><td class="font-mono text-xs">isDefault</td><td class="text-xs opacity-60">boolean</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">true</code> on seeded templates — delete is blocked at the API level (400)</td></tr>
          <tr><td class="font-mono text-xs">createdBy</td><td class="text-xs opacity-60">userId?</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">null</code> for seeded templates; set to the creating staff member for custom templates</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-2">Default templates</h3>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">MSA — Master Service Agreement</p>
        <p class="text-sm opacity-60 leading-relaxed">Governs the ongoing service relationship. Includes: scope of services (references SOW addenda), <strong>IP ownership</strong> (all deliverables belong to Client on full payment; Provider retains portfolio right unless NDA), confidentiality (mutual), term &amp; termination (30-day written notice), <strong>payment terms Net 30</strong> with <strong>late payment at 1.5%/month (18%/year)</strong> on overdue balances, limitation of liability (capped at fees paid in the last 12 months), and governing law placeholder.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">SOW — Statement of Work</p>
        <p class="text-sm opacity-60 leading-relaxed">Defines scope, deliverables, and fees for a specific project. Incorporates the MSA by reference. Includes: project scope (in/out of scope), deliverables with acceptance criteria, milestone timeline, <strong>maintenance warranty</strong> (<code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;warrantyDays&#125;&#125;</code> days free bug fixes post-delivery), post-warranty <strong>support rate</strong> at <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;supportRate&#125;&#125;/hour</code>, and <strong>change order pricing</strong> at <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;changeOrderRate&#125;&#125;/hour</code> for scope additions.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">NDA — Non-Disclosure Agreement</p>
        <p class="text-sm opacity-60 leading-relaxed">Mutual confidentiality — use before sharing sensitive information. Includes: confidential information definition, obligations (hold in confidence, no disclosure, no use outside engagement), exclusions (public domain, independently developed, legally required), term of <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;ndaTerm&#125;&#125;</code> years from effective date, return/destruction of materials on termination, and injunctive relief available without bond.</p>
      </div>
    </div>

    <h3 class="text-base font-semibold mt-2">Template variables</h3>
    <p class="text-sm opacity-70 leading-relaxed">Variables are written as <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;variableName&#125;&#125;</code> in the HTML content. The New Contract wizard pre-populates the content field in Step 3 — staff replace variables by editing the textarea before saving.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Variable</th><th>Used in</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">clientName</td><td class="text-xs opacity-60">MSA, SOW, NDA</td><td class="text-sm opacity-70">Full legal name of the client company</td></tr>
          <tr><td class="font-mono text-xs">clientAddress</td><td class="text-xs opacity-60">MSA, SOW, NDA</td><td class="text-sm opacity-70">Registered address of the client</td></tr>
          <tr><td class="font-mono text-xs">providerName</td><td class="text-xs opacity-60">MSA, SOW, NDA</td><td class="text-sm opacity-70">Full legal name of the service provider (your company)</td></tr>
          <tr><td class="font-mono text-xs">providerAddress</td><td class="text-xs opacity-60">MSA, SOW, NDA</td><td class="text-sm opacity-70">Registered address of the provider</td></tr>
          <tr><td class="font-mono text-xs">effectiveDate</td><td class="text-xs opacity-60">MSA, SOW, NDA</td><td class="text-sm opacity-70">The date the agreement takes legal effect</td></tr>
          <tr><td class="font-mono text-xs">projectTitle</td><td class="text-xs opacity-60">SOW</td><td class="text-sm opacity-70">Name of the specific project or engagement</td></tr>
          <tr><td class="font-mono text-xs">projectFees</td><td class="text-xs opacity-60">SOW</td><td class="text-sm opacity-70">Total project fee amount</td></tr>
          <tr><td class="font-mono text-xs">paymentSchedule</td><td class="text-xs opacity-60">SOW</td><td class="text-sm opacity-70">Milestones or dates when invoices are issued</td></tr>
          <tr><td class="font-mono text-xs">governingLaw</td><td class="text-xs opacity-60">MSA</td><td class="text-sm opacity-70">State/country whose law governs the agreement</td></tr>
          <tr><td class="font-mono text-xs">supportRate</td><td class="text-xs opacity-60">SOW</td><td class="text-sm opacity-70">Hourly rate for post-warranty support</td></tr>
          <tr><td class="font-mono text-xs">warrantyDays</td><td class="text-xs opacity-60">SOW</td><td class="text-sm opacity-70">Number of days free bug-fix support after delivery</td></tr>
          <tr><td class="font-mono text-xs">changeOrderRate</td><td class="text-xs opacity-60">SOW</td><td class="text-sm opacity-70">Hourly rate for approved scope additions</td></tr>
          <tr><td class="font-mono text-xs">ndaTerm</td><td class="text-xs opacity-60">NDA</td><td class="text-sm opacity-70">Duration of confidentiality obligations (years)</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- contract_signers collection -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">contract_signers</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      One document per signer per send. Holds the secure token used in the public signing URL and the audit record written at signing time.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">contractId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Parent contract</td></tr>
          <tr><td class="font-mono text-xs">name</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Signer's full name</td></tr>
          <tr><td class="font-mono text-xs">email</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Email address the signing link was sent to</td></tr>
          <tr><td class="font-mono text-xs">role</td><td class="text-xs opacity-60">client | provider | witness</td><td class="text-sm opacity-70">Party's role in the contract</td></tr>
          <tr><td class="font-mono text-xs">token</td><td class="text-xs opacity-60">string (unique)</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">crypto.randomUUID()</code>; appears in the signing URL — unique index</td></tr>
          <tr><td class="font-mono text-xs">tokenExpiresAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">30 days from when the contract was sent; expired links show a terminal error page</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">pending | signed | declined</td><td class="text-sm opacity-70">Updated on signing or decline</td></tr>
          <tr><td class="font-mono text-xs">signatureData</td><td class="text-xs opacity-60">string? (base64 PNG)</td><td class="text-sm opacity-70">Canvas drawing captured on the public signing page</td></tr>
          <tr><td class="font-mono text-xs">signedAt</td><td class="text-xs opacity-60">date?</td><td class="text-sm opacity-70">Server timestamp at signing</td></tr>
          <tr><td class="font-mono text-xs">declinedAt</td><td class="text-xs opacity-60">date?</td><td class="text-sm opacity-70">Server timestamp at decline</td></tr>
          <tr><td class="font-mono text-xs">declinedReason</td><td class="text-xs opacity-60">string?</td><td class="text-sm opacity-70">Optional reason text submitted on decline</td></tr>
          <tr><td class="font-mono text-xs">ipAddress</td><td class="text-xs opacity-60">string?</td><td class="text-sm opacity-70">Signer's IP at time of signature — audit trail</td></tr>
          <tr><td class="font-mono text-xs">userAgent</td><td class="text-xs opacity-60">string?</td><td class="text-sm opacity-70">Browser User-Agent string — audit trail</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- E-Signature Flow -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">E-Signature Flow</h2>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-3 text-sm">
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">1</span><p class="opacity-70">Staff creates a contract from a template (or blank) via the 3-step wizard at <code class="bg-base-300 px-1 rounded text-xs">/contracts/new</code>.</p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">2</span><p class="opacity-70">On the contract detail page, staff clicks <strong>Send for Signature</strong>, enters each signer's name, email, and role, then confirms.</p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">3</span><p class="opacity-70">The API creates a <code class="bg-base-300 px-1 rounded text-xs">contract_signers</code> record per signer with a <code class="bg-base-300 px-1 rounded text-xs">crypto.randomUUID()</code> token and 30-day expiry. Contract status moves to <code class="bg-base-300 px-1 rounded text-xs">pending_signature</code>.</p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">4</span><p class="opacity-70">Each signer receives an email with a link: <code class="bg-base-300 px-1 rounded text-xs">https://[app]/contracts/sign/[token]</code></p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">5</span><p class="opacity-70">The signing page loads the contract HTML (read-only), a canvas signature pad, and a consent checkbox. No login is required — the token is the credential.</p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">6</span><p class="opacity-70">The signer draws their signature and checks "I have read and agree…" then clicks <strong>Sign Document</strong>.</p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">7</span><p class="opacity-70">The API records <code class="bg-base-300 px-1 rounded text-xs">signatureData</code> (PNG), <code class="bg-base-300 px-1 rounded text-xs">signedAt</code>, <code class="bg-base-300 px-1 rounded text-xs">ipAddress</code>, and <code class="bg-base-300 px-1 rounded text-xs">userAgent</code>. The embedded signer entry on the contract document is updated in place.</p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">8</span><p class="opacity-70">The contract creator receives an email: <em>"[Name] has signed [Contract Title]."</em></p></div>
      <div class="flex gap-3"><span class="badge badge-primary badge-sm shrink-0 mt-0.5">9</span><p class="opacity-70">When every signer has signed, the contract's status automatically moves to <code class="bg-base-300 px-1 rounded text-xs">signed</code> and a "fully executed" email is sent to the creator.</p></div>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-1">
      <p class="font-semibold">Signing page states</p>
      <ul class="space-y-1 opacity-70 leading-relaxed list-disc list-inside">
        <li><strong>pending</strong> — normal flow: shows contract HTML, canvas pad, consent checkbox</li>
        <li><strong>expired</strong> — token past 30-day expiry; tells the signer to contact the sender</li>
        <li><strong>already_signed</strong> — shows the signed date; no re-signing possible</li>
        <li><strong>declined</strong> — shows a terminal "you declined" message</li>
        <li><strong>not_found</strong> — invalid or removed token</li>
      </ul>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-1">
      <p class="font-semibold">Decline flow</p>
      <p class="opacity-70 leading-relaxed">On the signing page a "Decline to Sign" button opens a sub-form with an optional reason textarea. Submitting POSTs to <code class="bg-base-300 px-1 rounded text-xs">/contracts/sign/:token/decline</code>, sets the signer's status to <code class="bg-base-300 px-1 rounded text-xs">declined</code>, and notifies the contract creator.</p>
    </div>
  </div>

  <!-- Frontend Views -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Frontend Views</h2>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Contracts list <code class="bg-base-300 px-1 rounded text-xs">/contracts</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Status filter buttons (All / Draft / Pending Signature / Signed / Active / Expired / Voided). Table with title, type badge, company, value, last updated, and status badge. New Contract button requires <code class="bg-base-300 px-1 rounded text-xs">contracts:create</code>. Customer users see only contracts where their email appears in <code class="bg-base-300 px-1 rounded text-xs">signers[].email</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">New Contract wizard <code class="bg-base-300 px-1 rounded text-xs">/contracts/new</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Three-step flow: <strong>Step 1</strong> — template picker cards (MSA / SOW / NDA / any custom templates / Blank Document); <strong>Step 2</strong> — metadata (title, company, value, currency, effective date, expiry date); <strong>Step 3</strong> — HTML content editor pre-populated from the chosen template. On submit, navigates to <code class="bg-base-300 px-1 rounded text-xs">/contracts/[id]</code>. Accepts a <code class="bg-base-300 px-1 rounded text-xs">dealId</code> query param to pre-link to a CRM deal.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Contract detail <code class="bg-base-300 px-1 rounded text-xs">/contracts/[id]</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Header with title (inline-editable in draft/active), type badge, status badge, company name. Meta cards: value, effective date, expiry date, created date. Signers panel (shown when signers exist) with per-signer status badges and signed timestamps. Full contract HTML rendered as prose. Action bar: <strong>Edit</strong> (draft/active only), <strong>Send for Signature</strong> (draft/active), <strong>Void</strong> (non-draft, non-voided), <strong>Delete</strong> (draft only), <strong>Print</strong> (triggers <code class="bg-base-300 px-1 rounded text-xs">window.print()</code>). The Send modal lets staff add signers (name + email + role) with a running list before confirming. Print CSS hides the sidebar and header for a clean PDF.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Templates <code class="bg-base-300 px-1 rounded text-xs">/contracts/templates</code></p>
        <p class="text-sm opacity-60 leading-relaxed">List of all templates with type badge, Default badge (seeded), and variable code chips. Inline editing (name, description, HTML content) for all templates; delete for non-default templates only. New Template modal with name, type, description, and content fields. Requires <code class="bg-base-300 px-1 rounded text-xs">contract_templates:read</code> to view; <code class="bg-base-300 px-1 rounded text-xs">contract_templates:create/update/delete</code> for mutations.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Public signing page <code class="bg-base-300 px-1 rounded text-xs">/contracts/sign/[token]</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Standalone page with no sidebar or authentication. Branded header (company logo / name from settings). Scrollable contract HTML. Canvas signature pad with mouse and touch support, Clear button. Consent checkbox. Sign button and Decline option. Terminal states (expired, already signed, declined, not found) each render a distinct card. The layout.server.ts skips the auth redirect for this path prefix.</p>
      </div>
    </div>
  </div>

  <!-- API Reference -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Endpoint</th><th>Auth</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/contracts</td><td class="text-xs opacity-60">contracts:read</td><td class="text-sm opacity-70">List contracts. Query: <code class="bg-base-300 px-1 rounded text-xs">status</code>, <code class="bg-base-300 px-1 rounded text-xs">companyId</code>, <code class="bg-base-300 px-1 rounded text-xs">type</code>. Customer role auto-scoped to <code class="bg-base-300 px-1 rounded text-xs">signers.email</code>.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/contracts</td><td class="text-xs opacity-60">contracts:create</td><td class="text-sm opacity-70">Create contract; body: <code class="bg-base-300 px-1 rounded text-xs">title, type, content, companyId?, dealId?, value?, currency, effectiveDate?, expiryDate?</code></td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/contracts/:id</td><td class="text-xs opacity-60">contracts:read</td><td class="text-sm opacity-70">Single contract with <code class="bg-base-300 px-1 rounded text-xs">companyName</code> joined and full <code class="bg-base-300 px-1 rounded text-xs">signerDetails</code> array from <code class="bg-base-300 px-1 rounded text-xs">contract_signers</code></td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/contracts/:id</td><td class="text-xs opacity-60">contracts:update</td><td class="text-sm opacity-70">Update title and/or content; only allowed when status is <code class="bg-base-300 px-1 rounded text-xs">draft</code> or <code class="bg-base-300 px-1 rounded text-xs">active</code></td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/contracts/:id</td><td class="text-xs opacity-60">contracts:delete</td><td class="text-sm opacity-70">Delete; only allowed when status is <code class="bg-base-300 px-1 rounded text-xs">draft</code></td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/contracts/:id/send</td><td class="text-xs opacity-60">contracts:update</td><td class="text-sm opacity-70">Send for signature; body: <code class="bg-base-300 px-1 rounded text-xs">signers: &#123; name, email, role &#125;[]</code>. Creates <code class="bg-base-300 px-1 rounded text-xs">contract_signers</code> records, sends signing emails, sets status to <code class="bg-base-300 px-1 rounded text-xs">pending_signature</code>.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/contracts/:id/void</td><td class="text-xs opacity-60">contracts:update</td><td class="text-sm opacity-70">Mark voided; sets status to <code class="bg-base-300 px-1 rounded text-xs">voided</code> regardless of current status</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/contracts/templates</td><td class="text-xs opacity-60">contract_templates:read</td><td class="text-sm opacity-70">List all templates, sorted: defaults first, then by name</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/contracts/templates</td><td class="text-xs opacity-60">contract_templates:create</td><td class="text-sm opacity-70">Create custom template; always sets <code class="bg-base-300 px-1 rounded text-xs">isDefault: false</code></td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/contracts/templates/:id</td><td class="text-xs opacity-60">contract_templates:read</td><td class="text-sm opacity-70">Single template</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/contracts/templates/:id</td><td class="text-xs opacity-60">contract_templates:update</td><td class="text-sm opacity-70">Update name, description, content</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/contracts/templates/:id</td><td class="text-xs opacity-60">contract_templates:delete</td><td class="text-sm opacity-70">Delete; returns 400 if <code class="bg-base-300 px-1 rounded text-xs">isDefault: true</code></td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/contracts/sign/:token</td><td class="text-xs opacity-60">None (public)</td><td class="text-sm opacity-70">Returns contract content + signer info, or <code class="bg-base-300 px-1 rounded text-xs">&#123; expired: true &#125;</code> / <code class="bg-base-300 px-1 rounded text-xs">&#123; alreadySigned: true &#125;</code> / <code class="bg-base-300 px-1 rounded text-xs">&#123; declined: true &#125;</code></td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/contracts/sign/:token</td><td class="text-xs opacity-60">None (public)</td><td class="text-sm opacity-70">Submit signature; body: <code class="bg-base-300 px-1 rounded text-xs">signatureData</code> (base64 PNG), <code class="bg-base-300 px-1 rounded text-xs">consent: true</code>. Records audit fields; sends email to creator; sets contract to <code class="bg-base-300 px-1 rounded text-xs">signed</code> if all done.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/contracts/sign/:token/decline</td><td class="text-xs opacity-60">None (public)</td><td class="text-sm opacity-70">Decline to sign; body: <code class="bg-base-300 px-1 rounded text-xs">reason?</code>. Records <code class="bg-base-300 px-1 rounded text-xs">declinedAt</code>, <code class="bg-base-300 px-1 rounded text-xs">declinedReason</code>; notifies creator.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Role</th><th>contracts</th><th>contract_templates</th></tr></thead>
        <tbody>
          <tr><td>owner / admin</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td></tr>
          <tr><td>lead</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">R</td></tr>
          <tr><td>contributor</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td></tr>
          <tr><td>viewer</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td></tr>
          <tr><td>customer</td><td class="text-xs opacity-70">R (own)</td><td class="text-xs opacity-70">—</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      "Own" for customers means contracts where their email appears in the <code class="bg-base-300 px-1 rounded text-xs">signers[].email</code> array — the API injects this filter automatically. The public signing endpoints (<code class="bg-base-300 px-1 rounded text-xs">/contracts/sign/:token</code>) require no session at all — the token is the credential. Default templates can be edited but not deleted by anyone; non-default templates can be deleted by those with <code class="bg-base-300 px-1 rounded text-xs">contract_templates:delete</code>.
    </p>
  </div>

  <!-- PDF -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">PDF Generation</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Contracts are printable as PDF via the browser's native print dialog — no server-side rendering or library required. The contract detail page includes a <strong>Print</strong> button that calls <code class="bg-base-300 px-1 rounded text-xs">window.print()</code>. The page's <code class="bg-base-300 px-1 rounded text-xs">@media print</code> CSS hides the sidebar, header, and action buttons so only the document prose is included in the output. Users can choose <em>Save as PDF</em> in the browser's print dialog.
    </p>
  </div>

  <!-- Indexes -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">MongoDB Indexes</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>// contracts
&#123; companyId: 1, status: 1 &#125;
&#123; dealId: 1 &#125;          // sparse
&#123; estimateId: 1 &#125;      // sparse
&#123; status: 1, expiryDate: 1 &#125;
&#123; createdBy: 1, createdAt: -1 &#125;
&#123; createdAt: -1 &#125;

// contract_templates
&#123; type: 1 &#125;
&#123; isDefault: 1 &#125;

// contract_signers
&#123; contractId: 1, status: 1 &#125;
&#123; token: 1 &#125;          // UNIQUE
&#123; email: 1, status: 1 &#125;
&#123; tokenExpiresAt: 1 &#125;  // for future cleanup jobs</code></pre>
  </div>

</div>
