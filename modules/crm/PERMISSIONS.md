# CRM (Nexus) — role matrix

`arch.js create` only auto-populates the `admin` and `viewer` rows of `api/src/data/permissions.json` from `module.json`'s `permissions` block. Apply the remaining rows below by hand to match the reference implementation (`projects/lmodulo`).

| role        | contacts (c/r/u/d) | companies (c/r/u/d) | deals (c/r/u/d) | activities (c/r/u/d) |
|-------------|----------------------|------------------------|--------------------|--------------------------|
| owner       | T/T/T/T              | T/T/T/T                 | T/T/T/T             | T/T/T/T                  |
| admin       | T/T/T/T              | T/T/T/T                 | T/T/T/T             | T/T/T/T                  |
| lead        | T/T/T/F              | T/T/T/F                 | T/T/T/F             | T/T/T/F                  |
| contributor | F/T/F/F              | F/T/F/F                 | F/T/F/F             | T/T/T/F                  |
| customer    | F/F/F/F              | F/F/F/F                 | F/F/F/F             | F/F/F/F                  |
| viewer      | F/T/F/F              | F/T/F/F                 | F/T/F/F             | F/T/F/F                  |

## Known couplings (not enforced by permissions, informational)

- `GET /crm/companies/:id/milestones` aggregates against the `agile_milestones`/`agile_sprints`/`agile_jobs`/`agile_tasks` collections via a forked copy of the rollup pipeline (`api/src/lib/companyMilestones.ts`) and the frontend company-detail page uses a forked copy of the relevant display helpers (`frontend/src/lib/utils/companyMilestones.ts`). Neither fork imports anything from `modules/agile`, so nothing breaks at build or import time if `modules/agile` isn't installed. **Verified behavior when agile isn't installed:** the endpoint is gated by `requirePermission('agile_milestones', 'read')` — since that permission resource doesn't exist at all without `modules/agile`, every role (including admin) gets `403 Forbidden` from this one endpoint specifically, rather than a 200 with an empty list. The company detail page's `+page.server.ts` calls it via `Promise.allSettled` and only reads the response if `.ok`, defaulting to an empty `milestones` array otherwise — so the *page* still renders fine (confirmed via a live `--modules crm` only project), it just silently shows no linked-milestones panel instead of technically-empty data.
- `routes/crm/contacts.ts`'s contact→customer conversion flow sends a welcome in-app message (`lib/welcomeMessage.ts`) and a "set your password" email (`lib/passwordSetEmail.ts`) — both are CRM-owned forks, not shared with folio/contracts' own email forks.
- CRM's contact form pages depend on `frontend/src/lib/components/{PhoneInput,CountrySelect}.svelte`, which this module ships under `frontend/src/lib/components/` (not `components/crm/`) since they aren't part of `candidate/`. These are also used elsewhere in the reference project (profile, user management) — that broader usage is a pre-existing gap in `candidate/` unrelated to this module and is not addressed here.
