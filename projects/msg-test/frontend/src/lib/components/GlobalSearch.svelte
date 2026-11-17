<script lang="ts">
  import { Search, Loader2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { m } from '$lib/paraglide/messages.js';

  interface Result {
    _id: string;
    title: string;
    status?: string;
  }

  // Extend this array when modules add searchable entities.
  // Each group maps a result key to a label, href factory, and badge style.
  const GROUPS: { key: string; label: string; href: (id: string) => string; badge: string }[] = [];

  let query = $state('');
  let results = $state<Record<string, Result[]> | null>(null);
  let loading = $state(false);
  let open = $state(false);
  let cursor = $state(-1);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inputEl: HTMLInputElement;
  let containerEl: HTMLDivElement;

  const flatResults = $derived.by(() => {
    if (!results) return [];
    return GROUPS.flatMap(group =>
      (results[group.key] ?? []).map((item: Result) => ({ href: group.href(item._id), item, group }))
    );
  });

  const groupStartIndices = $derived.by(() => {
    const map: Record<string, number> = {};
    let i = 0;
    for (const group of GROUPS) {
      map[group.key] = i;
      i += results?.[group.key]?.length ?? 0;
    }
    return map;
  });

  function hasResults(r: Record<string, Result[]>) {
    return GROUPS.some(g => (r[g.key]?.length ?? 0) > 0);
  }

  function onInput() {
    if (timer) clearTimeout(timer);
    if (!query.trim()) {
      results = null;
      open = false;
      loading = false;
      return;
    }
    loading = true;
    timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          results = await res.json();
          open = true;
          cursor = -1;
        }
      } catch { /* ignore */ } finally {
        loading = false;
      }
    }, 250);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      query = '';
      results = null;
      open = false;
      cursor = -1;
      inputEl?.blur();
      return;
    }
    if (!open || flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cursor = cursor < flatResults.length - 1 ? cursor + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cursor = cursor > 0 ? cursor - 1 : flatResults.length - 1;
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      navigate(flatResults[cursor].href);
    }
  }

  function navigate(href: string) {
    query = '';
    results = null;
    open = false;
    goto(href);
  }

  $effect(() => {
    function handleClick(e: MouseEvent) {
      if (open && containerEl && !containerEl.contains(e.target as Node)) {
        open = false;
        cursor = -1;
      }
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  });

  $effect(() => {
    if (cursor < 0) return;
    const el = containerEl?.querySelector(`[data-cursor-index="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  });
</script>

<div class="relative flex-1 max-w-sm" bind:this={containerEl}>
  <label class="input input-sm w-full flex items-center gap-2 bg-base-100 border-base-300">
    {#if loading}
      <Loader2 class="size-3.5 shrink-0 opacity-50 animate-spin" />
    {:else}
      <Search class="size-3.5 shrink-0 opacity-50" />
    {/if}
    <input
      bind:this={inputEl}
      bind:value={query}
      oninput={onInput}
      onkeydown={onKeydown}
      type="search"
      placeholder={m.search_placeholder()}
      autocomplete="off"
      class="grow bg-transparent text-sm outline-none"
    />
  </label>

  {#if open && results}
    <div class="absolute top-full mt-1 left-0 right-0 z-50 bg-base-200 border border-base-300 rounded-lg shadow-lg overflow-hidden max-h-[420px] overflow-y-auto">
      {#if !hasResults(results)}
        <p class="px-4 py-3 text-sm opacity-50">{m.search_no_results({ query })}</p>
      {:else}
        {#each GROUPS as group}
          {#if (results[group.key]?.length ?? 0) > 0}
            <div>
              <p class="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider opacity-40">{group.label}</p>
              {#each results[group.key] as item, itemIdx}
                {@const flatIdx = groupStartIndices[group.key] + itemIdx}
                <button
                  type="button"
                  data-cursor-index={flatIdx}
                  class="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors {flatIdx === cursor ? 'bg-base-300/60' : 'hover:bg-base-300/60'}"
                  onclick={() => navigate(group.href(item._id))}
                >
                  <span class="badge badge-xs {group.badge} shrink-0">{group.label.slice(0, 1)}</span>
                  <span class="text-sm truncate flex-1">{item.title}</span>
                  {#if item.status}
                    <span class="text-xs opacity-40 shrink-0">{item.status}</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  {/if}
</div>
