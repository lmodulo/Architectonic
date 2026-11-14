# CMS follow-up (2026-11-14): merge, scaffold fixes, calendar feed, friendsofmcrwr install

This follows [Session 6](cms-module-session-6.md) and acts on the user's answers to its four questions:

1. **Rate limit:** "exempt the web container's own calls using a shared secret, as a separate small scaffold change,
   before any production use."
2. **friendsofmcrwr:** "your recommendation", that is, merge `cms-module` into `main`, then install by hand (option a).
3. **Notifications websocket:** yes, fix it.
4. **Calendar feed:** list events "until they end".

## Commits

- `main` was fast-forwarded to `cb6fb92` (cms sessions 1–6). Not pushed.
- Branch `post-cms-fixes`, from `main`; not merged and not pushed:

| Commit | What |
|---|---|
| `103e4b5` | scaffold: rate-limit each visitor, not the web server as a whole |
| `6c9382e` | scaffold: fix the notifications websocket reconnecting every second |
| `359baf5` | calendar-events: list public events until they end (and a date-range display fix) |
| (last) | friendsofmcrwr: sync the three fixes and install cms; these handoffs |

friendsofmcrwr runs from this working tree, so it now runs `post-cms-fixes` code. Checking out `main` before this
branch is merged would take the fixes and the cms files back out from under the running app.

## 1. Rate limit (scaffold)

**Deviation from "exempt", and why.** Browsers never call the API directly: every call, including login, goes
through the web server (page loads, form actions and the `/api/*` proxies). Exempting the web server's calls would
therefore have removed every limit, the 10-a-minute login limit included. The same shared secret is used instead to
say *which visitor* each call is for, and the API limits each visitor separately. Calls the web server makes
outside any request (none today) are exempt, as asked.

- `candidate/frontend/src/lib/server/api-identity.ts`: `installApiIdentity()` wraps the global `fetch` once. A call
  whose origin is `API_URL`'s gets `x-internal-secret` and `x-client-ip`; other hosts are untouched, so the secret
  only goes to the API. The visitor's address comes from an `AsyncLocalStorage` that `hooks.server.ts` fills from
  `event.getClientAddress()` in a new first handle (`visitorHandle`). An internal `event.fetch` keeps the outer
  visitor. An unknown address is sent as `unknown`, which the API doesn't trust, so those calls fall back to the
  shared limit rather than escaping it. Wrapping `fetch` was chosen over editing the ~350 call sites in the scaffold
  and modules, which all use the global `fetch(`${API_URL}…`)`.
- `candidate/api/src/lib/callerKey.ts`: `identifyCaller(headers, secret)` returns `visitor` (secret matches and a
  valid IPv4/IPv6 address), `web` (secret matches, no address header) or `direct` (anything else, including a
  secret shorter than 32 characters). The comparison is constant-time.
- `candidate/api/src/plugins/rateLimitPlugin.ts`: `keyGenerator` uses the visitor's address or `req.ip`;
  `allowList` exempts `web`. Both also apply to the auth routes' own limits (checked in `@fastify/rate-limit` 10.3:
  route config is merged over the global options). It logs a warning at startup when the secret is unset or short.
- Config: `INTERNAL_API_SECRET` for web and api in `docker-compose.yml`, `.env.example` (blank; explained) and
  `render.yaml` (generated on the api service, read by the frontend with `fromService`). `arch.js` writes a fresh
  64-hex secret into each new project's `.env`. Without the secret nothing changes.
- **Behind a reverse proxy** the web server sees the proxy's address unless adapter-node's `ADDRESS_HEADER` (and
  `XFF_DEPTH`) are set on the web service; then every visitor shares one limit again. Documented in
  `.env.example`, `render.yaml` and `candidate/CLAUDE.md` (new "Rate limit" section); not set anywhere, because the
  right header depends on the host.
- A test script and its browser now share one budget (both are "the host" to the web server), but different
  projects and other visitors don't.

## 2. Notifications websocket (scaffold)

- `login` and `register` store the API's cookie as sent: `cookies.set('session', value, { encode: (v) => v, … })`.
  `cookies.get` decodes it once, and the raw value (`id.signature`, base64 with `+` and `/`) is safe in the
  `cookie:` header that server-side calls send, so pages work as before.
