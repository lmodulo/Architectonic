// Checks for the post-cms fixes on a throwaway project: per-visitor rate limit, websocket cookie, calendar feed.
// node followup-checks.cjs <project-dir> <web> <api> <compose-project> [phases]
// phases: idle (wait 61 s first), direct, web, ws, calendar. Throwaway projects only: it exhausts rate limits and
// inserts (then removes) calendar events titled "PCF …". It reads INTERNAL_API_SECRET from <project-dir>/.env.
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');

const [DIR, WEB, API, PREFIX] = process.argv.slice(2, 6);
const PHASES = (process.argv[6] || 'direct,web,ws,calendar').split(',');
const SECRET = fs.readFileSync(`${DIR}/.env`, 'utf8').match(/^INTERNAL_API_SECRET=(.*)$/m)[1].trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, info = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== '' ? `  [${info}]` : ''}`); };
const drain = async (why) => { console.log(`  … waiting 61 s (${why})`); await sleep(61000); };

const get = (path, headers = {}) => fetch(`${API}${path}`, { headers }).then(r => r.status);
async function firstFailure(fn, n) {
  for (let i = 1; i <= n; i++) { const s = await fn(); if (s !== 200) return [i, s]; }
  return [null, 200];
}
const sec = (ip) => ({ 'x-internal-secret': SECRET, ...(ip === undefined ? {} : { 'x-client-ip': ip }) });
const mongo = (js) => execFileSync('docker', ['exec', `${PREFIX}-mongo-1`, 'mongosh', '--quiet', 'appdb', '--eval', js], { encoding: 'utf8' }).trim();

(async () => {
  if (PHASES[0] === 'idle') await drain('start from an idle rate-limit window');

  // ── Direct to the API ─────────────────────────────────────────────────────────────────
  if (PHASES.includes('direct')) {
    const [n1, s1] = await firstFailure(() => get('/auth/config', { 'x-client-ip': '198.51.100.1' }), 205);
    check('no secret: a spoofed visitor header is ignored; the 201st call from this address is refused', n1 === 201 && s1 === 429, `${n1} ${s1}`);
    check('…while that address is blocked, the secret + another visitor gets through', await get('/auth/config', sec('198.51.100.2')) === 200);
    const own = await Promise.all([1, 2, 3, 4, 5].map(() => get('/auth/config', sec())));
    check('…and the web server\'s own calls (secret, no visitor) are not limited', own.every(s => s === 200), own.join());
    check('…a wrong secret counts against the connection address', await get('/auth/config', { 'x-internal-secret': 'x'.repeat(64), 'x-client-ip': '198.51.100.2' }) === 429);
    check('…an unknown visitor counts against the connection address', await get('/auth/config', sec('unknown')) === 429);
    const [n2, s2] = await firstFailure(() => get('/auth/config', sec('198.51.100.3')), 205);
    check('a visitor gets their own 200 a minute', n2 === 201 && s2 === 429, `${n2} ${s2}`);
    check('…and another visitor is unaffected', await get('/auth/config', sec('198.51.100.4')) === 200);
    const login = (ip) => fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', ...sec(ip) }, body: JSON.stringify({ email: 'admin@example.com', password: 'wrong-password' }) }).then(r => r.status);
    const tries = []; for (let i = 0; i < 11; i++) tries.push(await login('198.51.100.5'));
    check('login attempts are limited per visitor (10 a minute)', tries.slice(0, 10).every(s => s === 401) && tries[10] === 429, tries.join());
    check('…another visitor can still try to log in', await login('198.51.100.6') === 401);
    await drain('direct phase used up the host address');
  }

  // ── Through the web server ───────────────────────────────────────────────────────────
  if (PHASES.includes('web')) {
    const proxied = () => fetch(`${WEB}/api/calendar-events/public`).then(r => r.status);
    const [n, s] = await firstFailure(proxied, 215);
    check('through the web proxy, this browser is limited as one visitor', n !== null && n >= 195 && n <= 201 && s === 429, `${n} ${s}`);
    const other = execFileSync('docker', ['exec', `${PREFIX}-api-1`, 'node', '-e',
      // Vite's dev server only answers known Host names, so send localhost (still from this container's address)
      "const h=require('http');const one=()=>new Promise(r=>h.get({host:'web',port:3000,path:'/api/calendar-events/public',headers:{host:'localhost:3000'}},x=>{x.resume();r(x.statusCode)}));Promise.all([one(),one(),one()]).then(s=>console.log(s.join()))"], { encoding: 'utf8' }).trim();
    check('…while a visitor from another address is served by the same web server', other === '200,200,200', other);
    await drain('web phase used up the browser address');
  }

  // ── Websocket and cookie ─────────────────────────────────────────────────────────────
  if (PHASES.includes('ws')) {
    const browser = await chromium.launch();
    const watch = (page) => {
      const log = { opened: 0, init: 0, closed: 0 };
      page.on('websocket', ws => {
        if (!ws.url().includes('/notifications/ws')) return;
        log.opened++;
        ws.on('framereceived', f => { if (String(f.payload).includes('"init"')) log.init++; });
        ws.on('close', () => log.closed++);
      });
      return log;
    };

    // About a quarter of session cookies contain nothing that needs encoding (no + or / in the signature),
    // which would hide the bug, so log in until the cookie does.
    let ctx, page, log, cookie, tries = 0;
    for (;;) {
      tries++;
      ctx = await browser.newContext();
      page = await ctx.newPage();
      log = watch(page);
      await page.goto(`${WEB}/login`); await page.waitForLoadState('networkidle');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'admin-password');
      await Promise.all([page.waitForURL('**/dashboard'), page.click('button[type="submit"]')]);
      cookie = (await ctx.cookies()).find(c => c.name === 'session');
      if (cookie?.value.includes('%') || tries === 6) break;
      await ctx.close();
    }
    console.log(`  session cookie with encoded characters after ${tries} login(s)`);
    await sleep(15000);
    check('new login: one websocket, accepted by the API (init received) and still open after 15 s',
      log.opened === 1 && log.init === 1 && log.closed === 0, JSON.stringify(log));
    check('the browser stores the session cookie encoded once (has %2B or %2F, no %25)', !!cookie && /%2[BF]/i.test(cookie.value) && !cookie.value.includes('%25'));
    await page.goto(`${WEB}/profile`);
    check('server-rendered pages still see the user', page.url().endsWith('/profile') && (await page.content()).includes('admin@example.com'));
    await ctx.close();

    // A session stored by the old code (encoded twice) still works server-side, and the socket gives up once
    const old = await browser.newContext();
    await old.addCookies([{ name: 'session', value: encodeURIComponent(cookie.value), url: WEB, httpOnly: true, sameSite: 'Lax' }]);
    const p2 = await old.newPage();
    const log2 = watch(p2);
    await p2.goto(`${WEB}/dashboard`);
    check('old double-encoded session: pages still work', p2.url().endsWith('/dashboard'));
    await sleep(15000);
    check('old double-encoded session: the socket is refused once and not retried', log2.opened === 1 && log2.init === 0 && log2.closed === 1, JSON.stringify(log2));
    await old.close();
    await browser.close();
  }

  // ── Calendar feed ────────────────────────────────────────────────────────────────────
  if (PHASES.includes('calendar')) {
    const DAY = 86400000;
    const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
    const iso = t => new Date(t).toISOString();
    const now = Date.now();
    const cases = [
      // title, start, end, extra, expected
      ['PCF ended three days ago', today - 3 * DAY, today - 3 * DAY, {}, false],
      ['PCF two days ago', today - 2 * DAY, today - 2 * DAY, {}, false],
      ['PCF yesterday', today - DAY, today - DAY, {}, now < today + 12 * 3600000],
      ['PCF today', today, today, {}, true],
      ['PCF under way', today - 3 * DAY, today + DAY, {}, true],
      ['PCF next week', today + 7 * DAY, today + 7 * DAY, {}, true],
      ['PCF after a year', today + 370 * DAY, today + 370 * DAY, {}, false],
      ['PCF private today', today, today, { visibility: 'private' }, false],
      ['PCF draft today', today, today, { status: 'draft' }, false],
    ];
    const docs = cases.map(([title, s, e, extra]) =>
      `{title:${JSON.stringify(title)},content:'<p>x</p>',eventType:'upcoming_event',startDate:new Date('${iso(s)}'),endDate:new Date('${iso(e)}'),singleDay:${s === e},allDay:false,location:'',tags:[],status:'active',visibility:'public',createdAt:new Date(),updatedAt:new Date(),...${JSON.stringify(extra)}}`);
    mongo(`db.calendar_events.deleteMany({title:/^PCF /}); db.calendar_events.insertMany([${docs.join(',')}]).insertedIds.length`);
    const listed = (await fetch(`${WEB}/api/calendar-events/public`).then(r => r.json())).map(e => e.title).filter(t => t.startsWith('PCF '));
    for (const [title, , , , want] of cases) check(`feed: ${title} ${want ? 'listed' : 'not listed'}`, listed.includes(title) === want);
    check('feed: soonest first (the event under way comes first)', listed[0] === 'PCF under way', listed.join(' | '));
    const ranged = (await fetch(`${WEB}/api/calendar-events/public?from=${encodeURIComponent(iso(today - DAY))}`).then(r => r.json())).map(e => e.title);
    check('an explicit ?from still means "starting after"', ranged.includes('PCF today') && !ranged.includes('PCF under way'));
    const site = await fetch(`${WEB}/events`).then(r => r.text());
    check('the Content events page lists today\'s and the under-way event', site.includes('PCF today') && site.includes('PCF under way') && !site.includes('PCF two days ago'));

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`${WEB}/login`); await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin-password');
    await page.click('button[type="submit"]');
    try { await page.waitForURL('**/dashboard', { timeout: 15000 }); }
    catch { await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/pcf-login-fail.png` }); console.log('  login stuck:', (await page.locator('body').innerText()).slice(0, 300).replace(/\s+/g, ' ')); }
    await page.goto(`${WEB}/calendar-events`);
    const text = await page.locator('body').innerText();
    check('the Calendar page lists them too', text.includes('PCF today') && text.includes('PCF under way') && !text.includes('PCF ended three days ago'));
    await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/pcf-calendar.png`, fullPage: true });
    await browser.close();
    console.log('  removed', mongo(`db.calendar_events.deleteMany({title:/^PCF /}).deletedCount`), 'test events');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });
