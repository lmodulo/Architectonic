// Session 6 exit checks (throwaway project only): text links that follow page moves, the Events
// component, search and sharing tags, the documentation page, and the dashboard widget.
// Usage: node s6-checks.cjs [web] [api] [shots] [phases]
//   phases: links, events, seo, docs, widget (default: all)
// Works on a `--modules cms` project and on one with calendar-events and vault too: it detects
// which modules are installed and checks the matching behaviour. With Vault, run s5-seed.sh first
// (the share-image check uses one of its images). Needs the s5viewer user (see s5-media.cjs).
// Creates pages titled "S6 …" and removes them again; it first removes leftovers from a broken run.
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const WEB = process.argv[2] || 'http://localhost:3002';
const API = process.argv[3] || 'http://localhost:4002';
const SHOTS = process.argv[4] || require('os').tmpdir();
const PHASES = (process.argv[5] || 'links,events,seo,docs,widget').split(',');
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${!ok && d ? `  -- ${d}` : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
async function until(fn, ms = 4000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return true; await sleep(150); }
  return !!(await fn());
}

let cookie = '';
const api = async (m, p, body) => {
  for (let i = 0; ; i++) {
    const r = await fetch(`${API}${p}`, { method: m, headers: { cookie, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429 && i < 12) { console.log('rate limited, waiting…'); await sleep(10000); continue; }
    return { status: r.status, body: await r.json().catch(() => null) };
  }
};
const html = async (path, c = '') => {
  for (let i = 0; ; i++) {
    const r = await fetch(`${WEB}${path}`, { headers: c ? { cookie: c } : {}, redirect: 'manual' });
    if (r.status === 503 && i < 12) { console.log('site busy (rate limit), waiting…'); await sleep(10000); continue; }
    return { status: r.status, text: (await r.text()).replace(/<!--.*?-->/g, '') };
  }
};
const nodes = async () => (await api('GET', '/cms/nodes')).body;
const nodeBy = async title => (await nodes()).find(n => n.title === title);
async function makePage(title, extra = {}) {
  const r = await api('POST', '/cms/nodes', { type: 'page', title, showInMenu: false, ...extra });
  if (r.status !== 201 && r.status !== 200) throw new Error(`create ${title}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id;
}
async function saveDraft(id, blocks, seo = {}) {
  const { rev } = (await api('GET', `/cms/pages/${id}`)).body;
  return api('PUT', `/cms/pages/${id}/draft`, { blocks, seo, rev });
}
const publish = id => api('POST', `/cms/pages/${id}/publish`);
const text = (t, marks) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
const richText = (...paras) => ({ id: `rt-${Math.random().toString(36).slice(2, 10)}`, type: 'richText', data: { doc: { type: 'doc', content: paras.map(p => ({ type: 'paragraph', content: p })) } } });
const meta = (h, sel) => {
  const m = h.match(new RegExp(`<meta ${sel} content="([^"]*)"`));
  return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null;
};
const linkOf = h => { const m = h.match(/<link rel="canonical" href="([^"]*)"/); return m ? m[1] : null; };
const go = async (page, path) => { await page.goto(`${WEB}${path}`); await page.waitForLoadState('networkidle'); };
// The dev API allows 200 requests a minute from the web container, and every page it renders spends
// several (a dashboard with many module widgets spends dozens): let the window pass between phases
let phasesRun = 0;
const phase = async name => {
  if (!PHASES.includes(name)) return false;
  if (phasesRun++) { console.log(`(waiting 60 s before ${name} for the rate limit)`); await sleep(60000); }
  return true;
};

async function login(browser, email, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${email}: ${e.message}`));
  await go(page, '/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'admin-password');
  await Promise.all([page.waitForURL('**/dashboard'), page.click('button[type="submit"]')]);
  return { ctx, page };
}

(async () => {
  const login0 = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'admin-password' }) });
  cookie = login0.headers.get('set-cookie').split(';')[0];
  for (let i = 0; i < 20 && (await api('GET', '/cms/nodes')).status === 429; i++) await sleep(10000);
  const hasCalendar = (await fetch(`${WEB}/api/calendar-events/public`)).ok;
  const media = await api('GET', '/cms/media');
  const hasVault = media.body?.available === true;
  console.log(`modules: calendar-events ${hasCalendar ? 'yes' : 'no'}, vault ${hasVault ? 'yes' : 'no'}`);

  // Leftovers from a broken run (S6 Target may sit under About)
  for (const t of ['S6 Linker', 'S6 Target', 'S6 Old link', 'S6 Events block', 'S6 SEO', 'S6 Plain']) {
    const n = await nodeBy(t);
    if (n) await api('DELETE', `/cms/nodes/${n.id}`);
  }
  const about = await nodeBy('About');
  const browser = await chromium.launch();
  const { page } = await login(browser, 'admin@example.com');

  // ── Links inside text follow the page they point at ─────────────────────────────────────
  if (await phase('links')) {
    const target = await makePage('S6 Target', { slug: 's6-target' });
    await publish(target);
    const linker = await makePage('S6 Linker', { slug: 's6-linker' });
    await go(page, `/cms/pages/${linker}`);
    await page.getByRole('button', { name: 'Add block' }).click();
    await page.getByRole('menuitem', { name: /^Text/ }).click();
    await sleep(300);
    await page.keyboard.type('Go to ');
    await page.keyboard.press(`${MOD}+k`);
    await page.locator('input[list]').fill('/s6-target');
    const hint = page.getByText('Links to the page “S6 Target”');
    check('link form: a site path names its page', await until(() => hint.isVisible()));
    await page.locator('input[list]').press('Enter');
    await page.keyboard.type(' now.');
    check('a new link to a page is inserted with the page title', (await page.locator('.cms-editor a').first().innerText()) === 'S6 Target');
    check('autosave reaches "saved"', await until(async () => (await page.locator('[data-save-state]').getAttribute('data-save-state')) === 'saved', 10000));
    const draft = (await api('GET', `/cms/pages/${linker}`)).body.draft;
    const mark = draft.blocks[0]?.data.doc.content[0].content.find(t => t.marks)?.marks[0];
    check('the stored link has the page id and its path', mark?.attrs?.nodeId === target && mark?.attrs?.href === '/s6-target', JSON.stringify(mark));
    await publish(linker);
    let h = (await html('/s6-linker')).text;
    check('public: the link points at the page', h.includes('<a href="/s6-target">S6 Target</a>'));

    const moved = await api('POST', `/cms/nodes/${target}/move`, { parentId: about.id, index: 0 });
    check('move the target under About', moved.status === 200, JSON.stringify(moved));
    h = (await html('/s6-linker')).text;
    check('public: after the move the link follows, without republishing', h.includes('<a href="/about/s6-target">S6 Target</a>'));
    check('the old path is gone', (await html('/s6-target')).status === 404);

    await go(page, `/cms/pages/${linker}`);
    await page.locator('.cms-editor a').first().click();
    await sleep(500);
    check('clicking a link in the editor doesn\'t follow it', page.url().endsWith(`/cms/pages/${linker}`), page.url());
    await page.keyboard.press(`${MOD}+k`);
    check('editor: the link form shows the page\'s new path', await until(async () => (await page.locator('input[list]').inputValue()) === '/about/s6-target'), await page.locator('input[list]').inputValue().catch(() => ''));
    await page.keyboard.press('Escape');

    await api('POST', `/cms/pages/${target}/unpublish`);
    h = (await html('/s6-linker')).text;
    check('public: a link to an unpublished page shows as plain text', h.includes('Go to S6 Target now.') && !h.includes('href="/about/s6-target"'));
    const warn = await publish(linker);
    check('publishing warns about the link', (warn.body?.warnings ?? []).some(w => w.includes("isn't published")), JSON.stringify(warn.body));
    await publish(target);

    // An older link stored as a plain path picks up the page id at the next save
    const old = await makePage('S6 Old link', { slug: 's6-old-link' });
    await saveDraft(old, [richText([text('Read '), text('about us', [{ type: 'link', attrs: { href: '/about', target: null } }]), text('.')])]);
    await go(page, `/cms/pages/${old}`);
    check('opening a page with an old link saves nothing', (await page.locator('[data-save-state]').getAttribute('data-save-state')) === 'saved');
    const ed = page.locator('.cms-editor').first();
    await ed.click();
    await page.keyboard.press(MOD === 'Meta' ? 'Meta+ArrowDown' : 'Control+End');
    await page.keyboard.type(' Thanks');
    await until(async () => (await page.locator('[data-save-state]').getAttribute('data-save-state')) === 'saved', 10000);
    const oldMark = (await api('GET', `/cms/pages/${old}`)).body.draft.blocks[0].data.doc.content[0].content[1].marks?.[0];
    check('an old path link gains the page id on the next save', oldMark?.attrs?.nodeId === about.id, JSON.stringify(oldMark));

    // The target is deleted: the editor warns, and the site shows plain text
    await api('DELETE', `/cms/nodes/${target}`);
    await go(page, `/cms/pages/${linker}`);
    check('editor: a link to a deleted page is flagged', (await page.locator('[data-block-id]').first().innerText()).includes('points to a page that no longer exists'));
    h = (await html('/s6-linker')).text;
    check('public: the deleted page\'s link is plain text', h.includes('Go to S6 Target now.') && !h.includes('<a href="/about/s6-target"'));
    await page.screenshot({ path: `${SHOTS}/s6-lost-link.png`, fullPage: true });
    await api('DELETE', `/cms/nodes/${linker}`);
    await api('DELETE', `/cms/nodes/${old}`);
  }

  // ── Events ─────────────────────────────────────────────────────────────────────────────
  if (await phase('events')) {
    const r = await html('/events');
    const titles = [...r.text.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map(m => m[1]);
    if (hasCalendar) {
      check('events page lists the public active upcoming events, soonest first',
        JSON.stringify(titles) === JSON.stringify(['Quarterly All-Hands', 'Office closed — public holiday', 'Warehouse inventory count']), JSON.stringify(titles));
      const dates = [...r.text.matchAll(/<time datetime="([^"]*)">([^<]*)<\/time>/g)].map(m => [m[1], m[2]]);
      check('dates are in order', dates.map(d => d[0]).join() === [...dates.map(d => d[0])].sort().join() && dates.length === 3);
      check('a several-day event shows its range', /^[A-Z][a-z]+ \d{1,2} – ([A-Z][a-z]+ )?\d{1,2}, \d{4}$/.test(dates[2]?.[1] ?? ''), dates[2]?.[1]);
      const months = [...r.text.matchAll(/<h2 id="ev-[^"]*"[^>]*>([^<]*)<\/h2>/g)].map(m => m[1]);
      const want = [...new Set(dates.map(([d]) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })))];
      check('page mode groups by month', JSON.stringify(months) === JSON.stringify(want), `${JSON.stringify(months)} vs ${JSON.stringify(want)}`);
      check('descriptions are plain text (entities decoded, no tags)', r.text.includes('open Q&amp;A with leadership') && !r.text.includes('&lt;p'));
      check('non-event types are labelled', r.text.includes('>Announcement<'));
      check('event details: location', r.text.includes('Main Hall + Zoom'));

      // Blocks: limit and type filter
      const eb = await makePage('S6 Events block', { slug: 's6-events-block' });
      await saveDraft(eb, [
        { id: 'ev-limit', type: 'component', data: { key: 'events', props: { limit: 1 } } },
        { id: 'ev-type', type: 'component', data: { key: 'events', props: { eventType: 'announcement' } } },
      ]);
      await publish(eb);
      const b = (await html('/s6-events-block')).text;
      const blocks = b.split('cms-block--component').slice(1).map(s => [...s.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map(m => m[1]));
      check('block: limit 1 shows the next event only', JSON.stringify(blocks[0]) === JSON.stringify(['Quarterly All-Hands']), JSON.stringify(blocks[0]));
      check('block: the type filter shows announcements only', JSON.stringify(blocks[1]) === JSON.stringify(['Office closed — public holiday']), JSON.stringify(blocks[1]));
      check('block mode has no month headings', !/<h2 id="ev-/.test(b));

      // Client-side navigation in a far-off time zone renders the same dates as the server
      const far = await browser.newContext({ timezoneId: 'Pacific/Kiritimati', viewport: { width: 1400, height: 900 } });
      const fp = await far.newPage();
      fp.on('pageerror', e => errors.push(`tz: ${e.message}`));
      await fp.goto(`${WEB}/about`); await fp.waitForLoadState('networkidle');
      await fp.locator('nav[aria-label="Main"]').first().getByRole('link', { name: 'Events', exact: true }).click();
      await fp.waitForURL('**/events'); await fp.waitForLoadState('networkidle');
      const clientDates = await fp.locator('.cms-events time').allInnerTexts();
      check('UTC+14 browser after client navigation shows the same dates as the server', JSON.stringify(clientDates) === JSON.stringify(dates.map(d => d[1])), `${JSON.stringify(clientDates)} vs ${JSON.stringify(dates.map(d => d[1]))}`);
      await fp.screenshot({ path: `${SHOTS}/s6-events.png`, fullPage: true });
      await far.close();

      // Admin: the block's preview loads in the browser, and there is no missing-module warning
      await go(page, `/cms/pages/${eb}`);
      await page.locator('[data-block-id]').first().click();
      check('admin: the events block previews its events', await until(async () => (await page.locator('[data-block-id]').first().innerText()).includes('Quarterly All-Hands'), 6000));
      check('admin: the block has the limit and type settings', (await page.getByLabel('How many to show').count()) === 1 && (await page.getByLabel('Show', { exact: true }).count()) === 1);
      check('admin: no missing-module warning', !(await page.locator('[data-block-id]').first().innerText()).includes('needs the Calendar module'));
      await page.screenshot({ path: `${SHOTS}/s6-events-admin.png`, fullPage: true });
      await api('DELETE', `/cms/nodes/${eb}`);
    } else {
      check('without the Calendar module the events page says unavailable', r.status === 200 && r.text.includes('Events are unavailable right now.') && titles.length === 0);
      check('the calendar proxy is a plain 404 (not a site page)', (await fetch(`${WEB}/api/calendar-events/public`)).status === 404);
      const ev = await nodeBy('Events');
      await go(page, '/cms');
      await page.locator(`[data-node-button="${ev.id}"]`).click();
      const panel = page.getByText('needs the Calendar module');
      check('admin: the Events item warns that the Calendar module is missing', await until(() => panel.isVisible()));
    }
  }

  // ── Search and sharing tags ────────────────────────────────────────────────────────────
  if (await phase('seo')) {
    const home = (await html('/')).text;
    check('home: canonical is the site root', linkOf(home) === `${WEB}/`, linkOf(home));
    check('home: description from the page', !!meta(home, 'name="description"'));
    check('home: og:url and og:title', meta(home, 'property="og:url"') === `${WEB}/` && !!meta(home, 'property="og:title"'));
    check('home: not hidden from search engines', !home.includes('name="robots"'));

    const share = hasVault ? media.body.items[0] : null;
    const seoId = await makePage('S6 SEO', { slug: 's6-seo' });
    await saveDraft(seoId, [richText([text('Body text that is not the description.')])], {
      title: 'S6 search title', description: 'S6 description & "quotes"', noindex: true,
      ...(share ? { image: { vaultId: share.id, src: share.url, alt: 'S6 share image', w: 800, h: 600 } } : {}),
    });
    await publish(seoId);
    const s = (await html('/s6-seo')).text;
    check('title uses the search title', /<title>S6 search title( · [^<]+)?<\/title>/.test(s), (s.match(/<title>[^<]*<\/title>/) ?? [])[0]);
    check('meta description is the SEO description (escaped)', meta(s, 'name="description"') === 'S6 description & "quotes"', meta(s, 'name="description"'));
    check('noindex page has robots noindex', meta(s, 'name="robots"') === 'noindex');
    check('canonical is the page URL', linkOf(s) === `${WEB}/s6-seo`, linkOf(s));
    if (share) {
      check('og:image is the share image\'s current file, absolute', meta(s, 'property="og:image"') === `${WEB}${share.url}`, meta(s, 'property="og:image"'));
      check('og:image alt and size', meta(s, 'property="og:image:alt"') === 'S6 share image' && meta(s, 'property="og:image:width"') === '800' && meta(s, 'property="og:image:height"') === '600');
      check('twitter card is large with an image', meta(s, 'name="twitter:card"') === 'summary_large_image');
    } else {
      check('without Vault there is no og:image and a small card', !s.includes('og:image') && meta(s, 'name="twitter:card"') === 'summary');
    }

    const plainId = await makePage('S6 Plain', { slug: 's6-plain' });
    const long = 'The first paragraph of this page is long enough to need cutting when it becomes the description, because search engines show about one hundred and sixty characters of it at most.';
    await saveDraft(plainId, [richText([text(long)], [text('Second paragraph.')])]);
    await publish(plainId);
    const pl = (await html('/s6-plain')).text;
    const d = meta(pl, 'name="description"') ?? '';
    check('without a description, the start of the text is used, cut at a word', d.length <= 160 && d.endsWith('…') && long.startsWith(d.slice(0, -1)), `${d.length}: ${d}`);

    // Draft preview: one robots tag (noindex, nofollow) and no canonical
    await go(page, `/cms/preview/${seoId}`);
    const robots = await page.locator('meta[name="robots"]').evaluateAll(els => els.map(e => e.getAttribute('content')));
    check('preview: one robots tag, noindex nofollow', JSON.stringify(robots) === JSON.stringify(['noindex, nofollow']), JSON.stringify(robots));
    check('preview: no canonical link', (await page.locator('link[rel="canonical"]').count()) === 0);

    // Client navigation updates the head
    const anon = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const ap = await anon.newPage();
    ap.on('pageerror', e => errors.push(`anon: ${e.message}`));
    await ap.goto(`${WEB}/`); await ap.waitForLoadState('networkidle');
    await ap.locator('nav[aria-label="Main"]').first().getByRole('link', { name: 'About', exact: true }).click();
    await ap.waitForURL('**/about');
    check('client navigation updates the canonical link', await until(async () => (await ap.locator('link[rel="canonical"]').getAttribute('href')) === `${WEB}/about`));
    check('client navigation leaves one description tag', (await ap.locator('meta[name="description"]').count()) <= 1);
    await anon.close();
    await api('DELETE', `/cms/nodes/${seoId}`);
    await api('DELETE', `/cms/nodes/${plainId}`);
  }

  // ── Documentation ──────────────────────────────────────────────────────────────────────
  if (await phase('docs')) {
    const doc = await html('/documentation/cms');
    check('docs page is public', doc.status === 200);
    const h2 = [...doc.text.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map(m => m[1]);
    check('docs page ends with the API reference', h2.at(-1) === 'API Reference', h2.at(-1));
    check('API table lists the media and site routes', ['/cms/media', '/cms/media/folders', '/cms/site/resolve?path=', '/cms/nodes/:id/move'].every(p => doc.text.includes(`>${p}<`)));
    const index = await html('/documentation');
    check('the documentation index lists Content', index.text.includes('href="/documentation/cms"'));
  }

  // ── Dashboard widget ───────────────────────────────────────────────────────────────────
  if (await phase('widget')) {
    const all = await nodes();
    const pages = all.filter(n => n.type === 'page' || n.type === 'component');
    const want = [pages.filter(n => n.visible).length, pages.filter(n => !n.visible).length].map(String);
    await go(page, '/dashboard');
    const card = page.locator('a[href="/cms"]').filter({ hasText: 'Live pages' });
    check('dashboard: Content widget is shown', await until(() => card.isVisible(), 6000));
    const nums = await until(async () => !(await card.innerText()).includes('·'), 6000) && await card.locator('p.text-2xl').allInnerTexts();
    check('dashboard: counts match the site tree', JSON.stringify(nums) === JSON.stringify(want), `${JSON.stringify(nums)} vs ${JSON.stringify(want)}`);
    await page.screenshot({ path: `${SHOTS}/s6-dashboard.png` });
    const v = await login(browser, 's5viewer@example.com');
    check('dashboard: a viewer sees it too', await until(() => v.page.locator('a[href="/cms"]').filter({ hasText: 'Live pages' }).isVisible(), 6000));
    await v.ctx.close();
  }

  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
