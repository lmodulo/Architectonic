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

The dev API allows 200 requests and 10 logins per minute, and every SSR call counts (a signed-in page costs about 9).
Wait about 65 seconds between runs. To count rate-limit hits, use `docker logs <api> | grep -c '"statusCode": 429'`
(note the space).
