# Handoff: customers can't reach the client portal in candidate-based projects

**Status:** FIXED 2026-11-12 in candidate/, modules/ and friendsofmcrwr (uncommitted). Answers to the open questions:
first portal page, all roles, lmodulo untouched. The fix also changed folio/agile/contracts customer scoping to read the
workspace role instead of `users.role`, which real customers lack, so they saw every record. The original diagnosis follows.

Written 2026-11-12. Nothing from the previous session is committed. The
working tree holds a large uncommitted diff (themes, headers, demo data, dashboard, docs); leave it alone
unless asked, and don't commit without being asked.

## The problem

Modules ship customer-facing pages, but in any project built from `candidate/` (for example
`projects/friendsofmcrwr`) a signed-in **customer** can't open them. Every visit redirects to `/`.

| Page | Shipped by |
|---|---|
| `/client-portal/invoices`, `/client-portal/invoices/[id]` | folio |
| `/client-portal/estimates` | folio |
| `/client-portal/projects` | agile |
| `/client-portal/vault` | vault |

The documentation (`/documentation/folio`, `/documentation/vault`) describes this customer area as working.

**Repro (no real data needed):** create a throwaway project with demo data on (see Verify), then sign in as
the demo customer `client@vertexsystems.io` / `ClientPass1!` and open `/client-portal/invoices`.
You land on `/`.

## Root cause: four gaps, all in the scaffold/arch.js layer

1. **Route access.** `candidate/frontend/src/hooks.server.ts:24` only allows customers on
   `CUSTOMER_ALLOWED_PATHS = ['/', '/profile', '/logout', '/upcoming-events']`. Line 66 redirects any
   other non-public path to `/`. Modules have no way to add customer routes. The route-rules mechanism
   (`candidate/frontend/src/lib/config/route-rules.ts`) only has `public` and `bare`, and `public` would
   wrongly open these pages to logged-out visitors.
2. **Navigation.** The scaffold already supports customer-only nav items: `NavItem.customerOnly` in
   `candidate/frontend/src/lib/config/nav.ts`, filtered in `candidate/frontend/src/routes/+layout.svelte`
   around line 234, where customers see *only* `customerOnly` entries. But `arch.js` writes nav entries with
   just label/href/icon/permission (see the nav merge, `const entry = …`), so a module can't declare
   one. No module.json has client-portal nav entries, so customers would see an empty sidebar.
3. **Permissions.** `arch.js` fills module permissions only for `admin` and `viewer`, so in a fresh project
   the customer role has none of `finance_invoices`, `finance_estimates`, `finance_payments`,
   `agile_milestones`, `vault_documents`, `vault_folders`, and the portal pages' API calls return 403.
   friendsofmcrwr only has customer read access because the previous session copied lmodulo's matrix into
   `projects/friendsofmcrwr/api/src/data/permissions.json`. The modules' `PERMISSIONS.md` files document the
   intended customer rows.
