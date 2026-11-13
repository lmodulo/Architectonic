<script lang="ts">
  import { APP_THEME } from '$lib/config/theme';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<div data-theme={data.theme ?? APP_THEME}>
  {@render children()}
</div>
