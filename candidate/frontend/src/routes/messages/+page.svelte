<script lang="ts">
  import { Mail } from 'lucide-svelte';
  import { m } from '$lib/paraglide/messages.js';
</script>

<div class="flex flex-col items-center justify-center h-full opacity-40 gap-3">
  <Mail class="size-12" />
  <p class="text-sm">{m.messages_empty()}</p>
</div>
