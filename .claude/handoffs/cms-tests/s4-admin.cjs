// Session 4 exit checks for the Content admin, in a real browser (throwaway project only).
// Usage: node s4-admin.cjs [base-url] [screenshot-dir] [phase,phase,...]
// Expects the cms demo seed and the users s4viewer / s4contrib / s4lead @example.com (password
// admin-password; see the Session 4 handoff). Phases: tree, builder, preview, conflict, guard,
// moves, settings, roles, mobile, cleanup (default: all). They always run in that order; `tree`
// first removes a test branch left by an interrupted run. It builds
// Programs › Youth › Mentoring and removes it again in `cleanup`.
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const BASE = process.argv[2] || 'http://localhost:3002';
const SHOTS = process.argv[3] || require('os').tmpdir();
const PHASES = (process.argv[4] || 'tree,builder,preview,conflict,guard,moves,settings,roles,mobile,cleanup').split(',');
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  -- ${detail}` : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];

async function login(browser, email, viewport = { width: 1400, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${email}: ${e.message}`));
  await page.goto(`${BASE}/login`); await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'admin-password');
  await Promise.all([page.waitForURL('**/dashboard'), page.click('button[type="submit"]')]);
  return { ctx, page };
}
const api = (page, method, path, body) => page.evaluate(async ([m, p, b]) => {
  const r = await fetch(`/api/cms/${p}`, { method: m, headers: b ? { 'content-type': 'application/json' } : {}, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}, [method, path, body]);
const nodes = async page => (await api(page, 'GET', 'nodes')).body;
const nodeBy = async (page, title) => (await nodes(page)).find(n => n.title === title);
const go = async (page, path) => { await page.goto(`${BASE}${path}`); await page.waitForLoadState('networkidle'); };
const animating = (page, selector) => page.evaluate(s => [...document.querySelectorAll(s)].some(el => el.getAnimations().length > 0), selector);
const saveState = page => page.locator('[data-save-state]').getAttribute('data-save-state');
async function waitState(page, want, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if ((await saveState(page)) === want) return true; await sleep(150); }
  return false;
}
const row = (page, id) => page.locator(`[data-node-button="${id}"]`).locator('..');
// Svelte marks elements that are transitioning out as inert: count only the live ones
const cardOrder = page => page.locator('[data-block-id]').evaluateAll(els => els.filter(e => !e.closest('[inert]')).map(e => e.getAttribute('aria-label').split(' block')[0]));
const live = (page, selector) => page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => !e.closest('[inert]')).length, selector);
/** Polls until `fn()` is truthy (animations take a frame or two longer on a busy machine). */
async function until(fn, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return true; await sleep(100); }
  return !!(await fn());
}
const editorText = page => page.locator('.cms-editor').first().innerText();
async function typeAtEnd(page, text) {
  const ed = page.locator('.cms-editor').first();
  await ed.click();
  // End of the document: Cmd+Down on macOS, Ctrl+End elsewhere
  await page.keyboard.press(MOD === 'Meta' ? 'Meta+ArrowDown' : 'Control+End');
  await page.keyboard.type(text);
}

