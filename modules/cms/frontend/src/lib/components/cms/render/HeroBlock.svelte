<script lang="ts">
  // Full-width banner. The background image comes from Vault in Session 5; until then the hero uses
  // a soft gradient from the theme's colors.
  import { linkHref } from '$lib/cms/links';
  import type { HeroData } from '$lib/cms/types';

  let { data, links, heading = 'h2' }: { data: HeroData; links: Record<string, string>; heading?: 'h1' | 'h2' } = $props();

  const ctaHref = $derived(data.cta ? linkHref(data.cta.link, links) : undefined);
  const height = $derived({ sm: 'py-14 md:py-16', md: 'py-20 md:py-28', lg: 'py-24 md:py-40 min-h-[60vh]' }[data.height] ?? 'py-20');
  const centered = $derived(data.align !== 'left');
</script>

<section class="cms-hero relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/10 flex items-center {height}">
  <div class="relative w-full max-w-5xl mx-auto px-4 flex flex-col gap-5 {centered ? 'items-center text-center' : 'items-start text-left'}">
    <svelte:element this={heading} class="text-4xl md:text-5xl font-bold leading-tight tracking-tight max-w-3xl text-balance">{data.title}</svelte:element>
    {#if data.subtitle}
      <p class="text-lg md:text-xl opacity-80 max-w-2xl text-pretty">{data.subtitle}</p>
    {/if}
    {#if data.cta && ctaHref}
      <a href={ctaHref} class="btn btn-primary btn-lg mt-2">{data.cta.label}</a>
    {/if}
  </div>
</section>
