<script lang="ts">
  import { brand } from '$lib/config/logo';
  import LogoIcon from '$lib/components/LogoIcon.svelte';
</script>

<LogoIcon class="size-6 text-primary-700 dark:text-primary-200" />
<span class="text-xl font-semibold">{brand.text}</span>
