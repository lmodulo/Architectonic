# CMS module, Session 3: the public site

Done 2026-11-13 on branch `cms-module`, and committed there. The master plan is `.claude/handoffs/cms-module.md`, and
its §3, §4, §7 and Known pitfalls now carry this session's decisions, marked *(S3)*. This session covered master §4
and the §7 skeleton. No scaffold file changed, so nothing was synced to friendsofmcrwr.

## Files added or changed (under `modules/cms/`)

**API**
- `lib/cmsTree.ts`: added `publicTree()` and the `SiteTreeItem` type.
- `routes/cms/site.ts`: added the public `GET /cms/site/tree`, used by the sitemap.
- `tests/unit/lib/cmsTree.test.ts`: +1 test (43 in total).

**Frontend: routing and loading**

| File | What it does |
|---|---|
| `params/cmspath.ts` | Matcher: rejects `api`, `uploads` and `_app` as the first segment, and any segment outside `[a-z0-9-]`. |
| `lib/config/module-routes/cms.ts` | Route rules: the catch-all is public and bare, `/` is bare, `/cms/preview` is bare. |
| `lib/server/cms/site.ts` | `loadMenu` (never throws), `loadPage`, `loadPreview` (for S4). Runs component loads in parallel with a 5 s timeout; handles `rest` and `subpaths`. |
| `lib/server/cms/reserved.ts` | The project's own top-level route segments (lazy glob of route files, server only), plus `reservedSlugList()`. |
| `lib/server/module-home/cms.ts`, `lib/config/module-home/cms.svelte` | The `/` override; returns null unless a home page is published. |
| `routes/(site)/+layout.server.ts`, `+layout.svelte`, `+error.svelte` | The menu, `SiteShell`, and 404s inside the site chrome. |
| `routes/(site)/[...path=cmspath]/+page.server.ts`, `+page.svelte` | `resolve`, then a 307 redirect, 404 or 503, then `CmsPage`. |
| `routes/api/cms/[...path]/+server.ts` | Now also refuses top-level slugs the project's routes use: on create, on a root PATCH of `slug` or `type`, and on a move to the root. |

**Frontend: shared helpers (`lib/cms/`)**
- `components.ts`: the registry glob, `CMS_COMPONENTS` and `componentFor`.
- `links.ts`: `safeHref`, `linkHref`, `isExternal`, `toSlug`.
- `motion.ts`: `ms()`, which honours `prefers-reduced-motion`.
- `menuKeys.ts`: arrow-key handling for the menus.
- `types.ts`: added `SiteTreeItem` and the registry types (`CmsComponentEntry`, `PropSpec`, `CmsComponentProps`,
  `CmsComponentLoadContext`).

**Frontend: components**
- `render/`: `CmsPage`, `BlockRenderer`, `RichTextRenderer`, `HeroBlock`, `ButtonsBlock`, `DividerBlock`,
  `ComponentBlock`.
- `site/`: `SiteShell`, `SiteMenu`, `SiteMenuItem` (recursive flyouts), `SiteMobileMenu`, `SiteFooter`,
  `SitemapComponent`.
- `cms-prose.css`.
- `lib/config/cms-components/sitemap.ts`: the built-in registry entry (page and block, prop `includeHidden`).

**Test scripts (`.claude/handoffs/cms-tests/`)**
- `s3-site.sh`: a curl sweep across roles.
- `s3-menu.cjs`: Playwright menu behaviour.
- `s3-extra.sh`: a level-3 page, the browser checks, the home fallback and reserved slugs through the proxy.

## Deviations from the plan, and why

1. **New public endpoint `GET /cms/site/tree`.** A sitemap should list every public page, but the menu leaves out
   menu-hidden ones. The sitemap's `includeHidden` prop decides whether to list them. It also exercises the registry's
   `props`.
2. **`CmsPage` is the shared page body.** It renders the node title as the `h1` unless a hero comes first. Rich text
   only allows h2–h4, so without this most pages would have no `h1`. It sets `<title>` now; S6 adds the meta tags.
3. **The active trail is a `bg-base-200` pill, not `text-primary`.** In screenshots, primary was the least readable
   text on the default (business) theme. Prose links mix primary with the text colour for the same reason.
4. **The drawer uses `slide` along x on a clipping wrapper.** That is the plan's "slide x", without content reflow.
5. **Hover then click.** Playwright found that the click following a hover-open closed the menu. Now that click keeps
   it open.
6. **Brand fallback:** brand, else `appName`, else nothing (not the word "Home").
7. **Staff get a "Dashboard" link** in the site header, so they have a way back into the app.
8. **A 429 or other API failure on `resolve` returns 503,** while a 404 stays a 404. The home override returns null in
   both cases, so `/` falls back to the marketing page.

## Test results

All on the throwaway project `s3-check` (`--modules cms`, ports 3002 / 4002 / 27020, demo seed, with a viewer and a
customer added). A temporary route `routes/s3probe/` was added there for the reserved-slug check.

- **Site sweep (`s3-site.sh`): 56/56 on the final code, with 0 × 429.**
  - These pass for anonymous, customer, viewer and admin users:
    - `/` shows the CMS home with no app shell and no marketing markup
    - `/about` has its `h1`; `/about/team` has breadcrumbs
    - `/resources` → 307 `/resources/sitemap`, and the sitemap lists pages
    - `/home` → 307 `/`
    - `/nope`, `/about/nope` and `/events/summer-fair` → 404 inside the site chrome
    - `/privacy` → 200
    - `/api/nope` → a plain 404, not the CMS page
  - Logged-out `/dashboard` and `/cms` go to `/login`. Admin `/dashboard` still has the app shell. `__data.json` works
    for site pages.
