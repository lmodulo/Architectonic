# CMS module, Session 2: API, module skeleton and seed

Done 2026-11-13 on branch `cms-module`, and committed there. The master plan is `.claude/handoffs/cms-module.md`, and
its §2, §3, §5 and §9 now carry this session's design decisions, marked *(S2)*. This session covered
`module.json`, `PERMISSIONS.md`, the data model, the API, the seed, the `/api/cms` proxy and a placeholder `/cms`
page. No scaffold file changed, so nothing was synced to friendsofmcrwr. cms is still not installed there.

## Files added (all new, under `modules/cms/`)

| File | What it is |
|---|---|
| `module.json` | Nav "Content" (`/cms`, `LayoutTemplate`, `cms_nodes.read`, `matchPrefix`). Declares `cms_nodes` and `cms_pages` (crud) and `cms_publish` (update only). `roles` covers lead and contributor. No widgets yet (S6). |
| `PERMISSIONS.md` | The role matrix, which matches what arch.js generated (checked). |
| `api/src/lib/cmsSanitize.ts` | Whitelist sanitizer for blocks, Tiptap JSON, `cmsImage`, `ImageRef`, `LinkRef`, component props and SEO; `safeHref`; `collectRefs` (node links and Vault ids). Returns a `removed` count. |
| `api/src/lib/cmsTree.ts` | `CmsTree`, built in memory from all nodes: paths, visibility, `resolve`, `menu`, `linkMap`, cycle checks and breadcrumbs. Also `getSiteSettings`, `nodeJson` and `pageView`, the shared shape for resolve and preview. |
| `api/src/routes/cms/index.ts` | Creates the indexes (including the unique partial index on `{ parentId, slug }`) and registers its siblings. |
| `api/src/routes/cms/nodes.ts` | Node list, create, update and delete, and move. Holds `RESERVED_SLUGS`. |
| `api/src/routes/cms/pages.ts` | Draft read and save (`rev` lock), publish and unpublish (every node type), and preview. |
| `api/src/routes/cms/settings.ts` | GET and PATCH for site settings (home page must be a page; footer links are validated). |
| `api/src/routes/cms/site.ts` | Public `GET /cms/site/menu` and `GET /cms/site/resolve`. |
| `api/src/seeds/80-cms.ts` | The demo site from the plan, all published. Home is set as the home page, and the footer links to Privacy and to a mailto. Content goes through `sanitizePage`. |
| `api/tests/unit/lib/cmsSanitize.test.ts`, `cmsTree.test.ts` | 42 unit tests, copied into a project's `api/tests/unit/lib/`. |
| `frontend/src/lib/cms/types.ts` | Shared content and API types for Sessions 3–6. |
| `frontend/src/routes/api/cms/[...path]/+server.ts` | Catch-all proxy for GET, POST, PUT, PATCH and DELETE. Forwards the cookie, query string and body, and passes the API's status and body through unchanged, including the `rev` on a 409. Accepts only plain path segments, so `..` gets a 404. |
| `frontend/src/routes/cms/+page.server.ts`, `+page.svelte` | Placeholder: `PageHeader` plus a read-only tree table with type icons, URLs and Draft / Published / Hidden-by-parent / Hidden-from-menu badges. Session 4 replaces it. |

## Deviations from the plan, and why

These are all recorded in the master plan as well.

1. **Publish and unpublish work on every node type.** Labels, components and links need a way to become public too.
   Putting `status` on PATCH would have needed a second permission check there. For pages, publish also copies the
   draft. Unpublish sets `published: null`.
2. **`PATCH /cms/nodes/:id` can change `type`.** The Session 4 detail panel edits type. Rules:
   - A node with children can't become a link (409).
   - Becoming a link drops the slug; leaving link derives one from the title.
   - Becoming a page creates its page document. An old page document is kept if the type changes away from page.
3. **Footer links are `{ label, link: LinkRef, newTab? }`,** because a bare `LinkRef` has no label.
4. **No codeBlock and no code mark in rich text,** and headings are clamped to levels 2–4. Session 4 must configure
   StarterKit to match (`codeBlock: false, code: false, heading: { levels: [2, 3, 4] }`).
5. **The href check is stricter than planned.** It also rejects `/\host` (browsers read it as `//host`),
   whitespace and control characters, and it is case-insensitive.
6. **Reserved slugs apply only at the root,** because only the first URL segment can collide with an app route.
   Moving a node to the root checks again.
7. **Draft saves coalesce in the audit log.** Autosave would otherwise flood it, so a save is logged only when a
   different user saved last or more than 10 minutes have passed. Every other write is always logged.
8. **Deferred to Session 5:** `cmsRole.ts` and `media.ts`, which nothing uses before then. `resolve` returns
   `media: {}` for now.
9. **The module ships unit tests,** in `api/tests/unit/lib/`. This is the first module to do so. They don't collide
   with candidate's tests and run with the project's vitest.
10. **`rest` is returned for any component node with leftover segments.** The API doesn't know the frontend registry,
    so Session 3's page load must 404 unless the entry has `subpaths: true`.
11. **Preview link maps include unpublished targets,** so editors can follow them.

## Test results

On the throwaway project `s2-check` (`--modules cms`, ports 3002 / 4002 / 27020, `SEED_DEMO_DATA=true`, with a viewer
and a customer added to its DB):

