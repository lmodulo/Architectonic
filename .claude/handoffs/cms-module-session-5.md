# CMS module, Session 5: images from Vault

Done 2026-11-13 on branch `cms-module`, and committed there. The master plan is `.claude/handoffs/cms-module.md`; §6
now has an *(S5) As built* list, and Known pitfalls has three new entries. No scaffold file changed, so nothing was
synced to friendsofmcrwr. cms still imports nothing from Vault: it reads Vault's collections by name and uploads
through Vault's own HTTP routes.

This session's commit also includes the deletion of `.claude/handoffs/client-portal-customer-access.md` (the user
deleted it on 2026-11-13; it's no longer needed).

## Files added or changed (under `modules/cms/`)

**API**
- `lib/cmsMedia.ts` (new): the image rules and helpers:
  - `isWebImage`, `vaultAvailable`, `imageVersionStages`
  - `resolveMedia`, which looks up every id in one query
  - `pageImageIds`, `foreignImageIds`, `stripImages`, `missingCount`
- `lib/cmsRole.ts` (new): `callerRole` (copied from Vault, not imported) and `callerCan`, a requirePermission-style
  check that doesn't reply.
- `routes/cms/media.ts` (new): `GET /cms/media`, `/media/folders` and `/media/:id`. Each needs `cms_pages.update` and
  `vault_documents.read`, and returns `{ available: false }` without Vault.
- `routes/cms/index.ts`: registers media.
- `routes/cms/site.ts`, `pages.ts`, `lib/cmsTree.ts`:
  - The public resolve and the preview now fill `media`; `GET /cms/pages/:nodeId` returns it too.
  - Draft saves strip images from another workspace.
  - Publishing warns about unavailable images.
- `tests/unit/lib/cmsMedia.test.ts` (new): 19 tests, 62 in total.

**Frontend**

