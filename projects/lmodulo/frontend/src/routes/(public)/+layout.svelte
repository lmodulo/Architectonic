<script lang="ts">
  import { getThemeMode } from '$lib/stores/theme-mode';
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();

  const themeGetter = getThemeMode();
  const themeMode = $derived(themeGetter());
</script>

<div data-theme={themeMode}>
  {@render children()}
</div>
