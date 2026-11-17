<script lang="ts">
  import { Mail } from 'lucide-svelte';
  import { m } from '$lib/paraglide/messages.js';
</script>

<!-- Desktop only: on phones the layout shows the list on /messages and hides this panel -->
<div class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center opacity-50">
  <Mail class="size-10" />
  <p class="text-sm">{m.messages_empty()}</p>
</div>