- **Browser menu checks (`s3-menu.cjs`): 28/28.**
  - **Desktop:**
    - hover opens a dropdown with a running transition
    - a level-3 flyout opens on hover, and moving away closes everything
    - ArrowDown opens and focuses the first item; Up and Down move; ArrowRight opens a flyout and focuses its first
      item; ArrowLeft closes it and refocuses its toggle
    - Esc closes and refocuses the top toggle, and ArrowRight moves along the top row
    - a label opens on click, and an external link gets `target=_blank` with `noopener noreferrer`
    - clicking outside closes the menu
    - the active trail and level-3 breadcrumbs show, and site-to-site navigation is client-side
  - **Mobile:**
    - the drawer opens with a transition as a modal dialog, with focus on Close
    - the active branch starts expanded and the page is scroll-locked
    - the accordion opens with a transition
    - Esc closes the drawer, refocuses the menu button and releases the scroll lock
    - a link closes the drawer
  - **No page errors.**
- **Extras (`s3-extra.sh`): 13/13.**
  - With the home unpublished, `/` is the marketing page with no site shell; republishing restores the CMS home.
  - The proxy refuses root `s3probe` (explicit or derived from the title), a root rename to it, and a move of it to
    the root. The API alone accepts it; it's fine below the root; ordinary moves and deletes pass through.
- **Screenshots:** checked in the business (dark) and corporate (light) themes. The light theme was set only in the
  test browser; the shared setting was untouched.
- `grep -r "{@html" modules/cms` finds nothing. Rich-text mark spacing is correct
  (`around <strong>120 volunteers</strong>.`).
- **svelte-check:** 49 errors and 41 warnings, the same as Session 2's baseline, with none in cms files. I suppressed
  the 3 delegated-keydown a11y warnings with a reason. API `tsc` has no cms errors beyond the Fastify noise.
  Unit tests: 43/43.
- `s3-check` is torn down.

**Bugs I found and fixed along the way:**
- `<entry.component>` rendered nothing in SSR, so the sitemap was blank. The fix is a capitalised `$derived` component;
  see the plan's §7 and the memory note.
- The hover-then-click toggle described above.
- Unreadable active and link colours on the business theme.

**Test-harness mistakes I made and corrected:**
- A wrong 429 grep. It also made the Session 1 handoff's "0 × 429" claim wrong; that handoff is now corrected, and its
  results still hold.
- Bash brace expansion of inline JSON bodies.
- A class-name grep that matched inlined dev CSS.

## Open issues

1. **Production rate limit (important, existing).** The API's 200/min limit is per IP, and every SSR request comes
   from the web container, so all visitors share it. A public page costs about 5 API calls (3 public settings, the
   menu and `resolve`), so roughly 40 anonymous page views a minute exhaust it. After that, pages answer 503 and staff
   look logged out. **Needs a scaffold decision** (question 1).
2. **Uppercase or dotted URLs** (`/About`) don't match the CMS route. Logged-out visitors go to `/login`, as with any
   unknown URL. A lowercase redirect could be added later.
3. **ScaffoldHome's CSS** ships on `/` even when the CMS home renders (static import). It's scoped, so it's harmless.
4. **The `events` key** in the seed has no registry entry until S6. `/events` shows only its title for now.
5. Gallery blocks, `cmsImage` and hero images render nothing until S5, as planned.

## First steps for Session 4 (admin; master §5)

1. Read the master plan (§5, plus the *(S2)* and *(S3)* notes), then this file. Work on `cms-module`.
2. Replace the placeholder `/cms` page:
   - `routes/cms/+layout.svelte` with `PageHeader` and tabs for Site and Settings
   - the site tree with drag and drop and keyboard moves (`POST /cms/nodes/:id/move`), and the node panel
   - inline slug validation from `reservedSlugList()`, which the page load sends to the UI
3. Page builder at `routes/cms/pages/[nodeId]/`:
   - `BlockEditor`, `BlockCard`, `BlockInserter`, `RichTextEditor` (StarterKit with
     `codeBlock: false, code: false, heading: { levels: [2, 3, 4] }`), and the Hero, Buttons and Component editors
   - autosave with `rev`; on a 409, show the "changed elsewhere" prompt
   - `beforeNavigate` guard
   - render the canvas with `render/` components and `cms-prose.css`
4. Preview at `routes/cms/preview/[nodeId]/`:
   - its `+page.server.ts` calls `loadPreview` and requires `cms_pages.read`
   - its `+page.svelte` renders `SiteShell` (with `loadMenu`) and `CmsPage`, plus a "Draft preview" ribbon
   - the bare route rule is already in place
5. Settings at `routes/cms/settings/`: home page, footer text and links.
6. Rerun `cms-tests/s3-site.sh`, `s3-menu.cjs` and `s2-api-matrix.mjs` as regression checks, with the cool-downs in
   their README.

## Questions for the user

1. **Rate limit (open issue 1).** Should I fix how the API rate-limits the web container's SSR traffic in the scaffold
   (candidate, synced to friendsofmcrwr)? I'd do it as a separate small change. Options:
   - (a) The web container sends the client's IP (`x-forwarded-for` from `getClientAddress()`), and the API trusts it
     from the internal network, so each visitor has their own bucket. This is the most correct, but it touches every
     server-side `fetch`.
   - (b) Exempt web→API calls that carry a shared secret header (`INTERNAL_API_KEY` set on both services), and keep the
     limit for direct API traffic. This is smaller, and the web layer could add its own limit later.
   - (c) Leave it for now.

   I recommend (b), done before any production use of the public site.
2. Not mine: `.claude/handoffs/client-portal-customer-access.md` shows as deleted in the working tree. I didn't touch
   it and left it out of this commit. Restore it, or commit the deletion yourself if that was intended.
