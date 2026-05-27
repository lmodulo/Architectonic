# Business Model — Custom SaaS / ERP for Small Local Businesses

*Internal reference document. Sections marked `[MKT]` are written for direct lift into marketing copy.*

---

## 1. What We Do

We build custom business management software (ERP, workflow tools, internal systems) for small local businesses — typically 5 to 50 employees — at a price point that competes with generic SaaS subscriptions while delivering software that actually fits how the business operates.

We use AI-assisted development (Claude) to compress what was historically a 6–12 month, $200k+ custom build into a 4–8 week, $25–50k engagement. This lets us serve a customer segment that has always been too small for traditional custom development and too operationally specific for generic SaaS.

## 2. Market Context

The ERP and business management software market splits into three tiers:

| Tier | Examples | Annual Cost (30 users) | Implementation | Fit for Small Business |
|---|---|---|---|---|
| Enterprise | NetSuite, Dynamics 365, SAP | $50k–$150k+ | $30k–$250k | Overbuilt and overpriced |
| Mid-market SaaS | Zoho One, Salesforce, Odoo | $13k–$30k | $5k–$25k | Generic; requires workflow compromises |
| DIY stack | QuickBooks + Trello + Mailchimp + spreadsheets | $3k–$10k | Self-managed | Fragmented; data lives in 8 places |

Most small businesses run the DIY stack because tier 1 is unreachable and tier 2 forces them to change how they work to fit the software. They cope by maintaining tribal knowledge, spreadsheets, and a part-time bookkeeper who knows where everything is.

**Our position is a fourth tier:** custom software priced like tier 2, scoped to the specific workflows of one business, delivered fast enough to be commercially viable.

## 3. Target Customer

**Profile:**
- 5–50 employees
- $500k–$15M annual revenue
- Currently running QuickBooks + several disconnected tools, or a Zoho/Salesforce deployment they've outgrown or never fully adopted
- Has identifiable workflows that don't fit generic software (industry-specific scheduling, custom pricing rules, multi-step approvals, regulatory tracking)
- Owner-operator or small management team that makes buying decisions directly

**Vertical focus (recommended):**
Pick 1–3 industries and own them. Candidates with strong fit:
- Trades and field services (HVAC, plumbing, electrical, landscaping)
- Independent healthcare (dental, optometry, veterinary, physical therapy)
- Specialty manufacturing and fabrication shops
- Wholesale distribution and food service supply
- Property management and short-term rental operators

Vertical focus lets us reuse 60–80% of code across deployments, build accurate proposals quickly, and develop industry-specific marketing that converts better than generic outreach.

**Disqualifiers:**
- Businesses requiring multi-entity accounting, foreign currency, or formal audit trails (these need NetSuite-tier systems)
- Businesses in regulated industries with heavy compliance burdens unless we have specific expertise (HIPAA, PCI-DSS for direct card storage, FDA, etc.)
- Customers who want a "do everything" platform — they will be unhappy with our scoped approach
- Customers shopping primarily on lowest price — they want Zoho

## 4. Value Proposition

### [MKT] Against Zoho / generic SaaS
Generic SaaS makes you change how you work to fit the software. We build software that fits how you already work. The accounting tools generic ERPs include are useful; the workflow modules force you into someone else's idea of how a business should run. We replace the workflow modules with ones built for your business, and integrate with the accounting tools you already use.

### [MKT] Against NetSuite / enterprise ERP
NetSuite is built for companies with full-time IT, finance, and operations teams. Implementations take 4–6 months and cost more than most small businesses make in profit. Our deployments take 4–8 weeks and cost less than one year of NetSuite licensing.

### [MKT] Against the DIY stack
Most small businesses run six to ten disconnected tools held together by spreadsheets and the owner's memory. When the bookkeeper goes on vacation, work stops. We consolidate the workflow into one system that anyone on the team can use, with the data in one place and exportable on demand.

### What we do NOT claim
- We are not cheaper than Zoho on a per-user basis at steady state
- We are not a full replacement for accounting software (we integrate with QuickBooks/Xero)
- We do not build customer-facing e-commerce platforms (Shopify exists)
- We do not provide ongoing IT support for a customer's broader infrastructure

## 5. Service Offering

### Tier 1: Base Deployment
- Discovery and workflow mapping (10–20 hours)
- Core application build (3 to 5 primary workflows)
- Data migration from existing systems
- Integration with 2–3 external tools (typically QuickBooks, Stripe, email/calendar)
- Initial training (4 hours, recorded)
- 60-day stabilization period with bug fixes and minor adjustments included

**Price: $25,000–$50,000 fixed, scoped per engagement**

### Tier 2: Add-on Modules
Custom modules added after base deployment or as part of an expanded initial scope. Examples: advanced reporting dashboards, custom pricing engines, scheduling and dispatch, inventory tracking, document generation, customer portals, mobile field apps.

**Price: $5,000–$15,000 per module, fixed**

### Tier 3: Managed Hosting and Support (recurring)
- Application hosting on managed infrastructure
- Security patches and dependency updates
- Daily backups with documented restore process
- Bug fixes
- Up to 4 hours/month of minor enhancements
- Email and scheduled-call support
- 99.5% uptime target

**Price: $25–$60 per active user per month, with a minimum of $500/month per customer**

### Tier 4: Custom Development Retainer (optional)
For customers needing ongoing feature development beyond the 4 hours included in support. Sold in blocks of 10 or 20 hours per month at a discounted rate vs. project work.

**Price: $150–$200 per hour, billed monthly**

## 6. Pricing Logic

Our pricing is structured around three principles:

1. **Front-load the deployment fee to fund real engineering effort.** A custom build at $10k loses money the first time a client asks for revisions. $25–50k provides enough margin to absorb normal scope drift.

