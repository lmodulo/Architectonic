<script lang="ts">
  // One optional Vault image (a hero background, the page's share image): a thumbnail with Choose,
  // Replace and Remove. Without Vault access it says why, and still lets you remove a set image.
  import { slide } from 'svelte/transition';
  import { Image as ImageIcon, TriangleAlert } from 'lucide-svelte';
  import { getMediaContext } from '$lib/cms/media.svelte';
  import { ms } from '$lib/cms/motion';
  import type { ImageRef } from '$lib/cms/types';

  let { image, onchange, label, help = '', pickerTitle = 'Choose an image', disabled = false }: {
    image: ImageRef | undefined;
    onchange: (image: ImageRef | undefined) => void;
    label: string;
    help?: string;
    pickerTitle?: string;
    disabled?: boolean;
  } = $props();

  const media = getMediaContext();
  const canPick = $derived(!!media?.access.canPick && !disabled);
  const url = $derived(image ? media?.known[image.vaultId]?.url : undefined);
  const missing = $derived(!!image && !url);

  async function choose() {
    const picked = await media?.pick({ title: pickerTitle });
    if (picked?.[0]) onchange(picked[0]);
  }
</script>

<div class="flex flex-col gap-1.5">
  <span class="text-sm font-medium">{label}</span>
  <div class="flex items-center gap-3">
    {#if image}
      <img src={url ?? image.src} alt="" class="size-16 shrink-0 rounded-field object-cover bg-base-300 {missing ? 'opacity-40' : ''}" />
    {:else}
      <div class="size-16 shrink-0 rounded-field border border-dashed border-base-content/25 grid place-items-center" aria-hidden="true"><ImageIcon class="size-5 opacity-40" /></div>
    {/if}
    <div class="flex flex-wrap items-center gap-2">
      {#if canPick}
        <button type="button" class="btn btn-sm btn-outline" onclick={choose}>{image ? 'Replace' : 'Choose image'}</button>
      {/if}
      {#if image && !disabled}
        <button type="button" class="btn btn-sm btn-ghost" onclick={() => onchange(undefined)}>Remove</button>
      {/if}
      {#if !media?.access.canPick}
        <span class="text-xs opacity-60">{media?.access.reason ?? 'Install the Vault module to add images.'}</span>
      {/if}
    </div>
  </div>
  {#if missing}
    <p class="text-xs text-warning flex items-start gap-1.5" transition:slide={{ duration: ms(200) }}>
      <TriangleAlert class="size-3.5 shrink-0 mt-px" />This image is no longer available in Vault, so it doesn't show on the site.
    </p>
  {/if}
  {#if help}<p class="text-xs opacity-60">{help}</p>{/if}
</div>
