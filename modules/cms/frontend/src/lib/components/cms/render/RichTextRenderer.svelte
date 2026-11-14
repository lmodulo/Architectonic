<script lang="ts">
  // Renders sanitized Tiptap JSON by walking it with snippets. Only whitelisted nodes and marks
  // render; anything else is skipped. Nothing is rendered as raw HTML: text is always escaped, and link
  // hrefs are re-checked even though the API sanitized them on save.
  // Images (cmsImage) render from the page's media map, which holds only Vault images that may be
  // shown: one that is missing from it (deleted, admin-only, no longer an image) is left out.
  // A link to a site page (a `nodeId` on the link) takes its URL from the page's `links` map, so it
  // follows the page when it moves; if the page isn't public, the text shows without a link.
  import '$lib/components/cms/cms-prose.css';
  import { safeHref } from '$lib/cms/links';
  import type { CmsImageAttrs, MediaMap, TiptapNode } from '$lib/cms/types';

  type Mark = NonNullable<TiptapNode['marks']>[number];

  let { doc, media = {}, links = {} }: { doc: TiptapNode | undefined; media?: MediaMap; links?: Record<string, string> } = $props();

  /** The href for a link mark: a page's current URL, else the stored URL; undefined renders no link. */
  function hrefOf(m: Mark): string | undefined {
    const id = m.attrs?.nodeId;
    return typeof id === 'string' ? safeHref(links[id]) : safeHref(m.attrs?.href);
  }

  const ALIGNS = ['left', 'right', 'center', 'full'];
  const WIDTHS = [25, 33, 50, 100];
  function image(n: TiptapNode) {
    const a = (n.attrs ?? {}) as Partial<CmsImageAttrs>;
    const url = a.vaultId ? media[a.vaultId]?.url : undefined;
    if (!url) return null;
    const align = ALIGNS.includes(a.align as string) ? a.align! : 'center';
    const width = align === 'full' ? 100 : WIDTHS.includes(a.width as number) ? a.width! : 50;
    return { url, align, width, alt: a.alt ?? '', caption: a.caption || null, w: a.w || undefined, h: a.h || undefined };
  }

  const level = (n: TiptapNode) => {
    const l = n.attrs?.level;
    return l === 3 || l === 4 ? l : 2;
  };
  const start = (n: TiptapNode) => {
    const s = n.attrs?.start;
    return typeof s === 'number' && Number.isInteger(s) && s > 1 ? s : undefined;
  };
</script>

{#snippet children(list: TiptapNode[] | undefined)}{#each list ?? [] as child}{@render node(child)}{/each}{/snippet}

{#snippet node(n: TiptapNode)}
  {#if n.type === 'paragraph'}<p>{@render children(n.content)}</p>
  {:else if n.type === 'heading'}
    {#if level(n) === 3}<h3>{@render children(n.content)}</h3>{:else if level(n) === 4}<h4>{@render children(n.content)}</h4>{:else}<h2>{@render children(n.content)}</h2>{/if}
  {:else if n.type === 'bulletList'}<ul>{@render children(n.content)}</ul>
  {:else if n.type === 'orderedList'}<ol start={start(n)}>{@render children(n.content)}</ol>
  {:else if n.type === 'listItem'}<li>{@render children(n.content)}</li>
  {:else if n.type === 'blockquote'}<blockquote>{@render children(n.content)}</blockquote>
  {:else if n.type === 'horizontalRule'}<hr />
  {:else if n.type === 'hardBreak'}<br />
  {:else if n.type === 'cmsImage'}
    {@const img = image(n)}
    {#if img}
      <figure class="cms-fig cms-fig--{img.align}" data-width={img.width}>
        <img src={img.url} alt={img.alt} width={img.w} height={img.h} loading="lazy" decoding="async" />
        {#if img.caption}<figcaption>{img.caption}</figcaption>{/if}
      </figure>
    {/if}
  {:else if n.type === 'text' && n.text}{@render marked(n.text, n.marks ?? [], 0)}
  {/if}
{/snippet}

<!-- Marks nest outermost-first, as Tiptap stores them -->
{#snippet marked(text: string, marks: Mark[], i: number)}{#if i >= marks.length}{text}{:else if marks[i].type === 'bold'}<strong>{@render marked(text, marks, i + 1)}</strong>{:else if marks[i].type === 'italic'}<em>{@render marked(text, marks, i + 1)}</em>{:else if marks[i].type === 'underline'}<u>{@render marked(text, marks, i + 1)}</u>{:else if marks[i].type === 'strike'}<s>{@render marked(text, marks, i + 1)}</s>{:else if marks[i].type === 'link' && hrefOf(marks[i])}{@const blank = marks[i].attrs?.target === '_blank'}<a href={hrefOf(marks[i])} target={blank ? '_blank' : undefined} rel={blank ? 'noopener noreferrer' : undefined}>{@render marked(text, marks, i + 1)}</a>{:else}{@render marked(text, marks, i + 1)}{/if}{/snippet}

<div class="cms-prose">{@render children(doc?.content)}</div>