- **Exit matrix (`.claude/handoffs/cms-tests/s2-api-matrix.mjs`, 95 checks, about 105 requests): 95/95 pass** on a clean
  re-run. The first run was 94/95; the one failure was the test's own wrong expectation for `removed` (4 is right).
  The checks cover:
  - **CRUD:** duplicate sibling slug → 409; reserved `dashboard`/`cms` at the root → 400 (fine below the root); a
    child under a link → 400; a `javascript:` link URL → 400; a component without a key → 400; `status` can't be set on
    create; PATCH to a sibling's slug → 409; an invalid slug → 400; renaming keeps the slug; inserting at an index
    renumbers 0..n.
  - **Move:**
    - under a new parent, with old and new siblings renumbered
    - re-running the same move changes nothing
    - under itself, under a descendant, or under a link → 400
    - next to a sibling with the same slug → 409
    - a reserved slug moved to the root → 400
  - **Delete:** a node with children → 409; deleting a node removes its page; deleting the home node clears
    `homeNodeId`, after which `/` is 404.
  - **Drafts:**
    - A save sanitizes `javascript:` hrefs, an `iframe` node, a `script` block and a bad button, and keeps a safe link
      without stray attributes.
    - A stale `rev` gets 409 with the current `rev`; publishing with a stale `rev` gets 409.
    - The published page shows the sanitized content. A newer draft doesn't leak to the public page; preview shows it.
    - After unpublishing, the page is 404.
  - **Visibility:** an unpublished ancestor makes resolve 404 for its subtree, removes the subtree from the menu, and
    drops links to it. Publishing under a draft parent warns. Republishing restores everything.
  - **Resolve:** `/`, `/home` → `/`, a label redirect, `rest` for components, 404 for an extra segment, an unknown
    slug and a dotted path, and a hidden-from-menu page that still resolves. The footer resolves node links.
  - **Permissions** for every role:
    - reads, per role
    - writes: create, update and delete are refused for each role the matrix denies
    - `cms_pages` reads and updates, for contributor and viewer
    - a contributor can't publish or unpublish; a lead can publish
    - preview and settings, per role
    - anonymous → 401
- **Audit log:** entries for create, update, delete, move, publish, unpublish, settings and page updates, with draft
  saves coalesced.
- **Web side** (`.claude/handoffs/cms-tests/s2-web.sh`):
  - Anonymous `/api/cms/site/*` → 200, and `/api/cms/nodes` → 401 JSON. Traversal (`..%2F`, `%2E%2E`) → 404.
  - Admin create through the proxy → 201; a duplicate → 409; a stale draft → 409 with its body intact. Publish and
    delete work, and a contributor's publish → 403.
  - `/cms` renders for admin and contributor (9 rows), a customer is sent to `/`, and anonymous users go to `/login`.
  - I checked a screenshot as admin.
- **Unit tests:** 42/42 (`npx vitest run tests/unit/lib/cms*` in the project's `api/`).
- **Type checks:**
  - API `tsc`: 237 errors against candidate's 207. All 27 cms errors are the repo-wide Fastify generic noise (TS2314
    on `FastifyInstance`, then TS7006 on `req`/`reply`), the same as every module's route files. The lib files, seed
    and tests are clean.
  - Frontend svelte-check: 49 errors against candidate's 48. The extra one is arch.js's generated `nav.ts` icon typing
    (`typeof LayoutTemplate` vs `Component`), which every module's nav icon triggers (12 in friendsofmcrwr).
- `s2-check` is torn down.

## Open issues

- **Nav icon typing** (existing; affects every module): lucide-svelte icons in arch.js-generated `nav.ts` items fail
  svelte-check against `Component`. This is out of cms scope.
- **Large drafts.** A draft over about 900 KB is refused with 400. Fastify's default `bodyLimit` (1 MB) applies first,
  so very large pastes get 413 from Fastify. Session 4's autosave should show a clear message for either.
- **Permission reads per request.** Each `requirePermission` reads `workspace_members` and `roles`, as in every
  module. That's fine at this size.

## First steps for Session 3 (public site; master §4 and the §7 skeleton)

1. Read the master plan (§4 and §7, plus the *(S2)* notes in §3), then this file. Work on `cms-module`.
2. Frontend files, per master §4 and §9:
   - `params/cmspath.ts`
   - `lib/server/cms/site.ts`: `loadMenu` and `loadPage`, which call `API_URL` directly and run component loads with
     timeouts
   - `lib/server/cms/reserved.ts`, then hook it into the existing proxy at
     `routes/api/cms/[...path]/+server.ts` for node POST and PATCH. For move to the root, fetch the node first to get
     its slug.
   - `routes/(site)/…`
   - `lib/config/module-routes/cms.ts`
   - `lib/server/module-home/cms.ts` and `lib/config/module-home/cms.svelte`: the loader returns null unless
     `/cms/site/resolve?path=/` is 200
   - `SiteShell` and the menu components, `BlockRenderer`, `RichTextRenderer`, `cms-prose.css`
   - the `cms-components` registry with `sitemap`
3. Resolve gives `rest` for any component; 404 unless the registry entry has `subpaths: true`. An unknown component
   key renders nothing publicly.
4. Test on a throwaway project (`--modules cms`) using the Session 3 exit list. `cms-tests/` has the Session 2
   scripts, which can be rerun to check for API regressions. The seed already gives `/`, `/about`,
   `/about/team`, the label redirect `/resources` → `/resources/sitemap`, and a hidden-from-menu `/privacy`.
5. `grep -r "{@html" modules/cms` must find nothing.

## Questions for the user

None blocking. One for later: the seed's demo organization is "Riverbend Community Trust". Change it if you'd rather
the demo match one of your real projects.
