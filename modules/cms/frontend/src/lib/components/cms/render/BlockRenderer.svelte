<script lang="ts">
  // Renders a page's block stack. Heroes are full-bleed; everything else sits in a centered
  // column (text narrower than components). Gallery blocks render from Session 5.
  import '$lib/components/cms/cms-prose.css';
  import RichTextRenderer from './RichTextRenderer.svelte';
  import HeroBlock from './HeroBlock.svelte';
  import ButtonsBlock from './ButtonsBlock.svelte';
  import DividerBlock from './DividerBlock.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import type { Block } from '$lib/cms/types';

  let { blocks, links, componentData = {}, firstHeroIsTitle = false }: {
    blocks: Block[];
    links: Record<string, string>;
    componentData?: Record<string, unknown>;
    /** the first block is a hero standing in for the page title, so it renders as the h1 */
    firstHeroIsTitle?: boolean;
  } = $props();
</script>

<div class="cms-blocks flex flex-col gap-10 pb-16">
  {#each blocks as block, i (block.id)}
    {#if block.type === 'hero'}
      <div class="cms-block cms-block--hero">
        <HeroBlock data={block.data} {links} heading={firstHeroIsTitle && i === 0 ? 'h1' : 'h2'} />
      </div>
    {:else if block.type === 'richText'}
      <div class="cms-block cms-block--richText w-full max-w-3xl mx-auto px-4">
        <RichTextRenderer doc={block.data.doc} />
      </div>
    {:else if block.type === 'buttons'}
      <div class="cms-block cms-block--buttons w-full max-w-3xl mx-auto px-4">
        <ButtonsBlock data={block.data} {links} />
      </div>
    {:else if block.type === 'divider'}
      <div class="cms-block cms-block--divider w-full max-w-3xl mx-auto px-4">
        <DividerBlock data={block.data} />
      </div>
    {:else if block.type === 'component'}
      <div class="cms-block cms-block--component w-full max-w-5xl mx-auto px-4">
        <ComponentBlock componentKey={block.data.key} props={block.data.props} data={componentData[block.id]} mode="block" />
      </div>
    {/if}
  {/each}
</div>
