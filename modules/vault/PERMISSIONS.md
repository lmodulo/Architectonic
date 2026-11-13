# Vault — role matrix

`arch.js create` writes every row below into `api/src/data/permissions.json`: `owner`, `admin` and `viewer` from its defaults (every action, every action, read), the other roles from the `roles` block in `module.json`. Keep this table and `roles` in sync.

| role        | documents (c/r/u/d) | folders (c/r/u/d) |
|-------------|----------------------|--------------------|
| owner       | T/T/T/T              | T/T/T/T            |
| admin       | T/T/T/T              | T/T/T/T            |
| lead        | T/T/T/F              | T/T/T/F            |
| contributor | F/T/F/F              | F/T/F/F            |
| customer    | F/T/F/F              | F/T/F/F            |
| viewer      | F/T/F/F              | F/T/F/F            |

Notes:
- Read access is further narrowed by each document's visibility tier (`api/src/lib/vaultRole.ts` resolves the caller's workspace role). Customers only see `customer`-visibility documents, through `/client-portal/vault`.
