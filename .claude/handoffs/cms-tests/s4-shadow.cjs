// Session 4: project-only reserved slugs in the admin (throwaway project only).
// Needs a temporary route frontend/src/routes/s4probe/+page.svelte in the project. Creates a
// top-level "s4probe" item directly through the API (which doesn't know that route), checks the
// tree's Shadowed badge and the inline check, then deletes the item.
// Usage: node s4-shadow.cjs [web] [api]
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const BASE = process.argv[2] || 'http://localhost:3002';
const API = process.argv[3] || 'http://localhost:4002';
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${!ok && d ? `  -- ${d}` : ''}`); };
(async () => {
  // Direct API session (the API alone accepts the slug)
  const login = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'admin-password' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const created = await fetch(`${API}/cms/nodes`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'page', title: 'Probe', slug: 's4probe' }) });
  const node = await created.json();
  check('API accepts a slug only the project uses', created.status === 201, created.status);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${BASE}/login`); await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', 'admin@example.com'); await page.fill('input[name="password"]', 'admin-password');
  await Promise.all([page.waitForURL('**/dashboard'), page.click('button[type="submit"]')]);
  await page.goto(`${BASE}/cms`); await page.waitForLoadState('networkidle');
  const rowText = await page.locator(`[data-node-button="${node.id}"]`).locator('..').innerText();
  check('tree marks it Shadowed', rowText.includes('Shadowed'), rowText);
  await page.locator('section[aria-labelledby="cms-tree-heading"] > div').getByRole('button', { name: 'Add item' }).click();
  const f = page.locator('form[aria-label="Add a top-level item"]');
  await f.getByLabel('Title').fill('S4probe');
  check('inline check knows the project route', (await f.locator('p.text-error').innerText()).includes('is used by the application'));
  await f.getByLabel('Title').press('Escape');
  await page.locator(`[data-node-button="${node.id}"]`).click();
  const p = page.locator('form[aria-label="Edit Probe"]');
  await p.getByLabel('Slug').fill('s4probe-two');
  await p.getByLabel('Slug').fill('s4probe');
  check('panel keeps flagging the shadowed slug', (await p.locator('p.text-error').innerText()).includes('is used by the application'));
  await browser.close();
  const del = await fetch(`${API}/cms/nodes/${node.id}`, { method: 'DELETE', headers: { cookie } });
  check('cleanup', del.ok, del.status);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
