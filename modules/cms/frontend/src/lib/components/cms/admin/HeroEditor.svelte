<script lang="ts">
  // Settings for a hero block. The canvas above it shows the result live.
  import { slide } from 'svelte/transition';
  import { linkTargets } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import LinkPicker from './LinkPicker.svelte';
  import ImageField from './ImageField.svelte';
  import type { CmsNode, HeroData } from '$lib/cms/types';

  let { data = $bindable(), nodes, readonly = false }: { data: HeroData; nodes: CmsNode[]; readonly?: boolean } = $props();

  const uid = $props.id();
  const aligns = [{ v: 'left', l: 'Left' }, { v: 'center', l: 'Centered' }] as const;
  const heights = [{ v: 'sm', l: 'Short' }, { v: 'md', l: 'Medium' }, { v: 'lg', l: 'Tall' }] as const;

  function toggleCta(on: boolean) {
    if (!on) { data.cta = undefined; return; }
    const first = linkTargets(nodes)[0];
    data.cta = { label: 'Find out more', link: first ? { nodeId: first.id } : { url: '/' } };
  }
</script>

<div class="grid gap-4 sm:grid-cols-2">
  <div class="sm:col-span-2 flex flex-col gap-1">
    <label class="text-sm font-medium" for="{uid}-title">Heading</label>
    <input id="{uid}-title" class="input input-sm w-full" bind:value={data.title} maxlength="200" disabled={readonly} />
  </div>
  <div class="sm:col-span-2 flex flex-col gap-1">
    <label class="text-sm font-medium" for="{uid}-subtitle">Subtitle <span class="font-normal opacity-60">(optional)</span></label>
    <textarea id="{uid}-subtitle" class="textarea textarea-sm w-full" rows="2" bind:value={data.subtitle} maxlength="500" disabled={readonly}></textarea>
  </div>
  <div class="sm:col-span-2">
    <ImageField
      image={data.image}
      onchange={im => (data.image = im)}
      label="Background image"
      pickerTitle="Choose a background image"
      help="Shown behind the text under a dark overlay. It's decorative, so it needs no alt text."
      disabled={readonly}
    />
  </div>
  <div class="flex flex-col gap-1">
    <span class="text-sm font-medium" id="{uid}-align">Alignment</span>
    <div class="join" role="group" aria-labelledby="{uid}-align">
      {#each aligns as a (a.v)}
        <button type="button" class="btn btn-xs join-item {data.align === a.v ? 'btn-neutral' : ''}" aria-pressed={data.align === a.v} disabled={readonly} onclick={() => (data.align = a.v)}>{a.l}</button>
      {/each}
    </div>
  </div>
  <div class="flex flex-col gap-1">
    <span class="text-sm font-medium" id="{uid}-height">Height</span>
    <div class="join" role="group" aria-labelledby="{uid}-height">
      {#each heights as h (h.v)}
        <button type="button" class="btn btn-xs join-item {data.height === h.v ? 'btn-neutral' : ''}" aria-pressed={data.height === h.v} disabled={readonly} onclick={() => (data.height = h.v)}>{h.l}</button>
      {/each}
    </div>
  </div>
  <div class="sm:col-span-2 flex flex-col gap-3">
    <label class="flex items-center gap-2 text-sm cursor-pointer w-fit">
      <input type="checkbox" class="toggle toggle-sm" checked={!!data.cta} disabled={readonly} onchange={e => toggleCta(e.currentTarget.checked)} /> Button
    </label>
    {#if data.cta}
      <div class="grid gap-3 sm:grid-cols-2 rounded-box border border-base-300 bg-base-100 p-3" transition:slide={{ duration: ms(200) }}>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="{uid}-cta">Button label</label>
          <input id="{uid}-cta" class="input input-sm w-full" bind:value={data.cta.label} maxlength="80" disabled={readonly} aria-invalid={!data.cta.label.trim()} />
          {#if !data.cta.label.trim()}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>Add a label.</p>{/if}
        </div>
        <LinkPicker link={data.cta.link} {nodes} disabled={readonly} label="Button link" onchange={l => { if (data.cta) data.cta.link = l; }} />
      </div>
    {/if}
  </div>
</div>
