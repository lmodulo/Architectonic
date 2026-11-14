// Session 5: a --modules cms project WITHOUT Vault (throwaway, ports 3003/4003 by default).
// Image actions must be hidden, with "Install the Vault module to add images" where it matters,
// and everything else must keep working.
// Usage: node s5-novault.cjs [web] [api]
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const WEB = process.argv[2] || 'http://localhost:3003';
const API = process.argv[3] || 'http://localhost:4003';
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${!ok && d ? `  -- ${d}` : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const login = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'admin-password' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const api = (m, p) => fetch(`${API}${p}`, { method: m, headers: { cookie } }).then(async r => ({ status: r.status, body: await r.json().catch(() => null) }));
  const media = await api('GET', '/cms/media');
  check('API: /cms/media says Vault is not available', media.status === 200 && media.body.available === false, JSON.stringify(media));
  const folders = await api('GET', '/cms/media/folders');
  check('API: /cms/media/folders says the same', folders.body?.available === false);
  const home = (await api('GET', '/cms/nodes')).body.find(n => n.isHome);
  const page = await api('GET', `/cms/pages/${home.id}`);
  check('API: page drafts load with an empty media map', page.status === 200 && JSON.stringify(page.body.media) === '{}');
  const resolve = await fetch(`${API}/cms/site/resolve?path=/`).then(r => r.json());
  check('API: public resolve works without Vault', !!resolve.node && JSON.stringify(resolve.media) === '{}');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(`${WEB}/login`); await p.waitForLoadState('networkidle');
  await p.fill('input[name="email"]', 'admin@example.com'); await p.fill('input[name="password"]', 'admin-password');
  await Promise.all([p.waitForURL('**/dashboard'), p.click('button[type="submit"]')]);
  await p.goto(`${WEB}/cms/pages/${home.id}`); await p.waitForLoadState('networkidle');

  await p.locator('.cms-editor').first().click();
  await sleep(300);
  check('text toolbar has no image button', (await p.getByRole('button', { name: 'Image', exact: true }).count()) === 0);
  await p.getByRole('button', { name: 'Add block' }).click();
  const gallery = p.getByRole('menuitem', { name: /^Gallery/ });
  check('palette: Gallery is unavailable and says why', (await gallery.getAttribute('aria-disabled')) === 'true' && (await gallery.innerText()).includes('Install the Vault module to add images'));
  await gallery.click({ force: true }); // Playwright won't click an aria-disabled item on its own
  await sleep(300);
  check('choosing it adds nothing', (await p.locator('[data-block-id]').count()) === 4, await p.locator('[data-block-id]').count());
  await p.keyboard.press('Escape');
  await p.locator('[data-block-id]').first().click();
  await sleep(300);
  const heroForm = await p.locator('[data-block-id]').first().innerText();
  check('hero editor: no image button, with the install hint', !heroForm.includes('Choose image') && heroForm.includes('Install the Vault module to add images'));
  check('page settings: share image shows the install hint', (await p.locator('aside[aria-label="Page settings"]').innerText()).includes('Install the Vault module to add images'));
  check('no media picker in the page', (await p.locator('[role="dialog"]').count()) === 0);
  check('nothing was saved by looking', (await p.locator('[data-save-state]').getAttribute('data-save-state')) === 'saved');

  await p.goto(`${WEB}/cms/settings`); await p.waitForLoadState('networkidle');
  check('settings have no Images section', (await p.getByText('Vault folder for uploads').count()) === 0);

  const anon = await browser.newContext();
  const ap = await anon.newPage();
  ap.on('pageerror', e => errors.push(e.message));
  const res = await ap.goto(`${WEB}/`); await ap.waitForLoadState('networkidle');
  check('public home renders', res.status() === 200 && (await ap.locator('.cms-hero').count()) === 1);
  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
