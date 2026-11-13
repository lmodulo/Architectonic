# Contracts — role matrix

`arch.js create` writes every row below into `api/src/data/permissions.json`: `owner`, `admin` and `viewer` from its defaults (every action, every action, read), the other roles from the `roles` block in `module.json`. Keep this table and `roles` in sync.

| role        | contracts (c/r/u/d) | contract_templates (c/r/u/d) |
|-------------|----------------------|-------------------------------|
| owner       | T/T/T/T              | T/T/T/T                       |
| admin       | T/T/T/T              | T/T/T/T                       |
| lead        | T/T/T/F              | F/T/F/F                       |
| contributor | F/T/F/F              | F/T/F/F                       |
| customer    | F/T/F/F              | F/F/F/F                       |
| viewer      | F/T/F/F              | F/T/F/F                       |

Notes:
- `customer` read access to `contracts` reflects that customers can view contracts where they are a signer (filtered at the route level, not by this permission alone).
- The public signing flow (`/contracts/sign/[token]`) is unauthenticated and does not go through this permission matrix at all — it is gated purely by token validity/expiry.
