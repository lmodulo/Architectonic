# CMS module, Session 4: the admin

Done 2026-11-13 on branch `cms-module`, and committed there. The master plan is `.claude/handoffs/cms-module.md`; its
§5 now has an *(S4) As built* list with this session's design decisions. No scaffold file changed, so nothing was
synced to friendsofmcrwr, and no API file changed.

## Files added or changed (under `modules/cms/frontend/src/`)

**Routes**

| File | What it does |
|---|---|
| `routes/cms/+layout.server.ts` | Requires `cms_nodes.read` for every admin page. |
| `routes/cms/+layout.svelte` | `PageHeader` ("Content", "Site · Settings") and the tab bar (Site covers the tree and the builder). |
| `routes/cms/+page.server.ts`, `+page.svelte` | The site tree. The load now also sends `reserved` (inline validation) and `routeSlugs` (Shadowed badge). `?node=<id>` opens that item's panel. |
| `routes/cms/pages/[nodeId]/+page.server.ts`, `+page.svelte` | The page builder: autosave with `rev`, the 409 prompt, the navigation guard, Publish / Unpublish / Preview, the page settings and SEO panel. |
| `routes/cms/preview/[nodeId]/+page.server.ts`, `+page@.svelte` | Draft preview in the site chrome with a "Draft preview" ribbon. Resets to the root layout and checks `cms_pages.read` itself. |
| `routes/cms/settings/+page.server.ts`, `+page.svelte` | Home page and footer (text and links). |

**Helpers**
- `lib/cms/admin.ts` (new):
  - `cmsApi()`: fetch wrapper with plain-language messages
  - tree helpers: `buildTree`, `slugProblem`, `pathFor`
  - link helpers: `linkTargets`, `editorLinkMap`, `linkProblem`
  - block helpers: `newBlock`, `duplicateBlock`, `blockId` (falls back when `crypto.randomUUID` is missing outside https), `blockProblems`
  - `editable()`: fills the optional fields that editors bind to
- `lib/server/cms/reserved.ts`: `reservedSlugList()` is now this project's routes plus the API's fixed list, which is
  copied in and must be kept in sync by hand. The new `routeSlugList()` returns this project's routes only, for the
  Shadowed badge.

**Components (`lib/components/cms/admin/`, all new)**
- **Site tree:**
  - `tree.svelte.ts`: `TreeState` (context), the moves, drag and drop, and refocusing.
  - `SiteTree`, `SiteTreeNode` (recursive rows), `NodePanel`, `AddNodeForm`.
- **Builder:**
  - `BlockEditor` (canvas, inserters, drag and drop, undo for deletes), `BlockCard`, `BlockInserter`.
  - `RichTextEditor`, `HeroEditor`, `ButtonsEditor`, `ComponentEditor`, `ComponentPreview`.
- **Shared:** `LinkPicker` (a page or a URL) and `PropsEditor` (registry `PropSpec` fields).

**Test scripts (`.claude/handoffs/cms-tests/`)**
- `s4-admin.cjs`: the Session 4 exit checks in Playwright, in phases (about 6 minutes for all of them).
- `s4-shadow.cjs`: project-only reserved slugs and the Shadowed badge. It needs a temporary route in the project.

## Deviations from the plan, and why

1. **The detail panel opens inline under the selected row**, as an accordion, rather than beside the tree. The app's
   content column is only `max-w-5xl`, and inline works the same on a phone.
2. **Hero, buttons, divider and component blocks** show a live preview with their settings form sliding open
   underneath. Text is edited in place. Typing into the hero's heading directly on the canvas would need a second
   editing model for little gain.
3. **The gallery isn't in the block palette yet.** It needs the S5 media picker. An existing gallery block shows a
   placeholder card.
4. **The Website Media folder setting moves to S5**, with the rest of the Vault work.
5. **Extras the plan didn't ask for:**
   - Make home page, in the item panel.
   - Undo for block deletes.
   - "Replace with my version" in the 409 prompt.
   - Ctrl/Cmd + K and a list of site paths in the rich-text link form.
   - The Shadowed badge, which the plan listed in both S4 and S6.
6. **Inline slug validation** uses the project's routes plus the API's fixed list. Before, the frontend checked only
   the project's routes, so a slug like `shop` in a project without commerce passed inline and then failed at the API.