- `notifications.svelte.ts`: stops reconnecting on close code 4401, and resets the backoff on the server's `init`
  message instead of `onopen` (a socket that opens and is closed at once now backs off 1, 2, 4… 30 s).
- **Sessions from before the fix** (double-encoded cookies, including everyone signed in to friendsofmcrwr) keep
  working for pages. Their socket is refused once and gives up; live notifications return at the next sign-in.
- **Still open (not asked, pre-existing):** in production, adapter-node doesn't proxy `/notifications/ws` (only
  Vite's dev server does), so live notifications never connect there. Checked: the socket now backs off (5 tries in
  20 s) instead of looping.

## 3. Calendar feed (calendar-events)

- `/calendar-events/public` without `from` now lists events that haven't ended: `endDate > now − 36 h` (or
  `startDate`, if an event has no end date). Events are date-only, stored at UTC midnight, with no time zone, so an
  event stays until its last day is over everywhere (UTC−12). In the Americas it drops off overnight; in Europe,
  around midday the next day. A site time-zone setting would tighten this; not built.
- An explicit `?from=` still means "starting after" (nothing passes it today). The one-year cap is unchanged.
- The Calendar page and the cms Events component both read this feed; cms needed no code change. The Calendar and
  cms docs now say so.
- **Also fixed:** the Calendar's own date range for an event within one month read "Wednesday, November 11 – 2026
  (day: 15)" (`fmtDateRange` in `lib/utils/calendarEvents.ts`; same Intl problem cms hit in Session 6). It now reads
  "Wednesday, November 11 – 15, 2026".

## 4. friendsofmcrwr install

Done by hand, as `arch.js` would, after a dry run showed the 87 cms files collide with nothing:

1. Copied `modules/cms/frontend/src`, `api/src` and `api/tests` (`rsync --ignore-existing`).
2. `nav.ts`: a "Content" item after Audit Log (where `arch.js` puts module items); the user's hidden items and labels
   are untouched. `dashboard-widgets.ts`: `CmsDashboardWidget`, order 80. `permissions.json`: the cms rows exactly
   as a fresh `arch.js` project has them; no existing row changed.
3. Synced the scaffold fixes (byte-identical; `docker-compose.yml` and `.env.example` hand-merged, keeping the Stripe
   and Calendar extras) and the calendar-events changes. `.env` got its own `INTERNAL_API_SECRET` (`.env` isn't
   committed).
4. Recreated **web and api only** (`docker compose -p friendsofmcrwr -f docker-compose.yml -f docker-compose.dev.yml
   up -d web api`); Mongo kept running. Down for under a minute.

Verified without signing in or changing data:

- `/` renders the same visible text as before (the dev HTML is 26 KB larger: inline CSS for the cms components).
  `/login`, `/documentation` and `/shop` are 200 as before; `/documentation/cms` is new.
- `/cms` and `/calendar-events` redirect to `/login` when signed out. The API's `/cms/nodes` and `/cms/settings`
  answer 401; `/cms/site/menu` is empty. `cms_nodes` and `cms_pages` exist and are empty (no demo seed there).
- All six roles carry the cms permissions. No startup warnings; both containers have the 64-character secret.
- svelte-check: no errors in the cms files or the widget registry; `nav.ts` shows only the existing lucide icon
  typing noise (one per icon line, the new one included).

**What changes for the user there:**
- A "Content" item in the sidebar for owner, admin, lead, contributor and viewer, and a Content dashboard widget.
- Nothing is public until a page is published. `/` keeps its current page until a home page is published in Content.
- **Unknown lowercase URLs now show the site's "Page not found"** instead of redirecting signed-out visitors to
  `/login` (for example `/events` and `/about`: 303 before, 404 now). That is the cms catch-all, as designed.
- Their current sessions miss live notifications until they sign in again (see §2).

## Test results

Throwaway project `pcf-test` (`--modules cms,vault,calendar-events,commerce`, demo seed, dev compose, ports
3061/4061/27061), plus the same code on the production compose (`pcf-prod`, 3062/4062/27062). Both torn down.

