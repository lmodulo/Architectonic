// Session 3 menu behaviour in a real browser (throwaway project only).
// Usage: node s3-menu.cjs [base-url] [screenshot-dir]
// Expects the cms demo seed plus a published level-3 page /about/team/board (the test creates
// it beforehand through the API; see the Session 3 handoff).
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const BASE = process.argv[2] || 'http://localhost:3002';
const SHOTS = process.argv[3] || require('os').tmpdir();
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  -- ${detail}` : ''}`); };
const focused = (p) => p.evaluate(() => (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').trim());
// Svelte 5 runs transitions with the Web Animations API, so a running animation proves one is used
// Polls until no live (non-inert) element matches: closing elements stay in the DOM, inert, while they animate out
async function gone(p, sel, ms = 3000) {
  const end = Date.now() + ms;
  const none = () => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => !e.closest('[inert]')).length === 0, sel);
  while (Date.now() < end) { if (await none()) return true; await p.waitForTimeout(100); }
  return none();
}
const animating = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); return !!el && el.getAnimations().length > 0; }, sel);

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // ── Desktop ──────────────────────────────────────────────────────────────────────────
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}/`); await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SHOTS}/s3-home-desktop.png` });

  const tops = await page.locator('nav[aria-label="Main"] > ul > li').evaluateAll(lis => lis.map(li => li.textContent.trim()));
  check('desktop top level is Home, About, Events, Resources', JSON.stringify(tops) === JSON.stringify(['Home', 'About', 'Events', 'Resources']), JSON.stringify(tops));

  const aboutLi = page.locator('nav[aria-label="Main"] > ul > li', { hasText: 'About' });
  await aboutLi.hover();
  const dropSel = 'nav[aria-label="Main"] > ul > li[data-item] > div.absolute';
  check('hover opens the About dropdown with a transition', await animating(page, dropSel));
  await page.waitForTimeout(250);
  const dropItems = await page.locator(`${dropSel} > ul > li [data-menu-row]`).allTextContents();
  check('dropdown lists Team and History', dropItems.map(s => s.trim()).join(',') === 'Team,History', dropItems.join(','));

  // level 3 flyout on hover
  await page.locator(`${dropSel} li`, { hasText: 'Team' }).first().hover();
  await page.waitForTimeout(250);
  check('hovering Team opens a flyout with Board', await page.locator('a[href="/about/team/board"]').isVisible());
  await page.screenshot({ path: `${SHOTS}/s3-flyout.png` });
  await page.mouse.move(1200, 700);
  // 180 ms close delay plus the scale-out
  check('moving away closes the dropdown', await gone(page, dropSel));
  await page.waitForTimeout(300);

  // keyboard
  await page.locator('button[aria-label="About submenu"]').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  check('ArrowDown opens the dropdown and focuses Team', (await focused(page)) === 'Team', await focused(page));
  check('toggle reports aria-expanded=true', (await page.locator('button[aria-label="About submenu"]').getAttribute('aria-expanded')) === 'true');
  await page.keyboard.press('ArrowDown');
  check('ArrowDown moves to History', (await focused(page)) === 'History', await focused(page));
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  check('ArrowRight on Team opens its flyout and focuses Board', (await focused(page)) === 'Board', await focused(page));
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(250);
  check('ArrowLeft closes the flyout and refocuses its toggle', (await focused(page)) === 'Team submenu', await focused(page));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  check('Escape closes the dropdown and refocuses the About toggle', (await focused(page)) === 'About submenu' && await gone(page, dropSel), await focused(page));
  await page.keyboard.press('ArrowRight');
  check('ArrowRight moves along the top row', ['Events'].includes(await focused(page)), await focused(page));

  // label dropdown (click) with an external link
  await page.locator('nav[aria-label="Main"] button', { hasText: 'Resources' }).click();
  await page.waitForTimeout(250);
  const donate = page.locator(`${dropSel} a`, { hasText: 'Donate' });
  check('label opens on click; external link opens in a new tab', (await donate.getAttribute('target')) === '_blank' && (await donate.getAttribute('rel')) === 'noopener noreferrer');
  await page.mouse.click(5, 790);
  await page.waitForTimeout(250);
  check('clicking outside closes it', await gone(page, dropSel));

  // active trail + breadcrumbs on a level-3 page
  await page.goto(`${BASE}/about/team/board`); await page.waitForLoadState('networkidle');
  const aboutLink = page.locator('nav[aria-label="Main"] a[href="/about"]');
  check('active trail highlights About', (await aboutLink.getAttribute('class')).split(/\s+/).includes('bg-base-200'));
  const crumbs = await page.locator('nav[aria-label="Breadcrumb"] li').allTextContents();
  check('breadcrumbs About › Team › Board', crumbs.map(s => s.trim()).join('>') === 'About>Team>Board', crumbs.join('|'));
  await page.screenshot({ path: `${SHOTS}/s3-board-desktop.png` });

  // client-side navigation inside the site keeps the shell (no full reload)
  await page.evaluate(() => { window.__s3 = 1; });
  await page.locator('nav[aria-label="Breadcrumb"] a', { hasText: 'About' }).click();
  await page.waitForURL('**/about'); await page.waitForLoadState('networkidle');
  check('client-side navigation between site pages', await page.evaluate(() => window.__s3 === 1));

  // ── Mobile ───────────────────────────────────────────────────────────────────────────
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  m.on('pageerror', e => errors.push(e.message));
  await m.goto(`${BASE}/about/team`); await m.waitForLoadState('networkidle');
  check('desktop menu hidden on mobile', !(await m.locator('nav[aria-label="Main"] > ul').first().isVisible()));
  await m.locator('button[aria-label="Open menu"]').click();
  check('drawer opens with a transition', await animating(m, '#cms-mobile-menu') || await m.evaluate(() => document.querySelector('#cms-mobile-menu')?.parentElement?.getAnimations().length > 0));
  await m.waitForTimeout(350);
  check('drawer is a modal dialog with focus on Close', (await m.locator('#cms-mobile-menu[role="dialog"][aria-modal="true"]').count()) === 1 && (await focused(m)) === 'Close menu', await focused(m));
  check('active branch starts expanded (Team visible)', await m.locator('#cms-mobile-menu a[href="/about/team"]').isVisible());
  check('page behind is scroll-locked', (await m.evaluate(() => document.documentElement.style.overflow)) === 'hidden');
  await m.screenshot({ path: `${SHOTS}/s3-drawer.png` });
  await m.locator('#cms-mobile-menu button', { hasText: 'Resources' }).click();
  check('accordion opens with a transition', await m.evaluate(() => [...document.querySelectorAll('#cms-mobile-menu li > div:not(.flex)')].some(el => el.getAnimations().length > 0)));
  await m.waitForTimeout(300);
  check('Resources expands to show Sitemap', await m.locator('#cms-mobile-menu a[href="/resources/sitemap"]').isVisible());
  await m.keyboard.press('Escape');
  await m.waitForTimeout(350);
  check('Escape closes the drawer and refocuses the menu button', (await gone(m, '#cms-mobile-menu')) && (await focused(m)) === 'Open menu', await focused(m));
  check('scroll lock released', (await m.evaluate(() => document.documentElement.style.overflow)) === '');
  await m.locator('button[aria-label="Open menu"]').click();
  await m.waitForTimeout(350);
  await m.locator('#cms-mobile-menu button', { hasText: 'Resources' }).click();
  await m.waitForTimeout(300);
  await m.locator('#cms-mobile-menu a[href="/resources/sitemap"]').click();
  await m.waitForURL('**/resources/sitemap'); await m.waitForTimeout(400);
  check('following a drawer link navigates and closes the drawer', await gone(m, '#cms-mobile-menu'));
  await m.screenshot({ path: `${SHOTS}/s3-sitemap-mobile.png`, fullPage: true });

  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