7. **The admin canvas renders the page title and a leading hero as `h2`.** The admin's `PageHeader` already holds the
   page's `h1`.

## Test results

All on the throwaway project `s4-check` (`--modules cms`, ports 3002 / 4002 / 27020, demo seed), with test users
s4viewer, s4contrib, s4lead, s2viewer, s2customer, s3viewer and s3customer added the Session 1 way.

**Exit criteria (master plan, Session 4):**

| Criterion | Result |
|---|---|
| A three-level site with every block type except images, built and published from the UI alone | **Pass.** Programs › Youth › Mentoring was added in the tree and published bottom-up (the first publish showed the "not public until…" warning). Mentoring got hero, buttons, text (bold, a link, an h3), divider and sitemap-component blocks and was published from the builder. Logged out, `/programs/youth/mentoring` shows all of it: the hero heading is the h1, the external button opens a new tab, and the breadcrumbs and menu are right. |
| Drag and drop and keyboard moves persist | **Pass.** Dropping on the middle of a row moves the item inside it, and dropping on the top edge moves it before. Alt + ↓, → and ← move, indent and outdent. Focus stays on the moved row, and the screen-reader line announces it. All of it survives a reload. Block drag, Move up, Duplicate, Delete and Undo work in the builder. |
| A stale tab gets a 409 prompt | **Pass.** Two tabs on one page: the stale one gets the dialog. "Load the newer version" shows the other tab's text. "Replace with my version" stores this tab's text. |
| Preview shows the draft | **Pass.** The draft text shows in the preview, with the ribbon and no app shell, and not on the public page. Preview saves pending changes before opening. Logged out, the preview goes to /login. |
| Reserved and duplicate slugs blocked inline | **Pass.** Checked in the add form and in the item panel, covering the API's list, this project's routes (`s4-shadow.cjs`, with a probe route) and sibling clashes. The Add or Save button is disabled. Reserved words are allowed below the top level. |

**Scripts:**
- **`s4-admin.cjs`: 81/81 on the final code, with 0 rate-limit hits.** Beyond the exit criteria above, it covers:
  - opening the builder doesn't save anything
  - autosave status
  - leaving the builder saves first, then navigates
  - footer settings appear on the site
  - each role:
    - viewer: read-only tree, view-only builder
    - contributor: edits drafts, no publish
    - lead: adds, moves and publishes, no delete
  - the tree and builder fit a phone screen, with no sideways scrolling
  - transitions on the add form, the palette, collapse and the phone settings panel
  - no page errors
- `s4-shadow.cjs`: 5/5. A top-level item on a route the project has gains a Shadowed badge.
- **Regression:**
  - `s2-api-matrix.mjs`: 95/95
  - `s3-site.sh`: 56/56
  - `s3-extra.sh`: 13/13, including `s3-menu.cjs` at 28/28
  - 0 rate-limit hits

**Static checks:**
- svelte-check: 49 errors and 41 warnings, the same baseline as Sessions 2 and 3, with none in cms files.
- API unit tests: 43/43 (no API change).
- `grep -r "{@html" modules/cms` finds nothing.

**Screenshots** were checked on the default business theme (dark), desktop and phone: the tree with a panel open, the
builder, the conflict dialog, the preview and the public page.

**Test-harness fixes, not app bugs:**
- `s4-admin.cjs` and `s3-menu.cjs` now poll for elements to disappear, ignoring copies that are still animating out
  (Svelte marks them `inert`), instead of sleeping a fixed time. Two S3 menu checks failed once this way on a busy
  machine; the menu code is unchanged since S3.
- `s4-admin.cjs` waits for a `flip` reorder to settle before dragging, and for the rate limit to drain before starting
  and before each role's login.

**Teardown:** `s4-check` is torn down (containers, volumes, images and the folder).

## Bugs found and fixed this session

