# Contracts — role matrix

`arch.js create` only auto-populates the `admin` and `viewer` rows of `api/src/data/permissions.json` from `module.json`'s `permissions` block. Apply the remaining rows below by hand to match the reference implementation (`projects/lmodulo`).

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
