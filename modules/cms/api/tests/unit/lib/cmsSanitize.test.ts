import { describe, it, expect } from 'vitest';
import { sanitizePage, sanitizeDoc, safeHref, sanitizeProps, collectRefs } from '../../../src/lib/cmsSanitize.js';

const VAULT_ID = 'a'.repeat(24);
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const para = (...content: unknown[]) => ({ type: 'paragraph', content });
const linked = (href: string) => ({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href } }] });

describe('safeHref', () => {
  it.each(['https://example.org', 'http://a.b/c?d', 'mailto:a@b.c', 'tel:+441234', '/about/team', '#top', 'HTTPS://EXAMPLE.ORG'])(
    'accepts %s', href => expect(safeHref(href)).toBe(href));

  it.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x', '//evil.example', '/\\evil.example',
    'java\tscript:alert(1)', ' javascript:alert(1)', 'https://a b', '', 'relative/path'])(
    'rejects %j', href => expect(safeHref(href)).toBeUndefined());
});

describe('sanitizeDoc', () => {
  it('strips javascript: links but keeps the text', () => {
    const out = sanitizeDoc(doc(para(linked('javascript:alert(1)'))));
    expect(out.content![0].content![0]).toEqual({ type: 'text', text: 'x' });
  });

  it('keeps safe links with only href and target', () => {
    const out = sanitizeDoc(doc(para({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '/a', target: '_blank', rel: 'x', onclick: 'y' } }] })));
    expect(out.content![0].content![0].marks).toEqual([{ type: 'link', attrs: { href: '/a', target: '_blank' } }]);
  });

  it('drops unknown nodes and marks', () => {
    const out = sanitizeDoc(doc(
      { type: 'iframe', attrs: { src: 'https://x' } },
      { type: 'codeBlock', content: [{ type: 'text', text: 'x' }] },
      para({ type: 'text', text: 'hi', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: 'red' } }] }),
      { type: 'image', attrs: { src: 'https://x/y.png' } },
    ));
    expect(out.content).toEqual([para({ type: 'text', text: 'hi', marks: [{ type: 'bold' }] })]);
  });

  it('clamps heading levels to 2–4', () => {
    const out = sanitizeDoc(doc({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'a' }] }, { type: 'heading', attrs: { level: 6 }, content: [{ type: 'text', text: 'b' }] }));
    expect(out.content!.map(n => n.attrs!.level)).toEqual([2, 4]);
  });

  it('enforces the content model (no blocks inside paragraphs, list items start with a paragraph)', () => {
    const out = sanitizeDoc(doc(
      para({ type: 'heading', content: [] }, { type: 'text', text: 'ok' }),
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'bulletList', content: [{ type: 'listItem', content: [para({ type: 'text', text: 'n' })] }] }] }] },
      { type: 'bulletList', content: [] },
    ));
    expect(out.content![0]).toEqual(para({ type: 'text', text: 'ok' }));
    expect(out.content![1].content![0].content![0]).toEqual({ type: 'paragraph' });
    expect(out.content).toHaveLength(2);
  });

  it('validates cmsImage attributes and drops invalid images', () => {
    const out = sanitizeDoc(doc(
      { type: 'cmsImage', attrs: { vaultId: VAULT_ID, src: '/uploads/a.png', alt: 'A', align: 'left', width: 33, w: 800, h: 600, onerror: 'x' } },
      { type: 'cmsImage', attrs: { vaultId: 'nope', src: '/uploads/a.png' } },
      { type: 'cmsImage', attrs: { vaultId: VAULT_ID, src: 'javascript:alert(1)' } },
      { type: 'cmsImage', attrs: { vaultId: VAULT_ID, src: '/u.png', align: 'float', width: 70 } },
    ));
    expect(out.content).toEqual([
      { type: 'cmsImage', attrs: { vaultId: VAULT_ID, src: '/uploads/a.png', alt: 'A', caption: null, align: 'left', width: 33, w: 800, h: 600 } },
      { type: 'cmsImage', attrs: { vaultId: VAULT_ID, src: '/u.png', alt: '', caption: null, align: 'center', width: 50, w: null, h: null } },
    ]);
  });

  it('returns a doc with one empty paragraph for empty or invalid input', () => {
    expect(sanitizeDoc(undefined)).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
    expect(sanitizeDoc({ type: 'nope' })).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });

  it('caps nesting depth', () => {
    let deep: unknown = para({ type: 'text', text: 'x' });
    for (let i = 0; i < 40; i++) deep = { type: 'blockquote', content: [deep] };
    const out = sanitizeDoc(doc(deep));
    expect(JSON.stringify(out).length).toBeLessThan(2000);
  });
});

