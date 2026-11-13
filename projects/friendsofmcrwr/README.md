# friendsofmcrwr

SvelteKit + Fastify application. Runs entirely in Docker. Generated from `candidate/` with
`node arch.js create friendsofmcrwr --modules agile,calendar-events,commerce,contracts,crm,folio,notifications,vault`.

## Modules

| Module | Nav label | Route |
| --- | --- | --- |
| agile | Agile | `/agile` (Cmd/Ctrl+K opens the log-time palette) |
| calendar-events | Calendar · Manage Events | `/calendar-events` |
| commerce | Products · Orders · Categories · Inventory | `/commerce/*` |
| contracts | Contracts | `/contracts` |
| crm | Nexus | `/crm` |
| folio | Folio | `/folio` |
| notifications | — (bell in header) | `/notifications` |
| vault | Vault | `/vault` |

## Setup

```bash
cp .env.example .env
# set SESSION_SECRET: openssl rand -hex 32
```

## Development

```bash
# First run, or after any package.json change
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# Start everything (detached)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

API changes (`api/src/`) need a rebuild: `build api` then `up -d api`. Frontend `src/` is bind-mounted.

## Ports

Offset from lmodulo's defaults so both stacks can run side by side. Set in `.env`.

| Service | URL |
| --- | --- |
| App (frontend) | <http://localhost:3001> |
| API | <http://localhost:4001> |
| MongoDB | localhost:27019 (database `appdb`) |

Both apps use a `session` cookie on `localhost`. Browsers don't scope cookies by port, so signing in to
one app signs you out of the other. Use separate browser profiles if you need both at once.

## Changing the theme

**Settings → Theme → Edit**, pick a DaisyUI theme, **Save**. It applies immediately for everyone,
including the login and marketing pages. No code change or restart needed.

`business` is the custom monochrome theme from `frontend/lmodulo-theme.css`. To add your own
theme, see "Build a custom theme" in the repo-root README.

## Demo data

Off for this project (`SEED_DEMO_DATA=false` in `.env`), so pages start empty and the dashboard
shows real figures only. To explore with sample records, set `SEED_DEMO_DATA=true` and restart the
API. Each module fills only empty collections, so this is safe to toggle, but sample data stays
until you delete it.

## Logins (seeded on first boot)

Login uses the **email** field.

| Email | Password | Role |
| --- | --- | --- |
| `admin@example.com` | `admin-password` | admin |
| `owner@example.com` | `owner-password` | owner |
| `alex@example.com` | `alex-password` | lead |
| `jordan@example.com` | `jordan-password` | contributor |

## Useful commands

```bash
docker compose logs -f web
docker compose logs -f api            # also shows email preview URLs
docker compose exec mongo mongosh appdb
docker compose down                   # stop, keep data
docker compose down -v                # stop, wipe database + uploads
```
