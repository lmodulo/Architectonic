<script lang="ts">
  // Full-width banner: a Vault background image under a dark scrim (white text), or without an image
  // a soft gradient from the theme's colors. The image is decorative (empty alt): the heading carries
  // the meaning.
  import { linkHref } from '$lib/cms/links';
  import type { HeroData, MediaMap } from '$lib/cms/types';

  let { data, links, media = {}, heading = 'h2' }: {
    data: HeroData;
    links: Record<string, string>;
    media?: MediaMap;
    heading?: 'h1' | 'h2';
  } = $props();

  const image = $derived(data.image ? media[data.image.vaultId]?.url : undefined);

  const ctaHref = $derived(data.cta ? linkHref(data.cta.link, links) : undefined);
  const height = $derived({ sm: 'py-14 md:py-16', md: 'py-20 md:py-28', lg: 'py-24 md:py-40 min-h-[60vh]' }[data.height] ?? 'py-20');
  const centered = $derived(data.align !== 'left');
</script>

<section class="cms-hero relative overflow-hidden flex items-center {height} {image ? 'text-white bg-neutral' : 'bg-gradient-to-br from-primary/15 via-base-200 to-secondary/10'}">
  {#if image}
    <img src={image} alt="" width={data.image?.w} height={data.image?.h} decoding="async" class="absolute inset-0 size-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30" aria-hidden="true"></div>
  {/if}
  <div class="relative w-full max-w-5xl mx-auto px-4 flex flex-col gap-5 {centered ? 'items-center text-center' : 'items-start text-left'}">
    <svelte:element this={heading} class="text-4xl md:text-5xl font-bold leading-tight tracking-tight max-w-3xl text-balance">{data.title}</svelte:element>
    {#if data.subtitle}
      <p class="text-lg md:text-xl max-w-2xl text-pretty {image ? 'opacity-90' : 'opacity-80'}">{data.subtitle}</p>
    {/if}
    {#if data.cta && ctaHref}
      <a href={ctaHref} class="btn btn-primary btn-lg mt-2">{data.cta.label}</a>
    {/if}
  </div>
</section>
