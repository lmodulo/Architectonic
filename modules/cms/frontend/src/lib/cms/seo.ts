// Search and sharing tags for a public page (rendered by CmsPage's <svelte:head>).
//   description: the page's SEO description, else its hero subtitle, else the start of its text
//   canonical:   this site's origin + the page's public path ('/' for the home page)
//   og:image:    the share image (seo.image) at its current Vault URL, made absolute; left out if
//                Vault no longer lets it be shown (it isn't in the page's media map)
//   robots:      noindex for pages marked "hide from search engines" (draft previews set their own
//                noindex, nofollow in routes/cms/preview)
import type { PageView, TiptapNode } from './types';

const DESCRIPTION_MAX = 160;

export interface PageMeta {
  title: string;
  description: string;
  canonical: string | null;
  image: { url: string; alt: string; w?: number; h?: number } | null;
  noindex: boolean;
  siteName: string;
}

/** Plain text of a Tiptap doc, paragraphs and headings only (no image captions). */
function docText(n: TiptapNode | undefined, out: string[] = []): string[] {
  if (!n) return out;
  if (n.type === 'text' && n.text) out.push(n.text);
  else if (n.type === 'hardBreak') out.push(' ');
  else if (n.type !== 'cmsImage') {
    n.content?.forEach(c => docText(c, out));
    if (n.type === 'paragraph' || n.type === 'heading') out.push(' ');
  }
  return out;
}

/** Cuts at a word boundary and adds an ellipsis when the text is longer than `max`. */
export function clip(text: string, max = DESCRIPTION_MAX): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–-]+$/, '')}…`;
}

export function pageMeta(view: PageView, origin: string, siteName: string): PageMeta {
  const seo = view.page?.seo ?? {};
  const blocks = view.page?.blocks ?? [];
  const title = [seo.title || view.node.title, siteName].filter(Boolean).join(' · ');

  let description = seo.description?.trim() ?? '';
  if (!description) {
    const hero = blocks.find(b => b.type === 'hero');
    const text = blocks.find(b => b.type === 'richText');
    description = (hero?.type === 'hero' && hero.data.subtitle?.trim()) || (text?.type === 'richText' ? docText(text.data.doc).join('') : '');
  }

  const url = seo.image ? view.media[seo.image.vaultId]?.url : undefined;
  const absolute = (u: string) => { try { return new URL(u, origin).href; } catch { return null; } };
  const imageUrl = url ? absolute(url) : null;

  return {
    title,
    description: clip(description),
    canonical: view.preview || !view.node.path ? null : absolute(view.node.path),
    image: imageUrl && seo.image ? { url: imageUrl, alt: seo.image.alt ?? '', w: seo.image.w, h: seo.image.h } : null,
    noindex: seo.noindex === true && !view.preview,
    siteName,
  };
}
