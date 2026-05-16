<script lang="ts">
  import { ChevronDown, Check, Building2 } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  interface Workspace { id: string; name: string; slug: string; role: string; }

  let {
    workspaces,
    current,
  }: {
    workspaces: Workspace[];
    current:    Workspace | null;
  } = $props();

  let open      = $state(false);
  let switching = $state(false);

  async function switchTo(ws: Workspace) {
    if (ws.id === current?.id || switching) return;
    switching = true;
    try {
      await fetch(`/api/workspaces/${ws.id}/switch`, { method: 'POST' });
      await invalidateAll();
    } finally {
      switching = false;
      open = false;
    }
  }
</script>

{#if workspaces.length > 1}
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-base-300/50 transition-colors text-sm"
      onclick={() => (open = !open)}
      disabled={switching}
    >
      <Building2 class="size-4 shrink-0 opacity-60" />
      <span class="flex-1 text-left truncate">{current?.name ?? 'Workspace'}</span>
      <ChevronDown class="size-3 opacity-40 transition-transform duration-200 {open ? 'rotate-180' : ''}" />
    </button>

    {#if open}
      <button
        type="button"
        class="fixed inset-0 z-10"
        onclick={() => (open = false)}
        aria-label="Close workspace picker"
        tabindex="-1"
      ></button>
      <ul class="absolute left-0 right-0 z-20 mt-1 py-1 bg-base-200 border border-base-300 rounded shadow-lg">
        {#each workspaces as ws}
          <li>
            <button
              type="button"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-base-300/50 transition-colors"
              onclick={() => switchTo(ws)}
            >
              <span class="flex-1 text-left truncate">{ws.name}</span>
              {#if ws.id === current?.id}
                <Check class="size-3.5 text-primary shrink-0" />
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
