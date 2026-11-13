import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { CmsTree, type CmsNodeDoc } from '../../../src/lib/cmsTree.js';

let seq = 0;
function n(id: string, parent: string | null, order: number, type: CmsNodeDoc['type'], extra: Partial<CmsNodeDoc> = {}): CmsNodeDoc {
  return {
    _id: oid(id), parentId: parent ? oid(parent) : null, order, type, title: id,
    slug: type === 'link' ? undefined : id, showInMenu: true, status: 'published',
    createdAt: new Date(2026, 0, 1, 0, 0, seq++), updatedAt: new Date(), ...extra,
  };
}
const ids = new Map<string, ObjectId>();
const oid = (key: string) => ids.get(key) ?? ids.set(key, new ObjectId()).get(key)!;

function site(overrides: Record<string, Partial<CmsNodeDoc>> = {}) {
  const docs = [
    n('home', null, 0, 'page'),
    n('about', null, 1, 'page'),
    n('team', 'about', 0, 'page'),
    n('history', 'about', 1, 'page'),
    n('events', null, 2, 'component', { component: { key: 'events', props: {} } }),
    n('resources', null, 3, 'label'),
    n('sitemap', 'resources', 1, 'component', { component: { key: 'sitemap', props: {} } }),
    n('donate', 'resources', 0, 'link', { url: 'https://example.org/donate', newTab: true }),
    n('privacy', null, 4, 'page', { showInMenu: false }),
  ].map(d => ({ ...d, ...overrides[d.title] }));
  return new CmsTree(docs, oid('home').toString());
}
const idOf = (key: string) => oid(key).toString();

describe('CmsTree paths and visibility', () => {
  it('joins slugs, gives links no path and the home page /', () => {
    const t = site();
    expect(t.get(idOf('team'))!.path).toBe('/about/team');
    expect(t.get(idOf('sitemap'))!.path).toBe('/resources/sitemap');
    expect(t.get(idOf('donate'))!.path).toBeNull();
    expect(t.urlOf(t.get(idOf('home'))!)).toBe('/');
    expect(t.urlOf(t.get(idOf('donate'))!)).toBe('https://example.org/donate');
  });

  it('hides a node when any ancestor is a draft', () => {
    const t = site({ about: { status: 'draft' } });
    expect(t.get(idOf('about'))!.visible).toBe(false);
    expect(t.get(idOf('team'))!.visible).toBe(false);
    expect(t.get(idOf('events'))!.visible).toBe(true);
  });

  it('survives a corrupted parent cycle', () => {
    const a = n('a', 'b', 0, 'page'), b = n('b', 'a', 0, 'page');
    const t = new CmsTree([a, b], null);
    expect(t.roots).toHaveLength(0);
    expect(t.get(idOf('a'))!.visible).toBe(false);
    expect(t.isSelfOrAncestor(idOf('a'), idOf('b'))).toBe(true);
  });

  it('detects moves under self or a descendant', () => {
    const t = site();
    expect(t.isSelfOrAncestor(idOf('about'), idOf('team'))).toBe(true);
    expect(t.isSelfOrAncestor(idOf('about'), idOf('about'))).toBe(true);
    expect(t.isSelfOrAncestor(idOf('team'), idOf('about'))).toBe(false);
  });
});

describe('CmsTree.resolve', () => {
  it('resolves pages, the home page and its own path', () => {
    const t = site();
    expect(t.resolve('/')).toMatchObject({ kind: 'node', node: { id: idOf('home') } });
    expect(t.resolve('/home')).toEqual({ kind: 'redirect', to: '/' });
    expect(t.resolve('/about/team')).toMatchObject({ kind: 'node', node: { id: idOf('team') } });
    expect(t.resolve('/about/team/')).toMatchObject({ kind: 'node', node: { id: idOf('team') } });
    expect(t.resolve('/privacy')).toMatchObject({ kind: 'node' });
  });

  it('redirects a label to its first visible page or component', () => {
    expect(site().resolve('/resources')).toEqual({ kind: 'redirect', to: '/resources/sitemap' });
    expect(site({ sitemap: { status: 'draft' } }).resolve('/resources')).toEqual({ kind: 'notFound' });
  });

  it('passes extra segments to a component as rest, but not to a page', () => {
    expect(site().resolve('/events/summer-fair')).toMatchObject({ kind: 'node', node: { id: idOf('events') }, rest: 'summer-fair' });
    expect(site().resolve('/about/nope')).toEqual({ kind: 'notFound' });
  });

  it('returns notFound for unknown, hidden or malformed paths', () => {
    const t = site({ about: { status: 'draft' } });
    expect(t.resolve('/about/team')).toEqual({ kind: 'notFound' });
    expect(t.resolve('/nope')).toEqual({ kind: 'notFound' });
    expect(t.resolve('/About')).toEqual({ kind: 'notFound' });
    expect(t.resolve('/favicon.ico')).toEqual({ kind: 'notFound' });
    expect(t.resolve('about')).toEqual({ kind: 'notFound' });
    expect(new CmsTree([], null).resolve('/')).toEqual({ kind: 'notFound' });
  });
});

describe('CmsTree.menu and linkMap', () => {
  it('lists visible menu items in order, hiding subtrees', () => {
    const t = site({ history: { showInMenu: false } });
    const menu = t.menu();
    expect(menu.map(m => m.title)).toEqual(['home', 'about', 'events', 'resources']);
    expect(menu[1].children.map(m => m.title)).toEqual(['team']);
    expect(menu[3].children).toEqual([
      { id: idOf('donate'), type: 'link', title: 'donate', href: 'https://example.org/donate', newTab: true, children: [] },
      { id: idOf('sitemap'), type: 'component', title: 'sitemap', href: '/resources/sitemap', children: [] },
    ]);
    expect(site({ about: { status: 'draft' } }).menu().map(m => m.title)).not.toContain('about');
  });

  it('maps only visible nodes unless asked for hidden ones', () => {
    const t = site({ about: { status: 'draft' } });
    expect(t.linkMap([idOf('team'), idOf('home'), 'f'.repeat(24)])).toEqual({ [idOf('home')]: '/' });
    expect(t.linkMap([idOf('team')], true)).toEqual({ [idOf('team')]: '/about/team' });
  });
});
