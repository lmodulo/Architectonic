<script lang="ts">
  // Renders sanitized Tiptap JSON by walking it with snippets. Only whitelisted nodes and marks
  // render; anything else is skipped. Nothing is rendered as raw HTML: text is always escaped, and link
  // hrefs are re-checked even though the API sanitized them on save.
  // cmsImage nodes render nothing until Session 5 (they need the page's Vault media map).
  import '$lib/components/cms/cms-prose.css';
  import { safeHref } from '$lib/cms/links';
  import type { TiptapNode } from '$lib/cms/types';

  type Mark = NonNullable<TiptapNode['marks']>[number];

  let { doc }: { doc: TiptapNode | undefined } = $props();

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
  {:else if n.type === 'text' && n.text}{@render marked(n.text, n.marks ?? [], 0)}
  {/if}
{/snippet}

<!-- Marks nest outermost-first, as Tiptap stores them -->
{#snippet marked(text: string, marks: Mark[], i: number)}{#if i >= marks.length}{text}{:else if marks[i].type === 'bold'}<strong>{@render marked(text, marks, i + 1)}</strong>{:else if marks[i].type === 'italic'}<em>{@render marked(text, marks, i + 1)}</em>{:else if marks[i].type === 'underline'}<u>{@render marked(text, marks, i + 1)}</u>{:else if marks[i].type === 'strike'}<s>{@render marked(text, marks, i + 1)}</s>{:else if marks[i].type === 'link' && safeHref(marks[i].attrs?.href)}{@const blank = marks[i].attrs?.target === '_blank'}<a href={safeHref(marks[i].attrs?.href)} target={blank ? '_blank' : undefined} rel={blank ? 'noopener noreferrer' : undefined}>{@render marked(text, marks, i + 1)}</a>{:else}{@render marked(text, marks, i + 1)}{/if}{/snippet}

<div class="cms-prose">{@render children(doc?.content)}</div>
