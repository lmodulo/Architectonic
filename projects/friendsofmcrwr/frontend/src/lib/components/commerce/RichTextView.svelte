<script lang="ts">
  // Shows HTML from the base rich text editor (MessageEditor) without {@html}: see $lib/utils/richText.ts.
  // Pass `class` for the typography (e.g. `prose prose-sm`).
  import { richTextNodes, type RichNode } from '$lib/utils/richText';

  let { html, class: cls = '' }: { html: string | null | undefined; class?: string } = $props();

  const nodes = $derived(richTextNodes(html));
</script>

<!-- Kept on one line: whitespace in the template would add spaces between words and tags -->
{#snippet render(list: RichNode[])}{#each list as n}{#if 'text' in n}{n.text}{:else if n.tag === 'br'}<br />{:else if n.tag === 'hr'}<hr />{:else}<svelte:element this={n.tag}>{@render render(n.children)}</svelte:element>{/if}{/each}{/snippet}

<div class={cls}>{@render render(nodes)}</div>
