# Content (cms) — role matrix

`arch.js create` writes every row below into `api/src/data/permissions.json`: `owner`, `admin` and `viewer` from its
defaults (every declared action, every declared action, `read`), `lead` and `contributor` from the `roles` block in
`module.json`, and nothing for `customer`. Keep this table and `roles` in sync.

| role        | cms_nodes (c/r/u/d) | cms_pages (c/r/u/d) | cms_publish (u) |
|-------------|---------------------|---------------------|-----------------|
| owner       | T/T/T/T             | T/T/T/T             | T               |
| admin       | T/T/T/T             | T/T/T/T             | T               |
| lead        | T/T/T/F             | T/T/T/F             | T               |
| contributor | F/T/F/F             | F/T/T/F             | F               |
| viewer      | F/T/F/F             | F/T/F/F             | F               |
| customer    | F/F/F/F             | F/F/F/F             | F               |

Notes:
- The scaffold's permission actions are only create/read/update/delete, so publishing has its own resource,
  `cms_publish`, which declares only `update`. Viewer's default `read` therefore grants nothing on it.
- `cms_nodes` covers the site tree (create, edit, move, delete items) and the site settings (home page, footer,
  media folder). `cms_pages` covers page content: contributors can edit drafts but not publish them.
- `cms_pages.create` and `cms_pages.delete` are declared for completeness; page documents are created and removed
  with their tree item (`cms_nodes.create` / `cms_nodes.delete`).
- The public site (`/cms/site/*`) needs no permissions and only returns published content.
- Images come from the Vault module and also need its permissions: choosing images needs `vault_documents.read`
  (plus `cms_pages.update`), uploading needs `vault_documents.create`, and creating the "Website Media" folder needs
  `vault_folders.create`. Without them the image actions are hidden or say why.
- The `events` component reads the Calendar module's public feed, which needs no permissions.
