# CMS throwaway-project test scripts

Run these against a **throwaway** project only (never friendsofmcrwr): they create, publish and delete content.

- `s2-api-matrix.mjs`: the Session 2 API exit matrix, about 105 requests.
  Run it with `node s2-api-matrix.mjs http://localhost:4002`.
  - It expects the cms demo seed (`SEED_DEMO_DATA=true`).
  - It expects two extra users, `s2viewer@example.com` (viewer) and `s2customer@example.com` (customer), whose password
    hash is copied from `admin@example.com` (see the Session 1 and 2 handoffs for the mongosh snippet).
  - It leaves the seeded site as it found it.
- `s2-web.sh`: proxy and `/cms` page checks through the web container on :3002.

The dev API allows 200 requests and 10 logins per minute, so wait about 65 seconds between runs.
