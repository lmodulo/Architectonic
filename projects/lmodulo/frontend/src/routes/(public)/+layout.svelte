<script lang="ts">
  import { APP_THEME } from '$lib/config/theme';
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div data-theme={APP_THEME}>
  {@render children()}
</div>
