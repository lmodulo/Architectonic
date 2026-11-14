# Handoff: `cms` module ("Content"), a CMS for the public website

Written 2026-11-13 at HEAD `0f7980a` with a clean working tree. **Commit at the end of each session** (user, 2026-11-13), on
branch `cms-module`; don't push and don't merge to `main` unless asked.
This is the master plan for the module, and it stays the source of truth. Each session ends by writing
`.claude/handoffs/cms-module-session-<N>.md` and updating the status table below (see "End-of-session protocol").

## Status

| # | Session | State | Session handoff |
|---|---------|-------|-----------------|
| 1 | Scaffold extension points (candidate + friendsofmcrwr sync) | ☑ 2026-11-13 | [session 1](cms-module-session-1.md) |
| 2 | CMS API + module skeleton + seed | ☑ 2026-11-13 | [session 2](cms-module-session-2.md) |
| 3 | Public site: routing, site shell, n-deep menu, text blocks, component registry | ☑ 2026-11-13 | [session 3](cms-module-session-3.md) |
| 4 | Admin: site tree + block page builder (no images) | ☑ 2026-11-13 | [session 4](cms-module-session-4.md) |
| 5 | Vault media: picker, aligned images, gallery + lightbox | ☑ 2026-11-13 | [session 5](cms-module-session-5.md) |
| 6 | Events component, SEO, docs, widget, final test matrix | ☑ 2026-11-14 | [session 6](cms-module-session-6.md) |
| — | Follow-up: merged to `main`; scaffold rate limit + websocket fixes; calendar feed; cms installed in friendsofmcrwr | ☑ 2026-11-14 | [follow-up](cms-module-followup.md) |
| — | Follow-up 2: live notifications in production; `arch.js` session secret (branch `prod-ws-and-session-secret`) | ☑ 2026-11-14 | [follow-up, addendum](cms-module-followup.md#addendum-same-day-the-user-said-yes-to-all-three) |

## Goal

A new module `modules/cms`. Its nav item reads **Content** (`/cms`, lucide `LayoutTemplate`) and it manages the public
website rendered by the same SvelteKit app:

- **Site tree.** An n-deep tree. Each node is both a menu item and a URL.
- **Block page builder.** Rich text in which Vault images can float left or right with the text wrapping around them,
  plus hero, gallery (grid that opens a lightbox on click), buttons, divider and embedded-component blocks.
- **Images come from Vault.** A picker shows Vault's images. Uploads go into a Vault folder (default "Website Media").
  Editors place and align images inside the CMS.
- **Custom Svelte pages.** A registry of Svelte components that can be a whole page or a block. The first real one
  (Session 6) is **Events**: public, active events from the `calendar-events` module.

## Decisions (settled by the user on 2026-11-13; don't re-open them)

1. **Root URLs.** The public site serves `/`, `/about` and `/about/team`. This needs small, generic extension points in
   `candidate/`; the scaffold marketing page stays as the fallback home.
2. **One site tree.** Node types: `page` (blocks), `component` (registry Svelte page), `link` (external or internal URL)
   and `label` (a parent with no page of its own). A URL is the node's slugs joined. Each node has a `showInMenu` flag.
3. **Block-stack builder** in the Gutenberg/Sanity style: an ordered list of blocks, a "+" inserter between blocks,
   drag to reorder, and editing in place.
4. **Module only.** Build and verify in throwaway projects. Do **not** install cms into friendsofmcrwr; the user decides
   that later. *(Done 2026-11-14 at the user's choice, by hand; see the follow-up handoff.)*
5. **Scaffold edits are synced to friendsofmcrwr** (the byte-identical convention). That is not a cms install: copy the
   changed scaffold files only.

## Architecture

### 1. Scaffold extension points (`candidate/`; Session 1)

All of these are generic, and none of them changes behavior when no module uses them.

- **Route rules that match a route id.** In `candidate/frontend/src/lib/config/route-rules.ts`:
  - Make `prefix` optional and add `routeId?: string`, matched exactly against the SvelteKit route id.
  - Add an `applies(rule, path, routeId)` helper. *(Built in S1.)* A rule with both `prefix` and `routeId` matches only
    when both match; a rule with neither matches nothing. `routeId` is null for unmatched URLs, so `routeId` rules never
    apply to them. For `__data.json` requests, SvelteKit sets the page's route id, so client navigation is gated the same way.
  - `isPublicRoute`, `isCustomerRoute` and `isBareRoute` take an optional `routeId`.

  Then pass the route id at the call sites:
  - `hooks.server.ts`, where the gates are around lines 63 and 68: pass `event.route.id`. In SvelteKit 2.55 this is
    already set when `handle` runs (checked in `respond.js`).
  - `routes/+layout.svelte:43`: pass `page.route.id`.

  Existing prefix rules (commerce, folio, agile, vault) and `customer-home.ts` keep working unchanged.
- **Segment-boundary fix.** `ROUTE_PERMISSIONS` in `hooks.server.ts` matches with `path.startsWith(prefix)`, so a CMS
  slug like `/roles-of-the-board` would bounce staff without `roles.read` to `/403`. Match `path === p || path.startsWith(p + '/')`.
- **Home-page override.** Today there is no `src/hooks.ts` and no `routes/+page.server.ts`. Don't use `reroute`.
  - *New* `src/lib/server/module-home.ts`:
    - globs `./module-home/*.ts`; each file default-exports `(event: ServerLoadEvent) => Promise<object | null>`
      (type `ModuleHomeLoader`); the key is the file name, and a key with no matching `.svelte` falls back to the
      scaffold page
    - `resolveModuleHome(event)` returns the first non-null `{ key, data }`, ordered by file name
    - each loader runs inside try/catch
  - *New* `src/lib/config/module-home.ts`: an eager glob of `./module-home/*.svelte`, mapping key to component.
  - *New* `routes/+page.server.ts`: `load = async (e) => ({ moduleHome: await resolveModuleHome(e) })`.
  - Move the 957-line marketing markup from `routes/+page.svelte`, unchanged, into *new* `$lib/components/ScaffoldHome.svelte`.
    The page becomes `{#if Home}<Home data={data.moduleHome.data} />{:else}<ScaffoldHome />{/if}`.

  This split keeps private env (`API_URL`) out of the client bundle.
- **Upload size behind adapter-node.** adapter-node's `BODY_SIZE_LIMIT` defaults to 512K, but the API accepts 10 MB
  (`api/src/server.ts:49`). In production, larger Vault, commerce and avatar uploads already fail through the proxy.
  - Add `- BODY_SIZE_LIMIT=${BODY_SIZE_LIMIT:-10M}` to the `web` service in `candidate/docker-compose.yml`.
  - Do this in compose, because arch.js writes `.env`, which the web container doesn't read.
- **Docs.** Update the "Module routes" bullet in `candidate/CLAUDE.md` and the README "Public / customer / shell-free
  routes" paragraph (around line 559) to cover `routeId` rules and the home override.
- **Sync to friendsofmcrwr.**
  - Before overwriting each file, confirm the project copy equals `git show HEAD:candidate/...`.
  - Hand-merge the files that are intentionally different there: `+layout.svelte` (it has the agile LogTimePalette)
    and `docker-compose.yml`.
  - Then rebuild and restart **web only**. Touch no settings or data.

### 2. Data model (Mongo, native driver; no `workspaceId`)

There is one public site per deployment, as with settings and the commerce storefront. Only media lookups are
workspace-scoped.

- **`cms_nodes`**
  - Fields:
    ```
    { _id, parentId: ObjectId|null, order: number, type: 'page'|'component'|'link'|'label',
      title, slug?, showInMenu: boolean, status: 'draft'|'published',
      component?: { key, props }, url?, newTab?, createdAt, updatedAt, createdBy, updatedBy }
    ```
  - Indexes: `{ parentId: 1, order: 1 }`, and a unique `{ parentId: 1, slug: 1 }` with a partial filter on
    `slug: { $type: 'string' }`.
  - `link` nodes have no slug and no children.
  - A `label` node's slug is part of its children's URLs. Visiting the label's own URL redirects (307) to its first
    visible child.
  - **Don't store a materialized path.** Trees are small, so load every node and build paths in memory; that way moves
    don't have to rewrite paths.
  - A node is publicly visible only if it **and all its ancestors** are `published`.
- **`cms_pages`**
  - Fields:
    ```
    { _id, nodeId (unique), draft: { blocks, seo }, published: { blocks, seo } | null,
      rev: number, publishedAt, updatedAt, updatedBy }
    ```
  - Draft and published live on one document because compose runs a standalone `mongo:7` with no transactions, and a
    single-document update keeps publish atomic.
  - `rev` is the optimistic lock: a stale save returns `409`.
  - *(S2)* Unpublishing a page sets `published: null`, so only `status` and `published` decide what is public.
- **`cms_settings`**: one document, `{ _id: 'site', homeNodeId, footer: { text, links: FooterLink[] }, mediaFolderId }`.
  *(S2)* `FooterLink` is `{ label, link: LinkRef, newTab? }`, because a bare `LinkRef` has no label.
- **Blocks:** `{ id: crypto.randomUUID(), type, data }`. Shared types live in `frontend/src/lib/cms/types.ts`.
  ```ts
  type ImageRef = { vaultId: string; src: string; alt: string; w?: number; h?: number };
  type LinkRef  = { nodeId: string } | { url: string };   // nodeId → path at read time, so moves don't break links
  richText:  { doc: TiptapJSON }
  hero:      { title, subtitle?, image?: ImageRef, align: 'left'|'center', height: 'sm'|'md'|'lg', cta?: { label, link: LinkRef } }
  gallery:   { images: (ImageRef & { caption?: string })[], columns: 2|3|4|5|6, aspect: 'square'|'4:3'|'natural', gap: 'sm'|'md'|'lg' }
  buttons:   { items: { label, link: LinkRef, style: 'primary'|'outline' }[], align: 'left'|'center'|'right' }
  divider:   { style: 'line'|'space', size: 'sm'|'md'|'lg' }
  component: { key, props }                  // registry entry whose modes include 'block'
  ```
  The `cmsImage` node inside rich text has the attributes
  `{ vaultId, src, alt, caption?, align: 'left'|'right'|'center'|'full', width: 25|33|50|100, w, h }`.
  *(S6)* A `link` mark inside rich text is `{ href, target, nodeId? }`. With `nodeId` it points at a site page: the
  public URL comes from the page's `links` map, so it follows moves like a `LinkRef`, and `href` is only the editor's
  copy of the path.

### 3. API (`modules/cms/api/src/routes/cms/`; Fastify autoload)

`index.ts` creates the indexes and **registers its sibling files itself**: autoload ignores the other files in a folder
that has an `index.ts` (see `modules/vault/api/src/routes/vault/index.ts`). Follow Vault's style:

- `mapX()` turns `_id` into `id`
- requests are validated with a JSON `schema`
- every write calls `logAudit`
- errors use `reply.notFound`, `reply.conflict` and similar

Slugs come from `candidate/api/src/lib/slug.ts` `toSlug()`.

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/cms/nodes` | cms_nodes.read | flat list in tree order (parents first), each with a computed `path`, public `href` (`/` for home), `visible` and `isHome` |
| POST | `/cms/nodes` | cms_nodes.create | reserved-slug + sibling-slug check |
| PATCH | `/cms/nodes/:id` | cms_nodes.update | same checks. *(S2)* `type` may change (a node with children can't become a link). `status` can't be set here; use publish/unpublish. |
| DELETE | `/cms/nodes/:id` | cms_nodes.delete | 409 if it has children; also deletes its `cms_pages` doc |
| POST | `/cms/nodes/:id/move` | cms_nodes.update | `{ parentId, index }`. Rejects moving under itself or a descendant (walk up from the new parent), under a `link`, or next to a sibling with the same slug (409). Renumbers old and new siblings with `bulkWrite`; safe to re-run. |
| GET | `/cms/pages/:nodeId` | cms_pages.read | draft, published metadata, `rev` |
| PUT | `/cms/pages/:nodeId/draft` | cms_pages.update | `{ blocks, seo, rev }`; sanitized; returns `{ rev, draft, removed }`. A stale `rev` gets 409 with the current `rev` in the body. |
| POST | `/cms/pages/:nodeId/publish` | cms_publish.update | *(S2)* Works for **every node type**: it sets `status: published`, and for pages it also copies the draft to published. Optional `{ rev }` gets 409 if the draft has moved on. Returns `{ status, publishedAt, visible, warnings }`. Warnings so far: an unpublished ancestor, and links to items that aren't public; missing images come in S5. |
| POST | `/cms/pages/:nodeId/unpublish` | cms_publish.update | every node type; returns a warning with the number of descendants hidden too |
| GET | `/cms/pages/:nodeId/preview` | cms_pages.read | same shape as `resolve`, built from the draft |
| GET / PATCH | `/cms/settings` | cms_nodes.read / cms_nodes.update | |
| GET | `/cms/media`, `/cms/media/folders`, `/cms/media/:id` | cms_pages.update **and** a manual `vault_documents.read` check | see §6. Deferred to S5, together with `cmsRole.ts`. |
| GET | `/cms/site/menu` | **none** | published, visible, `showInMenu` tree, plus footer |
| GET | `/cms/site/tree` | **none** | *(S3)* every visible page, component and label (menu-hidden ones flagged with `showInMenu`, links left out), nested; used by the `sitemap` component |
| GET | `/cms/site/resolve?path=` | **none** | `{ node, page: { blocks, seo }, media: {vaultId → {url,w,h}}, links: {nodeId → path}, breadcrumbs, rest? }`, or `{ redirect }`, or 404. `/` resolves to `homeNodeId`, and the home node's own path redirects to `/`. *(S2)* `rest` is returned for any component node with leftover segments, and the frontend 404s it unless the registry entry has `subpaths`. A label redirects to its first visible page or component, descending through labels and skipping links. `media` stays `{}` until S5. |

- **Sanitize on save** (*new* `api/src/lib/cmsSanitize.ts`):
  - Whitelist the block types and the Tiptap node and mark types; drop anything else. *(S2)* The allowed nodes are
    doc, paragraph, heading, bulletList, orderedList (`start`), listItem (must start with a paragraph), blockquote,
    horizontalRule, hardBreak, text and cmsImage. The allowed marks are bold, italic, underline, strike and link
    (`href` and `target` only). **No codeBlock and no code mark.**
  - The content model is enforced (e.g. no blocks inside paragraphs), and empty lists and list items are dropped.
  - Headings may only be levels 2–4. *(S2)* Other levels are clamped into that range rather than dropped.
  - Cap document depth and size.
  - Link hrefs must match `^(https?:|mailto:|tel:|\/(?![/\\])|#)` (case-insensitive) with no whitespace or control
    characters, otherwise the link mark is removed. *(S2)* This also rejects `/\host`, which browsers treat as `//host`.
    *(S6)* A link mark keeps `nodeId` when it is a 24-hex id (a bad one is dropped silently, the href stays), and
    `collectRefs` gathers text links' nodeIds too, so `resolve`, previews and the publish warnings cover them.
  - Image attributes must match the `cmsImage` schema.
- **Reserved slugs, API baseline:** `api, uploads, _app, login, register, logout, forgot-password, reset-password,
  accept-invite, dashboard, settings, profile, messages, notifications, audit-log, user-management, manage-users, roles,
  403, upcoming-events, documentation, cms, shop, client-portal, vault, crm, agile, folio, contracts, calendar-events,
  commerce`. A second check against the project's real route list happens in the frontend (§4).

### 4. Public site (frontend; Session 3)

- **Param matcher** at *new* `modules/cms/frontend/src/params/cmspath.ts`. The scaffold has no `src/params`, so there is
  no collision.
  - It rejects a first segment of `api`, `uploads` or `_app`.
  - Every segment must match `^[a-z0-9-]+$`, so dotted paths like `favicon.ico` fail.
  - Without it, the catch-all would swallow `/api/<missing>` and serve HTML 404s to `fetch` callers.
- **Routes**
  - `routes/(site)/+layout.server.ts` loads the menu. It must **never throw**; on any failure it returns an empty menu.
  - `routes/(site)/+layout.svelte` renders `SiteShell`.
  - `routes/(site)/+error.svelte` shows 404s inside the site chrome.
  - `routes/(site)/[...path=cmspath]/+page.server.ts` resolves the page, throws `error(404)` or `redirect(307)` as
    needed, and runs the component loads.
  - `+page.svelte` renders `BlockRenderer`.
  - Static app routes always win over the catch-all, and so does the root `/`.
- **Route rules:** `lib/config/module-routes/cms.ts`
  ```ts
  [{ routeId: '/(site)/[...path=cmspath]', public: true, bare: true },
   { routeId: '/', bare: true },                 // the site home renders without the app shell for signed-in users too
   { prefix: '/cms/preview', bare: true }]       // staff only (not public, not customer)
  ```
- **Home:** `lib/server/module-home/cms.ts` returns `null` unless a home node is set and published, so the marketing
  page is the fallback. `lib/config/module-home/cms.svelte` renders `SiteShell` and `BlockRenderer`.
- **Shared server loader:** `lib/server/cms/site.ts` exports `loadMenu(event)` and `loadPage(event, path)`.
  - Call `API_URL` directly. `event.fetch('/api/...')` would re-run `handle`, including its `/auth/me` call, and the
    dev API has a 200 req/min limit.
  - Run component `load`s in parallel, each in try/catch with a timeout. Return `componentData[blockId | 'page']`.
  - *(S3)* There is also `loadPreview(event, nodeId)`, which forwards the session cookie, for the S4 preview route. A
    404 from `resolve` becomes a 404; anything else that isn't ok, including a 429 from the API, becomes a 503. `rest`
    becomes a 404 unless the component entry has `subpaths`. A failed or timed-out load yields `{ unavailable: true }`.
  - *(S3)* The home loader resolves `/` first and fetches the menu only if a home page is published. An unpublished
    home therefore costs one API call before the marketing page renders.
- **`SiteShell`**
  - Brand: `Logo` with `brandName` and `brandLogo` from the root layout data.
  - Desktop: a horizontal menu with dropdowns. Level 2 drops down; level 3 and deeper fly out to the side.
  - Mobile: a drawer with a nested accordion.
  - Every open and close uses a transition: `slide` 200 for accordions, `scale` 0.95 for dropdowns, `fade` plus
    `slide x` for the drawer.
  - Keyboard: `aria-expanded`, Esc closes, arrow keys move in menus.
  - Highlight the active trail. *(S3)* Use a `bg-base-200` pill plus semibold, **not `text-primary`**: primary is
    unreadable on several dark themes, including business. Prose links use primary mixed 55% with base-content for
    the same reason.
  - *(S3)* Brand: `brandName`/`brandLogo`, else `appName`, else nothing (no placeholder text). Signed-in non-customers
    also get a "Dashboard" link in the header.
  - *(S3)* Drawer: a fade backdrop, and `slide` with `axis: 'x'` on an `overflow-hidden` wrapper around a fixed-width
    panel, so the content slides rather than reflowing. It's a modal dialog: focus is trapped, Esc closes, focus
    returns to the menu button, the page scroll is locked, and it closes at the `lg` breakpoint.
  - *(S3)* Hover opens a dropdown, and the click that usually follows it keeps the dropdown open instead of toggling it
    shut; the next click closes it. Durations go through `ms()` (`lib/cms/motion.ts`), which returns 0 under
    `prefers-reduced-motion`. Keyboard handling is in `lib/cms/menuKeys.ts`.
  - Optional breadcrumbs, and a footer from `cms_settings.footer`.
  - Use the app's runtime DaisyUI theme (already on `<html data-theme>`).
  - Don't use `PageHeader`; it is for app pages only.
- **Renderers** in `lib/components/cms/render/`:
  - `BlockRenderer` switches on `block.type`.
  - `RichTextRenderer` walks the Tiptap JSON recursively with snippets. It renders only whitelisted nodes and marks,
    re-checks hrefs, and adds `rel="noopener noreferrer"` to `_blank` links.
  - **There is no `{@html}` anywhere in the module.** Don't reuse calendar-events' `EventCard`: it renders unsanitized
    `{@html}`, and importing another module's code is forbidden anyway.
  - One shared stylesheet, `cms-prose.css`, serves the editor and the public page:
    - typography
    - `display: flow-root` on blocks so floats stay inside them
    - figure floats, which become full width below about 640px
  - *(S3)* `CmsPage` (in `render/`) is shared by the catch-all route, the home override and the S4 preview. It
    renders the node title as the `h1` unless the first block is a hero, in which case the hero title is the `h1`. It
    also sets `<title>` to `{seo.title || node.title} · {brandName || appName}`; S6 adds the meta tags.
  - *(S6) Head tags* (`lib/cms/seo.ts` `pageMeta`): `description` (the SEO description, else the first hero's
    subtitle, else the start of the first text block, clipped at a word to 160), `robots: noindex` when hidden from
    search engines, `canonical` and `og:url` (`page.url.origin` + the node's public path, so production needs the web
    service's `ORIGIN` set to the public address), `og:type/title/site_name/description`, `og:image` (+ alt, width,
    height) from `view.media[seo.image.vaultId]` made absolute, and `twitter:card` (`summary_large_image` with an
    image). Previews have no canonical and keep their own single `noindex, nofollow`.
  - *(S6)* `RichTextRenderer` takes `links`: a link mark with `nodeId` uses `links[nodeId]`, and renders as plain text
    when the page isn't public (buttons are left out in that case).
  - *(S3)* Heroes are full-bleed. Rich text, buttons and dividers sit in a `max-w-3xl` column and component blocks in
    `max-w-5xl`. Breadcrumbs (shown at depth 2 and below) use the `max-w-3xl` column too.
  - *(S3)* Until S5, gallery blocks and `cmsImage` nodes render nothing, and a hero image is ignored.
- **Reserved slugs, per project:** `lib/server/cms/reserved.ts`.
  - Lazy-glob `/src/routes/**/+page.svelte` and `/src/routes/**/+server.ts`, strip `(group)` segments, and take the
    first static segment.
  - **Server only**: a client glob would pull `$env/dynamic/private` into the bundle.
  - The `/api/cms/[...path]` proxy rejects reserved slugs on node POST and PATCH, and the admin page load sends the list
    to the UI for inline validation. *(S3)* It also checks moves to the root (fetching the node to get its slug), and a
    PATCH of a root node's `slug` or `type`. `reservedSlugList()` is exported for S4.

### 5. Admin UI (`/cms`; Session 4)

The admin follows the README "Module Page Layout": `PageHeader icon={LayoutTemplate} title="Content" subtitle="Site · Settings"`,
a tab bar (`dragScroll`, `tab-scroll`) and `data-no-anim`. Browser calls go through the *new* catch-all proxy
`routes/api/cms/[...path]/+server.ts`, which forwards the session cookie on all methods.

- **Site tree** at `/cms`.
  - Indented tree with expand and collapse (`slide`), a type icon per node, and status badges: Draft, Published,
    Hidden from menu, and Shadowed when the slug collides with a route the project has gained since.
  - Native HTML5 drag and drop with **before / after / inside** drop zones. There is no DnD library in the repo; see
    the `reorder()` pattern in `candidate/frontend/src/routes/dashboard/+page.svelte` (around lines 245–345).
  - Keyboard alternatives: move up, move down, indent, outdent.
  - Add a child node inline.
  - Clicking a node opens a detail panel (`slide`) with title, slug (auto from the title, editable, inline reserved and
    duplicate validation), type, `showInMenu`, URL or `newTab` for links, component key and props, a live URL preview,
    and **Edit content** for pages.
- **Page builder** at `/cms/pages/[nodeId]`.
  - The canvas shows blocks styled like the public site.
  - Each block card has a hover toolbar: drag handle, up, down, duplicate, delete.
  - A "+" inserter between blocks opens a block palette popover (`scale`).
  - A side panel holds page settings and SEO.
  - Drafts autosave, debounced, sending `rev`. On a 409, show "changed elsewhere, reload".
  - Show an unsaved-changes indicator, and guard navigation with `beforeNavigate`.
  - Buttons: Publish, Unpublish, and Preview (opens `/cms/preview/[nodeId]` with a "Draft preview" ribbon).
- **`RichTextEditor`** is a *new* component, not a copy of `MessageEditor`.
  - Plain Tiptap 3: StarterKit, which **already includes Link and Underline**, so configure those through
    `StarterKit.configure`; plus Placeholder. *(S2)* To match the sanitizer, configure
    `codeBlock: false, code: false, heading: { levels: [2, 3, 4] }`, or saves will silently drop that content.
  - Link `isAllowedUri: (u, c) => c.defaultValidate(u) && SAFE.test(u)`.
  - Keep a `$state` tick that is bumped in `onTransaction`, so the toolbar's active states refresh.
    (`MessageEditor`'s editor isn't reactive.)
  - Store `getJSON()`, never HTML.
  - Block pasted or dropped files, or route them to the upload flow.
- **Settings** at `/cms/settings`: home page (page nodes only), footer text and links, and the Website Media folder.
  *(S4)* The Website Media folder field is deferred to S5, with the rest of the Vault work.
- *(S4) As built:*
  - **Layout.** `routes/cms/+layout.server.ts` requires `cms_nodes.read`. The preview is `preview/[nodeId]/+page@.svelte`
    (reset to the root layout, so no admin chrome) and checks `cms_pages.read` itself.
  - **Tree state** lives in `admin/tree.svelte.ts` (`TreeState`, shared by context). Every write goes to the API, then
    the whole node list is reloaded, so the tree always shows the stored paths, order and visibility.
  - **The detail panel opens inline under the selected row** (an accordion, `slide`), not in a side column: the app
    container is only `max-w-5xl`, and inline works the same on phones. Only one panel is open at a time; switching away
    from unsaved panel edits asks with `confirm()`.
  - **Drop zones** are the top 30%, middle and bottom 30% of a row; a link row has no "inside". Keyboard moves are
    Alt + ↑ ↓ → ← on the row button, plus Move buttons in the panel; focus returns to the moved row and an `aria-live`
    line announces the new position.
  - **Slugs.** A draft item's slug follows its title until edited by hand. Changing a published item's slug shows a
    broken-links warning. Inline validation uses `reservedSlugList()`, which is now this project's routes **plus the
    API's fixed list** (kept in sync by hand in `reserved.ts`); the Shadowed badge uses `routeSlugList()`, the project's
    routes only.
  - The panel also has **Make home page** (pages) and Publish/Unpublish for every type. Publishing a page there
    publishes its saved draft.
  - **Builder canvas.** Blocks render with the public `render/` components. Text is edited in place; hero, buttons,
    divider and component blocks show a live preview (`inert`, so its links can't be followed) with their settings form
    sliding open underneath while selected. Component blocks run their registry `load` in the browser for the preview.
    The admin's `PageHeader` holds the page's `h1`, so the canvas renders the page title and a leading hero as `h2`.
  - **No gallery in the palette until S5**; an existing gallery block shows a placeholder card.
  - **Autosave**: 1.2 s after the last change, at most 10 s after the first unsaved one. The page compares the JSON it
    last *sent* (not the sanitized reply) to decide what's unsaved. Fields that editors `bind:` to are filled in on load
    (`editable()` in `lib/cms/admin.ts`), because `bind:` writes defaults into undefined fields and would make every
    page look edited on open.
  - **409**: a modal offers "Load the newer version" (remounts the canvas) or "Replace with my version" (re-saves with
    the `rev` from the 409 body). Publish sends `rev` too and gets the same prompt.
  - **Leaving**: `beforeNavigate` cancels, saves, then navigates; if the save fails it asks. Closing or reloading the tab
    gets the browser's own prompt. Preview opens its tab first (so it isn't blocked as a popup), saves, then loads it.
  - **Blocks with problems.** `blockProblems()` lists what the sanitizer would drop (an empty button label, a bad URL)
    in red and warnings in amber, under the block. If a save reports `removed > 0`, a banner says so.
  - **RichTextEditor** also sets `trailingNode: false` (it appended a paragraph on open, which looked like an edit) and
    stores links with `target: null` unless "New tab" is ticked. The link form (Ctrl/Cmd + K) offers the site's paths in
    a `datalist`. After applying, focus goes back with `editor.view.focus()` synchronously: Tiptap's `focus()` waits a
    frame, and keys typed meanwhile went to the closing form.
  - **Deleting a block** offers Undo for 8 seconds.
  - *(S6) Text links to pages.* `LinkNode` (`lib/cms/tiptap/LinkNode.ts`) adds a `nodeId` attribute to StarterKit's
    link mark through `addGlobalAttributes`. The link form matches the typed path against the site's pages
    (`pageForHref`; `/` stays a plain URL, meaning "the home page"), says "Links to the page “About”. The link follows
    it if the page moves.", and stores the id. A new link typed with nothing selected is inserted with the page's
    title. An existing link shows its page's current path. `editable(content, media, nodes)` refreshes those paths on
    load and gives older path-only links their page id, so they follow from the next save. A link whose page was
    deleted gets a block warning.
  - *(S6) Two editor fixes.* Clicks on links inside the editor are cancelled (SvelteKit's router followed them and
    left the builder). After applying a link, the link mark is dropped from the typing marks, so the next words don't
    join it (the mark is inclusive because of autolink).

### 6. Vault media (Session 5)

Modules never import each other's code. CMS reads Vault's collections by name and uploads through Vault's own HTTP
proxies.

- **`GET /cms/media`** is one aggregate over `vault_documents` in the caller's workspace, with
  `visibility ∈ {staff, customer}`.
  - **Never return `admin_only`**, even to admins. These images end up public.
  - `$lookup` `vault_document_versions` on `currentVersionId`, keep `mimetype` `^image/`, and **exclude
    `image/svg+xml`** (a same-origin SVG can run scripts).
  - Filters: `folderId`, `q` (name and tags), `skip` and `limit`, about 24 per page.
  - If `listCollections({ name: 'vault_documents' })` is empty, return `{ available: false }`.
  - Copy the roughly 10-line `callerRole` logic into *new* `api/src/lib/cmsRole.ts`; don't import `vaultRole.ts`.
- **Upload.**
  1. Find or create a root Vault folder "Website Media" through `/api/vault/folders`, and store its id in
     `cms_settings.mediaFolderId`. Recreate it if it was deleted.
  2. Send a multipart POST to `/api/vault/documents` with that `folderId`.
  3. Vault returns only `{ id }`, so then fetch `/api/cms/media/:id`.

  Vault keeps its own validation, audit log and permissions this way. Editors without `vault_documents.create` don't see
  the upload button. Editors without `vault_folders.create` upload to the Vault root.
- **`MediaPicker`** modal (`fade` backdrop, `scale` content).
  - Image grid, a Vault folder sidebar, search, pagination, upload with progress, and an alt text field.
  - Check `file.size <= 10 MB` before uploading. An oversized body makes the streaming proxy return 500, not 413
    (found in S1).
  - On select, read `naturalWidth` and `naturalHeight` and store them as `w` and `h`. There is no sharp and no
    thumbnails, so use `loading="lazy" decoding="async"`.
  - A notice: "Images placed on pages are publicly visible."
  - If Vault isn't installed, hide image actions and show "Install the Vault module to add images".
- **`cmsImage` Tiptap node** (*new* `lib/cms/tiptap/CmsImage.ts`).
  - Node options: `group: 'block'`, `atom`, `draggable`, `selectable`.
  - `renderHTML` outputs `figure[data-cms-image].cms-fig--{align} > img + figcaption`.
  - `parseHTML` **only** accepts `figure[data-cms-image]`, so pasted external images are dropped.
  - Use plain `renderHTML`, not a Svelte NodeView, in v1.
  - When `editor.isActive('cmsImage')`, a toolbar row slides in with:
    - **align left / right / center / full**
    - width 25 / 33 / 50 / 100%
    - alt
    - caption
    - replace
    - remove

    Don't use the svelte-tiptap `BubbleMenu`: it shows and hides through CSS visibility rather than a Svelte transition,
    and it throws if it mounts before the editor exists.
- **Gallery block.**
  - Editor: add images (picker multi-select), remove them, drag to reorder, captions, columns, aspect ratio, gap.
  - Public render: a CSS grid, or CSS columns for `natural`.
  - Each tile is a `<button>` that opens a lightbox.
- **`Lightbox.svelte`**, hand-rolled; no library, matching the repo's no-dependency habit.
  - `fade` backdrop with `scale` content.
  - Esc closes; ← and → move between images; swipe works on touch (pointer events); focus is trapped and returned on
    close.
  - Counter and caption; the neighboring images are preloaded.
  - Body scroll is locked while open; `prefers-reduced-motion` is respected.
- *(S5) As built:*
  - **Allowed images.** PNG, JPEG, GIF, WebP and AVIF, checked by MIME type **and** by the file URL's extension
    (`lib/cmsMedia.ts` `isWebImage`). This is stricter than "`^image/` minus SVG": an SVG renamed `.png`, or any
    `image/*` type that isn't a web image, is never listed or shown. The URL must be `/uploads/…` or http(s).
  - **Search** (`q`) is a case-insensitive substring match on name and tags, not Mongo `$text`, which only matches whole
    words.
  - **Workspace guard on save.** `PUT /cms/pages/:nodeId/draft` strips images whose Vault document belongs to another
    workspace (`foreignImageIds` + `stripImages`) and counts them in `removed`. The picker only offers the editor's own
    workspace, so this only stops hand-made requests. Read-time resolution can't scope by workspace (the site has
    none).
  - **The `media` map is `{ vaultId → { url } }`.** Width and height come from the stored `ImageRef`, read with
    `naturalWidth` at pick time. They are layout hints only: images use `height: auto`, so a new version with another
    shape still renders correctly. `GET /cms/pages/:nodeId` also returns `media` (for the draft), so the editor shows
    current versions and flags unavailable images. `editable()` swaps stored `src` values for current URLs on load.
  - **Access** is decided on the client (`lib/cms/media.svelte.ts` `mediaAccess`):
    - Vault is "installed" when the user's permissions have a `vault_documents` key.
    - **Pick** needs `vault_documents.read` and `cms_pages.update`. **Upload** needs `vault_documents.create`, plus
      `vault_folders.create` to make the folder.
    - Without access, image actions are hidden or disabled with the reason ("Install the Vault module to add images",
      or "You need access to Vault to add images"). Gallery stays in the block list as an `aria-disabled` entry with
      the reason, so keyboard users hear why.
  - **Uploads.**
    - The "Website Media" folder is created with visibility `staff`. Its id is saved in the settings only if the editor
      has `cms_nodes.update` (the folder is still used for that upload otherwise).
    - Uploads are tagged `website`.
    - Settings has an "Images" section to pick the folder (shown when Vault is installed and readable).
  - **Picker** (`admin/MediaPicker.svelte`): one instance per builder page; components call `media.pick()`.
    - "Show more" appends the next 24.
    - Phones get a folder `<select>` instead of the sidebar.
    - Double-click picks in single mode.
    - Alt text is asked only for images in text (heroes are decorative, galleries edit alt per image).
  - **Rich text images.**
    - A new image goes centred at 50% and is selected so its toolbar opens.
    - An image that ends the text gets an empty paragraph after it (`trailingNode` is off).
    - Pasted or dropped image files upload and land at the drop point; other files are refused with a message.
    - Unavailable images get a dashed warning outline (`data-missing`, set through `CmsImage.configure({ isMissing })`).
  - **Hero image** is decorative (`alt=""`) under a dark scrim, with white text. The page settings panel also takes a
    **share image** (`seo.image`; S6 renders `og:image`).
  - **Lightbox** cross-fades between images (stacked in one grid cell). A click on the dark area closes it, except the
    click that ends a mouse swipe.
- **Read-time resolution.**
  - `resolve` collects every `vaultId` in the published blocks and runs one `$in` lookup.
  - An image renders only if its document exists, isn't `admin_only`, and its current version is `image/*`. Otherwise
    the image is dropped from the page.
  - New Vault versions therefore show up on the site automatically, and deleted images disappear. Vault's delete
    removes the files too (`documents.ts:270`).
  - The stored `src` is only for the editor preview. The editor flags missing images, and publish returns them as
    warnings.

### 7. Custom component registry (Session 3 skeleton; Events in Session 6)

- A glob registry at `lib/config/cms-components/*.ts`, following the `module-routes` and `module-docs` pattern. Each file
  default-exports:
  ```ts
  { key: string, label: string, description: string, modes: ('page'|'block')[],
    component: Component, props?: PropSpec[], subpaths?: boolean,
    load?: (ctx: { fetch, url, rest, props }) => Promise<unknown> }
  ```
- **Entries run on both server and client.** `+page.server.ts` calls `load`, and `+page.svelte` imports `component`.
  So `load` may only use the `fetch` it is given, against `/api/...` proxies, and must **never** import
  `$env/dynamic/private`. Importing a `.svelte` file from an eager-glob `.ts` file is fine.
- Another module can add an entry later by shipping its own file in this folder. It must match the shape **without
  importing CMS types**, so the module still builds when cms isn't installed.
- An unknown key renders nothing on the public site and a warning in the admin.
- *(S3)* The glob lives in `lib/cms/components.ts`, which exports `CMS_COMPONENTS` and
  `componentFor(key, mode)` (undefined for an unknown key or an unsupported mode). The types (`CmsComponentEntry`,
  `PropSpec`, `CmsComponentProps`) are in `lib/cms/types.ts`. Every registry component receives
  `{ props, data, mode, rest }`.
- *(S3)* **Render the component through a capitalised `$derived`** (`const Entry = $derived(componentFor(...)?.component)`
  then `<Entry … />`). With Svelte 5.53, `<entry.component>` where `entry` is a `$derived` rendered **nothing** in SSR.
- With `subpaths: true`, `/events/<slug>` resolves to the longest matching node and passes the remainder as `rest`.
- **Session 3 proof:** a built-in `sitemap` entry (page and block) that renders the published tree, so no other module
  is needed. *(S3)* It loads `/api/cms/site/tree`, and its prop `includeHidden` (boolean, default false) decides whether
  menu-hidden pages are listed.
- **Session 6: `events`** (page and block).
  - `load` fetches `/api/calendar-events/public` (that proxy sends no cookie) and returns `{ unavailable: true }` if the
    response isn't ok. With the matcher, a missing module means a plain 404.
  - Render text only, and sort by start date.
  - Block props: `limit` and `eventType`.
  - **Known gap:** the endpoint filters `status: 'active', visibility: 'public', startDate > now`, so events already in
    progress are skipped. Raise this with the user; any fix belongs in the calendar-events module.
- *(S6) As built:*
  - **Files.** `lib/config/cms-components/events.ts` (the entry), `lib/cms/events.ts` (`loadEvents`, `htmlToText`,
    date formatting, `EVENT_TYPES`) and `site/EventsComponent.svelte`.
  - **Data.** The load keeps id, title, a plain-text summary (tags stripped, entities decoded, 600 characters), type,
    start and end days (`YYYY-MM-DD`) and location, sorts by start then title, and applies `limit` (1–50, default 10).
    `eventType` is passed to the feed as `?type=`; the options are the Calendar's four built-in types plus "Every type".
  - **Dates are formatted in UTC.** Calendar events are date-only (`<input type="date">`, stored as UTC midnight), so
    UTC shows the date the editor chose and renders the same on the server and in any browser time zone.
  - **Layout.** As a page: month headings (`h2`) over lists of events (`h3` titles); as a block, one list (summaries
    clamped to two lines). Each event has a date badge (decorative), the date range (`<time datetime>`), location,
    summary, and its type unless it's a plain event. The list is `max-w-[46rem]`, the content width of the title and
    text column.
  - **`requires`.** Registry entries may declare `requires: { resource, module }`. The admin's component editor and the
    tree item panel warn when the signed-in user's permissions don't list `resource` (the same "installed" test as
    Vault): `"Events" needs the Calendar module, which isn't installed, so it says it's unavailable on the site.`
  - **Default component.** A new component block or item starts with the first registry entry that has no
    `requires` (`defaultComponent` in `lib/cms/admin.ts`). The registry is in file-name order, so without this the
    default became Events once `events.ts` sorted before `sitemap.ts`, even on sites without the Calendar.
  - **Same-day gap (fixed 2026-11-14).** The feed used to want `startDate > now`, so an event dropped off on its own day
    (from 00:00 UTC) and once it was in progress. calendar-events now lists events until their last day is over
    everywhere (`endDate > now − 36 h`); cms needed no change.

### 8. Permissions (`module.json` `roles`, mirrored in `PERMISSIONS.md`)

The only actions available are create, read, update and delete (`candidate/frontend/src/lib/permissions.ts:1`
`Action`; the API's `requirePermission` in `candidate/api/src/plugins/auth.ts` checks the same four). Publishing therefore has
its own resource, `cms_publish: ['update']`.

| Role | cms_nodes | cms_pages | cms_publish |
|---|---|---|---|
| owner, admin | c r u d | c r u d | u |
| lead | c r u | c r u | u |
| contributor | r | r u (edit drafts only) | none |
| viewer | r | r | none |
| customer | none | none | none |

In Session 2, check how `arch.js`'s "viewer gets read" default treats `cms_publish`, which declares no `read` action.
If needed, set viewer explicitly. Public pages need no permissions.

`module.json`:
- nav: `[{ "label": "Content", "href": "/cms", "icon": "LayoutTemplate", "permission": "cms_nodes.read", "matchPrefix": true }]`
- widgets: `CmsDashboardWidget` (Session 6, wraps `ModuleStatsWidget`), `order` 80. *(S6)* It lives in
  `components/cms/admin/`, needs `cms_nodes.read`, and shows "Live pages" and "Not live" (page and component items,
  by `visible`), both counted from `/api/cms/nodes`.
- dependencies: none expected; Tiptap is already in candidate
- seed: `api/src/seeds/80-cms.ts`

Ship no file that already exists in candidate (for example `nav.ts` or `routes/+page.svelte`); arch.js stops on any
collision.

### 9. Module file map (new files)

```
modules/cms/
  module.json  PERMISSIONS.md
  api/src/lib/{cmsTree,cmsSanitize,cmsRole}.ts            (cmsRole: S5)
  api/src/routes/cms/{index,nodes,pages,settings,media,site}.ts   (media: S5)
  api/src/seeds/80-cms.ts
  api/tests/unit/lib/{cmsSanitize,cmsTree}.test.ts      (S2; copied into projects' api/tests)
  frontend/src/params/cmspath.ts
  frontend/src/lib/cms/{types.ts, tiptap/CmsImage.ts}
  frontend/src/lib/cms/{admin,components,links,media.svelte,menuKeys,motion,events,seo}.ts   tiptap/LinkNode.ts   (S3–S6)
  frontend/src/lib/config/module-routes/cms.ts
  frontend/src/lib/config/module-docs/cms.ts
  frontend/src/lib/config/module-home/cms.svelte
  frontend/src/lib/config/cms-components/{sitemap,events}.ts
  frontend/src/lib/server/module-home/cms.ts
  frontend/src/lib/server/cms/{site,reserved}.ts
  frontend/src/lib/components/cms/
    render/  BlockRenderer RichTextRenderer HeroBlock GalleryBlock ButtonsBlock DividerBlock ComponentBlock Lightbox
    site/    SiteShell SiteMenu SiteMenuItem SiteMobileMenu SiteFooter SitemapComponent EventsComponent
    admin/   SiteTree SiteTreeNode NodePanel BlockEditor BlockCard BlockInserter RichTextEditor MediaPicker
             GalleryEditor HeroEditor ButtonsEditor ComponentEditor CmsDashboardWidget
    cms-prose.css
  frontend/src/routes/(site)/{+layout.server.ts,+layout.svelte,+error.svelte}
  frontend/src/routes/(site)/[...path=cmspath]/{+page.server.ts,+page.svelte}
  frontend/src/routes/cms/{+layout.svelte,+layout.server.ts,+page.server.ts,+page.svelte}
  frontend/src/routes/cms/pages/[nodeId]/   frontend/src/routes/cms/settings/   frontend/src/routes/cms/preview/[nodeId]/
  frontend/src/routes/api/cms/[...path]/+server.ts
  frontend/src/routes/(docs)/documentation/cms/+page.svelte
```

## Session plan and exit criteria

**Session 1: scaffold extension points.** Covers §1 in full, including the docs and the friendsofmcrwr sync.
*Exit:*
- `node arch.js create s1-check --modules commerce,vault` behaves exactly as before:
  - `/` shows the marketing page
  - `/shop` is public and shell-free
  - `/documentation` is public
  - logged-out `/dashboard` goes to `/login`
  - customer redirects are unchanged
- A temporary probe file in that throwaway project, `lib/server/module-home/probe.ts` plus `probe.svelte`, overrides
  `/`. Removing it restores the marketing page.
- A temporary `routeId` rule makes a test route public.
- `npx vitest run` in `candidate/api` passes.
- `svelte-check` (after `npx svelte-kit sync`) reports no new errors.
- friendsofmcrwr's web container is rebuilt, and its `/`, login and dashboard behave as before.

**Session 2: CMS API and module skeleton.** Covers `module.json`, `PERMISSIONS.md`, §2, §3, the seed, the `/api/cms`
proxy, and a placeholder `/cms` page with `PageHeader`.

The seed (`SEED_DEMO_DATA=true` only, empty collections only) builds:

```
Home (page: hero + rich text; set as home)
About (page)
  Team
  History
Events (component: events)
Resources (label)
  Sitemap (component)
  Donate (external link)
Privacy (page, hidden from menu)
```

*Exit (curl):*
- CRUD and move, including cycle and duplicate-slug rejections
- a stale `rev` returns 409
- publish and unpublish
- a hidden ancestor makes `resolve` return 404
- `javascript:` hrefs and unknown nodes are stripped
- reserved slugs are rejected
- the permission matrix holds per role
- a contributor can't publish

**Session 3: public site.** Covers §4 and the §7 skeleton (`sitemap`). Rich text renders without images; `cmsImage`
nodes render nothing until Session 5.
*Exit:*
- `/`, `/about`, `/about/team`, a label redirect and an unknown-slug 404 (inside the site chrome) all work for
  logged-out visitors, a customer and staff, with no app shell.
- `/api/nope` returns a plain 404, not the CMS page.
- `/dashboard` while logged out still goes to `/login`.
- The n-deep menu works on desktop and mobile, with transitions.
- `grep -r "{@html" modules/cms` finds nothing.
- With no home published, the marketing page shows.

**Session 4: admin.** Covers §5.
*Exit:*
- A three-level site, with every block type except images, can be built and published from the UI alone.
- Drag and drop and keyboard moves persist.
- A stale tab gets a 409 prompt.
- Preview shows the draft.
- Reserved and duplicate slugs are blocked inline.

**Session 5: Vault media.** Covers §6.
*Exit:*
- Left and right floats wrap the text, and stack on mobile.
- The gallery grid opens the lightbox, with keyboard and swipe navigation.
- Uploading from the picker lands in "Website Media".
- A new Vault version appears on the public page.
- Images that are deleted or set to `admin_only` disappear from the public page.
- SVGs are never listed.
- A `--modules cms` project with no Vault works, with image actions hidden.

**Session 6: Events, SEO, docs, polish.**
- The `events` component.
- SEO per page: `<svelte:head>` title as `{seo.title || node.title} · {brandName}`, meta description, `og:image` from
  Vault, and a canonical URL.
- `module-docs/cms.ts` and its documentation page, ending with the API table.
- The dashboard widget.
- Shadow badges.

*Exit:*
- The full matrix passes on `--modules cms` and on `--modules cms,vault,calendar-events,commerce`.
- Then tear down every throwaway project.
- The final session handoff sets out the friendsofmcrwr install decision for the user.

## End-of-session protocol (every session)

1. Run that session's exit checks and record the results honestly: what passed, what failed, what was skipped.
2. Write `.claude/handoffs/cms-module-session-<N>.md` covering:
   - the files changed or added
   - any deviation from this plan, and why
   - test results
   - open issues and bugs found, including pre-existing ones
   - exact first steps for session N+1
   - questions for the user
3. Update the **Status** table above (☑, date, link). If the design changed, edit the matching section here so this
   document stays the source of truth.
4. Tear down the throwaway stacks, or list the ones left running with their ports.
5. If a durable convention changed (for example the new scaffold extension points), update the matching memory note.
6. Commit the session's work (code, friendsofmcrwr sync, handoffs) on branch `cms-module` as one commit. Don't push.

## Known pitfalls

- **arch.js limits.** Collision checks forbid shipping any file that exists in candidate. There is no "add a module to
  an existing project" command.
- **Labels.** Nav labels are plain strings with no i18n, and must not contain an apostrophe (arch.js doesn't escape it).
- **Autoload** skips sibling files when a folder has an `index.ts`.
- **Seed numbers** 10–70 are taken; use `80`.
- **Server-only globs** (`reserved.ts`, the home loaders) must never be imported by client code.
- **Production rate limit (found in S3).** The API's global limit (200 req/min) is keyed by IP. Every SSR call comes
  from the web container, so **all visitors share one bucket**: about 40 anonymous public page views a minute (around
  5 calls each) exhaust it. After that, site pages answer 503 and signed-in users look logged out. This predates cms
  but a public site makes it acute. **Fixed 2026-11-14 (scaffold):** the web server sends `INTERNAL_API_SECRET` and
  the visitor's address, and the API limits each visitor separately (see the follow-up handoff).
- **Uppercase or dotted URLs** (`/About`, `/favicon.ico`) don't match `cmspath`. With no route, logged-out visitors are
  redirected to `/login` (as for any unknown URL) rather than shown the site's 404.
- **Dev SSR CSS.** `routes/+page.svelte` imports `ScaffoldHome` statically, so its scoped CSS ships on `/` even when the
  CMS home renders. It's harmless (scoped), but a grep for its class names matches CSS, not markup.
- **`/uploads/` has no auth.** It is served with no auth (`api/src/server.ts:51`), so any Vault file, `admin_only`
  included, can be fetched by anyone who has its URL. This predates cms. Don't widen it, and report it to the user.
- **Vault's list endpoint** returns no mimetype or URL, which is why cms runs its own aggregate. lmodulo's fork has a
  similar join for reference (`projects/lmodulo/api/src/routes/vault/documents.ts:98-112`); don't edit lmodulo.
- **Vault's `PATCH` endpoints** don't validate `visibility`. This predates cms; report it, don't fix it here.
- **Prod uploads (found in S1).** The prod API image (`USER appuser`) can't write a fresh `uploads` volume
  (`EACCES`), so local-storage uploads fail in production. Test uploads on the dev compose, or `chown` inside a
  throwaway container. The user will fix it later, outside this plan (2026-11-13); don't fix it in a cms session.
- **Personal seed accounts** in `candidate/api/src/plugins/seed.ts` stay (user, 2026-11-13); don't touch them.
- **Verification (found in S1).**
  - Playwright on the dev server: `waitForLoadState('networkidle')` before filling or clicking.
  - curl against form actions: send `accept: text/html`, plus `Origin` for multipart.
  - When switching a project to the prod compose, use `--no-deps`.
- **Admin API cost (found in S4).** Each proxy call from the browser runs `hooks.server.ts` first, so it costs two API
  requests (`/auth/me` plus the call). An autosave is 2 and a tree change about 4 (the write, then the list reload).
  Back-to-back Playwright runs hit the dev limit; `s4-admin.cjs` waits for it to drain.
- **Rich-text links were plain paths (S4; fixed in S6).** Text links now store `nodeId` too and follow moves. Links
  written before S6 gain their id the next time their page is saved in the builder; until then they are plain paths.
- **Calendar feed gap (S6; fixed 2026-11-14).** `/calendar-events/public` returned events with `startDate > now` only,
  so in-progress and same-day events were missing. It now lists events until they end.
- **Notifications websocket loop in dev (found in S6; scaffold, not cms).** The browser's session cookie is
  double-encoded by SvelteKit's `cookies.set`, so `/notifications/ws` gets 4401 and the client reconnects every second
  (about 60 API requests a minute per signed-in tab). It is the main reason browser suites hit the dev rate limit when
  run together. **Fixed 2026-11-14 (scaffold):** login and register store the cookie as the API sent it, and the
  client stops on 4401. Sessions created before the fix still work for pages; their socket gives up until the next
  sign-in.
- **Canonical URLs need `ORIGIN` (S6).** They use `page.url.origin`, which adapter-node takes from `ORIGIN`
  (`http://localhost:<WEB_PORT>` in the compose file). A production deployment must set it to the public address.
- **Playwright and Svelte transitions (found in S4).** Elements that are transitioning out stay in the DOM, marked
  `inert`, for the duration. Count live elements only (`!el.closest('[inert]')`) and poll rather than sleeping. Wait
  for a `flip` reorder to settle before starting another drag.
- **Playwright HTML5 drags (found in S5).** `locator.dragTo` can scroll the page between mouse-down and the drag
  starting when the drop point is near a sticky bar; Chromium then drags whatever is under the pointer. Use explicit
  `mouse.move` / `down` / `move({ steps })` / `up` on precomputed points instead. Playwright also refuses to click an
  `aria-disabled` element without `{ force: true }`.
- **Vault's demo seed has no images (found in S5).** Use `cms-tests/s5-seed.sh` to put PNGs, a JPEG, an SVG and an
  admin-only image into Vault through its own API.
- **Vault trusts the browser's MIME type.** Vault stores the multipart part's declared type. cms adds the extension
  check above; `/uploads/` serves by extension, so a mislabelled file isn't served as HTML. This predates cms.
- **No thumbnails.** The picker grid and `imageSize()` load full images (lazy). That's fine for typical sites, but slow
  with many very large files. Thumbnails stay out of scope (sharp).
- **Global search** in candidate is a stub with no module registry, so cms can't register search content. That is out
  of scope.
- **Existing marketing page bugs.** `+page.svelte` reads a `brand.text` that doesn't exist, and doesn't pass the runtime
  brand to `MarketingNav`. These predate cms. Keep the markup byte-for-byte when moving it to `ScaffoldHome.svelte`,
  and report the bugs separately.

## Conventions you must follow in this repo

- **Three copies stay byte-identical:** `candidate/`, `modules/<m>/` and `projects/friendsofmcrwr/`. Since 2026-11-14
  the cms module **is** installed in friendsofmcrwr, so cms changes are synced there too. Scaffold edits are synced to
  it (decision 5).
  - Intentional friendsofmcrwr-only differences: `frontend/src/lib/config/nav.ts`,
    `frontend/src/lib/config/dashboard-widgets.ts`, `frontend/src/routes/+layout.svelte`, `docker-compose.yml`, `.env*`,
    and `api/src/data/permissions.json`.
- **Modules never import each other's code.** They use Mongo collections by name, HTTP proxies, and the scaffold
  registries: `module-routes/`, `module-docs/`, `module-home/`, `cms-components/`, widgets and seeds.
- **Don't edit `projects/lmodulo`** unless asked.
- **The user works in friendsofmcrwr live.** Never change its settings or data to test anything; use throwaway projects.
- **UI rules.** Every show, hide or layout shift needs a Svelte transition: `slide` 200 for inline panels, `scale` 0.95
  with `cubicOut` for popups, a `fade` backdrop with `scale` 300 content for modals. App pages use `PageHeader`; public
  pages don't. `README.md` "Style Guide" is the authority, and `candidate/CLAUDE.md` holds the Svelte 5 rules.
- **Customer scoping** reads `workspace_members`, never `users.role`.

## Running stacks and tooling

- **Ports.** lmodulo: 3000 / 4000 / 27017. friendsofmcrwr: 3001 / 4001 / 27019. Throwaway projects use 3002 / 4002 /
  27020; use 3003 / 4003 / 27021 for a second one.
- **Throwaway project setup.**
  - Create it with `node arch.js create <name> --modules ...`. Don't pass `--no-install`, or run `npm install` in both
    folders before the Docker build.
  - Edit `.env` (ports, `SEED_DEMO_DATA=true`) with perl or sed; it has no trailing newline, so `>>` appends to the
    last line.
  - Start it with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`. API changes need
    `build api && up -d api`.
  - Tear down with `docker compose … down -v --rmi local`, then `rm -rf projects/<name>`.
- **Seeded logins.** `admin@example.com` / `admin-password`. The demo customer is `client@vertexsystems.io` /
  `ClientPass1!`. The login form uses the `email` field.
- **Rate limits.** The dev API allows 200 req/min (login 10/min), and every SSR call counts: a signed-in public page
  costs about 9 API calls. Space out page sweeps (about 65s between roles). A 429 on `/auth/me` looks like being logged
  out, and a 429 on `resolve` makes the site answer 503. Count 429s with
  `docker logs <api> | grep -c '"statusCode": 429'` (pino-pretty puts a space after the colon).
- **Tools.** Playwright: `require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright')`. macOS has no
  `timeout`. Run `npx svelte-kit sync` before `npx svelte-check`.
- **Test scripts.** `.claude/handoffs/cms-tests/` holds the reusable throwaway-project checks (Session 2 API matrix,
  web/proxy checks); see its README. Add each session's scripts there.
  - *(S6)* Two projects can be tested at once (they have separate APIs and rate limits). The shell sweeps keep their
    files in a folder per port; Playwright contexts are isolated anyway. Expect more rate-limit waits on a project
    with many modules: its dashboard alone spends dozens of API calls.
- **Known noise.** The `candidate/api` roles test logs one `ERR_HTTP_HEADERS_SENT`. The friendsofmcrwr API `tsc` has
  about 598 baseline errors, so compare counts rather than expecting zero.

## Out of scope (future)

- A Vault public visibility tier, and signed or authenticated file URLs
- Thumbnails and resizing (sharp)
- Several sites per workspace
- Revision history and rollback
- Scheduled publishing
- More than one menu (e.g. a footer tree)
- Translated content
- Search registration
- `sitemap.xml` and `robots.txt`
- Column or layout blocks
- Forms
- Page templates
- Menu caching
- A separate public-site theme
