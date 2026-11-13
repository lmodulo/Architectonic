<script lang="ts" module>
  // Compact dashboard card for a module: a few live counts from the module's list endpoints.
  // Modules wrap this in their own widget and register it via module.json → "widgets".
  //   count(json) defaults to: array length, else `total`, else the first array property's length.
  export interface ModuleStat {
    label: string;
    endpoint: string;
    count?: (json: any) => number;
  }
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import type { IconProps } from 'lucide-svelte';
  import { ArrowRight } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let { title, icon: ModuleIcon, href, stats }: {
    title: string;
    icon: typeof SvelteComponent<IconProps>;
    href: string;
    stats: ModuleStat[];
  } = $props();

  function defaultCount(json: any): number {
    if (Array.isArray(json)) return json.length;
    if (typeof json?.total === 'number') return json.total;
    const arr = json && Object.values(json).find(Array.isArray);
    return Array.isArray(arr) ? arr.length : 0;
  }

  let values = $state<(number | null)[]>([]);
  let loaded = $state(false);

  onMount(async () => {
    values = await Promise.all(stats.map(async s => {
      try {
        const res = await fetch(s.endpoint);
        if (!res.ok) return null;
        return (s.count ?? defaultCount)(await res.json());
      } catch { return null; }
    }));
    loaded = true;
  });
</script>

<a {href} class="card bg-base-100 border border-base-200 p-5 space-y-4 hover:border-primary/40 transition-colors group">
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <ModuleIcon size={18} class="size-4.5 opacity-70" />
      <p class="text-sm font-semibold">{title}</p>
    </div>
    <ArrowRight class="size-4 opacity-30 group-hover:opacity-70 transition-opacity" />
  </div>
  <div class="grid gap-3" style="grid-template-columns: repeat({stats.length}, minmax(0, 1fr))">
    {#each stats as s, i}
      <div>
        <p class="text-2xl font-bold leading-tight tabular-nums">
          {#if loaded}<span in:fade={{ duration: 150 }}>{values[i] ?? '—'}</span>{:else}<span class="opacity-20">·</span>{/if}
        </p>
        <p class="text-xs opacity-60">{s.label}</p>
      </div>
    {/each}
  </div>
</a>
