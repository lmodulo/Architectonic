// Adds a `nodeId` attribute to StarterKit's link mark: a link to one of the site's own pages.
// The public renderer takes the URL from the page's `links` map (nodeId → current path), so the link
// follows the page when it moves; the mark's `href` is only the editor's copy of the path.
// Only the API's sanitizer decides what is stored (lib/cmsSanitize.ts keeps 24-hex ids only).
import { Extension } from '@tiptap/core';

export const LinkNode = Extension.create({
  name: 'cmsLinkNode',
  addGlobalAttributes() {
    return [{
      types: ['link'],
      attributes: {
        nodeId: {
          default: null,
          parseHTML: el => el.getAttribute('data-node-id') || null,
          renderHTML: attrs => (attrs.nodeId ? { 'data-node-id': attrs.nodeId } : {}),
        },
      },
    }];
  },
});
