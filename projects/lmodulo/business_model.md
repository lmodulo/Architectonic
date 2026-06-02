# Business Model — Vertical SaaS Factory (Custom-First) for Small Local Businesses

*Internal reference document. Sections marked `[MKT]` are written for direct lift into marketing copy.*

---

## 1. What We Do

We build custom business management software (ERP, workflow tools, internal systems) for small local businesses — typically 5 to 50 employees — at a price point that competes with generic SaaS subscriptions while delivering software that actually fits how the business operates.

We do this **one vertical at a time**. We are not a generic "small business software" shop; that's a customer size, not a market. We pick an industry, learn its workflows deeply, and reuse the result across every customer that shares them.

AI-assisted development is the mechanism that makes the price point possible: it compresses what was historically a 6–12 month, $200k+ custom build into a 4–8 week, $25–50k engagement. The judgment stays human — architecture, scope, integrations, and anything touching money or PII are owned by an operator, not generated and shipped unreviewed. That distinction matters both for quality and for how the business is valued (see §1.1).

This lets us serve a customer segment that has always been too small for traditional custom development and too operationally specific for generic SaaS.

### 1.1 The actual strategy: a vertical SaaS factory

The simplest framing — "custom software priced like SaaS" — undersells what this is and anchors it to the wrong valuation multiple. Custom-software shops are valued on consulting multiples; repeatable products are valued on SaaS multiples.

What we are really building is a **vertical SaaS factory that begins as custom work**:

1. **Custom deployments** for real customers in one vertical.
2. **Pattern recognition** — identify the workflows that recur across every customer in that vertical.
3. **Vertical modules** — package the recurring workflows as standard, reusable modules.
4. **Productization** — turn the strongest vertical into a repeatable platform.
5. **Vertical SaaS company** — operate a productized platform in that industry, with proven workflows and paying customers already in hand.

Every custom deployment funds the move along this path and tells us exactly which product to build. The closer we get to a repeatable vertical platform, the more the business is worth and the less each new customer costs to serve.

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

### Vertical focus is not optional — it's the model

Pick one vertical first, own it, then add a second only by deliberate decision (see §11, Phase 3). The capacity and margin assumptions in §7 hold *only* under vertical focus; without it, every deployment is a fresh build and the reuse curve never kicks in.

**First-vertical selection criteria:**
- A workflow spine that's consistent across companies in the industry (so code reuse is real)
- Enough local density to reach 10+ customers without geographic sprawl
- Pain with generic SaaS that's specific and articulable (so marketing converts)
- No heavy compliance burden we can't yet support (see Disqualifiers)

**Candidate verticals, ranked by fit:**
1. **Trades and field services** (HVAC, plumbing, electrical, landscaping) — strong shared spine: dispatch, scheduling, job costing, recurring maintenance contracts, mobile time entry. Recommended first vertical.
2. Independent healthcare (dental, optometry, veterinary, physical therapy) — strong spine but watch HIPAA scope.
3. Specialty manufacturing and fabrication shops
4. Wholesale distribution and food service supply
5. Property management and short-term rental operators

The recommendation is to commit to **one** of these (trades/field services unless discovery says otherwise), prove the model there, and treat the others as a backlog — not a simultaneous target.

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
Custom modules added after base deployment or as part of an expanded initial scope. Examples: advanced reporting dashboards, custom pricing engines, scheduling and dispatch, inventory tracking, document generation, customer portals, mobile field apps. As a vertical matures, these shift from custom builds toward catalog modules (see §1.1) — the same module sold repeatedly is where margin improves fastest.

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

**Critical dependency — these numbers assume vertical focus.** The 20–30 active-customer ceiling and the year-2-onward cost figures are only achievable if support load stays predictable and customizations stay controlled. That predictability comes from verticalization: when the tenth HVAC customer's requests resemble the previous nine, support is bounded and module reuse is high. Without a vertical, each customer is a bespoke system with bespoke support, and the realistic single-operator ceiling drops to roughly 8–12 active customers — at which point the business is a custom-dev consultancy, not a product company. The capacity model and the vertical strategy (§3) are the same decision viewed from two angles. Treat any plan that claims 20–30 customers *without* a committed vertical as unfunded.

## 8. Operational Model

