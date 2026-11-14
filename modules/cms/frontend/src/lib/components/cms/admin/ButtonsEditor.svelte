<script lang="ts">
  // Settings for a buttons block: up to 10 buttons, each with a label, a link and a style.
  import { slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-svelte';
  import { linkTargets } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import LinkPicker from './LinkPicker.svelte';
  import type { ButtonsData, CmsNode } from '$lib/cms/types';

  let { data = $bindable(), nodes, readonly = false }: { data: ButtonsData; nodes: CmsNode[]; readonly?: boolean } = $props();

  const uid = $props.id();
  const MAX = 10;
  const aligns = [{ v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }] as const;

  function add() {
    const first = linkTargets(nodes)[0];
    data.items.push({ label: 'Button', link: first ? { nodeId: first.id } : { url: '/' }, style: data.items.length ? 'outline' : 'primary' });
  }
  function move(i: number, d: -1 | 1) {
    const [item] = data.items.splice(i, 1);
    data.items.splice(i + d, 0, item);
  }
</script>

<div class="flex flex-col gap-3">
  <ul class="flex flex-col gap-2">
    {#each data.items as item, i (item)}
      <li class="rounded-box border border-base-300 bg-base-100 p-3 flex flex-col gap-3" animate:flip={{ duration: ms(200) }} transition:slide={{ duration: ms(200) }}>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold opacity-60">Button {i + 1}</span>
          <span class="flex-1"></span>
          {#if !readonly}
            <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move button {i + 1} up" disabled={i === 0} onclick={() => move(i, -1)}><ArrowUp class="size-3.5" /></button>
            <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move button {i + 1} down" disabled={i === data.items.length - 1} onclick={() => move(i, 1)}><ArrowDown class="size-3.5" /></button>
            <button type="button" class="btn btn-ghost btn-xs btn-square text-error" aria-label="Remove button {i + 1}" onclick={() => data.items.splice(i, 1)}><Trash2 class="size-3.5" /></button>
          {/if}
        </div>
        <div class="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium" for="{uid}-label-{i}">Label</label>
            <input id="{uid}-label-{i}" class="input input-sm w-full" bind:value={item.label} maxlength="80" disabled={readonly} aria-invalid={!item.label.trim()} />
            {#if !item.label.trim()}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>Add a label.</p>{/if}
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium" for="{uid}-style-{i}">Style</label>
            <select id="{uid}-style-{i}" class="select select-sm w-full" bind:value={item.style} disabled={readonly}>
              <option value="primary">Filled</option>
              <option value="outline">Outline</option>
            </select>
          </div>
        </div>
        <LinkPicker link={item.link} {nodes} disabled={readonly} onchange={l => (item.link = l)} />
      </li>
    {/each}
  </ul>
  <div class="flex flex-wrap items-center gap-3">
    {#if !readonly}
      <button type="button" class="btn btn-sm btn-outline" disabled={data.items.length >= MAX} onclick={add}><Plus class="size-4" />Add a button</button>
    {/if}
    <span class="flex-1"></span>
    <span class="text-sm font-medium" id="{uid}-align">Alignment</span>
    <div class="join" role="group" aria-labelledby="{uid}-align">
      {#each aligns as a (a.v)}
        <button type="button" class="btn btn-xs join-item {data.align === a.v ? 'btn-neutral' : ''}" aria-pressed={data.align === a.v} disabled={readonly} onclick={() => (data.align = a.v)}>{a.l}</button>
      {/each}
    </div>
  </div>
</div>
