<script lang="ts">
  // A registry component (see $lib/config/cms-components/). An unknown key, or one that doesn't
  // support this mode, renders nothing on the public site.
  import { componentFor } from '$lib/cms/components';

  let { componentKey, props = {}, data, mode, rest = null }: {
    componentKey: string | undefined;
    props?: Record<string, unknown>;
    data: unknown;
    mode: 'page' | 'block';
    rest?: string | null;
  } = $props();

  // A capitalised derived component, not `<entry.component>`: the dotted form rendered nothing in
  // SSR when `entry` is a $derived (Svelte 5.x), found in Session 3.
  const Entry = $derived(componentFor(componentKey, mode)?.component);
</script>

{#if Entry}
  <Entry {props} {data} {mode} {rest} />
{/if}
