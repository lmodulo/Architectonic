import { describe, it, expect } from 'vitest';
import { isWebImage, stripImages, pageImageIds, missingCount } from '../../../src/lib/cmsMedia.js';

const A = 'a'.repeat(24), B = 'b'.repeat(24), C = 'c'.repeat(24), D = 'd'.repeat(24);
const ref = (vaultId: string) => ({ vaultId, src: `/uploads/vault/x/${vaultId}.png`, alt: '' });
const img = (vaultId: string) => ({ type: 'cmsImage', attrs: { ...ref(vaultId), align: 'left', width: 50 } });
const page = () => ({
  blocks: [
    { id: 'r', type: 'richText', data: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }, img(A)] } } },
    { id: 'h', type: 'hero', data: { title: 'T', align: 'center', height: 'md', image: ref(B) } },
    { id: 'g', type: 'gallery', data: { images: [ref(A), ref(C)], columns: 3, aspect: 'square', gap: 'md' } },
  ],
  seo: { title: 'S', image: ref(D) },
});

describe('isWebImage', () => {
  it.each([
    ['image/png', '/uploads/vault/w/d/1-a.png'],
    ['image/jpeg', '/uploads/vault/w/d/1-a.JPG'],
    ['image/webp', 'https://bucket.s3.amazonaws.com/vault/a.webp'],
    ['image/gif', '/uploads/a.gif?v=2'],
  ])('accepts %s at %s', (m, u) => expect(isWebImage(m, u)).toBe(true));

  it.each([
    ['image/svg+xml', '/uploads/a.svg', 'SVG by type'],
    ['image/png', '/uploads/a.svg', 'SVG by extension'],
    ['text/html', '/uploads/a.png', 'not an image type'],
    ['image/png', '/uploads/a.html', 'not an image extension'],
    ['image/png', 'javascript:alert(1)//.png', 'unsafe scheme'],
    ['image/png', '//evil.example/a.png', 'protocol-relative'],
    ['image/png', '/uploads/a b.png', 'whitespace'],
    ['image/png', '/uploads/a".png', 'quote'],
    ['image/tiff', '/uploads/a.tiff', 'not a web format'],
  ])('rejects %s at %s (%s)', (m, u) => expect(isWebImage(m, u)).toBe(false));

  it('rejects non-strings', () => expect(isWebImage(undefined, null)).toBe(false));
});

describe('pageImageIds', () => {
  it('collects rich text, hero, gallery and SEO images', () => {
    expect([...pageImageIds(page())].sort()).toEqual([A, B, C, D]);
  });
  it('handles empty content', () => expect(pageImageIds(null).size).toBe(0));
});

describe('stripImages', () => {
  it('removes every use of the dropped ids and counts them', () => {
    const { content, removed } = stripImages(page(), new Set([A, B, D]));
    expect(removed).toBe(4); // rich-text image, hero image, one gallery image, SEO image
    expect(JSON.stringify(content)).not.toMatch(new RegExp(`${A}|${B}|${D}`));
    expect((content.blocks[2].data.images as unknown[]).length).toBe(1);
    expect(content.blocks[1].data.title).toBe('T');
    expect(content.seo.title).toBe('S');
    expect((content.blocks[0].data.doc as { content: unknown[] }).content.length).toBe(1);
  });
  it('returns the same content when nothing is dropped', () => {
    const p = page();
    expect(stripImages(p, new Set())).toEqual({ content: p, removed: 0 });
  });
});

describe('missingCount', () => {
  it('counts ids without a resolved URL', () => {
    expect(missingCount(new Set([A, B, C]), { [A]: { url: '/uploads/a.png' } })).toBe(2);
  });
});
