<script lang="ts">
  // Edits a LinkRef: a page from the site tree (stored by id, so moving the page doesn't break the
  // link) or a URL. Used by the hero and buttons editors and the footer settings.
  import { slide } from 'svelte/transition';
  import { linkProblem, linkTargets } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import type { CmsNode, LinkRef } from '$lib/cms/types';

  let { link, nodes, onchange, label = 'Link', disabled = false, showErrors = true }: {
    link: LinkRef | undefined;
    nodes: CmsNode[];
    onchange: (link: LinkRef) => void;
    label?: string;
    disabled?: boolean;
    showErrors?: boolean;
  } = $props();

  const targets = $derived(linkTargets(nodes));
  const mode = $derived(link && 'nodeId' in link ? 'page' : 'url');
  const problem = $derived(showErrors ? linkProblem(link, nodes) : null);
  const uid = $props.id();

  // Switching back and forth keeps what was there before
  let lastUrl = '';
  let lastNode = '';
  function setMode(m: 'page' | 'url') {
    if (m === mode) return;
    if (link && 'nodeId' in link) lastNode = link.nodeId;
    if (link && 'url' in link) lastUrl = link.url;
    onchange(m === 'page' ? { nodeId: lastNode || targets[0]?.id || '' } : { url: lastUrl });
  }
</script>

<div class="flex flex-col gap-1.5">
  <div class="flex items-center justify-between gap-2">
    <span class="text-sm font-medium" id="{uid}-label">{label}</span>
    <div class="join" role="group" aria-label="{label}: link to">
      <button type="button" class="btn btn-xs join-item {mode === 'page' ? 'btn-neutral' : ''}" aria-pressed={mode === 'page'} {disabled} onclick={() => setMode('page')}>Page</button>
      <button type="button" class="btn btn-xs join-item {mode === 'url' ? 'btn-neutral' : ''}" aria-pressed={mode === 'url'} {disabled} onclick={() => setMode('url')}>URL</button>
    </div>
  </div>
  {#if link && 'nodeId' in link}
    <select
      class="select select-sm w-full"
      aria-labelledby="{uid}-label"
      value={link.nodeId}
      {disabled}
      onchange={e => onchange({ nodeId: e.currentTarget.value })}
    >
      {#if !targets.some(t => t.id === link.nodeId)}
        <option value={link.nodeId} disabled>{link.nodeId ? 'Missing page' : 'Choose a page'}</option>
      {/if}
      {#each targets as t (t.id)}
        <option value={t.id}>{t.label}{t.visible ? '' : ' (not public)'}</option>
      {/each}
    </select>
  {:else}
    <input
      type="text"
      inputmode="url"
      class="input input-sm w-full font-mono"
      aria-labelledby="{uid}-label"
      placeholder="https://example.org or /about"
      value={link && 'url' in link ? link.url : ''}
      maxlength="2048"
      {disabled}
      oninput={e => onchange({ url: e.currentTarget.value.trim() })}
    />
  {/if}
  {#if problem}
    <p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>{problem}</p>
  {/if}
</div>
