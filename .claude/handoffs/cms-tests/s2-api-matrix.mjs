// Session 2 exit matrix: runs against the cms API directly (throwaway project only).
const API = process.argv[2] || 'http://localhost:4002';
let pass = 0, fail = 0, requests = 0;
const results = [];

function check(name, cond, detail = '') {
  if (cond) pass++; else fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  -- ${detail}` : ''}`);
}

async function login(email, password) {
  requests++;
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const m = (r.headers.get('set-cookie') || '').match(/session=([^;]+)/);
  if (!r.ok || !m) throw new Error(`login ${email} failed ${r.status}`);
  return `session=${m[1]}`;
}

async function call(cookie, method, path, body) {
  requests++;
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(`${API}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, body: json };
}

const S = {};
S.admin = await login('admin@example.com', 'admin-password');
S.lead = await login('alex@example.com', 'alex-password');
S.contrib = await login('jordan@example.com', 'jordan-password');
S.viewer = await login('s2viewer@example.com', 'admin-password');
S.customer = await login('s2customer@example.com', 'admin-password');

const nodes = async () => (await call(S.admin, 'GET', '/cms/nodes')).body;
let all = await nodes();
const byTitle = t => all.find(n => n.title === t);
const id = t => byTitle(t).id;
const resolve = p => call(null, 'GET', `/cms/site/resolve?path=${encodeURIComponent(p)}`);

// ── A. Public resolve and menu on the seeded site ─────────────────────────────────────
{
  let r = await resolve('/');
  check('resolve / is the home page', r.status === 200 && r.body.node.title === 'Home' && r.body.page.blocks.length === 4, JSON.stringify(r.body).slice(0, 200));
  check('home links map nodeIds to paths', r.body.links?.[id('About')] === '/about' && r.body.links?.[id('Events')] === '/events', JSON.stringify(r.body.links));
  r = await resolve('/home');            check('home node path redirects to /', r.status === 200 && r.body.redirect === '/', JSON.stringify(r.body));
  r = await resolve('/about/team');      check('resolve /about/team', r.status === 200 && r.body.node.title === 'Team' && r.body.breadcrumbs.map(b => b.title).join('>') === 'About>Team');
  r = await resolve('/resources');       check('label redirects to first visible child', r.body.redirect === '/resources/sitemap', JSON.stringify(r.body));
  r = await resolve('/events/summer-fair'); check('component gets rest', r.status === 200 && r.body.rest === 'summer-fair' && r.body.page === null && r.body.node.component.key === 'events');
  r = await resolve('/about/nope');      check('page with extra segment is 404', r.status === 404);
  r = await resolve('/nope');            check('unknown slug is 404', r.status === 404);
  r = await resolve('/favicon.ico');     check('dotted path is 404', r.status === 404);
  r = await resolve('/privacy');         check('hidden-from-menu page still resolves', r.status === 200);
  r = await call(null, 'GET', '/cms/site/menu');
  check('menu omits Privacy, keeps Donate link', !JSON.stringify(r.body.items).includes('Privacy') && JSON.stringify(r.body.items).includes('https://example.org/donate'));
  check('footer resolves node links', r.body.footer.links.some(l => l.label === 'Privacy' && l.href === '/privacy'), JSON.stringify(r.body.footer));
}

// ── B. Permission matrix ──────────────────────────────────────────────────────────────
{
  const expect = async (who, method, path, body, want, label) => {
    const r = await call(S[who] ?? null, method, path, body);
    check(`${label ?? `${method} ${path}`} as ${who} → ${want}`, r.status === want, `got ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
    return r;
  };
  for (const [who, want] of [['admin', 200], ['lead', 200], ['contrib', 200], ['viewer', 200], ['customer', 403], ['anon', 401]]) {
    await expect(who, 'GET', '/cms/nodes', undefined, want);
  }
  for (const [who, want] of [['contrib', 403], ['viewer', 403], ['customer', 403]]) {
    await expect(who, 'POST', '/cms/nodes', { type: 'page', title: `Perm ${who}` }, want);
  }
  const leadNode = await expect('lead', 'POST', '/cms/nodes', { type: 'page', title: 'Lead Page' }, 201);
  await expect('lead', 'PATCH', `/cms/nodes/${leadNode.body.id}`, { title: 'Lead Page 2' }, 200);
  await expect('contrib', 'PATCH', `/cms/nodes/${leadNode.body.id}`, { title: 'nope' }, 403);
  await expect('lead', 'DELETE', `/cms/nodes/${leadNode.body.id}`, undefined, 403, 'DELETE node');
  const pg = await call(S.contrib, 'GET', `/cms/pages/${leadNode.body.id}`);
  check('contributor can read a page draft', pg.status === 200 && pg.body.rev === 0);
  await expect('contrib', 'PUT', `/cms/pages/${leadNode.body.id}/draft`, { blocks: [], seo: {}, rev: 0 }, 200, 'PUT draft');
  await expect('viewer', 'PUT', `/cms/pages/${leadNode.body.id}/draft`, { blocks: [], seo: {}, rev: 1 }, 403, 'PUT draft');
  await expect('customer', 'GET', `/cms/pages/${leadNode.body.id}`, undefined, 403, 'GET page');
  await expect('contrib', 'POST', `/cms/pages/${leadNode.body.id}/publish`, undefined, 403, 'publish (contributor cannot publish)');
  await expect('viewer', 'POST', `/cms/pages/${leadNode.body.id}/publish`, undefined, 403, 'publish');
  await expect('lead', 'POST', `/cms/pages/${leadNode.body.id}/publish`, undefined, 200, 'publish');
  await expect('contrib', 'POST', `/cms/pages/${leadNode.body.id}/unpublish`, undefined, 403, 'unpublish');
  await expect('viewer', 'GET', `/cms/pages/${leadNode.body.id}/preview`, undefined, 200, 'preview');
  await expect('customer', 'GET', `/cms/pages/${leadNode.body.id}/preview`, undefined, 403, 'preview');
  await expect('viewer', 'GET', '/cms/settings', undefined, 200);
  await expect('customer', 'GET', '/cms/settings', undefined, 403);
  await expect('contrib', 'PATCH', '/cms/settings', { footer: { text: 'x' } }, 403);
  await expect('admin', 'DELETE', `/cms/nodes/${leadNode.body.id}`, undefined, 200, 'DELETE node');
  const gone = await call(S.admin, 'GET', `/cms/pages/${leadNode.body.id}`);
  check('deleting a node removes its page', gone.status === 404);
}

