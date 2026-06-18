import { Extension, PasteRule } from '@tiptap/core';
import type { UrlParser } from './editorParsers';

export const UrlParserExtension = Extension.create<{ parsers: UrlParser[] }>({
  name: 'urlParser',

  addOptions() {
    return { parsers: [] };
  },

  addPasteRules() {
    return this.options.parsers.map((parser) =>
      new PasteRule({
        find: new RegExp(parser.pattern.source, 'gi'),
        handler({ state, range, match }) {
          const label = parser.getLabel(match);
          const url = match[0];
          const linkMark = state.schema.marks.link?.create({ href: url, target: '_blank' });
          if (!linkMark) return null;
          state.tr.replaceWith(range.from, range.to, state.schema.text(label, [linkMark]));
        }
      })
    );
  }
});