describe('sanitizePage', () => {
  it('whitelists block types, fills defaults and counts what it removed', () => {
    const { blocks, removed } = sanitizePage({ blocks: [
      { id: 'b1', type: 'divider', data: { style: 'zigzag' } },
      { id: 'b2', type: 'script', data: { src: 'x' } },
      { type: 'buttons', data: { items: [
        { label: 'Ok', link: { nodeId: VAULT_ID }, style: 'primary' },
        { label: 'Bad', link: { url: 'javascript:alert(1)' } },
      ] } },
    ] });
    expect(blocks.map(b => b.type)).toEqual(['divider', 'buttons']);
    expect(blocks[0]).toEqual({ id: 'b1', type: 'divider', data: { style: 'line', size: 'md' } });
    expect(blocks[1].id).toMatch(/^[0-9a-f-]{36}$/);
    expect((blocks[1].data.items as unknown[])).toHaveLength(1);
    expect(removed).toBe(2);
  });

  it('regenerates duplicate block ids', () => {
    const { blocks } = sanitizePage({ blocks: [{ id: 'same', type: 'divider', data: {} }, { id: 'same', type: 'divider', data: {} }] });
    expect(new Set(blocks.map(b => b.id)).size).toBe(2);
  });

  it('sanitizes hero, gallery and component blocks', () => {
    const { blocks } = sanitizePage({ blocks: [
      { id: 'h', type: 'hero', data: { title: ' Hi ', align: 'right', cta: { label: 'Go', link: { url: '//evil' } }, image: { vaultId: VAULT_ID, src: '/a.png', alt: 'x' } } },
      { id: 'g', type: 'gallery', data: { columns: 9, images: [{ vaultId: VAULT_ID, src: '/a.png', alt: '', caption: 'c' }, { vaultId: 'x', src: '/b.png' }] } },
      { id: 'c', type: 'component', data: { key: 'events', props: { limit: 3, bad: () => 1, 'no-dash': 1 } } },
      { id: 'c2', type: 'component', data: { key: 'Bad Key' } },
    ] });
    expect(blocks[0].data).toEqual({ title: 'Hi', align: 'center', height: 'md', image: { vaultId: VAULT_ID, src: '/a.png', alt: 'x' } });
    expect(blocks[1].data).toEqual({ images: [{ vaultId: VAULT_ID, src: '/a.png', alt: '', caption: 'c' }], columns: 3, aspect: 'square', gap: 'md' });
    expect(blocks[2].data).toEqual({ key: 'events', props: { limit: 3 } });
    expect(blocks).toHaveLength(3);
  });

  it('keeps only known SEO fields', () => {
    const { seo } = sanitizePage({ blocks: [], seo: { title: 'T', description: 'D', noindex: true, script: 'x' } });
    expect(seo).toEqual({ title: 'T', description: 'D', noindex: true });
  });
});

describe('sanitizeProps', () => {
  it('keeps plain JSON only', () => {
    expect(sanitizeProps({ a: 1, b: 'x', c: [true, null, Infinity], d: { e: { f: { g: { h: 1 } } } } })).toEqual({ a: 1, b: 'x', c: [true, null], d: { e: { f: {} } } });
    expect(sanitizeProps('nope')).toEqual({});
  });
});

describe('collectRefs', () => {
  it('finds node links and Vault images across block types', () => {
    const { blocks } = sanitizePage({ blocks: [
      { type: 'hero', data: { title: 'x', cta: { label: 'a', link: { nodeId: '1'.repeat(24) } }, image: { vaultId: '2'.repeat(24), src: '/a' } } },
      { type: 'buttons', data: { items: [{ label: 'b', link: { nodeId: '3'.repeat(24) } }] } },
      { type: 'richText', data: { doc: doc({ type: 'cmsImage', attrs: { vaultId: '4'.repeat(24), src: '/b' } }) } },
      { type: 'gallery', data: { images: [{ vaultId: '5'.repeat(24), src: '/c' }] } },
    ] });
    const refs = collectRefs(blocks);
    expect([...refs.nodeIds].sort()).toEqual(['1'.repeat(24), '3'.repeat(24)]);
    expect([...refs.vaultIds].sort()).toEqual(['2'.repeat(24), '4'.repeat(24), '5'.repeat(24)]);
  });
});
