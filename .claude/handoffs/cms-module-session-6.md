# CMS module, Session 6: Events, search tags, text links, docs, widget, final matrix

Done 2026-11-14 on branch `cms-module`, and committed there. This is the last planned session; the master plan is
`.claude/handoffs/cms-module.md` (its status table is all ticked, and §2–§8 and Known pitfalls have *(S6)* notes). No
scaffold file changed, so nothing was synced to friendsofmcrwr. cms still imports no other module's code.

The user's answer from Session 5, 2026-11-14: **text links should follow page moves** ("Links inside text - yes").
The rate-limit question was not answered, so the scaffold is unchanged (see Questions).

## Files added or changed (under `modules/cms/`)

**API**
- `lib/cmsSanitize.ts`: link marks keep a valid `nodeId`; `collectRefs` gathers text links' nodeIds, so `resolve`,
  previews and the publish warnings include them.
- `seeds/80-cms.ts`: the seeded "Read our story" link stores the History page's id.
- `tests/unit/lib/cmsSanitize.test.ts`: nodeId kept or dropped, and text links in `collectRefs` (63 tests in all).

**Frontend**

| File | What it does |
|---|---|
| `lib/cms/tiptap/LinkNode.ts` (new) | Adds `nodeId` to StarterKit's link mark (`addGlobalAttributes`). |
| `lib/cms/admin.ts` | `pageLinks`, `pageForHref`; `editable(content, media, nodes)` refreshes text links' paths and gives old path-only links their page id; `blockProblems` flags links to deleted pages; `missingModule` / `missingModuleText`. |
| `admin/RichTextEditor.svelte` | The link form recognises site pages, says so, and stores the id; a new link with nothing selected gets the page title. Link clicks inside the editor are cancelled. Typing after a new link no longer joins it. |
| `render/RichTextRenderer.svelte`, `render/BlockRenderer.svelte` | Text links with a page id use the page's current URL from `links`, or render as plain text when it isn't public. |
| `lib/cms/events.ts`, `lib/config/cms-components/events.ts`, `site/EventsComponent.svelte` (new) | The `events` component (see §7 of the plan). |
| `lib/cms/types.ts` | `CmsComponentEntry.requires`. |
| `admin/ComponentEditor.svelte`, `admin/NodePanel.svelte`, `admin/AddNodeForm.svelte` | Warn when a component's module is missing. New blocks and items start with a component that needs no other module (`defaultComponent`). |
| `lib/cms/seo.ts` (new), `render/CmsPage.svelte` | Search and sharing tags. |
| `admin/CmsDashboardWidget.svelte` (new), `module.json` `widgets` | The dashboard widget ("Live pages", "Not live"). |
| `lib/config/module-docs/cms.ts`, `routes/(docs)/documentation/cms/+page.svelte` (new) | The documentation page, ending with the API table. |
| `PERMISSIONS.md` | Notes on the Vault permissions images need, and the Calendar feed. |

`admin/BlockCard.svelte`, `BlockEditor.svelte` and `routes/cms/pages/[nodeId]/+page.svelte` only pass the new page
list and node list through.

**Test scripts:**
- `cms-tests/s6-checks.cjs` (new; see the README).
- `s3-site.sh`, `s3-extra.sh` and `s2-web.sh` now keep their work files in a folder per port. Cookie jars ignore
  the port, so two runs against different projects at once overwrote each other's sessions and response files.
- `s5-media.cjs` takes the Mongo container name as a sixth argument (it was hard-coded to `s5-check-mongo-1`), and
  waits 60 s before its settings step. `s6-checks.cjs` waits 60 s between phases. Both are for the dev rate limit.

## Deviations from the plan, and why