- **Every page looked edited the moment it opened.** `bind:` on an undefined SEO field (and a footer link's `newTab`)
  writes the input's default back into the state. Optional fields are now filled in on load (`editable()`). This is
  noted in the Svelte gotchas memory.
- **A fast link insert went wrong.** After applying a link, Tiptap's `focus()` waits a frame, so an immediate Enter
  submitted the closing link form again. That selected the whole link, and the next keystrokes replaced it. Fixed:
  - focus now returns synchronously
  - a second submit is ignored
  - the caret moves to after the link
- **The "parts were left out" banner** appeared whenever an autosave caught a button with an empty label, and shifted
  the canvas in the middle of a drag. It now appears only when the API drops more than the editor already flagged in
  red.
- **On phones, the builder's "Page settings" button had no accessible name** (its text is hidden), and the top bar
  squeezed the title to "M…". The button now has a label, and the actions wrap onto their own row.
- StarterKit's `trailingNode` appended an empty paragraph on open. It's turned off.

## Open issues

1. **Production rate limit (from S3, still open).** Every SSR and proxy call shares the web container's single
   200/min bucket. The admin adds to this: each autosave costs 2 API calls (`/auth/me` plus the PUT), and each tree
   change costs 4 (`/auth/me`, the write, `/auth/me`, the list reload). Back-to-back test runs here hit it. This needs
   the scaffold decision from the Session 3 handoff (question 1).
2. **Links inside rich text are stored as plain paths** (`href: "/about"`), unlike buttons, heroes and footer links,
   which store `{ nodeId }`. Moving or renaming a page therefore breaks links to it from inside text. The fix would be a
   `nodeId` attribute on the link mark, resolved at read time, plus a sanitizer change. Not done; question 2.
3. **A few things the editor allows but the sanitizer drops:**
   - a quote inside a quote
   - a horizontal line inside a list item

   They are rare. If one is saved, the "left out" banner explains it.
4. **Switching tree items with unsaved panel edits** asks with the browser's `confirm()`, not a styled dialog.
5. **Typing right after a link extends it.** This is Tiptap's autolink default (`inclusive`).
6. Still from S3: uppercase URLs aren't matched, the `events` key has no component until S6, and galleries and images
   arrive in S5.

## First steps for Session 5 (Vault media; master §6)

1. Read the master plan (§6, plus the *(S2)*–*(S4)* notes), then this file. Work on `cms-module`.
2. **API.**
   - `api/src/lib/cmsRole.ts`: copy Vault's `callerRole`.
   - `routes/cms/media.ts`: `GET /cms/media`, `/media/folders`, `/media/:id`; register it in `routes/cms/index.ts`.
   - Read-time image resolution in `pageView`: fill `media`, and drop missing or `admin_only` images.
   - Publish warnings for missing images.
3. **Frontend.**
   - `MediaPicker`:
     - upload to "Website Media" through `/api/vault/folders` and `/api/vault/documents`
     - check that each file is 10 MB or less before uploading
     - store `w` and `h`
   - Add the "Website Media" folder to Settings.
   - Hero image and SEO image pickers: add them to `HeroEditor` and to the page settings panel in the builder.
4. **Rich text.**
   - Add `lib/cms/tiptap/CmsImage.ts` to `RichTextEditor`'s extensions, with an image button in its toolbar.
   - Add the image toolbar row (align, width, alt, caption, replace, remove), shown with `slide` when
     `editor.isActive('cmsImage')`.
   - Render `cmsImage` in `RichTextRenderer` from the page's `media` map.
   - Route pasted and dropped image files to the upload flow instead of refusing them.
5. **Gallery.**
   - `GalleryEditor`: add it to `BlockCard`, and add Gallery to `BlockInserter`'s list.
   - `GalleryBlock` and `Lightbox` in `render/`; `BlockRenderer` gets the gallery case.
6. **Without Vault.** A `--modules cms` project must still work: hide the image actions.
7. **Regression checks.** Rerun `s4-admin.cjs`, `s3-site.sh`, `s3-extra.sh` and `s2-api-matrix.mjs`, with the
   cool-downs in their README.

## Questions for the user

1. **Rate limit (still open from Session 3).** Should I fix how the API rate-limits the web container's traffic? It's
   a separate small scaffold change. I recommend option (b): exempt web→API calls that carry a shared secret header.
   The admin's autosave makes this more pressing.
2. **Links inside text.** Should they follow page moves, like buttons do? That means storing the page id on the link
   and resolving it when the page is read: a small API and sanitizer change. I'd do it in Session 5 or 6 if you want
   it.
3. Still not mine: `.claude/handoffs/client-portal-customer-access.md` shows as deleted in the working tree. I've left
   it out of the commits.