(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await login(browser, 'admin@example.com');
  // Back-to-back runs can hit the dev API's 200/min limit: wait until it answers normally again
  for (let i = 0; i < 20 && (await api(page, 'GET', 'nodes')).status === 429; i++) { console.log('rate limited, waiting…'); await sleep(10000); }
  const ids = {};
  const remember = async () => { for (const t of ['Programs', 'Youth', 'Mentoring']) { const n = await nodeBy(page, t); if (n) ids[t] = n.id; } };
  await remember();

  // ── Tree: build three levels from the UI, inline slug validation, publishing ─────────────
  if (PHASES.includes('tree')) {
    // Leftovers from an interrupted run (children first)
    for (const t of ['Mentoring', 'Youth', 'Programs']) if (ids[t]) { await api(page, 'DELETE', `nodes/${ids[t]}`); delete ids[t]; }
    await go(page, '/cms');
    await page.screenshot({ path: `${SHOTS}/s4-tree.png`, fullPage: true });
    await page.locator('section[aria-labelledby="cms-tree-heading"] > div').getByRole('button', { name: 'Add item' }).click();
    const rootForm = page.locator('form[aria-label="Add a top-level item"]');
    check('top-level add form opens with a transition', await animating(page, 'section[aria-labelledby="cms-tree-heading"] div:has(> form)'));
    await rootForm.getByLabel('Title').fill('Dashboard');
    check('reserved slug is flagged inline', (await rootForm.locator('p.text-error').innerText()).includes('is used by the application'));
    check('reserved slug disables Add', await rootForm.getByRole('button', { name: 'Add item' }).isDisabled());
    await rootForm.getByLabel('Title').fill('About');
    check('duplicate top-level slug is flagged inline', (await rootForm.locator('p.text-error').innerText()).includes('already uses this slug'));
    await rootForm.getByLabel('Title').fill('Programs');
    check('slug follows the title and the URL preview updates', (await rootForm.getByLabel('Slug').inputValue()) === 'programs' && (await rootForm.innerText()).includes('/programs'));
    await rootForm.getByLabel('Title').press('Enter');
    await page.waitForSelector('form[aria-label="Edit Programs"]');
    await remember();
    check('Programs created as a draft at the top level, panel open', !!ids.Programs && (await nodeBy(page, 'Programs')).status === 'draft');

    await page.getByRole('button', { name: 'Add an item under Programs' }).click();
    let f = page.locator('form[aria-label="Add an item under Programs"]');
    await f.getByLabel('Title').fill('Youth');
    await f.getByLabel('Title').press('Enter');
    await page.waitForSelector('form[aria-label="Edit Youth"]');
    await page.getByRole('button', { name: 'Add an item under Programs' }).click();
    f = page.locator('form[aria-label="Add an item under Programs"]');
    await f.getByLabel('Title').fill('Youth');
    check('duplicate sibling slug is flagged inline', (await f.locator('p.text-error').innerText()).includes('already uses this slug'));
    await f.getByLabel('Title').fill('Dashboard');
    check('reserved slugs are allowed below the top level', await until(async () => (await live(page, 'form[aria-label="Add an item under Programs"] p.text-error')) === 0));
    await f.getByLabel('Title').press('Escape');
    check('Escape closes the add form', await until(async () => (await page.locator('form[aria-label="Add an item under Programs"]').count()) === 0));

    await page.getByRole('button', { name: 'Add an item under Youth' }).click();
    f = page.locator('form[aria-label="Add an item under Youth"]');
    await f.getByLabel('Title').fill('Mentoring');
    await f.getByLabel('Title').press('Enter');
    await page.waitForSelector('form[aria-label="Edit Mentoring"]');
    await remember();
    const m = await nodeBy(page, 'Mentoring');
    check('level-3 item has path /programs/youth/mentoring', m?.path === '/programs/youth/mentoring', m?.path);

    // Publish bottom-up: the first publish warns about the unpublished ancestors
    const panel = page.locator('form[aria-label="Edit Mentoring"]');
    await panel.getByRole('button', { name: 'Publish', exact: true }).click();
    await panel.locator('.alert-warning').waitFor();
    check('publishing under a draft parent shows the API warning', (await panel.locator('.alert-warning').innerText()).includes('not public until'));
    for (const t of ['Youth', 'Programs']) {
      await page.locator(`[data-node-button="${ids[t]}"]`).click();
      const p = page.locator(`form[aria-label="Edit ${t}"]`);
      await p.getByRole('button', { name: 'Publish', exact: true }).click();
      await p.locator('.alert-success, .alert-warning').waitFor();
    }
    check('all three levels are public', (await nodes(page)).filter(n => ['Programs', 'Youth', 'Mentoring'].includes(n.title)).every(n => n.visible));
    check('row badge reads Published', (await row(page, ids.Mentoring).innerText()).includes('Published'));

    // Inline validation in the panel (Programs' panel is still open from publishing it)
    const pp = page.locator('form[aria-label="Edit Programs"]');
    await pp.getByLabel('Slug').fill('about');
    check('panel: duplicate slug flagged, Save disabled', (await pp.locator('p.text-error').innerText()).includes('already uses this slug') && await pp.getByRole('button', { name: 'Save' }).isDisabled());
    await pp.getByLabel('Slug').fill('cms');
    check('panel: reserved slug flagged', (await pp.locator('p.text-error').innerText()).includes('is used by the application'));
    await pp.getByLabel('Slug').fill('our-programs');
    check('panel: published slug change warns about broken links', (await pp.innerText()).includes('links from other sites'));
    await pp.getByRole('button', { name: 'Discard changes' }).click();
    check('panel: discard restores the slug', (await pp.getByLabel('Slug').inputValue()) === 'programs');
    // The API agrees with the inline check (proxy + API)
    const dup = await api(page, 'PATCH', `nodes/${ids.Programs}`, { slug: 'about' });
    check('API rejects the duplicate too (409)', dup.status === 409, dup.status);
    await page.screenshot({ path: `${SHOTS}/s4-tree-built.png`, fullPage: true });
    await sleep(20000);
  }

  // ── Builder: every block type except images, then publish ───────────────────────────────
  if (PHASES.includes('builder')) {
    await go(page, `/cms/pages/${ids.Mentoring}`);
    const rev0 = (await api(page, 'GET', `pages/${ids.Mentoring}`)).body.rev;
    await sleep(2500);
    const rev1 = (await api(page, 'GET', `pages/${ids.Mentoring}`)).body.rev;
    check('opening the builder saves nothing', rev0 === rev1 && (await saveState(page)) === 'saved', `${rev0}→${rev1} ${await saveState(page)}`);
    check('empty page shows the empty state', (await page.innerText('.cms-canvas')).includes('This page is empty'));

    await page.getByRole('button', { name: 'Add block' }).click();
    check('block palette opens with a transition', await animating(page, '[role="menu"][aria-label="Block types"]'));
    await page.getByRole('menuitem', { name: /^Text/ }).click();
    await sleep(300);
    await page.keyboard.type('Mentors meet young people ');
    await page.keyboard.press(`${MOD}+b`);
    await page.keyboard.type('every week');
    await page.keyboard.press(`${MOD}+b`);
    await page.keyboard.type('. Read the ');
    await page.keyboard.press(`${MOD}+k`);
    await page.locator('input[list]').fill('/about');
    await page.locator('input[list]').press('Enter');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Heading 3' }).click();
    await page.keyboard.type('How it works');
    check('text toolbar shows active states', (await page.getByRole('button', { name: 'Heading 3' }).getAttribute('aria-pressed')) === 'true');

    await page.getByRole('button', { name: 'Add a block at the top' }).click();
    await page.getByRole('menuitem', { name: /^Hero/ }).click();
    await sleep(300);
    const hero = page.locator('[data-block-id]').first();
    await hero.getByLabel('Heading').fill('Mentoring');
    await hero.getByLabel('Subtitle').fill('One young person, one mentor, one hour a week.');
    await hero.getByText('Button', { exact: true }).click();
    await hero.getByLabel('Button label').fill('Get involved');

    await page.getByRole('button', { name: 'Add block' }).click();
    await page.getByRole('menuitem', { name: /^Buttons/ }).click();
    await sleep(300);
    const btns = page.locator('[data-block-id]').last();
    await btns.getByLabel('Label').first().fill('Volunteer');
    await btns.getByRole('button', { name: 'URL', exact: true }).first().click();
    await btns.locator('input[inputmode="url"]').first().fill('https://example.org/volunteer');
    await btns.getByRole('button', { name: 'Add a button' }).click();
    await btns.getByLabel('Label').nth(1).fill('');
    check('an empty button label is flagged before saving', (await btns.innerText()).includes('Button 2 needs a label'));
    await btns.getByRole('button', { name: 'Remove button 2' }).click();

    await page.getByRole('button', { name: 'Add block' }).click();
    await page.getByRole('menuitem', { name: /^Divider/ }).click();
    await sleep(300);
    await page.locator('[data-block-id]').last().getByRole('button', { name: 'Space' }).click();

    await page.getByRole('button', { name: 'Add block' }).click();
    await page.getByRole('menuitem', { name: /^Component/ }).click();
    await page.waitForTimeout(1200);
    check('component block previews the sitemap with live data', (await page.locator('[data-block-id]').last().innerText()).includes('Mentoring'));

    check('block order after inserting', JSON.stringify(await cardOrder(page)) === JSON.stringify(['Hero', 'Text', 'Buttons', 'Divider', 'Component']), JSON.stringify(await cardOrder(page)));
    // Toolbar move, drag and drop, duplicate, delete + undo
    await page.locator('[data-block-id]').nth(3).hover();
    await page.locator('[data-block-id]').nth(3).getByRole('button', { name: 'Move up' }).click();
    check('Move up reorders', JSON.stringify(await cardOrder(page)) === JSON.stringify(['Hero', 'Text', 'Divider', 'Buttons', 'Component']));
    await sleep(400); // let the reorder animation (flip, 200 ms) settle before dragging
    const buttonsCard = page.locator('[data-block-id]').nth(3);
    const textCard = page.locator('[data-block-id]').nth(1);
    // Centre the target first: a drop point under the sticky top bar makes Playwright scroll between
    // mouse-down and the drag starting, and Chromium then drags whatever is under the pointer
    await textCard.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    // …and wait until it stops moving (the app's scroll container may scroll smoothly)
    let last = '';
    await until(async () => { const b = JSON.stringify(await textCard.boundingBox()); const still = b === last; last = b; return still; });
    // Explicit mouse moves rather than dragTo: no auto-scrolling mid-gesture, and several dragover
    // events like a real drag
    await buttonsCard.hover();
    const grip = await buttonsCard.locator('[draggable="true"]').boundingBox();
    const tb = await textCard.boundingBox();
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(tb.x + 40, tb.y + tb.height * 0.25, { steps: 12 });
    await sleep(100);
    await page.mouse.up();
    await sleep(400);
    check('drag and drop reorders blocks', JSON.stringify(await cardOrder(page)) === JSON.stringify(['Hero', 'Buttons', 'Text', 'Divider', 'Component']), JSON.stringify(await cardOrder(page)));
    const div = page.locator('[data-block-id]').nth(3);
    await div.hover();
    await div.getByRole('button', { name: 'Duplicate' }).click();
    check('Duplicate adds a copy', await until(async () => (await cardOrder(page)).length === 6));
    await sleep(300);
    await page.locator('[data-block-id]').nth(4).hover();
    await page.locator('[data-block-id]').nth(4).getByRole('button', { name: 'Delete block' }).click();
    check('Delete removes it', await until(async () => (await cardOrder(page)).length === 5));
    await sleep(300);
    await page.getByRole('button', { name: 'Undo' }).click();
    check('Undo restores it', await until(async () => (await cardOrder(page)).length === 6));
    await sleep(300);
    await page.locator('[data-block-id]').nth(4).hover();
    await page.locator('[data-block-id]').nth(4).getByRole('button', { name: 'Delete block' }).click();
    await until(async () => (await cardOrder(page)).length === 5);
    await sleep(300);

    check('autosave reaches "saved"', await waitState(page, 'saved'));
    const draft = (await api(page, 'GET', `pages/${ids.Mentoring}`)).body.draft;
    const types = draft.blocks.map(b => b.type);
    check('saved draft has every block type in order', JSON.stringify(types) === JSON.stringify(['hero', 'buttons', 'richText', 'divider', 'component']), JSON.stringify(types));
    const json = JSON.stringify(draft);
    check('saved text has bold, a link, and an h3', json.includes('"bold"') && json.includes('"href":"/about"') && json.includes('"level":3'));
    await page.screenshot({ path: `${SHOTS}/s4-builder.png`, fullPage: true });

    await page.getByRole('button', { name: 'Publish changes' }).or(page.getByRole('button', { name: 'Publish', exact: true })).click();
    await page.locator('.alert-success').waitFor();
    check('publish from the builder', (await page.locator('.alert-success').innerText()).includes('Published'));

    const anon = await browser.newContext();
    const ap = await anon.newPage();
    await ap.goto(`${BASE}/programs/youth/mentoring`); await ap.waitForLoadState('networkidle');
    const html = (await ap.content()).replace(/<!--.*?-->/g, ''); // Svelte's hydration markers
    check('public page: hero heading is the h1', (await ap.locator('h1').innerText()).trim() === 'Mentoring');
    check('public page: bold text and the link', html.includes('<strong>every week</strong>') && (await ap.locator('.cms-prose a[href="/about"]').count()) === 1);
    check('public page: h3 from the editor', (await ap.locator('.cms-prose h3').innerText()).includes('How it works'));
    const vol = ap.locator('a', { hasText: 'Volunteer' });
    check('public page: external button opens a new tab', (await vol.getAttribute('href')) === 'https://example.org/volunteer' && (await vol.getAttribute('target')) === '_blank');
    check('public page: hero button links to a page', (await ap.locator('.cms-hero a', { hasText: 'Get involved' }).count()) === 1);
    check('public page: sitemap block lists the new branch', (await ap.locator('.cms-block--component').innerText()).includes('Youth'));
    check('public page: breadcrumbs Programs › Youth › Mentoring', (await ap.locator('nav[aria-label="Breadcrumb"] li').allInnerTexts()).map(s => s.trim()).join('>') === 'Programs>Youth>Mentoring');
    check('public menu shows Programs', (await ap.locator('nav[aria-label="Main"]').first().innerText()).includes('Programs'));
    await ap.screenshot({ path: `${SHOTS}/s4-public.png`, fullPage: true });
    await anon.close();
    await sleep(20000);
  }

  // ── Preview shows the draft ────────────────────────────────────────────────────────────
  if (PHASES.includes('preview')) {
    await go(page, `/cms/pages/${ids.Mentoring}`);
    await typeAtEnd(page, ' DRAFTONLY');
    check('typing marks the page unsaved', ['pending', 'saving'].includes(await saveState(page)));
    check('draft saves', await waitState(page, 'saved'));
    check('Publish changes is offered', await page.getByRole('button', { name: 'Publish changes' }).isEnabled());
    const pv = await ctx.newPage();
    await pv.goto(`${BASE}/cms/preview/${ids.Mentoring}`); await pv.waitForLoadState('networkidle');
    check('preview shows the draft text', (await pv.content()).includes('DRAFTONLY'));
    check('preview has the ribbon and no app shell', (await pv.locator('[role="status"]', { hasText: 'Draft preview' }).count()) === 1 && (await pv.locator('.h-screen.flex.overflow-hidden').count()) === 0);
    await pv.screenshot({ path: `${SHOTS}/s4-preview.png` });
    await pv.close();
    const anon = await browser.newContext();
    const ap = await anon.newPage();
    await ap.goto(`${BASE}/programs/youth/mentoring`); await ap.waitForLoadState('networkidle');
    check('public page does not show the draft', !(await ap.content()).includes('DRAFTONLY'));
    const pr = await ap.goto(`${BASE}/cms/preview/${ids.Mentoring}`);
    check('anonymous preview goes to login', ap.url().includes('/login'), ap.url());
    await anon.close();
    // Preview button saves first: type, then click Preview immediately
    await typeAtEnd(page, ' PREVIEWSAVE');
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Preview' }).click()]);
    await popup.waitForURL('**/cms/preview/**'); await popup.waitForLoadState('networkidle');
    check('Preview saves pending changes before opening', (await popup.content()).includes('PREVIEWSAVE'));
    await popup.close();
    await sleep(15000);
  }

  // ── A stale tab gets the 409 prompt ────────────────────────────────────────────────────
  if (PHASES.includes('conflict')) {
    await go(page, `/cms/pages/${ids.Mentoring}`);
    const b = await ctx.newPage();
    b.on('pageerror', e => errors.push(`tab B: ${e.message}`));
    await go(b, `/cms/pages/${ids.Mentoring}`);
    await typeAtEnd(b, ' FROMB');
    check('tab B saves', await waitState(b, 'saved'));
    await typeAtEnd(page, ' FROMA');
    check('stale tab A gets the conflict state', await waitState(page, 'conflict'));
    const dlg = page.locator('[role="dialog"][aria-label="This page was changed elsewhere"]');
    check('conflict prompt is shown', await dlg.isVisible());
    await sleep(400); // let the fade-in finish
    await page.screenshot({ path: `${SHOTS}/s4-conflict.png` });
    await dlg.getByRole('button', { name: 'Load the newer version' }).click();
    await sleep(500);
    const t = await editorText(page);
    check('loading the newer version shows B\'s text, not A\'s', t.includes('FROMB') && !t.includes('FROMA') && (await saveState(page)) === 'saved', t.slice(-60));
    // Now B is stale; "Replace with my version" keeps B's edit
    await typeAtEnd(page, ' A2');
    await waitState(page, 'saved');
    await typeAtEnd(b, ' B2');
    check('tab B now gets the conflict', await waitState(b, 'conflict'));
    await b.locator('[role="dialog"]').getByRole('button', { name: 'Replace with my version' }).click();
    check('replace saves B\'s version', await waitState(b, 'saved'));
    const d = JSON.stringify((await api(page, 'GET', `pages/${ids.Mentoring}`)).body.draft);
    check('stored draft is B\'s', d.includes('B2') && !d.includes(' A2'));
    await b.close();
    await sleep(15000);
  }

  // ── Leaving waits for the save ─────────────────────────────────────────────────────────
  if (PHASES.includes('guard')) {
    await go(page, `/cms/pages/${ids.Mentoring}`);
    await typeAtEnd(page, ' NAVTEST');
    await page.locator('nav[aria-label="Content sections"] a', { hasText: 'Site' }).click();
    await page.waitForURL(`${BASE}/cms`);
    const d = JSON.stringify((await api(page, 'GET', `pages/${ids.Mentoring}`)).body.draft);
    check('navigating away saves first, then leaves', d.includes('NAVTEST'));
    await sleep(10000);
  }

  // ── Tree moves persist: drag and drop, keyboard ────────────────────────────────────────
  if (PHASES.includes('moves')) {
    await go(page, '/cms');
    const grip = id => row(page, id).locator('[draggable="true"]');
    await grip(ids.Mentoring).dragTo(row(page, ids.Programs), { targetPosition: { x: 300, y: 18 } });
    await sleep(800);
    let n = await nodeBy(page, 'Mentoring');
    check('drag onto the middle of a row moves inside it', n.parentId === ids.Programs && n.path === '/programs/mentoring', n.path);
    const box = await row(page, ids.Youth).boundingBox();
    await grip(ids.Mentoring).dragTo(row(page, ids.Youth), { targetPosition: { x: 300, y: 2 } });
    await sleep(800);
    let kids = (await nodes(page)).filter(n => n.parentId === ids.Programs).sort((a, b) => a.order - b.order).map(n => n.title);
    check('drag onto the top edge moves before it', JSON.stringify(kids) === '["Mentoring","Youth"]', JSON.stringify(kids) + ' h=' + box?.height);
    await go(page, '/cms');
    kids = await page.locator(`li:has(> div > [data-node-button="${ids.Programs}"]) ul [data-node-button]`).allInnerTexts();
    check('drag moves persist after reload', kids[0].includes('Mentoring'), kids.join('|'));

    const btn = page.locator(`[data-node-button="${ids.Mentoring}"]`);
    await btn.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await sleep(700);
    kids = (await nodes(page)).filter(n => n.parentId === ids.Programs).sort((a, b) => a.order - b.order).map(n => n.title);
    check('Alt+Down moves after the next sibling', JSON.stringify(kids) === '["Youth","Mentoring"]', JSON.stringify(kids));
    check('focus stays on the moved row', await page.evaluate(id => document.activeElement?.getAttribute('data-node-button') === id, ids.Mentoring));
    await page.keyboard.press('Alt+ArrowRight');
    await sleep(700);
    n = await nodeBy(page, 'Mentoring');
    check('Alt+Right indents under the previous sibling', n.parentId === ids.Youth && n.path === '/programs/youth/mentoring', n.path);
    await page.keyboard.press('Alt+ArrowLeft');
    await sleep(700);
    n = await nodeBy(page, 'Mentoring');
    check('Alt+Left outdents', n.parentId === ids.Programs, n.path);
    await page.keyboard.press('Alt+ArrowRight');
    await sleep(700);
    check('screen reader announcement after a move', (await page.locator('section p[aria-live="polite"]').innerText()).startsWith('Moved "Mentoring"'));
    await go(page, '/cms');
    n = await nodeBy(page, 'Mentoring');
    check('keyboard moves persist', n.path === '/programs/youth/mentoring', n.path);
    // Collapse / expand animates
    await page.getByRole('button', { name: 'Collapse Programs' }).click();
    check('collapse animates', await animating(page, `li:has(> div > [data-node-button="${ids.Programs}"]) > ul`));
    await sleep(300);
    await page.getByRole('button', { name: 'Expand Programs' }).click();
    await sleep(300);
    await sleep(10000);
  }

  // ── Settings: footer and home ──────────────────────────────────────────────────────────
  if (PHASES.includes('settings')) {
    await go(page, '/cms/settings');
    check('settings open clean (Save disabled)', await page.getByRole('button', { name: 'Save settings' }).isDisabled());
    const before = (await api(page, 'GET', 'settings')).body;
    await page.getByLabel('Text').fill('S4 footer text');
    await page.getByRole('button', { name: 'Add a link' }).click();
    const last = page.locator('form ul > li').last();
    await last.getByLabel('Label').fill('Mentoring');
    await last.locator('select').selectOption(ids.Mentoring);
    await page.getByRole('button', { name: 'Save settings' }).click();
    await page.getByRole('status').filter({ hasText: 'Saved' }).waitFor();
    const anon = await browser.newContext();
    const ap = await anon.newPage();
    await ap.goto(`${BASE}/about`); await ap.waitForLoadState('networkidle');
    const foot = await ap.locator('footer').innerText();
    check('footer text and page link appear on the site', foot.includes('S4 footer text') && (await ap.locator('footer a[href="/programs/youth/mentoring"]').count()) === 1);
    await anon.close();
    await api(page, 'PATCH', 'settings', { footer: before.footer });
    await sleep(10000);
  }

  // ── Roles: viewer, contributor, lead ───────────────────────────────────────────────────
  if (PHASES.includes('roles')) {
    for (const [who, expect] of [['s4viewer', 'viewer'], ['s4contrib', 'contributor'], ['s4lead', 'lead']]) {
      // Every SSR request shares the web container's rate-limit bucket: wait for it to drain first
      await sleep(30000);
      for (let i = 0; i < 20 && (await api(page, 'GET', 'nodes')).status === 429; i++) await sleep(10000);
      const s = await login(browser, `${who}@example.com`);
      await go(s.page, '/cms');
      const addItem = await s.page.locator('section[aria-labelledby="cms-tree-heading"]').getByRole('button', { name: 'Add item' }).count();
      const grips = await s.page.locator('[draggable="true"]').count();
      await s.page.locator(`[data-node-button="${ids.Mentoring}"]`).click();
      const panel = s.page.locator('form[aria-label="Edit Mentoring"]');
      const titleDisabled = await panel.getByLabel('Title').isDisabled();
      const publishBtn = await panel.getByRole('button', { name: /^(Publish|Unpublish)$/ }).count();
      const deleteBtn = await panel.getByRole('button', { name: 'Delete' }).count();
      await go(s.page, `/cms/pages/${ids.Mentoring}`);
      const state = await saveState(s.page);
      const inserters = await s.page.getByRole('button', { name: 'Add block' }).count();
      const pub = await s.page.getByRole('button', { name: /^Publish/ }).count();
      if (expect === 'viewer') {
        check('viewer: tree is read-only (no add, no drag, fields disabled, no publish/delete)', !addItem && !grips && titleDisabled && !publishBtn && !deleteBtn);
        check('viewer: builder is view-only', state === 'readonly' && !inserters && !pub);
      } else if (expect === 'contributor') {
        check('contributor: tree is read-only', !addItem && !grips && titleDisabled && !publishBtn);
        check('contributor: can edit the draft but not publish', state === 'saved' && inserters === 1 && !pub, `${state} ${inserters} ${pub}`);
      } else {
        check('lead: can add, move and publish, not delete', addItem === 1 && grips > 0 && !titleDisabled && publishBtn === 1 && !deleteBtn);
        check('lead: builder can publish', inserters === 1 && pub === 1);
      }
      await s.ctx.close();
    }
  }

  // ── Phone width ────────────────────────────────────────────────────────────────────────
  if (PHASES.includes('mobile')) {
    const mp = await ctx.newPage();
    await mp.setViewportSize({ width: 390, height: 844 });
    await go(mp, '/cms');
    check('tree fits a phone screen', await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await mp.locator(`[data-node-button="${ids.Youth}"]`).click();
    await sleep(300);
    await mp.screenshot({ path: `${SHOTS}/s4-tree-mobile.png`, fullPage: true });
    await go(mp, `/cms/pages/${ids.Mentoring}`);
    check('builder fits a phone screen', await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await mp.getByRole('button', { name: 'Page settings' }).click();
    check('page settings open with a transition on phones', await animating(mp, '#cms-page-settings-sm'));
    await sleep(300);
    await mp.screenshot({ path: `${SHOTS}/s4-builder-mobile.png`, fullPage: true });
    await mp.close();
  }

  // ── Cleanup: leave the seed as it was ──────────────────────────────────────────────────
  if (PHASES.includes('cleanup')) {
    await remember();
    for (const t of ['Mentoring', 'Youth', 'Programs']) if (ids[t]) await api(page, 'DELETE', `nodes/${ids[t]}`);
    check('cleanup removed the test branch', !(await nodes(page)).some(n => ['Programs', 'Youth', 'Mentoring'].includes(n.title)));
  }

  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