4. **Landing.** After login, customers go to `/` (`hooks.server.ts:57`), the marketing page. There is no
   portal home in the scaffold or modules (lmodulo's `/client-portal` home page is lmodulo-only).

**What already works (don't rebuild it):** the portal pages' server loads require sign-in, and the invoice
detail page checks ownership (`invoice.customerId !== locals.user.id` → 403). The APIs scope data to the
caller: Agile milestones by `caller.companyId`, Folio by customer, and Vault by visibility through
`modules/vault/api/src/lib/vaultRole.ts` (fixed last session). Customer users need `companyId` on the user
document for Agile and Folio scoping; the demo seed sets it.

## Reference: how lmodulo solves it

`projects/lmodulo/frontend/src/hooks.server.ts:31-93` hard-codes the portal paths in
`CUSTOMER_ALLOWED_PATHS`, plus a `startsWith('/client-portal/invoices/')` exception, and sends customers to
`/client-portal` after login. lmodulo's nav has `customerOnly` entries for each portal page
(`projects/lmodulo/frontend/src/lib/config/nav.ts`, the client-portal lines). **Do not copy the
hard-coding.** In the scaffold, modules must declare their own routes (see conventions below).

## Recommended fix (confirm the open questions first)

1. **Route rule flag.** Add `customer?: boolean` to `RouteRule` in `route-rules.ts` ("signed-in customers
   may visit; not public") and an `isCustomerRoute(path)` helper. In `hooks.server.ts:66`, also allow
   `isCustomerRoute(path)`. Modules declare rules in their existing or new
   `frontend/src/lib/config/module-routes/<module>.ts`:
   folio → `/client-portal/invoices`, `/client-portal/estimates`; agile → `/client-portal/projects`;
   vault → `/client-portal/vault`. Prefix matching already covers `/invoices/[id]`.
2. **Customer nav from modules.** Teach `arch.js`'s nav merge to emit `customerOnly: true` when a
   module.json nav item has it, then add customer nav items to folio, agile and vault `module.json`
   (Invoices / Estimates / Projects / Documents, with lucide icons). Update friendsofmcrwr's `nav.ts` by
   hand (arch.js only merges at create time). Note that this file is intentionally different from candidate:
   it has Notifications/Automation/Workspace removed.
3. **Customer permissions from modules.** Let module.json declare per-role grants, e.g.
   `"roles": { "customer": { "finance_invoices": ["read"] } }`, applied by `arch.js` alongside the
   admin/viewer defaults. Source the values from each module's `PERMISSIONS.md`.
4. **Landing.** Send customers to their first visible `customerOnly` nav item after login, falling back to
   `/` (needs a decision; see questions).
5. **Docs.** Update the "Module routes" line in `candidate/CLAUDE.md` and the README module section
   ("Public / shell-free routes"); confirm the Folio/Vault docs pages match the behavior.

## Open questions for the user

- Should customers land on the first portal page after login, or keep landing on `/`? Or should a small
  portal home page be added to the scaffold?
- Should arch.js grant module permissions to roles beyond admin/viewer (owner/lead/contributor too), or only
  customer for now?
- Apply to lmodulo as well? Probably not, since it has its own working approach, but ask.

## Conventions you must follow in this repo

- **Three copies stay byte-identical:** `candidate/` (scaffold), `modules/<m>/` (module source), and
  `projects/friendsofmcrwr/` (generated project). Edit candidate/modules first, then copy into
  friendsofmcrwr. Before overwriting, check the project copy is unmodified: compare it to
  `git show HEAD:<path>` or to the current candidate/module file. Intentional friendsofmcrwr-only
  differences: `frontend/src/lib/config/nav.ts`, `frontend/src/lib/config/dashboard-widgets.ts`,
  `frontend/src/routes/+layout.svelte` (agile log-time palette), `docker-compose.yml`, `.env*`,
  `api/src/data/permissions.json`.
- **Modules never import each other's code.** They extend the scaffold only through registries:
  `module-routes/`, `module-docs/`, `dashboard-widgets` (module.json `widgets`), `api/src/seeds/`.
- **Don't edit lmodulo** unless asked (`projects/lmodulo`, a separate lineage).
- **The user works in friendsofmcrwr live.** Never change its shared settings (e.g. the theme) or data to
  test. Use a throwaway project instead.
- UI rules: any visual layout change needs a Svelte transition. App page headers use
  `$lib/components/PageHeader.svelte` (the portal pages already do).

## Running stacks and tooling

- lmodulo: web 3000 / api 4000 / mongo 27017. friendsofmcrwr: 3001 / 4001 / 27019 (dev compose, `src/`
  bind-mounted; API changes need `build api && up -d api`, translation-file changes need a web rebuild).
- Dev API rate limit is 200 req/min (login 10/min); space out browser checks.
- Playwright: `require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright')`.
  Login form uses the `email` field.
- macOS has no `timeout` command. Run `npx svelte-kit sync` before `npx svelte-check`.
- Known pre-existing test noise: `candidate/api` roles test logs one `ERR_HTTP_HEADERS_SENT` unhandled error;
  all tests still pass.

## Verify

1. Throwaway project: `node arch.js create portal-check --modules agile,calendar-events,commerce,contracts,crm,folio,notifications,vault`.
   In its `.env`, set ports 3002/4002/27020 and `SEED_DEMO_DATA=true`. arch.js writes `.env` with no
   trailing newline, so edit the file rather than appending with `>>`.
   Then run `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`.
2. Sign in as `client@vertexsystems.io` / `ClientPass1!`. Customer nav shows the portal pages. Invoices,
   estimates, projects and documents load with that company's records. Another customer's invoice ID gives
   403. Staff pages (e.g. `/dashboard`, `/crm`) still redirect.
3. Logged out, `/client-portal/invoices` still goes to `/login` (the flag must not make them public).
4. Staff (`admin@example.com` / `admin-password`) behavior is unchanged.
5. `candidate/api`: `npx vitest run`. svelte-check shows no new errors in changed files.
6. Tear down: `docker compose … down -v --rmi local`, then `rm -rf projects/portal-check`. Then sync
   into friendsofmcrwr and confirm with the same customer flow only if the user wants test data there (it has
   none; `SEED_DEMO_DATA=false`).
