// A Vault image inside rich text: a figure that floats left or right (text wraps round it), sits
// centred, or spans the full width, with optional caption. Its attributes match the API sanitizer's
// cmsImage node. Plain renderHTML (no Svelte node view): the editor shows it with the same
// cms-prose.css rules as the public page.
//
// parseHTML accepts only our own figure[data-cms-image], so images pasted from other sites (plain
// <img>) are dropped; copy and paste within the editor keeps them.
import { Node } from '@tiptap/core';
import type { CmsImageAttrs } from '../types';

export interface CmsImageOptions {
  /** true for an image Vault no longer serves (deleted, admin-only…): drawn with a warning outline */
  isMissing: (vaultId: string) => boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cmsImage: {
      insertCmsImage: (attrs: Partial<CmsImageAttrs> & { vaultId: string; src: string }) => ReturnType;
    };
  }
}

const ALIGNS = ['left', 'right', 'center', 'full'] as const;
const WIDTHS = [25, 33, 50, 100] as const;
/** Same rule as the sanitizer: same-site paths or http(s) */
const SAFE_SRC = /^(\/(?![/\\])|https?:)/i;

const plain = (def: unknown) => ({ default: def, rendered: false });

export const CmsImage = Node.create<CmsImageOptions>({
  name: 'cmsImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return { isMissing: () => false };
  },

  addAttributes() {
    return {
      vaultId: plain(null),
      src: plain(null),
      alt: plain(''),
      caption: plain(null),
      align: plain('center'),
      width: plain(50),
      w: plain(null),
      h: plain(null),
    };
  },

  parseHTML() {
    return [{
      tag: 'figure[data-cms-image]',
      getAttrs: el => {
        const img = el.querySelector('img');
        const vaultId = el.getAttribute('data-vault-id');
        const src = img?.getAttribute('src') ?? '';
        if (!vaultId || !/^[a-f0-9]{24}$/.test(vaultId) || !SAFE_SRC.test(src)) return false;
        const align = el.getAttribute('data-align');
        const width = Number(el.getAttribute('data-width'));
        return {
          vaultId,
          src,
          alt: img?.getAttribute('alt') ?? '',
          caption: el.querySelector('figcaption')?.textContent || null,
          align: (ALIGNS as readonly string[]).includes(align ?? '') ? align : 'center',
          width: (WIDTHS as readonly number[]).includes(width) ? width : 50,
          w: Number(img?.getAttribute('width')) || null,
          h: Number(img?.getAttribute('height')) || null,
        };
      },
    }];
  },

  renderHTML({ node }) {
    const a = node.attrs as CmsImageAttrs;
    const width = a.align === 'full' ? 100 : a.width;
    const figure: Record<string, string> = {
      'data-cms-image': '',
      'data-vault-id': a.vaultId,
      'data-align': a.align,
      'data-width': String(width),
      class: `cms-fig cms-fig--${a.align}`,
    };
    if (this.options.isMissing(a.vaultId)) figure['data-missing'] = '';
    const img: Record<string, string> = { src: SAFE_SRC.test(a.src) ? a.src : '', alt: a.alt ?? '', draggable: 'false' };
    if (a.w) img.width = String(a.w);
    if (a.h) img.height = String(a.h);
    return a.caption ? ['figure', figure, ['img', img], ['figcaption', {}, a.caption]] : ['figure', figure, ['img', img]];
  },

  addCommands() {
    return {
      insertCmsImage: attrs => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: { caption: null, align: 'center', width: 50, alt: '', w: null, h: null, ...attrs } }),
    };
  },
});
