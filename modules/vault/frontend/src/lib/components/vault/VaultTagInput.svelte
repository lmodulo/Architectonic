<script lang="ts">
  // Tags as chips: type a tag and press Enter or a comma (or paste "a, b, c"); Backspace in the empty box removes the
  // last one. `suggestions` (the tags already in use) show as the browser's own autocomplete list.
  import { flip } from 'svelte/animate';
  import { fade, scale } from 'svelte/transition';
  import { X } from 'lucide-svelte';

  let {
    tags = $bindable([]),
    suggestions = [],
    id,
    disabled = false,
    max = 20,
  }: { tags?: string[]; suggestions?: string[]; id: string; disabled?: boolean; max?: number } = $props();

  let draft = $state('');
  let box = $state<HTMLInputElement | null>(null);

  const listId = $derived(`${id}-suggestions`);
  const has = (t: string) => tags.some(x => x.toLowerCase() === t.toLowerCase());
  const offered = $derived(suggestions.filter(s => !has(s)).slice(0, 50));

  /** Adds each comma-separated tag in `text` that isn't there yet */
  function commit(text: string) {
    const next = [...tags];
    for (const raw of text.split(',')) {
      const t = raw.trim().slice(0, 50);
      if (t && next.length < max && !next.some(x => x.toLowerCase() === t.toLowerCase())) next.push(t);
    }
    tags = next;
    draft = '';
  }

  function remove(t: string) {
    tags = tags.filter(x => x !== t);
    box?.focus();
  }

  function keydown(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Enter') {
      e.preventDefault(); // never submits the form from here
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      tags = tags.slice(0, -1);
    }
  }

  function input(e: Event) {
    // A pasted list, or a suggestion picked from the list. Picking one replaces the text in a single step; typing
    // a suggestion's name out (which may be the start of a longer tag) doesn't add it.
    const type = e instanceof InputEvent ? e.inputType : '';
    if (draft.includes(',')) commit(draft);
    else if ((!type || type === 'insertReplacementText') && suggestions.includes(draft)) commit(draft);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="input w-full h-auto min-h-10 flex flex-wrap items-center gap-1.5 py-1.5 cursor-text {disabled ? 'opacity-60 pointer-events-none' : ''}"
  onclick={() => box?.focus()}
>
  {#each tags as tag (tag)}
    <span
      class="badge badge-sm gap-1 pr-1 bg-base-300 border-0"
      animate:flip={{ duration: 150 }}
      in:scale={{ duration: 150, start: 0.8 }}
      out:fade={{ duration: 100 }}
    >
      {tag}
      <button type="button" class="rounded-full p-0.5 hover:bg-base-content/15 transition-colors" aria-label="Remove tag {tag}"
        onclick={(e) => { e.stopPropagation(); remove(tag); }}><X class="size-3" /></button>
    </span>
  {/each}
  <input
    bind:this={box}
    {id}
    type="text"
    class="w-0 grow min-w-24 bg-transparent outline-none text-sm"
    placeholder={tags.length ? '' : 'Type a tag and press Enter'}
    list={offered.length ? listId : undefined}
    maxlength="50"
    autocomplete="off"
    {disabled}
    bind:value={draft}
    onkeydown={keydown}
    oninput={input}
    onblur={() => { if (draft.trim()) commit(draft); }}
  />
</div>
{#if offered.length}
  <datalist id={listId}>
    {#each offered as s (s)}<option value={s}></option>{/each}
  </datalist>
{/if}
