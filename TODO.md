Critical gaps
[x] Time tracking
Zero time entry exists. No timesheets, no per-task logging, no billable-hours report. For hourly or T&M billing this is the most significant hole — you can't generate an accurate invoice without it.

[x] Project → Client linking
Agile milestones/sprints are not connected to CRM companies or contacts. You can't answer "show me all work billed to Acme Corp" or roll up hours per client. The two modules are completely siloed.

[x] Estimates / Proposals
Finance goes straight to Invoice. There's no quote or proposal stage — no finance_quotes collection, no /folio/estimates route. For web dev engagements you typically need a client-approved estimate before creating an invoice.

[x] Expense tracking
Invoices (revenue) exist but there's no expense record — no way to log hosting costs, software subscriptions, contractor payments, or reimbursable client expenses. Without it there's no P&L.

Secondary gaps
5. Retainer / hours-balance tracking
Subscriptions exist but they're flat-rate billing, not hours-consumed-against-retainer. A typical dev retainer model (20 hrs/mo, hours roll over or don't) has no data model here.

6. Client portal scope
The client portal only surfaces support tickets. Clients can't view project status, approve deliverables, download invoices, or sign off on estimates — all common web-dev workflow needs.

7. Financial summary / P&L report
The finance module tracks invoices and subscriptions but there's no revenue vs. expense dashboard, no tax-period summary, and no export (PDF/CSV) for an accountant.


CI/CD — GitHub Actions → Render; render.yaml already exists
CSV import for bulk contacts/invoices
Zoho/QuickBooks connectors
Rate limiting
S3 file storage (local volume is fine for two users)
Audit log UI (data is collected; surfacing it can wait)


FUTURE FOCUS
    onboarding new clients
    spinning up projects
    tracking leads
    generating invoices
    deployment checklists
    support triage
    proposal generation
    asset organization


zoho.com = 15k-20k/year (~45/month/per employee) for 30 employees.