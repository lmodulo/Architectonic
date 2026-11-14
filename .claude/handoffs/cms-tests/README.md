# CMS throwaway-project test scripts

Run these against a **throwaway** project only (never friendsofmcrwr): they create, publish and delete content.

- `s2-api-matrix.mjs`: the Session 2 API exit matrix, about 105 requests.
  Run it with `node s2-api-matrix.mjs http://localhost:4002`.
  - It expects the cms demo seed (`SEED_DEMO_DATA=true`).
  - It expects two extra users, `s2viewer@example.com` (viewer) and `s2customer@example.com` (customer), whose password
    hash is copied from `admin@example.com` (see the Session 1 and 2 handoffs for the mongosh snippet).
  - It leaves the seeded site as it found it.
- `s2-web.sh`: proxy and `/cms` page checks through the web container on :3002.
- `s3-site.sh [web]`: the public-site sweep across roles (anonymous, customer, viewer, admin), 56 checks.
  It needs `s3viewer@example.com` and `s3customer@example.com` and takes about 5 minutes (65 s between roles).
- `s3-extra.sh [web] [api] [shots]`:
  - creates a level-3 page and runs `s3-menu.cjs` (Playwright, desktop and mobile)
  - checks the no-home marketing fallback
  - checks project-level reserved slugs through the proxy; this part needs a throwaway route
    `frontend/src/routes/s3probe/+page.svelte`
  - deletes what it created

- `s4-admin.cjs [web] [shots] [phases]`: the Session 4 admin exit checks in Playwright, 81 checks in about 6 minutes.
  - Phases: tree, builder, preview, conflict, guard, moves, settings, roles, mobile, cleanup. They always run in that
    order, and `tree` first removes a test branch left by an interrupted run.
  - It builds Programs › Youth › Mentoring from the UI and deletes it in `cleanup`.
  - It needs `s4viewer`, `s4contrib` and `s4lead` @example.com (roles viewer, contributor and lead), created like the
    S2 users.
  - It waits for the rate limit to drain before starting and before each role's login.
- `s4-shadow.cjs [web] [api]`: project-only reserved slugs and the tree's Shadowed badge. It needs a throwaway route
  `frontend/src/routes/s4probe/+page.svelte`.

- `s5-seed.sh [api] [image-dir]`: puts test images into Vault through Vault's API:
  - a "Photos" folder holding River, Garden, Market, School, Park, Bridge, Portrait and "Wide hero"
  - an SVG
  - an admin-only image

  Make the images with Pillow (snippet in the Session 5 handoff).
- `s5-media.cjs [web] [api] [image-dir] [shots] [mongo-container]` (the container defaults to `s5-check-mongo-1`): the Session 5 exit checks, 65 in about 5 minutes, on a
  `--modules cms,vault` project after `s5-seed.sh`. It covers:
  - what the API lists, and the crafted-reference guards
  - picker uploads and limits
  - images in text, galleries, and hero and share images
  - floats, which wrap text and stack on phones
  - the lightbox (keys, swipe, focus)
  - new versions, admin-only and deleted images
  - roles

  It needs the `s5lead`, `s5contrib` and `s5viewer` users. It deletes Park from Vault mid-run and re-uploads it at
  the end, so it can run again.
- `s5-novault.cjs [web] [api]`: a `--modules cms` project without Vault: image actions are hidden with the install
  hint, and everything else works (14 checks).
- `s6-checks.cjs [web] [api] [shots] [phases]`: the Session 6 checks, in about 7 minutes (it waits 60 s between
  phases for the rate limit). It detects whether
  calendar-events and Vault are installed and checks the matching behaviour (54 checks with both, 41 with neither).
  Phases: `links`, `events`, `seo`, `docs`, `widget`.
  - links: text links store the page id, follow a move without republishing, go plain when the page is unpublished
    or deleted, and old path-only links pick up the id on the next save; clicking a link in the editor stays put
  - events: the public page and blocks (limit, type filter, month headings, plain-text descriptions), the same dates
    after client navigation in a UTC+14 browser, the admin preview; without the Calendar module, the "unavailable"
    text and the admin warning
  - seo: description (and its fallback), robots, canonical, `og:*` and the share image, previews, client navigation
  - docs and widget: the documentation page and index, the dashboard counts for admin and viewer

  With Vault it uses an image from `s5-seed.sh`. It needs the `s5viewer` user. Its test pages are titled "S6 …" and
  are removed at the end (and at the start, if a run was interrupted).

- `followup-checks.cjs <project-dir> [web] [api] [compose-project] [phases]` (follow-up, 2026-11-14): the per-visitor
  rate limit (direct to the API and through the web server, using a second container as another visitor), the
  session cookie and notifications websocket (new and pre-fix sessions), and the calendar feed around today's date.
  Phases: `idle` (wait first), `direct`, `web`, `ws`, `calendar`; 29 checks in about 5 minutes. It also works against
  the production compose (`direct,web`).
- `prodws-checks.cjs <web> <api> <compose-project>` (2026-11-14): the production websocket pass-through
  (`frontend/server.js`) on a calendar-events project started with the production compose only: connect and stay
  open, a live notification (subscribe admin, create an event), a pre-fix cookie, Origin and path refusals, the
  handshake counted per visitor, and a prompt `docker stop`. 11 checks in about 2 minutes.

The dev API allows 200 requests and 10 logins per minute **per visitor** (since the 2026-11-14 follow-up; the visitor
is the address the web server sees, so a test script and its browser share one budget). Every SSR call counts (a
signed-in page costs about 9). Wait about 65 seconds between runs that each use much of it. The websocket reconnect
loop that used to add about 60 requests a minute per signed-in tab is fixed. To count rate-limit hits, use
`docker logs <api> | grep -c '"statusCode": 429'` (note the space).
