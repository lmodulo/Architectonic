<script lang="ts">
  import type { PageData } from './$types';
  import RepoTable from '$lib/components/github/RepoTable.svelte';

  let { data }: { data: PageData } = $props();

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }
</script>

<svelte:head><title>GitHub</title></svelte:head>

<div class="space-y-6">

  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">GitHub</h1>
      <p class="text-sm opacity-60 mt-0.5">
        {#if data.status.lastSync}
          {data.status.repoCount} {data.status.repoCount === 1 ? 'repository' : 'repositories'} — synced {relativeTime(data.status.lastSync)}
        {:else}
          No sync yet
        {/if}
      </p>
    </div>
  </div>

  {#if !data.status.configured}
    <div class="card preset-filled-warning-100-900 border border-warning-300-700 px-5 py-4 text-sm space-y-1">
      <p class="font-semibold">GitHub not configured</p>
      <p class="opacity-70">Set <code class="font-mono">GITHUB_TOKEN</code> and <code class="font-mono">GITHUB_OWNER</code> in your <code class="font-mono">.env</code> file, then rebuild the API container.</p>
    </div>
  {/if}

  <RepoTable repos={data.repos} user={data.user} configured={data.status.configured} />

</div>