// ── C. CRUD and move ──────────────────────────────────────────────────────────────────
let testId;
{
  let r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Test Page' });
  testId = r.body.id;
  check('create page: draft, slug from title, path', r.status === 201 && r.body.status === 'draft' && r.body.slug === 'test-page' && r.body.path === '/test-page' && r.body.visible === false, JSON.stringify(r.body));
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Test Page' });
  check('duplicate sibling slug → 409', r.status === 409, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Dashboard' });
  check('reserved root slug "dashboard" → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'label', title: 'Admin area', slug: 'cms' });
  check('reserved root slug "cms" → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Dashboard', parentId: id('About') });
  const dashChild = r.body.id;
  check('reserved word is fine below the root', r.status === 201 && r.body.path === '/about/dashboard', JSON.stringify(r.body));
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Under link', parentId: id('Donate') });
  check('child under a link → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'link', title: 'Bad', url: 'javascript:alert(1)' });
  check('link with javascript: URL → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'component', title: 'No key' });
  check('component without key → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'X', status: 'published' });
  check('status is not settable on create (stays draft)', r.status === 201 && r.body.status === 'draft', JSON.stringify(r.body).slice(0, 120));
  if (r.body.id) await call(S.admin, 'DELETE', `/cms/nodes/${r.body.id}`);
  r = await call(S.admin, 'PATCH', `/cms/nodes/${testId}`, { slug: 'about' });
  check('PATCH to a sibling\'s slug → 409', r.status === 409, `${r.status}`);
  r = await call(S.admin, 'PATCH', `/cms/nodes/${testId}`, { slug: 'Bad Slug' });
  check('PATCH invalid slug → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'PATCH', `/cms/nodes/${testId}`, { title: 'Test Page Renamed', showInMenu: false });
  check('PATCH title keeps slug', r.status === 200 && r.body.slug === 'test-page' && r.body.title === 'Test Page Renamed' && r.body.showInMenu === false);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Index Insert', index: 0 });
  all = await nodes();
  const roots = all.filter(n => n.parentId === null).sort((a, b) => a.order - b.order);
  check('create at index 0 renumbers siblings 0..n', roots[0].title === 'Index Insert' && roots.every((n, i) => n.order === i), roots.map(n => `${n.title}:${n.order}`).join(','));
  await call(S.admin, 'DELETE', `/cms/nodes/${r.body.id}`);

  // move
  r = await call(S.admin, 'POST', `/cms/nodes/${testId}/move`, { parentId: id('About'), index: 0 });
  check('move under About at index 0', r.status === 200 && r.body.path === '/about/test-page', JSON.stringify(r.body).slice(0, 200));
  all = await nodes();
  const kids = all.filter(n => n.parentId === id('About')).sort((a, b) => a.order - b.order);
  check('About children renumbered', kids.map(n => n.title).join(',') === 'Test Page Renamed,Team,History,Dashboard' && kids.every((n, i) => n.order === i), kids.map(n => `${n.title}:${n.order}`).join(','));
  const rootsAfter = all.filter(n => n.parentId === null).sort((a, b) => a.order - b.order);
  check('old siblings renumbered', rootsAfter.every((n, i) => n.order === i), rootsAfter.map(n => `${n.title}:${n.order}`).join(','));
  r = await call(S.admin, 'POST', `/cms/nodes/${testId}/move`, { parentId: id('About'), index: 0 });
  const again = (await nodes()).filter(n => n.parentId === id('About')).sort((a, b) => a.order - b.order);
  check('re-running a move is a no-op', r.status === 200 && again.map(n => `${n.title}:${n.order}`).join() === kids.map(n => `${n.title}:${n.order}`).join());
  r = await call(S.admin, 'POST', `/cms/nodes/${id('About')}/move`, { parentId: id('Team'), index: 0 });
  check('move under own descendant → 400', r.status === 400, `${r.status} ${JSON.stringify(r.body)}`);
  r = await call(S.admin, 'POST', `/cms/nodes/${id('About')}/move`, { parentId: id('About'), index: 0 });
  check('move under itself → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', `/cms/nodes/${id('Home')}/move`, { parentId: id('Donate'), index: 0 });
  check('move under a link → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Team' });
  const rootTeam = r.body.id;
  check('root "team" is allowed (different parent)', r.status === 201, `${r.status}`);
  r = await call(S.admin, 'POST', `/cms/nodes/${rootTeam}/move`, { parentId: id('About'), index: 1 });
  check('move next to a same-slug sibling → 409', r.status === 409, `${r.status}`);
  r = await call(S.admin, 'POST', `/cms/nodes/${dashChild}/move`, { parentId: null, index: 0 });
  check('move a reserved slug to the root → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'DELETE', `/cms/nodes/${id('About')}`);
  check('delete a node with children → 409', r.status === 409, `${r.status}`);
  await call(S.admin, 'DELETE', `/cms/nodes/${rootTeam}`);
  r = await call(S.admin, 'DELETE', `/cms/nodes/${dashChild}`);
  check('delete a leaf', r.status === 200);
  r = await call(S.admin, 'PATCH', `/cms/nodes/${id('Resources')}`, { type: 'link', url: 'https://example.org' });
  check('label with children cannot become a link → 409', r.status === 409, `${r.status}`);
  r = await call(S.admin, 'GET', '/cms/nodes/zzz');
  check('malformed id → 4xx, not 500', r.status >= 400 && r.status < 500, `${r.status}`);
}

// ── D. Drafts: sanitize, rev lock, publish, unpublish, preview ─────────────────────────
{
  let r = await call(S.admin, 'GET', `/cms/pages/${testId}`);
  const rev0 = r.body.rev;
  const dirty = {
    rev: rev0,
    seo: { title: 'Test', evil: 'x' },
    blocks: [
      { id: 'rt', type: 'richText', data: { doc: { type: 'doc', content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'click', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
        { type: 'iframe', attrs: { src: 'https://evil.example' } },
        { type: 'paragraph', content: [{ type: 'text', text: 'safe', marks: [{ type: 'link', attrs: { href: '/about', target: '_blank', onclick: 'x' } }] }] },
      ] } } },
      { id: 'sc', type: 'script', data: { src: 'https://evil.example/x.js' } },
      { id: 'bt', type: 'buttons', data: { items: [{ label: 'Go', link: { nodeId: id('Team') } }, { label: 'Bad', link: { url: 'javascript:void(0)' } }] } },
    ],
  };
  r = await call(S.contrib, 'PUT', `/cms/pages/${testId}/draft`, dirty);
  const saved = JSON.stringify(r.body.draft ?? {});
  check('draft saved, rev bumped', r.status === 200 && r.body.rev === rev0 + 1, `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  check('javascript: hrefs stripped', !saved.includes('javascript'), saved);
  check('unknown node (iframe) and block (script) stripped', !saved.includes('iframe') && !saved.includes('"script"') && !saved.includes('evil'), saved);
  check('safe link kept without extra attrs', saved.includes('"href":"/about","target":"_blank"') && !saved.includes('onclick'), saved);
  check('removed count reported (link mark, iframe, script block, bad button)', r.body.removed === 4, `removed=${r.body.removed}`);
  r = await call(S.contrib, 'PUT', `/cms/pages/${testId}/draft`, { ...dirty, rev: rev0 });
  check('stale rev → 409 with current rev', r.status === 409 && r.body.rev === rev0 + 1, `${r.status} ${JSON.stringify(r.body)}`);
  r = await call(S.admin, 'POST', `/cms/pages/${testId}/publish`, { rev: rev0 });
  check('publish with stale rev → 409', r.status === 409, `${r.status}`);
  r = await call(S.admin, 'POST', `/cms/pages/${testId}/publish`, { rev: rev0 + 1 });
  check('publish with current rev', r.status === 200 && r.body.status === 'published' && r.body.visible === true, JSON.stringify(r.body));
  r = await resolve('/about/test-page');
  check('published page resolves with sanitized content', r.status === 200 && r.body.page.blocks.length === 2 && !JSON.stringify(r.body).includes('javascript'), JSON.stringify(r.body).slice(0, 200));
  check('resolve maps the button nodeId link', r.body.links?.[id('Team')] === '/about/team', JSON.stringify(r.body.links));
  await call(S.admin, 'PUT', `/cms/pages/${testId}/draft`, { rev: rev0 + 1, blocks: [{ type: 'divider', data: {} }], seo: {} });
  r = await resolve('/about/test-page');
  check('a newer draft does not leak to the public page', r.body.page.blocks.length === 2);
  r = await call(S.viewer, 'GET', `/cms/pages/${testId}/preview`);
  check('preview shows the draft', r.status === 200 && r.body.preview === true && r.body.page.blocks.length === 1 && r.body.page.blocks[0].type === 'divider');
  r = await call(S.admin, 'GET', `/cms/pages/${testId}`);
  check('hasUnpublishedChanges after editing', r.body.hasUnpublishedChanges === true);
  r = await call(S.admin, 'POST', `/cms/pages/${testId}/unpublish`);
  check('unpublish', r.status === 200 && r.body.status === 'draft');
  r = await resolve('/about/test-page');
  check('unpublished page is 404', r.status === 404);
}

// ── E. A hidden ancestor hides its subtree ────────────────────────────────────────────
{
  let r = await call(S.lead, 'POST', `/cms/pages/${id('About')}/unpublish`);
  check('unpublish About warns about hidden children', r.status === 200 && r.body.warnings.length === 1, JSON.stringify(r.body));
  r = await resolve('/about/team');
  check('hidden ancestor → resolve 404', r.status === 404, `${r.status}`);
  r = await call(null, 'GET', '/cms/site/menu');
  check('hidden ancestor drops the subtree from the menu', !JSON.stringify(r.body.items).includes('"Team"') && !JSON.stringify(r.body.items).includes('"About"'));
  r = await call(S.lead, 'POST', `/cms/pages/${id('Team')}/publish`);
  check('publishing under a draft parent warns', r.status === 200 && r.body.visible === false && r.body.warnings.some(w => w.includes('About')), JSON.stringify(r.body));
  r = await resolve('/');
  check('home links drop the hidden About', r.body.links[id('About')] === undefined && r.body.links[id('Events')] === '/events', JSON.stringify(r.body.links));
  await call(S.lead, 'POST', `/cms/pages/${id('About')}/publish`);
  r = await resolve('/about/team');
  check('republishing the ancestor restores it', r.status === 200);
}

// ── F. Settings and the home page ─────────────────────────────────────────────────────
{
  let r = await call(S.lead, 'PATCH', '/cms/settings', { homeNodeId: id('Events') });
  check('home must be a page → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'POST', '/cms/nodes', { type: 'page', title: 'Temp Home' });
  const temp = r.body.id;
  await call(S.admin, 'POST', `/cms/pages/${temp}/publish`);
  r = await call(S.lead, 'PATCH', '/cms/settings', { homeNodeId: temp });
  check('set home page', r.status === 200 && r.body.homeNodeId === temp);
  r = await resolve('/');
  check('/ resolves to the new home', r.status === 200 && r.body.node.id === temp);
  r = await call(S.admin, 'DELETE', `/cms/nodes/${temp}`);
  r = await call(S.admin, 'GET', '/cms/settings');
  check('deleting the home node clears homeNodeId', r.body.homeNodeId === null, JSON.stringify(r.body));
  r = await resolve('/');
  check('no home → / is 404 (marketing fallback)', r.status === 404);
  r = await call(S.admin, 'PATCH', '/cms/settings', { homeNodeId: id('Home'), footer: { text: 'Footer text', links: [{ label: 'Bad', link: { url: 'javascript:x' } }] } });
  check('footer link with unsafe URL → 400', r.status === 400, `${r.status}`);
  r = await call(S.admin, 'PATCH', '/cms/settings', { homeNodeId: id('Home') });
  check('home restored', r.status === 200 && r.body.homeNodeId === id('Home'));
  await call(S.admin, 'DELETE', `/cms/nodes/${testId}`);
}

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed, ${requests} requests`);
process.exit(fail ? 1 : 0);
