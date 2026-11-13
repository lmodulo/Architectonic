# CMS module, Session 1: scaffold extension points

Done 2026-11-13, starting from HEAD `0f7980a`. Committed on branch `cms-module`. The master plan is `.claude/handoffs/cms-module.md`.
This session covered master §1 in full: generic extension points in `candidate/`, the docs, and the friendsofmcrwr sync.
No cms module code exists yet.

## Files changed or added

All paths are under `candidate/` and copied byte-identically to `projects/friendsofmcrwr/`, except where noted.

| File | Change |
|---|---|
| `frontend/src/lib/config/route-rules.ts` | `prefix` is now optional. New fields: `routeId?`, and `applies(rule, path, routeId?)`. `isPublicRoute`, `isCustomerRoute` and `isBareRoute` take an optional `routeId`. |
| `frontend/src/hooks.server.ts` | Passes `event.route.id` to the public and customer gates. `ROUTE_PERMISSIONS` now matches on segment boundaries (`path === p \|\| path.startsWith(p + '/')`). |
| `frontend/src/routes/+layout.svelte` | `isBareRoute(page.url.pathname, page.route.id)`. **Hand-merged** in friendsofmcrwr, keeping the agile LogTimePalette. |
| `frontend/src/routes/+page.svelte` | Now only renders `<Home data=…>` when a module home resolves, else `<ScaffoldHome />`. |
| `frontend/src/routes/+page.server.ts` | *new*: `{ moduleHome: await resolveModuleHome(event) }` |
| `frontend/src/lib/server/module-home.ts` | *new*: eager glob of `./module-home/*.ts`. Runs loaders in file-name order inside try/catch; the first non-null `{ key, data }` wins. Exports the `ModuleHomeLoader` and `ModuleHome` types. |
| `frontend/src/lib/config/module-home.ts` | *new*: eager glob of `./module-home/*.svelte` → `MODULE_HOME_COMPONENTS[key]` |
| `frontend/src/lib/components/ScaffoldHome.svelte` | *new*: byte-for-byte the HEAD `routes/+page.svelte` (checked with `cmp`) |
| `docker-compose.yml` | `web`: `BODY_SIZE_LIMIT=${BODY_SIZE_LIMIT:-10M}`, with a comment. **Hand-merged** in friendsofmcrwr, keeping the Stripe lines. |
| `CLAUDE.md` | Extended the "Module routes" bullet (`routeId`). New "Home page override" bullet. |
| `README.md` (repo root only) | Extended "Public / customer / shell-free routes" with `routeId`. New "Home page override" paragraph. friendsofmcrwr's own README is project-specific and was not touched. |

## Deviations from the plan

1. **Rules that set both `prefix` and `routeId`** match only when both match (AND). A rule with neither matches nothing.
   Two rules already give OR, and AND lets a rule narrow a catch-all. Master §1 now says this.
2. **Loader type.** Loaders are typed `(event: ServerLoadEvent) => Promise<object | null>`, not bare
   `RequestEvent`, so a loader can call `parent()` or `depends()` if it needs to.
3. **The key is the file name without its extension.** If a loader returns data but no
   `config/module-home/<key>.svelte` exists, `/` silently falls back to `ScaffoldHome`.
4. **No signed-in check on friendsofmcrwr.** Logging in there would write session and audit rows into the live DB, so
   it was checked logged out only. The same code was checked signed in, for four roles, on the throwaway project.

## Test results

**svelte-check** (after `svelte-kit sync`), with the HEAD baseline taken in a temporary worktree:

| Project | HEAD | After |
|---|---|---|
| candidate | 48 errors, 41 warnings | 48 errors, 41 warnings |
| friendsofmcrwr | 198 errors, 286 warnings | 198 errors, 286 warnings |

The only change in either error list is the two existing `brand.text` errors, which moved from `+page.svelte` into
`ScaffoldHome.svelte`. **PASS.**

**`candidate/api` vitest:** 17 files and 163 tests pass. The only error is the known `ERR_HTTP_HEADERS_SENT` from the
roles test. **PASS.**

**Throwaway project `s1-check`** (`--modules commerce,vault`, ports 3002 / 4002 / 27020):
- **Before/after sweep on the same stack.** I swapped HEAD's versions of the changed files into the project, ran a
  31-check curl sweep, restored the new files and ran it again. It covered anonymous, admin, viewer and customer users;
  status, Location, app shell or bare, and marketing markers; and 0 × 429. The only difference was the intended fix:
  a viewer on `/roles-of-the-board` was sent to `/403` at HEAD and now gets the 404 page. Unchanged:
  - `/` shows the marketing page
  - `/shop` is public and bare
  - `/documentation` is public
  - logged-out `/dashboard` goes to `/login`
  - customer login and `/dashboard` go to `/client-portal/vault`, and customer `/profile` is 200

  **PASS.**
- **Probe home.** Files: `a-throws.ts` (throws), `b-null.ts` (returns null), and `probe.ts` + `probe.svelte` (reads
  `$env/dynamic/private`). `/` rendered the probe for anonymous users, admin and customer. The throwing loader was logged
  and skipped. Removing the files brought the marketing page back. **PASS.**
- **Probe `routeId` rule** `{ routeId: '/s1probe/[slug]', public: true, bare: true }`:
  - anonymous `/s1probe/x` is 200 and bare
  - the uncovered sibling `/s1other` gives 303 `/login`
  - `__data.json` serves data for the probe route and a redirect JSON for the sibling
  - admin, viewer and customer get the probe route bare
  - a customer on `/s1other` gets 303 to the portal

  **PASS.**
