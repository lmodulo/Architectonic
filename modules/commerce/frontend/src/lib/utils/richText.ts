// HTML from the base rich text editor (MessageEditor: Tiptap StarterKit + Underline), shown without {@html}.
// The stored string is read into a tree of allowed elements and text; RichTextView (and the Shop page type's
// ShopComponent) render that tree through Svelte, so only these tags ever reach the page, with no attributes,
// and every piece of text is escaped, whatever the string holds. Fields that were plain text before they had an
// editor (a product description) still read correctly: text with no tags becomes paragraphs.

export type RichNode = { text: string } | { tag: string; children: RichNode[] };

const ALLOWED = new Set([
  'p', 'br', 'hr', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h3', 'h4', 'h5', 'h6',
]);
/** Other spellings of the same thing; h1/h2 drop below the page's own headings */
const RENAME: Record<string, string> = { b: 'strong', i: 'em', strike: 's', del: 's', h1: 'h3', h2: 'h3' };
const VOID = new Set(['br', 'hr']);
/** Containers where whitespace between elements means nothing */
const NO_TEXT = new Set(['ul', 'ol']);
const MAX_DEPTH = 30;
const MAX_LENGTH = 50_000;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
    const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hasTags = (s: string) => /<[a-z!/][^>]*>/i.test(s);

/** The editor's starting content: HTML as it is; plain text as paragraphs (a blank line between them) and line breaks */
export function toEditorHtml(value: string | null | undefined): string {
  const s = (value ?? '').trim();
  if (!s || hasTags(s)) return s;
  return s
    .split(/\n\s*\n/)
    .map(p => `<p>${escape(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Plain text, for meta descriptions and emptiness checks: tags removed, entities decoded, spaces collapsed */
export function richTextToPlain(value: string | null | undefined): string {
  return decode(
    (value ?? '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<(br|hr|\/p|\/li|\/h[1-6]|\/blockquote|\/pre|\/div)\b[^>]*>/gi, ' ')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when there's nothing to show (the editor leaves "<p></p>" behind when it's emptied) */
export const isRichTextEmpty = (value: string | null | undefined) => richTextToPlain(value) === '';

/** The tree RichTextView renders */
export function richTextNodes(value: string | null | undefined): RichNode[] {
  const html = toEditorHtml(value).slice(0, MAX_LENGTH).replace(/<(script|style)\b[\s\S]*?(<\/\1\s*>|$)/gi, '');
  const root: RichNode[] = [];
  const open: { tag: string; children: RichNode[] }[] = [];
  const here = () => open.at(-1) ?? null;

  const text = (raw: string) => {
    const parent = here();
    const t = decode(raw);
    if (!t.trim() && (!parent || NO_TEXT.has(parent.tag))) return;
    const list = parent?.children ?? root;
    const last = list.at(-1);
    if (last && 'text' in last) last.text += t;
    else list.push({ text: t });
  };

  let at = 0;
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)) {
    if (m.index > at) text(html.slice(at, m.index));
    at = m.index + m[0].length;
    if (!m[2]) continue; // a comment
    const name = m[2].toLowerCase();
    const tag = RENAME[name] ?? name;
    if (!ALLOWED.has(tag)) continue; // the tag goes, its text stays
    if (m[1]) {
      // Close the innermost open element of this kind (and anything left open inside it)
      for (let i = open.length - 1; i >= 0; i--) {
        if (open[i].tag === tag) { open.length = i; break; }
      }
      continue;
    }
    const node = { tag, children: [] as RichNode[] };
    (here()?.children ?? root).push(node);
    if (!VOID.has(tag) && open.length < MAX_DEPTH) open.push(node);
  }
  if (at < html.length) text(html.slice(at));
  return root;
}