| Check | Result |
|---|---|
| `callerKey` unit tests (new) | 5/5 |
| `candidate/api` suite | 168/168, plus the known roles-test `ERR_HTTP_HEADERS_SENT` (also on the untouched code) |
| `followup-checks.cjs`, dev, all phases in one run | 29/29 |
| `s3-site.sh` (public site, four roles) | 56/56, no rate-limit hits |
| `s6-checks.cjs` (with Calendar and Vault) | 54/54, no rate-limit hits |
| Production compose: `direct` / `web` phases | 9/9 (from an idle minute) / 2/2 |
| Production: login, cookie, websocket | login works, cookie encoded once, socket backs off (5 tries in 20 s at 1.8, 3.1, 5.2, 9.3, 17.5 s) |
| svelte-check (pcf-test) | 90 errors / 70 warnings, the Session 6 baseline; none in changed files |
| `candidate/api` tsc | same counts as before the change (25 TS2314, 9 TS2339, 1 TS2349, 170 TS7006, 2 TS7016) |

**How it got there (honestly).** The first runs of the new script failed five checks, all in the script:
- Vite's dev server refused the second visitor's `Host: web` (403), so it now sends `localhost`.
- About a quarter of session cookies contain nothing that needs encoding, which hid the old-cookie case; the script
  now logs in until the cookie does.
- Logins clicked before hydration stalled; it now waits for `networkidle`.
- `process.exit` cut off buffered output on macOS pipes; it now sets `exitCode`.
- A speculative "pages degrade" check was dropped.
On production, the first `direct` run counted 198 instead of 201 because the readiness probe's page loads shared the
host's budget (by design); the rerun from an idle minute passed 9/9. Typing the two new rate-limit callbacks with
`FastifyRequest` added errors (the scaffold's Fastify types don't resolve), so they use a small structural type.

## Still open (when this handoff was first written)

1. ~~Merge `post-cms-fixes` into `main`~~: done, see below.
2. ~~Live notifications in production~~: done, see below.
3. ~~`arch.js` copies `SESSION_SECRET`~~: done, see below.
4. From before: `ORIGIN` must be the public address in production (canonical URLs, and now the websocket's Origin
   check); the prod uploads permission bug (user fixing separately); `/uploads/` has no auth; no thumbnails.
5. Nothing is pushed.

## Addendum (same day): the user said yes to all three

- **Merged:** `main` fast-forwarded to `900cacc` (`post-cms-fixes`). Not pushed.
- **Branch `prod-ws-and-session-secret`** (from `main`; not merged, not pushed):

| Commit | What |
|---|---|
| `00e2971` | scaffold: live notifications in production (websocket pass-through) |
| `d21ec79` | arch.js: generate `SESSION_SECRET` per project |

**Production websocket.** `candidate/frontend/server.js` imports adapter-node's `build/index.js` (which exports its
server; so `PORT`, `HOST`, `ORIGIN`, `ADDRESS_HEADER`, graceful shutdown etc. are unchanged) and handles `upgrade`
for `/notifications/ws` only: it forwards the handshake to `API_URL` with `INTERNAL_API_SECRET` and the visitor's
address (worked out as adapter-node does), relays the 101 and pipes both ways. Other paths get 404; an `Origin` that
isn't `ORIGIN` gets 403 (skipped when `ORIGIN` is unset or the client sends none); a non-101 answer from the API
(e.g. 429) is passed on; open sockets are destroyed on SIGTERM/SIGINT. The Dockerfile copies it and runs
`node server.js`. Dev still uses Vite's proxy. Synced to friendsofmcrwr, which runs the dev compose, so nothing
changed there at runtime and it wasn't restarted.

**`arch.js` secrets.** Each new project gets a fresh `SESSION_SECRET` and `INTERNAL_API_SECRET`. With no
`candidate/.env` (a fresh clone), it creates the project's `.env` from `.env.example` first. README updated.

**Tests** (throwaway `pws-test`, `--modules calendar-events`, production compose only; torn down):

| Check | Result |
|---|---|
| `prodws-checks.cjs` | 11/11 on the first run: connects and stays open; a notification for a newly created event arrives live and the bell updates without a reload; a pre-fix cookie is refused once, not retried; foreign Origin 403, own Origin 101, other path 404; with the host's budget used up its handshake gets 429 while another container's gets 101; `docker stop` with a socket open takes 0.2 s; the web container comes back after `docker start` |
| `arch.js` on this repo | the project's `SESSION_SECRET` is fresh (not `candidate/.env`'s), both secrets 64-hex, each once |
| `arch.js` on a fresh clone (copy without `candidate/.env`) | `.env` created from `.env.example`; both secrets filled; the module's env var still appended; no placeholder left |