1. **Text links follow page moves** (added at the user's request; not in the original S6 list). A link mark stores the
   page id beside its path, exactly like buttons' `LinkRef`. `/` stays a plain URL, because it means "the home page"
   whichever page that is. Older links pick up their id on the next save instead of through a migration.
2. **Meta description has a fallback**: the hero subtitle, else the start of the first text block. The plan only said
   "meta description"; without a fallback most pages would have none.
3. **`requires` on registry entries** is new. Without it an editor could place Events on a site without the Calendar
   module and only find out from the preview text.
4. **Events dates are formatted in UTC** with no times. The Calendar module is date-only, and UTC is the only way to
   get the same text from the server and from browsers in every time zone.
5. **The widget shows two counts** (live, not live), both from one cheap endpoint, rather than a third that would need
   a new API route. Each count is a proxy call (two API requests).
6. **"Shadow badges"** were already built in Session 4 (`SiteTreeNode`, `s4-shadow.cjs`); nothing new was needed.

## Test results

Two throwaway projects:
- `s6-full`: `--modules cms,vault,calendar-events,commerce`, ports 3002 / 4002 / 27020, demo seed plus `s5-seed.sh`.
- `s6-cms`: `--modules cms`, ports 3003 / 4003 / 27021, demo seed.

Both had the s2–s5 test users and the `s3probe` / `s4probe` routes.

**Exit criterion: the full matrix passes on both projects.**

| Suite | `s6-full` (cms, vault, calendar-events, commerce) | `s6-cms` (cms only) |
|---|---|---|
| `s2-api-matrix.mjs` | 95/95 | 95/95 |
| `s3-site.sh` | 56/56 | 56/56 |
| `s3-extra.sh` (with `s3-menu.cjs` 28/28) | 13/13 | 13/13 |
| `s4-shadow.cjs` | 5/5 | 5/5 |
| `s4-admin.cjs` | 81/81 | 81/81 |
| `s5-media.cjs` (after `s5-seed.sh`) | 65/65 | (needs Vault) |
| `s5-novault.cjs` | (has Vault) | 14/14 |
| `s6-checks.cjs` (new) | 54/54 | 41/41 |

**How it got there.** Not every suite passed first time:
- **`s3-site` (both):** 54/56 and 55/56 on the first pass, because the two runs shared one temp folder and cookie jar.
  Harness bug: the folder is per port now. Both passed on a re-run.
- **`s4-admin` (both):** 79/81 on the first pass, because a new component block defaulted to Events. That was a real
  bug, now fixed (see below). Later attempts failed in the preview phase whenever another suite had just run against
  the same API: the dev rate limit, inflated by the websocket loop described below. Run alone, both projects passed
  81/81, the cms-only one with no rate-limit hits.
- **`s5-media` (full):** first failed on a hard-coded container name (now an argument). Then it twice reached the
  settings step with the rate limit spent by three role logins onto a dashboard full of widgets. It now waits 60 s
  first. The passing run still saw 10 rate-limit replies during those logins, which its waits absorbed.
- **`s6-checks` (full):** one pass failed in the widget phase on the rate limit; the script now waits 60 s between
  phases. It passed 54/54 before and after that change, and 41/41 twice on the cms-only project.

**Static checks**
- API unit tests: 63/63 cms tests (128 across the project's API suite).
- svelte-check, `s6-cms`: 49 errors and 41 warnings, the baseline since S2, none in cms.
- svelte-check, `s6-full`: 90 errors and 70 warnings, none in cms. They are in the other modules' own files
  (commerce, vault, calendar-events) and the scaffold's (notifications, settings, profile and so on).
- API `tsc`: in cms files only the usual Fastify-generics noise (6 × TS2314, 30 × TS7006).
- `grep -r "{@html" modules/cms` finds nothing.

**Screenshots** checked on the default dark theme: the Events page (desktop and phone), the events block in the
builder, the dashboard widget, and a text block warning about a link to a deleted page. The events list lines up with
the page title at 1400 px and 390 px (measured).

**Teardown:** `s6-full` and `s6-cms` are torn down (containers, volumes, images and folders). `projects/` holds only
friendsofmcrwr, lmodulo and potency.

## Bugs found and fixed this session

- **Clicking a link inside the text editor left the page builder** (from S4). SvelteKit's router follows any `<a>`
  click, contenteditable or not. Link clicks in the editor are now cancelled.
- **Words typed right after a new link joined it** (from S4). The link mark is inclusive because autolink is on; it is
  now dropped from the typing marks after a link is applied.
- **A new component block defaulted to Events** once `events.ts` existed (the registry is in file-name order), even on
  sites without the Calendar. It now starts with the first component that needs no other module (Sitemap). The
  matrix caught this in `s4-admin`.
- Found and fixed while building: the docs page used a TypeScript snippet parameter without `lang="ts"` (a 500); the
  multi-day date range read "December 14 – 2026 (day: 16)"; the separator lost its spaces (Svelte trims whitespace at
  an element's edges); and the events list sat 16 px left of the title.

## Open issues

1. **Production rate limit (from S3, still open).** A public site makes it acute: every visitor's page view costs
   several API calls from the web container's one address. Not changed (no answer yet).
2. **The Calendar feed skips in-progress and same-day events.** `/calendar-events/public` asks for `startDate > now`,
   and events are stored at UTC midnight, so an event disappears from the site at 00:00 UTC on its own day (the
   evening before, in the Americas), and a multi-day event disappears once it starts. The fix belongs in
   calendar-events (for example `endDate >= start of today`); cms would then show them unchanged.
3. **Canonical URLs need `ORIGIN`.** They use the web service's `ORIGIN`, which the compose file sets to
   `http://localhost:<WEB_PORT>`. A real deployment must set it to the public address, or canonical and `og:url`
   point at localhost.
4. Still from earlier sessions: no thumbnails; deleting an image in Vault gives no warning; `/uploads/` has no auth;
   uppercase URLs aren't matched; the prod uploads permission bug (user is fixing it separately).
5. **Old text links** follow moves only after their page is next saved in the builder. The demo seed's internal link
   is already stored with its id.

## Found this session, not cms: the notifications websocket reconnects every second (dev)

While chasing rate-limit failures in the matrix I found a scaffold bug that predates cms. It probably affects
friendsofmcrwr in dev too.

- The login and register actions copy the API's session cookie with SvelteKit's `cookies.set`, which URL-encodes the
  value again (the API's value is already encoded). Server-side calls decode it once and work. The browser's websocket
  to `/notifications/ws` sends the stored, double-encoded value through Vite's dev proxy straight to the API, which
  closes it with **4401 Unauthorized**. Checked: the browser's value gets 401 from `/auth/me`, and the decoded value
  gets 200.
- `notifications.svelte.ts` resets its backoff in `onopen`, and the socket opens before it's closed, so it reconnects
  about **once a second, for as long as the tab is open**.
- So every signed-in tab spends about 60 API requests a minute in dev. One tab plus a test script's own calls stays
  under the 200/min limit; two tabs, or suites run back to back, don't. That's why `s4-admin` and `s5-media` failed
  when other suites ran next to them, and passed alone.
- Production probably doesn't loop: adapter-node doesn't proxy `/notifications/ws`, so the socket never opens and the
  backoff grows to 30 s. Either way, real-time notifications don't work in dev.
- **Suggested fix (not made; it's scaffold code):** in `login` and `register`, store the cookie exactly as the API
  sent it (for example `encode: v => v` in the `cookies.set` options), and stop reconnecting on close code 4401.
  Existing sessions should keep working, because `cookies.get` still decodes the old values; check that when fixing.

## Installing cms into friendsofmcrwr: the decision for you

friendsofmcrwr already has Vault and calendar-events (and agile, commerce, contracts, crm and folio), so images and
Events would work there. There is no `arch.js` command to add a module to an existing project, so an install means:

1. Copy `modules/cms/frontend/src`, `api/src` and `api/tests` into the project (the files never collide with the
   scaffold by design).
2. Merge `module.json` by hand into its project-only files: the nav item into `nav.ts`, the widget into
   `dashboard-widgets.ts`, and the three resources into `api/src/data/permissions.json` (owner and admin everything,
   lead and contributor as in `roles`, viewer `read`).
3. Rebuild and restart **web and api**. The API re-applies `permissions.json` to the `roles` collection on every start
   (that is existing behaviour), so any role edits made in the Roles screen would be replaced, as on any restart.
4. Nothing is seeded (no demo data there), so the site starts empty and `/` keeps its current page until you publish a
   home page in Content. Nothing becomes public until you publish it.

Options:
- **(a) Install by hand now**, at a time you choose, following the steps above. Quickest.
- **(b) Add an `arch.js add <module> --project <name>` command first**, then install with it. More work, but it can
  be reused for the next module and makes the steps repeatable.
- **(c) Wait** until `cms-module` is merged to `main`.

My recommendation: merge `cms-module` first, then (a), and **fix the rate limit before the site is public**. If
friendsofmcrwr runs the production compose, Vault uploads will also hit the prod uploads permission bug you're fixing
separately. Set `ORIGIN` to the public address when it goes live.

## Questions for the user

1. **Rate limit (still open from Session 3).** Should I fix it in the scaffold? I recommend exempting web→API calls
   that carry a shared secret header.
2. **friendsofmcrwr:** (a), (b) or (c) above? And should `cms-module` be merged to `main`?
3. **Notifications websocket (scaffold):** should I fix the cookie encoding and the reconnect loop described above?
4. **Calendar feed:** should calendar-events list events until they end, so today's and in-progress events show on the
   site? (The Calendar's own `/calendar-events` page reads the same feed, so it would change there too.)
