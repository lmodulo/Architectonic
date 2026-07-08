# Agile — role matrix

`arch.js create` only auto-populates the `admin` and `viewer` rows of `api/src/data/permissions.json` from `module.json`'s `permissions` block. Apply the remaining rows below by hand to match the reference implementation (`projects/lmodulo`).

| role        | milestones (c/r/u/d) | sprints (c/r/u/d) | jobs (c/r/u/d) | tasks (c/r/u/d) | comments (c/r/u/d) | time_entries (c/r/u/d) |
|-------------|--------------------------|------------------------|---------------------|----------------------|--------------------------|-----------------------------|
| owner       | T/T/T/T                  | T/T/T/T                | T/T/T/T             | T/T/T/T              | T/T/T/T                  | T/T/T/T                     |
| admin       | T/T/T/T                  | T/T/T/T                | T/T/T/T             | T/T/T/T              | T/T/T/T                  | T/T/T/T                     |
| lead        | T/T/T/F                  | T/T/T/F                | T/T/T/F             | T/T/T/T              | T/T/T/T                  | T/T/T/T                     |
| contributor | F/T/F/F                  | F/T/F/F                | F/T/F/F             | F/T/T/F              | T/T/T/T                  | T/T/T/T                     |
| customer    | F/T/F/F                  | F/F/F/F                | F/F/F/F             | F/F/F/F              | n/a                       | F/F/F/F                     |
| viewer      | F/T/F/F                  | F/T/F/F                | F/T/F/F             | F/T/F/F              | F/T/F/F                  | F/T/F/F                     |

Note: the real Mongo collection backing `time_entries` is literally named `time_entries` (not `agile_time_entries` — that string is only the permission *resource* name used above and in `module.json`).

## Known gaps and couplings (not enforced by permissions, informational)

- **`supportSprint.ts` is intentionally not shipped by this module.** In the reference project it's used only by a bespoke `routes/tickets.ts` feature that is not part of `candidate/` and not one of this module set — that coupling (tickets → agile) remains a manual, per-project concern if a target project also has a similar tickets feature.
- **The global "log time" keyboard-shortcut palette needs manual wiring.** `frontend/src/lib/components/agile/LogTimePalette.svelte` and `frontend/src/lib/stores/logTimePalette.svelte.ts` are shipped, but in the reference project they're rendered and wired to a keyboard shortcut from the root `frontend/src/routes/+layout.svelte` — a file `arch.js` has no mechanism to patch (unlike `nav.ts`/`dashboard-widgets.ts`). After generating a project with this module, add the import, a `<LogTimePalette />` render, and the keyboard handler to `+layout.svelte` by hand if the floating time-logging UI should be reachable.
- **`frontend/src/lib/components/UserSelect.svelte`** is shipped by this module (wraps `svelte-select`, already a `candidate/` dependency) since agile's board/task/job detail pages need it for assignee pickers. It's also used more broadly in the reference project (message composer, user management) — that broader reuse is a pre-existing gap in `candidate/` unrelated to this module.
- **CRM integration is one-way and soft.** Agile's own `lib/agile.ts` looks up `crm_companies` by `clientId` for milestone rollups — a plain Mongo `$lookup`, not a code import — so it degrades to a null `clientName` if `modules/crm` isn't installed. `modules/crm` ships its own separate fork of the same rollup logic (`companyMilestones.ts`) for its "linked milestones" panel, so neither module imports the other's TypeScript.
- **Calendar-events integration is optional and ID-only.** Milestones/sprints/jobs/tasks store `calendarEventIds[]` and expose `POST .../calendar-events` endpoints; nothing breaks if `modules/calendar-events` isn't installed alongside agile.
