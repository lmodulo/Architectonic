<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.error_403_title()}</title>
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="text-center space-y-4 max-w-sm">
    <p class="text-6xl font-bold text-error">{m.error_403_code()}</p>
    <h1 class="text-2xl font-semibold">{m.error_403_title()}</h1>
    <p class="text-base-content/40">{m.error_403_message()}</p>
    <a href="/dashboard" class="btn btn-primary mt-4">{m.error_403_back()}</a>
  </div>
</div>