### How AI fits in the workflow
AI accelerates production; the operator owns correctness. Specifically:
- Requirements documents drafted with AI assistance, reviewed with the customer
- Schema design and initial scaffolding generated, then reviewed and corrected by the operator
- Boilerplate (CRUD, auth, admin UI, reports) generated, reviewed by the operator
- Business logic written collaboratively, with the operator owning correctness
- Test generation and edge-case enumeration assisted
- Documentation generated, then edited for accuracy

Operator time concentrates on: customer relationship, scope discipline, architecture decisions, integration debugging, anything touching money or PII, deployment, and training. Nothing in the money or PII path ships without human review.

### What we standardize across customers
- Auth, user management, billing integration, audit logging
- Hosting setup and CI/CD pipeline
- Backup and restore procedures
- Customer onboarding checklist
- Project templates per vertical

This is where vertical focus pays off — the second HVAC company gets 70% of the first one's codebase for free, and that reuse is what underwrites the §7 economics.

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
Traditional custom software costs $150–400/hour and takes thousands of hours. A real custom ERP from a normal agency starts at $200k and takes a year. AI-assisted development changes the labor math: the same scope takes a fraction of the hours, which is what makes the $25–50k price point work without sacrificing quality. The engineering judgment is still ours; the speed is what's new.

### [MKT] Why we can do this and an offshore dev shop can't
Offshore shops can match the price but not the model. Custom business software requires deep conversation about how the business operates — conversations that happen better with someone in the same timezone, language, and business culture. Our advantage is being local, available, and capable of having a one-hour discovery call that actually maps the workflow correctly.

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope creep on fixed-price deployments | Strict change-order process, written sign-off on workflow spec before build |
| Customer expects unlimited support for $500/month | Clear contract terms on support inclusions; escalation to retainer or hourly for excess |
| One operator becomes single point of failure | Code conventions and documentation enforced from day one; second operator hired at ~15 active customers |
| Support load scales faster than revenue | Enforce vertical focus; refuse out-of-vertical customers in Phase 1–2 even when tempting; track support hours per customer and flag outliers early |
| Claude API pricing changes affect cost structure | Monitor token consumption per project; pricing model has room to absorb 2-3x API cost increases |
| Schema evolution across live customers | Additive, optional fields; version-tolerant readers that handle old and new document shapes during transitions; structural changes gated behind a deployment version flag |
| Customer outgrows the system | Build with clean data export from day one; this is a feature, not a bug — graceful exit preserves referrals |
| Liability for downtime, data loss, or bugs | E&O insurance, contractual limitations of liability, documented backup and restore |
| Customer wants to take the code and self-host | Offer source code release as a paid option ($10–20k); price it to reflect the loss of recurring revenue |

## 11. Go-to-Market

### Phase 1 (months 1–6): Prove the model in one vertical
- Build 2–3 deployments at reduced rate for case study customers **in the single chosen vertical**
- Document everything: workflow templates, time tracking, support patterns
- Generate 3 published case studies with named customers, real numbers, and demos
- Goal: validate that customer two and three reuse 60–80% of customer one

### Phase 2 (months 6–18): Vertical traction
- Direct outreach to businesses in the chosen vertical: industry associations, trade publications, local business groups
- Content marketing focused on the vertical (blog posts, comparison guides, ROI calculators)
- Referral incentives for existing customers
- Targeted ads against competitor keywords ("[vertical] + Zoho problems," "[vertical] + custom software")
- Begin extracting recurring workflows into catalog modules (§1.1, step 3)

### Phase 3 (month 18+): Scale or specialize
- Decision point: add a second operator and a second vertical, or stay solo and go deeper in one
- A third path: productize the first vertical (§1.1, steps 4–5) and shift the revenue mix from custom builds toward repeatable platform subscriptions
- Each path affects lifestyle, risk, valuation, and ceiling differently

## 12. Extractable Marketing Statements

For lifting into website copy, sales decks, and outreach:

> Generic ERP software was built for everyone. We build software for your business specifically — same price as a Zoho subscription, scoped to how you actually work.

> NetSuite costs more in implementation than most small businesses make in a year. We deliver a working custom system in 4–8 weeks for less than NetSuite's first month.

> Most small businesses run their operations across QuickBooks, three spreadsheets, two SaaS tools, and the owner's memory. We replace the spreadsheets and the memory.

> AI-assisted development lets us deliver custom business software at the price point that used to only buy you a license to someone else's software.

> We don't try to be everything. We build the three or four workflows your business actually depends on, and integrate with the tools you already use for the rest.

---

*Document version: 1.1. Update pricing tables quarterly. Update market context section annually or when a major competitor changes pricing.*