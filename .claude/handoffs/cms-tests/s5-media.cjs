// Session 5 exit checks: Vault images in the CMS (throwaway project with --modules cms,vault only).
// Usage: node s5-media.cjs [web] [api] [image-dir] [screenshot-dir] [mongo-container]
// (mongo-container defaults to s5-check-mongo-1; with `docker compose -p <name>` it is <name>-mongo-1)
// Needs s5-seed.sh to have run (Photos folder, River…Portrait, Wide hero, an SVG, an admin-only image)
// and the users s5lead / s5contrib / s5viewer @example.com. Creates a top-level page /photo-test and
// deletes it at the end. It deletes Park from Vault and re-uploads it at the end; its other Vault
// changes (uploads, a new River version) stay, and a rerun allows for them.
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs');
const { execSync } = require('child_process');
const WEB = process.argv[2] || 'http://localhost:3002';
const API = process.argv[3] || 'http://localhost:4002';
const IMG = process.argv[4] || '.';
const SHOTS = process.argv[5] || require('os').tmpdir();
const MONGO = process.argv[6] || 's5-check-mongo-1';
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${!ok && d ? `  -- ${d}` : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
async function until(fn, ms = 5000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return true; await sleep(150); }
  return !!(await fn());
}

// ── Direct API (from this machine: its own rate-limit bucket) ────────────────────────────
let cookie = '';
async function apiLogin() {
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'admin-password' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
}
async function api(method, path, body) {
  const form = body instanceof FormData;
  const r = await fetch(`${API}${path}`, { method, headers: { cookie, ...(body && !form ? { 'content-type': 'application/json' } : {}) }, body: form ? body : body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const fileForm = (file, type, fields = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  f.append('file', new Blob([fs.readFileSync(`${IMG}/${file}`)], { type }), file);
  return f;
};

// ── Browser helpers ──────────────────────────────────────────────────────────────────────
async function login(browser, email, viewport = { width: 1400, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${email}: ${e.message}`));
  await page.goto(`${WEB}/login`); await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'admin-password');
  await Promise.all([page.waitForURL('**/dashboard'), page.click('button[type="submit"]')]);
  return { ctx, page };
}
const go = async (page, path) => { await page.goto(`${WEB}${path}`); await page.waitForLoadState('networkidle'); };
const animating = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].some(el => el.getAnimations().length > 0), sel);
const saveState = page => page.locator('[data-save-state]').getAttribute('data-save-state');
const waitSaved = page => until(async () => (await saveState(page)) === 'saved', 12000);
const picker = page => page.locator('[role="dialog"][aria-labelledby]').filter({ has: page.locator('h2') });
const tile = (page, name) => picker(page).locator('ul button[aria-pressed]', { hasText: name });
const longText = n => Array.from({ length: n }, (_, i) => `Sentence ${i + 1} about the riverside work that volunteers do every week.`).join(' ');

(async () => {
  await apiLogin();
  const media = (await api('GET', '/cms/media?limit=60')).body;
  const byName = Object.fromEntries(media.items.map(i => [i.name, i]));
  const svgId = execSync(`docker exec ${MONGO} mongosh appdb --quiet --eval 'print(db.vault_documents.findOne({name:"Logo SVG"})._id.toString())'`).toString().trim();
  const secretId = execSync(`docker exec ${MONGO} mongosh appdb --quiet --eval 'print(db.vault_documents.findOne({name:"Secret"})._id.toString())'`).toString().trim();

  // ── API: what may be listed ──────────────────────────────────────────────────────────────
  const seeded = ['River', 'Garden', 'Market', 'School', 'Park', 'Bridge', 'Portrait', 'Wide hero'];
  check('media list has the 8 seeded web images', media.available === true && seeded.every(n => byName[n]), `${media.total} ${media.items.map(i => i.name)}`);
  check('SVGs are never listed', !media.items.some(i => i.id === svgId || /svg/i.test(i.mimetype)));
  check('admin-only images are never listed, even for an admin', !media.items.some(i => i.id === secretId));
  check('documents that aren\'t images are not listed', media.items.every(i => /^image\/(png|jpeg|gif|webp|avif)$/.test(i.mimetype)));
  check('single lookup refuses the SVG', (await api('GET', `/cms/media/${svgId}`)).status === 404);
  const photos = (await api('GET', '/cms/media/folders')).body.folders.find(f => f.name === 'Photos');
  check('folder filter', (await api('GET', `/cms/media?folderId=${photos.id}`)).body.total === 8 && (await api('GET', '/cms/media?folderId=root')).body.total === 0);
  check('search by name', JSON.stringify((await api('GET', '/cms/media?q=riv')).body.items.map(i => i.name)) === '["River"]');

  // Test page
  for (const n of (await api('GET', '/cms/nodes')).body) if (n.slug === 'photo-test') await api('DELETE', `/cms/nodes/${n.id}`);
  const pageNode = (await api('POST', '/cms/nodes', { type: 'page', title: 'Photo test', slug: 'photo-test' })).body;
  await api('POST', `/cms/pages/${pageNode.id}/publish`);

  // Crafted references: an SVG never resolves; another workspace's image is stripped on save
  const draft0 = (await api('GET', `/cms/pages/${pageNode.id}`)).body;
  const otherWs = execSync(`docker exec ${MONGO} mongosh appdb --quiet --eval '
    const d = db.vault_documents.findOne({name:"River"}); const v = db.vault_document_versions.findOne({_id:d.currentVersionId});
    const id = new ObjectId(); const vid = new ObjectId(); const ws = new ObjectId();
    db.vault_document_versions.insertOne({...v, _id: vid, documentId: id, workspaceId: ws});
    db.vault_documents.insertOne({...d, _id: id, workspaceId: ws, currentVersionId: vid, name: "Other workspace"});
    print(id.toString())'`).toString().trim();
  const crafted = await api('PUT', `/cms/pages/${pageNode.id}/draft`, {
    rev: draft0.rev, seo: {},
    blocks: [{ id: 'g1', type: 'gallery', data: { columns: 3, aspect: 'square', gap: 'md', images: [
      { vaultId: svgId, src: '/uploads/x.svg', alt: '' },
      { vaultId: otherWs, src: '/uploads/x.png', alt: '' },
      { vaultId: byName.River.id, src: byName.River.url, alt: 'River' },
    ] } }],
  });
  check('an image from another workspace is removed on save', crafted.status === 200 && crafted.body.removed === 1 && !JSON.stringify(crafted.body.draft).includes(otherWs), JSON.stringify(crafted.body?.removed));
  const pv = (await api('GET', `/cms/pages/${pageNode.id}/preview`)).body;
  check('a crafted SVG reference never resolves', !pv.media[svgId] && !!pv.media[byName.River.id]);
  await api('PUT', `/cms/pages/${pageNode.id}/draft`, { rev: crafted.body.rev, blocks: [], seo: {} });

  const browser = await chromium.launch();
  const { ctx, page } = await login(browser, 'admin@example.com');
  await go(page, `/cms/pages/${pageNode.id}`);

  // ── Picker: upload, limits, inserting into text ─────────────────────────────────────────
  await page.getByRole('button', { name: 'Add block' }).click();
  await page.getByRole('menuitem', { name: /^Text/ }).click();
  await sleep(300);
  await page.keyboard.type(longText(3));
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Image', exact: true }).click();
  await picker(page).waitFor();
  check('picker opens with a transition', await animating(page, '[role="dialog"][aria-labelledby]'));
  await until(async () => (await picker(page).locator('ul button[aria-pressed]').count()) === Math.min(media.total, 24));
  check('picker lists the images, no SVG or admin-only', (await picker(page).locator('ul button[aria-pressed]').count()) === media.total && !(await picker(page).innerText()).includes('Secret') && !(await picker(page).innerText()).includes('Logo SVG'));
  check('picker says images are public', (await picker(page).innerText()).includes('Images placed on pages are publicly visible'));
  const input = picker(page).locator('input[type="file"]');
  await input.setInputFiles(`${IMG}/huge.png`);
  check('a file over 10 MB is refused before uploading', await until(async () => (await picker(page).innerText()).includes('larger than 10 MB')));
  await input.setInputFiles(`${IMG}/logo.svg`);
  check('an SVG upload is refused', await until(async () => (await picker(page).innerText()).includes("isn't a PNG")));
  await input.setInputFiles(`${IMG}/upload-me.png`);
  check('upload appears selected in the picker', await until(async () => (await tile(page, 'upload-me').first().getAttribute('aria-pressed')) === 'true', 15000));
  await picker(page).getByLabel('Alt text').fill('Uploaded test image');
  await picker(page).getByRole('button', { name: 'Use image' }).click();
  await until(async () => (await page.locator('.cms-editor figure[data-cms-image]').count()) === 1);
  const folders = (await api('GET', '/cms/media/folders')).body;
  const site = folders.folders.find(f => f.name === 'Website Media');
  const uploaded = (await api('GET', '/cms/media?q=upload-me')).body.items[0];
  check('upload landed in Vault\'s "Website Media" folder', !!site && uploaded?.folderId === site.id, JSON.stringify(uploaded));
  check('settings remember the Website Media folder', folders.mediaFolderId === site?.id);
  check('an inserted image is selected, with its toolbar open', await until(() => page.getByRole('group', { name: 'Image settings' }).isVisible()));
  check('alt text from the picker is stored', (await page.getByRole('group', { name: 'Image settings' }).getByLabel('Alt text').inputValue()) === 'Uploaded test image');
  // Replace it with River, float it left at 33%
  await page.getByRole('group', { name: 'Image settings' }).getByRole('button', { name: 'Replace' }).click();
  await picker(page).waitFor();
  await until(async () => (await tile(page, 'River').count()) === 1);
  await tile(page, 'River').click();
  await picker(page).getByLabel('Alt text').fill('The river at dawn');
  await picker(page).getByRole('button', { name: 'Use image' }).click();
  await sleep(400);
  const imgBar = page.getByRole('group', { name: 'Image settings' });
  await imgBar.getByRole('button', { name: 'Left', exact: true }).click();
  await imgBar.getByRole('button', { name: '33%' }).click();
  await imgBar.getByLabel('Caption').fill('Early morning on the river');
  check('editor shows the image floated left', (await page.locator('.cms-editor figure[data-cms-image]').first().evaluate(f => getComputedStyle(f).float)) === 'left');
  await page.keyboard.press('Escape');
  // Type the text that wraps round it, then a second image floated right
  await page.locator('.cms-editor p').last().click();
  await page.keyboard.type(longText(8));
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Image', exact: true }).click();
  await picker(page).waitFor();
  await until(async () => (await tile(page, 'Garden').count()) === 1);
  await tile(page, 'Garden').click();
  await picker(page).getByLabel('Alt text').fill('The community garden');
  await picker(page).getByRole('button', { name: 'Use image' }).click();
  await sleep(400);
  await page.getByRole('group', { name: 'Image settings' }).getByRole('button', { name: 'Right', exact: true }).click();
  await page.getByRole('group', { name: 'Image settings' }).getByRole('button', { name: '25%' }).click();
  await page.locator('.cms-editor p').last().click();
  await page.keyboard.type(longText(8));

  // Drop an image file onto the text: uploads to Vault and lands where it was dropped
  const before = (await api('GET', '/cms/media')).body.total;
  await page.evaluate(async () => {
    const c = Object.assign(document.createElement('canvas'), { width: 320, height: 200 });
    const g = c.getContext('2d'); g.fillStyle = '#c84'; g.fillRect(0, 0, 320, 200);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'dropped.png', { type: 'image/png' }));
    const p = document.querySelector('.cms-editor p');
    const r = p.getBoundingClientRect();
    p.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: r.left + 5, clientY: r.top + 5, bubbles: true, cancelable: true }));
  });
  check('a dropped image file uploads and is inserted', await until(async () => (await page.locator('.cms-editor figure[data-cms-image]').count()) === 3, 15000));
  check('the dropped file is in Vault', (await api('GET', '/cms/media')).body.total === before + 1);
  // Remove the dropped one again (keeps the page layout predictable)
  await page.locator('.cms-editor figure[data-cms-image]').first().click();
  await page.getByRole('group', { name: 'Image settings' }).getByRole('button', { name: 'Remove' }).click();
  await until(async () => (await page.locator('.cms-editor figure[data-cms-image]').count()) === 2);

  // ── Gallery block ───────────────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Add block' }).click();
  await page.getByRole('menuitem', { name: /^Gallery/ }).click();
  await sleep(400);
  const gal = page.locator('[data-block-id]').last();
  await gal.getByRole('button', { name: 'Add images' }).click();
  await picker(page).waitFor();
  await until(async () => (await tile(page, 'Portrait').count()) === 1);
  for (const n of ['Portrait', 'Bridge', 'Park', 'School', 'Market', 'Garden']) await tile(page, n).click();
  await picker(page).getByRole('button', { name: /^Add 6 images/ }).click();
  await until(async () => (await gal.locator('[data-gallery-index]').count()) === 6);
  check('gallery editor holds 6 images', (await gal.locator('[data-gallery-index]').count()) === 6);
  check('missing alt text is flagged', (await gal.innerText()).includes('6 images have no alt text'));
  for (let i = 0; i < 6; i++) await gal.getByLabel('Alt text').nth(i).fill(`Gallery photo ${i + 1}`);
  await gal.getByLabel('Caption').nth(1).fill('The old bridge');
  await gal.getByRole('button', { name: 'Move image 1 later' }).click();
  check('gallery reorder', (await gal.getByLabel('Alt text').nth(0).inputValue()) === 'Gallery photo 2');
  await gal.getByRole('button', { name: 'Move image 2 earlier' }).click();
  await sleep(300);

  // ── Hero with a background image, and the share image ───────────────────────────────────
  await page.getByRole('button', { name: 'Add a block at the top' }).click();
  await page.getByRole('menuitem', { name: /^Hero/ }).click();
  await sleep(400);
  const hero = page.locator('[data-block-id]').first();
  await hero.getByLabel('Heading').fill('Photo test');
  await hero.getByRole('button', { name: 'Choose image' }).click();
  await picker(page).waitFor();
  check('hero picker asks no alt text (decorative)', (await picker(page).getByLabel('Alt text').count()) === 0);
  await until(async () => (await tile(page, 'Wide hero').count()) === 1);
  await tile(page, 'Wide hero').click();
  await picker(page).getByRole('button', { name: 'Use image' }).click();
  await sleep(400);
  check('hero preview shows the image', (await hero.locator('.cms-hero img').count()) === 1);
  await page.locator('aside[aria-label="Page settings"]').getByRole('button', { name: 'Choose image' }).click();
  await picker(page).waitFor();
  await until(async () => (await tile(page, 'Portrait').count()) === 1);
  await tile(page, 'Portrait').click();
  await picker(page).getByRole('button', { name: 'Use image' }).click();
  await picker(page).waitFor({ state: 'detached' });
  await until(async () => (await saveState(page)) !== 'saved', 3000);
  check('autosave', await waitSaved(page));
  await page.screenshot({ path: `${SHOTS}/s5-builder.png`, fullPage: true });
  await page.getByRole('button', { name: /^Publish/ }).last().click();
  await page.locator('.alert-success, .alert-warning').first().waitFor();
  check('publishes without warnings', (await page.locator('.alert-success').count()) === 1, await page.locator('.alert-warning').innerText().catch(() => ''));
  const stored = (await api('GET', `/cms/pages/${pageNode.id}`)).body.draft;
  const sj = JSON.stringify(stored);
  check('stored image refs carry width and height', /"vaultId":"[a-f0-9]{24}","src":"[^"]+","alt":"The river at dawn","caption":"Early morning on the river","align":"left","width":33,"w":800,"h":600/.test(sj), sj.slice(0, 300));
  check('share image stored', stored.seo.image?.vaultId === byName.Portrait.id);

  // ── Public page: floats wrap, stack on phones; gallery and lightbox ─────────────────────
  const anon = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ap = await anon.newPage();
  ap.on('pageerror', e => errors.push(`public: ${e.message}`));
  await go(ap, '/photo-test');
  const figs = ap.locator('.cms-prose figure.cms-fig');
  check('public page shows both text images', (await figs.count()) === 2);
  const layout = await ap.evaluate(() => {
    const [f1, f2] = document.querySelectorAll('.cms-prose figure.cms-fig');
    const p1 = f1.nextElementSibling, col = f1.parentElement.getBoundingClientRect();
    const a = f1.getBoundingClientRect(), b = p1.getBoundingClientRect();
    return { float1: getComputedStyle(f1).float, float2: getComputedStyle(f2).float, w1: a.width / col.width, w2: f2.getBoundingClientRect().width / col.width, wrapped: b.top < a.bottom - 10 };
  });
  check('left image floats left at a third of the column', layout.float1 === 'left' && Math.abs(layout.w1 - 0.333) < 0.02, JSON.stringify(layout));
  check('right image floats right at a quarter', layout.float2 === 'right' && Math.abs(layout.w2 - 0.25) < 0.02, JSON.stringify(layout));
  check('text wraps beside the floated image', layout.wrapped, JSON.stringify(layout));
  check('caption shown', (await figs.first().locator('figcaption').innerText()) === 'Early morning on the river');
  check('images load lazily', (await figs.first().locator('img').getAttribute('loading')) === 'lazy' && (await figs.first().locator('img').getAttribute('decoding')) === 'async');
  check('hero background image', (await ap.locator('.cms-hero img').getAttribute('src')) === byName['Wide hero'].url && (await ap.locator('.cms-hero img').getAttribute('alt')) === '');
  await ap.screenshot({ path: `${SHOTS}/s5-public.png`, fullPage: true });

  const tiles = ap.locator('.cms-gallery button');
  check('gallery shows 6 tiles', (await tiles.count()) === 6);
  await tiles.nth(1).click();
  const box = ap.locator('[role="dialog"][aria-label="Image viewer"]');
  await box.waitFor();
  check('lightbox opens with a transition', await animating(ap, '[role="dialog"][aria-label="Image viewer"]'));
  check('lightbox counter and caption', (await box.innerText()).includes('2 / 6') && (await box.innerText()).includes('The old bridge'));
  check('page behind is scroll-locked', (await ap.evaluate(() => document.documentElement.style.overflow)) === 'hidden');
  await ap.keyboard.press('ArrowRight');
  check('→ shows the next image', await until(async () => (await box.innerText()).includes('3 / 6')));
  await ap.keyboard.press('ArrowLeft');
  await ap.keyboard.press('ArrowLeft');
  check('← goes back', await until(async () => (await box.innerText()).includes('1 / 6')));
  await ap.keyboard.press('Tab'); await ap.keyboard.press('Tab'); await ap.keyboard.press('Tab'); await ap.keyboard.press('Tab');
  check('focus stays inside the lightbox', await ap.evaluate(() => !!document.activeElement?.closest('[aria-label="Image viewer"]')));
  await sleep(400); // let the cross-fade finish
  await ap.screenshot({ path: `${SHOTS}/s5-lightbox.png` });
  await ap.keyboard.press('Escape');
  check('Esc closes and focus returns to the tile', await until(async () => (await box.count()) === 0) && await ap.evaluate(() => document.activeElement?.getAttribute('aria-label')?.startsWith('Open image 2 of 6')));
  check('scroll lock released', (await ap.evaluate(() => document.documentElement.style.overflow)) === '');
  await anon.close();

  // Phone: floats stack, swipe moves between images
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await mob.newPage();
  mp.on('pageerror', e => errors.push(`mobile: ${e.message}`));
  await go(mp, '/photo-test');
  const stacked = await mp.evaluate(() => [...document.querySelectorAll('.cms-prose figure.cms-fig')].map(f => ({ float: getComputedStyle(f).float, w: f.getBoundingClientRect().width / f.parentElement.getBoundingClientRect().width })));
  check('on phones the images stack full width', stacked.every(s => s.float === 'none' && s.w > 0.98), JSON.stringify(stacked));
  check('gallery fits a phone', await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await mp.locator('.cms-gallery button').first().scrollIntoViewIfNeeded();
  await mp.locator('.cms-gallery button').first().click();
  const mbox = mp.locator('[role="dialog"][aria-label="Image viewer"]');
  await mbox.waitFor();
  await sleep(300);
  const r = await mbox.boundingBox();
  await mp.mouse.move(r.x + r.width * 0.8, r.y + r.height / 2);
  await mp.mouse.down(); await mp.mouse.move(r.x + r.width * 0.2, r.y + r.height / 2, { steps: 5 }); await mp.mouse.up();
  check('swipe left shows the next image', await until(async () => (await mbox.innerText()).includes('2 / 6')), await mbox.innerText());
  await sleep(400);
  await mp.screenshot({ path: `${SHOTS}/s5-lightbox-mobile.png` });
  check('lightbox still open after the swipe', (await mbox.count()) === 1);
  await mp.keyboard.press('Escape');
  await mp.screenshot({ path: `${SHOTS}/s5-public-mobile.png`, fullPage: true });
  await mob.close();

  // ── Vault changes reach the public page without republishing ────────────────────────────
  const v2 = await api('POST', `/vault/documents/${byName.River.id}/versions`, fileForm('version2.png', 'image/png', { note: 'S5 test' }));
  check('new Vault version uploaded', v2.status === 201, v2.status);
  const pub = async () => { const c = await browser.newContext(); const p = await c.newPage(); await go(p, '/photo-test'); const html = await p.content(); const n = await p.locator('.cms-gallery button').count(); const f = await p.locator('.cms-prose figure.cms-fig').count(); await c.close(); return { html, tiles: n, figs: f }; };
  let s = await pub();
  check('a new Vault version shows on the public page', s.html.includes('version2.png'));
  await api('PATCH', `/vault/documents/${byName.Garden.id}`, { visibility: 'admin_only' });
  s = await pub();
  check('an image made admin-only disappears (text and gallery)', s.figs === 1 && s.tiles === 5, JSON.stringify({ figs: s.figs, tiles: s.tiles }));
  await api('DELETE', `/vault/documents/${byName.Park.id}`);
  s = await pub();
  check('a deleted image disappears', s.tiles === 4, s.tiles);
  // The editor flags them, and publishing warns
  await go(page, `/cms/pages/${pageNode.id}`);
  const canvas = await page.locator('.cms-canvas').innerText();
  check('the editor flags unavailable images', canvas.includes('no longer available in Vault'));
  check('the editor outlines a missing image in text', (await page.locator('.cms-editor figure[data-missing]').count()) === 1);
  const pubRes = await api('POST', `/cms/pages/${pageNode.id}/publish`);
  check('publish warns about unavailable images', pubRes.body.warnings.some(w => w.includes('2 images are no longer available')), JSON.stringify(pubRes.body.warnings));
  await api('PATCH', `/vault/documents/${byName.Garden.id}`, { visibility: 'staff' });
  s = await pub();
  check('restoring the visibility brings it back', s.figs === 2 && s.tiles === 5);

  // ── Roles ───────────────────────────────────────────────────────────────────────────────
  for (const [who, role] of [['s5contrib', 'contributor'], ['s5viewer', 'viewer'], ['s5lead', 'lead']]) {
    await sleep(20000);
    const u = await login(browser, `${who}@example.com`);
    await go(u.page, `/cms/pages/${pageNode.id}`);
    const editorExists = (await u.page.locator('.cms-editor').count()) > 0;
    if (editorExists) await u.page.locator('.cms-editor').first().click();
    const imageButton = await u.page.getByRole('button', { name: 'Image', exact: true }).count();
    let upload = 0;
    if (imageButton) {
      await u.page.getByRole('button', { name: 'Image', exact: true }).click();
      await picker(u.page).waitFor();
      upload = await picker(u.page).getByRole('button', { name: 'Upload' }).count();
      await picker(u.page).getByRole('button', { name: 'Cancel' }).click();
    }
    if (role === 'contributor') check('contributor can pick images but not upload', imageButton === 1 && upload === 0, `${imageButton} ${upload}`);
    if (role === 'viewer') check('viewer gets no image actions', imageButton === 0);
    if (role === 'lead') check('lead can pick and upload', imageButton === 1 && upload === 1);
    await u.ctx.close();
  }
  const viewer = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 's5viewer@example.com', password: 'admin-password' }) });
  const vr = await fetch(`${API}/cms/media`, { headers: { cookie: viewer.headers.get('set-cookie').split(';')[0] } });
  check('API: a viewer can\'t browse media (no cms_pages.update)', vr.status === 403, vr.status);

  // Settings: the Website Media folder field. The role logins above each land on the dashboard, which on a project
  // with many modules spends dozens of API calls: let the dev rate-limit window pass first.
  await sleep(60000);
  await go(page, '/cms/settings');
  check('settings show the upload folder', (await page.getByLabel('Vault folder for uploads').inputValue()) === site.id);

  // ── Cleanup (Park goes back, so the script can run again) ───────────────────────────────
  await api('DELETE', `/cms/nodes/${pageNode.id}`);
  await api('POST', '/vault/documents', fileForm('park.png', 'image/png', { name: 'Park', visibility: 'staff', folderId: photos.id, tags: 'test' }));
  execSync(`docker exec ${MONGO} mongosh appdb --quiet --eval 'db.vault_documents.deleteOne({name:"Other workspace"})'`);
  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
