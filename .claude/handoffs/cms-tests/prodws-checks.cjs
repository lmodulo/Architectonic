// Production-compose checks for the notifications websocket pass-through (frontend/server.js).
// node prodws-checks.cjs <web> <api> <compose-project>
// Needs a throwaway project with calendar-events, started with the production compose only
// (`docker compose -p <name> -f docker-compose.yml up -d --build`). It subscribes admin to new Calendar
// events, creates one public event titled "PWS live …", exhausts the host's rate limit, and stops and restarts
// the web container.
const { chromium } = require('/Users/joenicora/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const [WEB, API, PREFIX] = process.argv.slice(2, 5);
const webPort = new URL(WEB).port;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, info = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== '' ? `  [${info}]` : ''}`); };

// A raw websocket handshake; resolves with the HTTP status (101 when upgraded)
const upgrade = (path = '/notifications/ws', headers = {}) => new Promise(res => {
  const req = http.request({ host: 'localhost', port: webPort, path, headers: {
    Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13',
    'Sec-WebSocket-Key': crypto.randomBytes(16).toString('base64'), ...headers } });
  req.on('upgrade', (r, s) => { s.destroy(); res(r.statusCode); });
  req.on('response', r => { r.resume(); res(r.statusCode); });
  req.on('error', e => res(`error ${e.message}`));
  req.end();
});
const fromOtherContainer = () => execFileSync('docker', ['exec', `${PREFIX}-api-1`, 'node', '-e', `
  const r = require('http').request({ host: 'web', port: 3000, path: '/notifications/ws', headers: {
    Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==' } });
  r.on('upgrade', (x, s) => { s.destroy(); console.log(x.statusCode); });
  r.on('response', x => { x.resume(); console.log(x.statusCode); });
  r.on('error', e => console.log('error ' + e.message));
  r.end();`], { encoding: 'utf8' }).trim();

function watch(page) {
  const log = { opened: 0, init: 0, closed: 0, notifications: [] };
  page.on('websocket', ws => {
    if (!ws.url().includes('/notifications/ws')) return;
    log.opened++;
    ws.on('framereceived', f => {
      const s = String(f.payload);
      if (s.includes('"init"')) log.init++;
      if (s.includes('"notification"')) log.notifications.push(JSON.parse(s).payload.title);
    });
    ws.on('close', () => log.closed++);
  });
  return log;
}
async function login(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const log = watch(page);
  await page.goto(`${WEB}/login`); await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin-password');
  await Promise.all([page.waitForURL('**/dashboard'), page.click('button[type="submit"]')]);
  return { ctx, page, log };
}

(async () => {
  const listening = execFileSync('docker', ['logs', `${PREFIX}-web-1`], { encoding: 'utf8' });
  check('the web container runs server.js (adapter-node still listens)', /Listening on/.test(listening));

  const browser = await chromium.launch();

  // Connect, receive init, stay open; then a live notification
  const { ctx, page, log } = await login(browser);
  await sleep(8000);
  check('production: one websocket, accepted (init received), still open after 8 s', log.opened === 1 && log.init === 1 && log.closed === 0, JSON.stringify({ ...log, notifications: undefined }));

  const loginRes = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'admin-password' }) });
  const cookie = loginRes.headers.get('set-cookie').match(/^session=[^;]+/)[0];
  const api = (method, path, body) => fetch(`${API}${path}`, { method, headers: { cookie, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  await api('PUT', '/calendar-events/subscriptions/me', { notifyOn: { newEvent: true } });
  const title = `PWS live ${Date.now()}`;
  const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const created = await api('POST', '/calendar-events', { title, content: '<p>x</p>', eventType: 'upcoming_event', startDate: day, endDate: day, singleDay: true, visibility: 'public', status: 'active' });
  let got = false;
  for (let i = 0; i < 20 && !got; i++) { await sleep(250); got = log.notifications.includes(`New event: ${title}`); }
  check('a notification arrives live through the pass-through', created.ok && got, `${created.status} ${JSON.stringify(log.notifications)}`);
  const badge = await page.locator('header').innerText().catch(() => '');
  check('…and the bell shows it without a reload', /\b1\b/.test(badge), badge.replace(/\s+/g, ' ').slice(0, 80));
  const id = (await created.json().catch(() => ({}))).id;
  if (id) await api('DELETE', `/calendar-events/${id}`);
  await api('DELETE', '/calendar-events/subscriptions/me');

  // A session stored by the old code (encoded twice): pages work, the socket is refused once and stops
  let sessionCookie = (await ctx.cookies()).find(c => c.name === 'session');
  let tries = 1;
  while (!sessionCookie.value.includes('%') && tries < 6) {
    const again = await login(browser); tries++;
    sessionCookie = (await again.ctx.cookies()).find(c => c.name === 'session');
    await again.ctx.close();
  }
  await ctx.close();
  const old = await browser.newContext();
  await old.addCookies([{ name: 'session', value: encodeURIComponent(sessionCookie.value), url: WEB, httpOnly: true, sameSite: 'Lax' }]);
  const p2 = await old.newPage();
  const log2 = watch(p2);
  await p2.goto(`${WEB}/dashboard`);
  await sleep(10000);
  check('production, pre-fix session: pages work; socket refused once, not retried', p2.url().endsWith('/dashboard') && log2.opened === 1 && log2.init === 0 && log2.closed === 1, JSON.stringify({ ...log2, notifications: undefined }));
  await old.close();

  // Handshake rules
  check('another site\'s Origin is refused (403)', await upgrade('/notifications/ws', { Origin: 'http://evil.example' }) === 403);
  check('the site\'s own Origin is passed through (101)', await upgrade('/notifications/ws', { Origin: `http://localhost:${webPort}` }) === 101);
  check('upgrades on other paths are refused (404)', await upgrade('/dashboard') === 404);

  // Rate limit: the handshake counts against the visitor, not the web server
  let n = 0, s = 200;
  while (s === 200 && n < 215) { n++; s = (await fetch(`${WEB}/api/calendar-events/public`)).status; }
  const mine = await upgrade();
  const theirs = fromOtherContainer();
  check('with this visitor\'s budget used up, its handshake is refused (429 passed on)', mine === 429, `${n} calls, then ${mine}`);
  check('…while another visitor\'s handshake still goes through', theirs === '101', theirs);

  // Shutdown isn't held up by an open socket
  console.log('  … waiting 61 s for the rate-limit window');
  await sleep(61000);
  const { ctx: c3, log: log3 } = await login(browser).catch(() => ({}));
  await sleep(3000);
  const t0 = Date.now();
  execFileSync('docker', ['stop', `${PREFIX}-web-1`]);
  const took = (Date.now() - t0) / 1000;
  check('docker stop with a socket open finishes promptly (not the 10 s kill)', took < 5, `${took.toFixed(1)} s, socket was ${log3 && log3.opened ? 'open' : 'not open (login rate-limited?)'}`);
  execFileSync('docker', ['start', `${PREFIX}-web-1`]);
  await c3?.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });
