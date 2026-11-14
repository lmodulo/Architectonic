<script lang="ts">
  // Settings for a component block: which registry entry, and its props.
  import { TriangleAlert } from 'lucide-svelte';
  import { slide } from 'svelte/transition';
  import { page } from '$app/state';
  import { blockComponents, defaultProps, missingModule, missingModuleText } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import { CMS_COMPONENTS } from '$lib/cms/components';
  import PropsEditor from './PropsEditor.svelte';
  import type { ComponentData } from '$lib/cms/types';

  let { data = $bindable(), readonly = false }: { data: ComponentData; readonly?: boolean } = $props();

  const uid = $props.id();
  const entries = blockComponents();
  const entry = $derived(CMS_COMPONENTS[data.key]);
  const usable = $derived(!!entry && entry.modes.includes('block'));
  const missing = $derived(usable ? missingModule(entry, page.data.user) : null);

  function choose(key: string) {
    data.key = key;
    data.props = defaultProps(CMS_COMPONENTS[key]?.props);
  }
</script>

<div class="flex flex-col gap-3">
  <div class="flex flex-col gap-1">
    <label class="text-sm font-medium" for="{uid}-key">Component</label>
    <select id="{uid}-key" class="select select-sm w-full sm:max-w-xs" value={data.key} disabled={readonly} onchange={e => choose(e.currentTarget.value)}>
      {#if !usable}<option value={data.key}>{data.key ? `${data.key} (not available)` : 'Choose a component'}</option>{/if}
      {#each entries as e (e.key)}<option value={e.key}>{e.label}</option>{/each}
    </select>
    {#if entry}<p class="text-xs opacity-60">{entry.description}</p>{/if}
  </div>
  {#if missing}
    <p class="text-sm text-warning flex items-start gap-2" transition:slide={{ duration: ms(200) }}><TriangleAlert class="size-4 shrink-0 mt-0.5" />{missingModuleText(entry?.label ?? data.key, missing)}</p>
  {/if}
  {#if !entries.length}
    <p class="text-sm opacity-70 flex items-start gap-2"><TriangleAlert class="size-4 shrink-0 mt-0.5" />No components that can be placed on a page are installed.</p>
  {/if}
  {#if usable && entry.props?.length}
    <PropsEditor specs={entry.props} props={data.props} disabled={readonly} onchange={p => (data.props = p)} />
  {/if}
</div>