| File | What it does |
|---|---|
| `lib/cms/media.svelte.ts` (new) | `mediaAccess()`, upload checks (type, 10 MB), `imageSize`, `uploadFolder` (finds or creates "Website Media"), `uploadImage` (XHR with progress), and `MediaContext` (the page's known images, the single picker request, uploads from paste and drop). |
| `lib/cms/tiptap/CmsImage.ts` (new) | The `cmsImage` node: atom, draggable, selectable. It parses only `figure[data-cms-image]`, renders `figure.cms-fig--{align}[data-width]`, and adds an `insertCmsImage` command. |
| `lib/cms/types.ts` | `MediaMap`, `MediaItem`, and `PageDraft.media`. |
| `lib/cms/admin.ts` | `editable(content, media)` swaps in current image URLs. `blockProblems(…, known)` flags unavailable images and missing alt text. |
| `admin/MediaPicker.svelte` (new) | The modal: folders, search, "Show more", multi-select, upload with progress and limits, and alt text. |
| `admin/ImageField.svelte` (new) | A single optional image: hero background and share image. |
| `admin/GalleryEditor.svelte` (new) | Gallery images (add, drag or arrows to reorder, alt text, caption, remove), columns, shape and spacing. |
| `admin/RichTextEditor.svelte` | Image button, image toolbar row (position, width, alt, caption, replace, remove), paste and drop uploads, and the missing-image outline. |
| `admin/BlockCard.svelte`, `BlockInserter.svelte`, `HeroEditor.svelte` | Gallery block and preview, Gallery in the block list, and the hero background image. |
| `render/GalleryBlock.svelte`, `render/Lightbox.svelte` (new) | Public gallery (grid, or CSS columns for "As uploaded") and the hand-rolled lightbox. |
| `render/RichTextRenderer.svelte`, `HeroBlock.svelte`, `BlockRenderer.svelte`, `CmsPage.svelte` | Render images from `media` only. |
| `routes/cms/pages/[nodeId]/+page.svelte` | Sets up `MediaContext` and the picker, and adds the share image. |
| `routes/cms/settings/*` | The "Images" section: which Vault folder uploads go to. |

**Test scripts (`.claude/handoffs/cms-tests/`):** `s5-seed.sh`, `s5-media.cjs` and `s5-novault.cjs` (see the README).

## Deviations from the plan, and why

1. **The image types are an allowlist:** PNG, JPEG, GIF, WebP and AVIF, checked by MIME type and by file extension.
   The plan said "`^image/` minus SVG", but that would still let through an SVG with a wrong label, plus formats
   browsers can't show.
2. **Search matches substrings, not Mongo `$text`,** which only matches whole words ("riv" finds nothing). Vault's
   collections are small, so a regex is fine.
3. **A workspace guard on save** (not in the plan). The public site has no workspace, so read time can't check one.
   Saving now drops images from another workspace's Vault instead.
4. **The share image (`seo.image`) is pickable now.** S6 only has to render `og:image`.
5. **The hero image is decorative** (`alt=""`) and needs no alt text. The heading carries the meaning.
6. **Gallery stays in the block list without Vault**, marked unavailable with the reason, rather than disappearing.
   The plan said to hide image actions and show the install hint; this does both where it's useful.

## Test results

All on throwaway projects:
- `s5-check`: `--modules cms,vault`, ports 3002 / 4002 / 27020, demo seed plus `s5-seed.sh` images.
- `s5-novault`: `--modules cms`, ports 3003 / 4003 / 27021.

The test images were made with Pillow:

```python
from PIL import Image, ImageDraw   # gradients with white dots, 800×600 / 800×1000 PNGs, a 1600×700 JPEG,
# plus logo.svg and an 11.5 MB noise PNG (huge.png) for the size limit
```

**Exit criteria (master plan, Session 5):**

| Criterion | Result |
|---|---|
| Left and right floats wrap the text and stack on mobile | **Pass.** Measured on the public page: float `left` at 33.3% and `right` at 25% of the column, and the next paragraph starts beside the image. At 390 px both are `float: none` and full width. |
| The gallery grid opens the lightbox, with keyboard and swipe navigation | **Pass.** It opens with a transition at "2 / 6" with its caption. → and ← move, Tab stays inside, and the page is scroll-locked. Esc closes, returns focus to the tile and releases the lock. A swipe on a phone moves to the next image, and the click that ends a swipe doesn't close it. |
| Uploading from the picker lands in "Website Media" | **Pass.** The folder was created and its id stored in the settings, and the Settings page shows it. Files over 10 MB and SVGs are refused before uploading. A file dropped into text uploads too. |
| A new Vault version appears on the public page | **Pass**, without republishing. |
| Images that are deleted or set to `admin_only` disappear from the public page | **Pass**, in text and in the gallery. The editor outlines and lists them, and publishing warns ("2 images are no longer available"). Restoring the visibility brings them back. |
| SVGs are never listed | **Pass.** Checked in the API list, the picker, and a single lookup (404). An SVG id put into a draft by hand never resolves. |
| A `--modules cms` project with no Vault works, with image actions hidden | **Pass.** `s5-novault.cjs` 14/14. |

**Scripts:**
- `s5-media.cjs`: **65/65 on the final code, with 0 rate-limit hits.** Beyond the exit criteria, it covers:
  - the folder filter and search
  - the cross-workspace strip
  - the alt-text warnings
  - gallery reordering
  - the hero image is decorative (`alt=""`)
  - the share image is stored
  - `w` and `h` are stored with each image
  - `loading="lazy"`
  - roles:
    - contributor: picks images, no upload
    - viewer: no image actions, and a 403 from the API
    - lead: picks and uploads
  - no page errors
- `s5-novault.cjs`: 14/14.
- **Regression on the cms + Vault project:**
  - `s2-api-matrix.mjs`: 95/95
  - `s4-shadow.cjs`: 5/5
  - `s4-admin.cjs`: 81/81 (after the harness fix below)
  - `s3-site.sh`: 56/56
  - `s3-extra.sh`: 13/13, with `s3-menu.cjs` at 28/28
  - 0 rate-limit hits

**Static checks:**
- **API unit tests:** 62/62.
- **svelte-check, cms-only project:** 49 errors and 41 warnings, the S2–S4 baseline, with none in cms.
- **svelte-check, cms + Vault project:** 73 errors and 48 warnings, with none in cms. Of those, 22 errors and 7
  warnings are in Vault's own files, and 2 more are the known nav-icon errors in `nav.ts` (Vault adds nav items).
- **API `tsc`:** in cms files, only the usual Fastify-generics noise (TS2314/TS7006), the same pattern as the
  existing routes. The new libraries are clean.
- `grep -r "{@html" modules/cms` finds nothing.

**Screenshots** were checked on the default dark theme: the picker, the image toolbar, the public page with floats and
a gallery, the lightbox on desktop and phone, and the phone page.

**Test-harness fixes, not app bugs:**
- **`s4-admin.cjs` block drag now uses explicit mouse moves.** `dragTo` scrolled the page between mouse-down and the
  drag starting when the drop point was under the sticky bar, so Chromium dragged a different block's grip. It failed
  intermittently on this project; it passed 3/3 and then the full run after the change.
- `s5-novault.cjs` force-clicks the `aria-disabled` Gallery entry.
- `s5-seed.sh` avoids bash 4's `${n^}`.
- Several checks poll instead of sleeping, for transitions.

**Teardown:** `s5-check` and `s5-novault` are torn down (containers, volumes, images and folders).

## Bugs found and fixed this session

- **An image at the end of a text block left nowhere to type after it.** `trailingNode` is off, from S4. An empty
  paragraph is now added after it.
- **The lightbox flashed dark between images.** The old image vanished before the new one faded in. It cross-fades
  now.
- **A mouse swipe in the lightbox could close it.** The click that ends a swipe landed on the dark area. That click is
  now ignored.
- **The palette's "Gallery" entry was natively disabled** while unavailable, so keyboard users couldn't reach it to
  hear why. It's `aria-disabled` now.

## Open issues

1. **Production rate limit (from S3, still open).** Uploads add requests too.
2. **Text links are plain paths (from S4, still open).** Moving a page breaks links to it from inside text.
3. **No thumbnails.** The picker and the size reading load full images. That's fine for normal photos, but slow for
   many very large files. Sharp is out of scope.
4. **Deleting an image in Vault gives no warning** that pages use it. cms flags it afterwards: the editor outline and
   the publish warning.
5. **`/uploads/` has no auth (from the plan, still open).** It isn't widened: only placed images are meant to be
   public.
6. Still from S3: uppercase URLs aren't matched, and the `events` key has no component until S6.

## First steps for Session 6 (master plan, Session 6)

1. Read the master plan (the Session 6 bullets, §7 Events, and the *(S2)*–*(S5)* notes), then this file. Work on
   `cms-module`.
2. **Events component.** Add `lib/config/cms-components/events.ts` and `site/EventsComponent.svelte`:
   - `load` fetches `/api/calendar-events/public` and returns `{ unavailable: true }` if the response isn't ok.
   - Render text only, sorted by start date.
   - Block props: `limit` and `eventType`.
   - Raise the in-progress-events gap with the user.
3. **SEO.** In `CmsPage`'s `<svelte:head>`:
   - meta description
   - `og:image` from `view.media[seo.image.vaultId]`, made absolute
   - canonical URL
   - `noindex`
4. **Docs.** `module-docs/cms.ts` and `routes/(docs)/documentation/cms/+page.svelte`, ending with the API table
   (including `/cms/media`).
5. **Dashboard widget.** `CmsDashboardWidget` wraps `ModuleStatsWidget`; add it to `module.json` widgets with
   `order` 80.
6. **Full matrix.** Run it on `--modules cms` and on `--modules cms,vault,calendar-events,commerce`:
   - `s2-api-matrix.mjs`, `s3-site.sh`, `s3-extra.sh`
   - `s4-admin.cjs`, `s4-shadow.cjs`
   - `s5-media.cjs` after `s5-seed.sh`, and `s5-novault.cjs`
   - plus the new S6 checks
7. Tear everything down, and set out the friendsofmcrwr install decision for the user.

## Questions for the user

1. **Rate limit (still open from Session 3).** Should I fix it in the scaffold? I recommend option (b): exempt
   web→API calls that carry a shared secret header.
2. **Links inside text (still open from Session 4).** Should they follow page moves, like buttons do? If yes, I'll do
   it in Session 6.