- **Client-side navigation** (Playwright, admin). `/dashboard` → `/s1probe/abc` drops the shell, `/s1other` brings it
  back, and so does `/dashboard`. All three were client-side (a window marker survived), with no page errors.
  **PASS.**
- **`BODY_SIZE_LIMIT`** (prod build of web): a 2 MB upload through `/api/vault/documents` returned 201 with `10M`. With
  `512K`, HEAD's default, it returned 500. **PASS.**

**friendsofmcrwr after the sync:**
- Before each overwrite, its copy matched `git show HEAD:candidate/...`, and both hand-merged files were unchanged since
  the merge was prepared.
- Web only was rebuilt with `up -d --no-deps --build web`. The API and Mongo were not restarted.
- A logged-out sweep (`/`, `/login`, `/dashboard`, `/shop`, `/documentation`, `/client-portal/vault`,
  `/roles-of-the-board`, `/api/nope`) matched the pre-sync run, and the web logs are clean. **PASS** (not checked
  signed in; see deviation 4).

## Open issues found (all pre-existing; none fixed)

1. **Uploads can't be written in production with local storage.** `api/Dockerfile` switches to `USER appuser` but never
   creates `/app/uploads`, so a fresh `uploads` volume is root-owned and every write fails with `EACCES`: avatars, logo,
   Vault and commerce. I confirmed this with a brand-new volume on the prod API image. The likely fix is
   `RUN mkdir -p /app/uploads && chown appuser:appuser /app/uploads` before `USER`, in candidate and every project.
   **Needs a user decision.**
2. **Oversized uploads return 500, not 413.** A body over `BODY_SIZE_LIMIT` makes the streaming proxies (e.g.
   `routes/api/vault/documents/+server.ts`) fail with `fetch failed` and answer 500 `Internal Error`. **Session 5:**
   MediaPicker must check `file.size <= 10 MB` before uploading. Fixing the proxies themselves is separate scaffold work.
3. **The candidate seed creates personal accounts in every project.** `api/src/plugins/seed.ts:89` creates
   `kylenicora@me.com` with the fixed password `k-password` (and the owner `joenicora@me.com`), and contracts'
   `40-contracts.ts` also references them. Any production deploy ships with a known-password account. **Question for
   the user.**
4. **`ROUTE_PERMISSIONS` guards pages that don't exist.** It lists `/manage-users` and `/roles`, but candidate has
   neither page (admins get a 404; user management lives at `/user-management`). The entries are dead but harmless.
5. **Marketing page bugs**, carried over unchanged into `ScaffoldHome.svelte`: it reads `brand.text`, which doesn't
   exist, and `MarketingNav` gets no runtime brand.
6. **Signed-in users see the marketing page inside the app shell at `/`** (staff and customers). **Session 3 note:** the
   planned cms rule `{ routeId: '/', bare: true }` makes `/` bare for every signed-in user once cms is installed, even
   when the marketing page is the fallback. That is probably fine, because the page has its own nav, but confirm it then.
7. From the plan, still to report: `/uploads/` is served without auth, and Vault's `PATCH` endpoints don't validate
   `visibility`.

## Verification gotchas learned (also saved to memory)

- **Playwright against the dev server.** Call `waitForLoadState('networkidle')` before filling or clicking. Otherwise
  hydration resets filled inputs (the login posts empty) and links do full reloads.
- **curl against a SvelteKit form action.** Send `accept: text/html` to get the real 303; with `*/*` it answers 200
  JSON. Multipart POSTs need an `Origin` header that matches `ORIGIN`, or SvelteKit's CSRF check rejects them.
- **Switching a dev-started project to prod.** `docker compose -f docker-compose.yml up web` also recreates `api` as
  prod; use `--no-deps` to avoid that. The prod API can't write a volume that the dev container created.

## First steps for Session 2

1. Read the master plan, then this file. Work on branch `cms-module`, where this session's commit is.
2. Start `modules/cms/`: `module.json` (nav, roles, seed), then `PERMISSIONS.md`.
   - First check how `arch.js` gives viewer `read` for `cms_publish`, which declares only `update` (master §8).
   - Ship no file that exists in candidate. In particular, don't ship `routes/+page.server.ts`; the home goes through
     `lib/server/module-home/cms.ts` (Session 3).
3. Write the API (master §2 and §3): `api/src/lib/{cmsTree,cmsSanitize,cmsRole}.ts`, then
   `api/src/routes/cms/{index,nodes,pages,settings,site}.ts`. `index.ts` registers its sibling files and creates the
   indexes. Defer `media.ts` to Session 5, or stub it.
4. Add the seed `api/src/seeds/80-cms.ts` and the `/api/cms/[...path]` proxy, plus a placeholder `/cms` page with
   `PageHeader`.
5. Run the Session 2 curl exit matrix on a throwaway project: `node arch.js create s2-check --modules cms`, on ports
   3002 / 4002 / 27020 with `SEED_DEMO_DATA=true`. The seed has no viewer or customer, so add them in the throwaway DB
   as this session did, by copying the admin's `passwordHash` into new `users` and `workspace_members` rows.

## Questions for the user (answered 2026-11-13)

1. Fix the production `/app/uploads` permission bug (issue 1) now? **Later**, outside the cms plan.
2. Should the personal seed accounts (issue 3) stay? **Yes.**
3. Commit per session or at the end? **After each session.** Session 1 is committed on branch `cms-module`.