2. **Recurring revenue funds the ongoing relationship.** Hosting + support at $25–60/user/month means a 20-user customer generates $6,000–14,400/year of recurring revenue. Across 10–15 customers, this funds a small ongoing operation without requiring constant new sales.

3. **Hosting is included, not optional.** Asking small businesses to self-host is a guaranteed support nightmare. We host on $50–200/month infrastructure that we bill at $500–1,500/month bundled into support. The markup funds the operational work that hosting requires.

## 7. Unit Economics

**Per-customer five-year model (mid-range assumptions, 20-user customer):**

| Year | Revenue | Direct Cost | Margin |
|---|---|---|---|
| 1 | $35k deployment + $6k support (partial year) = $41k | $18k (build labor + Claude API + infra) | $23k |
| 2 | $12k support + $5k for one module add | $4k | $13k |
| 3 | $12k support | $3k | $9k |
| 4 | $12k support + $8k for module add | $5k | $15k |
| 5 | $12k support | $3k | $9k |
| **Total** | **$90k** | **$33k** | **$57k** |

**Five-year customer margin: ~$57k. Average annual margin per customer at steady state: ~$10k.**

**Capacity model:**
- One operator can deliver 8–12 new deployments per year
- One operator can support 20–30 active customers in steady state before needing help
- At 20 active customers + 8 new deployments/year, gross revenue is roughly $300–400k with $150–250k margin before owner compensation
- This is a viable single-operator business; scaling beyond requires hiring and changes the economics

## 8. Operational Model

### How Claude fits in the workflow
- Requirements documents drafted with Claude, reviewed with customer
- Schema design and initial scaffolding generated with Claude
- Boilerplate (CRUD, auth, admin UI, reports) generated with Claude, reviewed by operator
- Business logic written collaboratively, with operator owning correctness
- Test generation and edge case enumeration with Claude
- Documentation generated with Claude

Operator time concentrates on: customer relationship, scope discipline, architecture decisions, integration debugging, anything touching money or PII, deployment, and training.

### What we standardize across customers
- Auth, user management, billing integration, audit logging
- Hosting setup and CI/CD pipeline
- Backup and restore procedures
- Customer onboarding checklist
- Project templates per vertical

This is where vertical focus pays off — the second HVAC company gets 70% of the first one's codebase for free.

### What we customize per customer
- Workflow definitions
- Reports and dashboards
- Pricing and quote logic
- Integration mappings
- UI labels and terminology

## 9. Competitive Advantages

### [MKT] Why we can do this and Zoho can't
Zoho serves millions of customers with a single codebase. Customizing for one business would cost them more than the customer is worth. We pick up where their economics fail — customers who need something specific enough that mass-market software can't justify building it.

### [MKT] Why we can do this and a traditional dev shop can't
Traditional custom software costs $150–400/hour and takes thousands of hours. A real custom ERP from a normal agency starts at $200k and takes a year. AI-assisted development changes the labor math: the same scope takes a fraction of the hours, which is what makes the $25–50k price point work without sacrificing quality.

### [MKT] Why we can do this and an offshore dev shop can't
Offshore shops can match the price but not the model. Custom business software requires deep conversation about how the business operates — conversations that happen better with someone in the same timezone, language, and business culture. Our advantage is being local, available, and capable of having a one-hour discovery call that actually maps the workflow correctly.

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope creep on fixed-price deployments | Strict change-order process, written sign-off on workflow spec before build |
| Customer expects unlimited support for $500/month | Clear contract terms on support inclusions; escalation to retainer or hourly for excess |
| One operator becomes single point of failure | Code conventions and documentation enforced from day one; second operator hired at ~15 active customers |
| Claude API pricing changes affect cost structure | Monitor token consumption per project; pricing model has room to absorb 2-3x API cost increases |
| Customer outgrows the system | Build with clean data export from day one; this is a feature, not a bug — graceful exit preserves referrals |
| Liability for downtime, data loss, or bugs | E&O insurance, contractual limitations of liability, documented backup and restore |
| Customer wants to take the code and self-host | Offer source code release as a paid option ($10–20k); price it to reflect the loss of recurring revenue |

## 11. Go-to-Market

### Phase 1 (months 1–6): Prove the model
- Build 2–3 deployments at reduced rate for case study customers in one vertical
- Document everything: workflow templates, time tracking, support patterns
- Generate 3 published case studies with named customers, real numbers, and demos

### Phase 2 (months 6–18): Vertical traction
- Direct outreach to businesses in the chosen vertical: industry associations, trade publications, local business groups
- Content marketing focused on the vertical (blog posts, comparison guides, ROI calculators)
- Referral incentives for existing customers
- Targeted ads against competitor keywords ("[vertical] + Zoho problems," "[vertical] + custom software")

### Phase 3 (month 18+): Scale or specialize
- Decision point: add a second operator and a second vertical, or stay solo and go deeper in one
- Either path is viable; the choice affects lifestyle, risk, and ceiling

## 12. Extractable Marketing Statements

For lifting into website copy, sales decks, and outreach:

> Generic ERP software was built for everyone. We build software for your business specifically — same price as a Zoho subscription, scoped to how you actually work.

> NetSuite costs more in implementation than most small businesses make in a year. We deliver a working custom system in 4–8 weeks for less than NetSuite's first month.

> Most small businesses run their operations across QuickBooks, three spreadsheets, two SaaS tools, and the owner's memory. We replace the spreadsheets and the memory.

> AI-assisted development lets us deliver custom business software at the price point that used to only buy you a license to someone else's software.

> We don't try to be everything. We build the three or four workflows your business actually depends on, and integrate with the tools you already use for the rest.

---

*Document version: 1.0. Update pricing tables quarterly. Update market context section annually or when a major competitor changes pricing.*
