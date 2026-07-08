# Folio — role matrix

`arch.js create` only auto-populates the `admin` and `viewer` rows of `api/src/data/permissions.json` from `module.json`'s `permissions` block. Apply the remaining rows below by hand to match the reference implementation (`projects/lmodulo`).

| role        | invoices (c/r/u/d) | payments (c/r/u/d) | subscriptions (c/r/u/d) | estimates (c/r/u/d) | expenses (c/r/u/d) | reports (r) |
|-------------|----------------------|-----------------------|----------------------------|-------------------------|------------------------|-------------|
| owner       | T/T/T/T              | T/T/T/T                | T/T/T/T                    | T/T/T/T                  | T/T/T/T                  | T           |
| admin       | T/T/T/T              | T/T/T/T                | T/T/T/T                    | T/T/T/T                  | T/T/T/T                  | T           |
| lead        | F/T/F/F              | F/T/F/F                | F/T/F/F                    | F/T/F/F                  | F/T/F/F                  | T           |
| contributor | F/T/F/F              | F/T/F/F                | F/F/F/F                    | F/T/F/F                  | F/T/F/F                  | F           |
| customer    | F/T/F/F              | T/T/F/F                | F/T/F/F                    | F/T/F/F                  | F/F/F/F                  | F           |
| viewer      | F/T/F/F              | F/T/F/F                | F/T/F/F                    | F/T/F/F                  | F/T/F/F                  | T           |

Notes:
- `customer` create+read on `payments` reflects that customers initiate their own Stripe payments and can see the resulting payment records.
- The recurring-invoice/subscription-billing runner (`api/src/routes/finance/scheduler.ts`) starts automatically via an `onReady` hook in `routes/finance/index.ts` — no manual `server.ts` registration needed (mirrors `modules/calendar-events`'s scheduler pattern).
- The retainer-hours computation in the scheduler queries the Mongo collection `time_entries` (not `agile_time_entries`, which is only the *permission resource name* used by the agile module) and joins to `agile_milestones` by `clientId`. If `modules/agile` isn't installed alongside folio, this join simply finds no matching milestones and retainer overage billing is skipped — no error.
