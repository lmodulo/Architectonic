<script lang="ts">
  import { Search, Loader2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  interface Result {
    _id: string;
    title: string;
    status: string;
  }

  interface Results {
    milestones: Result[];
    sprints: Result[];
    jobs: Result[];
    tasks: Result[];
    contacts: Result[];
    companies: Result[];
    deals: Result[];
  }

  const GROUPS: { key: keyof Results; label: string; href: (id: string) => string; badge: string }[] = [
    { key: 'milestones', label: 'Milestones', href: id => `/agile/milestones/${id}`, badge: 'badge-primary' },
    { key: 'sprints',    label: 'Sprints',    href: id => `/agile/sprints/${id}`,    badge: 'badge-secondary' },
    { key: 'jobs',       label: 'Jobs',       href: id => `/agile/jobs/${id}`,       badge: 'badge-accent' },
    { key: 'tasks',      label: 'Tasks',      href: id => `/agile/tasks/${id}`,      badge: 'badge-neutral' },
    { key: 'contacts',   label: 'Contacts',   href: id => `/crm/contacts/${id}`,     badge: 'badge-info' },
    { key: 'companies',  label: 'Companies',  href: id => `/crm/companies/${id}`,    badge: 'badge-success' },
    { key: 'deals',      label: 'Deals',      href: id => `/crm/deals/${id}`,        badge: 'badge-warning' },
  ];

  let query = $state('');
  let results = $state<Results | null>(null);
  let loading = $state(false);
  let open = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inputEl: HTMLInputElement;
  let containerEl: HTMLDivElement;

  function hasResults(r: Results) {
    return GROUPS.some(g => r[g.key].length > 0);
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
      inputEl?.blur();
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
      }
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
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
      placeholder="Search…"
      autocomplete="off"
      class="grow bg-transparent text-sm outline-none"
    />
  </label>

  {#if open && results}
    <div class="absolute top-full mt-1 left-0 right-0 z-50 bg-base-200 border border-base-300 rounded-lg shadow-lg overflow-hidden max-h-[420px] overflow-y-auto">
      {#if !hasResults(results)}
        <p class="px-4 py-3 text-sm opacity-50">No results for "{query}"</p>
      {:else}
        {#each GROUPS as group}
          {#if results[group.key].length > 0}
            <div>
              <p class="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider opacity-40">{group.label}</p>
              {#each results[group.key] as item}
                <button
                  type="button"
                  class="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-base-300/60 transition-colors"
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
