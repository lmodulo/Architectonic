<script lang="ts">
  // A registry component on the editor canvas, with its data loaded in the browser. Entries' `load`
  // only uses the fetch it is given against /api/... proxies, so it runs here as it does on the server.
  import { TriangleAlert } from 'lucide-svelte';
  import { componentFor, CMS_COMPONENTS } from '$lib/cms/components';
  import ComponentBlock from '../render/ComponentBlock.svelte';

  let { componentKey, props }: { componentKey: string; props: Record<string, unknown> } = $props();

  const entry = $derived(componentFor(componentKey, 'block'));
  let data = $state<unknown>(undefined);
  let loading = $state(false);
  let seq = 0;

  $effect(() => {
    const e = entry;
    const p = $state.snapshot(props);
    if (!e?.load) { data = undefined; return; }
    const mine = ++seq;
    loading = true;
    // Debounced, so typing in a prop field doesn't fire a request per keystroke
    const timer = setTimeout(async () => {
      try {
        const d = await e.load!({ fetch, url: new URL(window.location.href), rest: null, props: p });
        if (mine === seq) data = d;
      } catch {
        if (mine === seq) data = { unavailable: true };
      } finally {
        if (mine === seq) loading = false;
      }
    }, 300);
    return () => clearTimeout(timer);
  });
</script>

{#if entry}
  <div class="transition-opacity duration-200 {loading ? 'opacity-50' : ''}">
    <ComponentBlock {componentKey} {props} {data} mode="block" />
  </div>
{:else}
  <div class="rounded-box border border-dashed border-warning/60 bg-warning/5 p-4 text-sm flex items-start gap-2">
    <TriangleAlert class="size-4 shrink-0 mt-0.5 text-warning" />
    <span>
      {#if !componentKey}Choose a component for this block.
      {:else if CMS_COMPONENTS[componentKey]}"{CMS_COMPONENTS[componentKey].label}" can only be used as a whole page, so this block shows nothing on the site.
      {:else}No component called "{componentKey}" is installed, so this block shows nothing on the site.{/if}
    </span>
  </div>
{/if}
