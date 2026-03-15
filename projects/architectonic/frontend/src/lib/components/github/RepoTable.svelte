<script lang="ts">
  import { Star, CircleDot, RefreshCw } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { UserWithPermissions } from '$lib/permissions';

  interface Repo {
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stars: number;
    openIssues: number;
    lastPush: string;
    url: string;
  }

  let {
    repos,
    user,
    configured,
  }: {
    repos: Repo[];
    user: UserWithPermissions | null;
    configured: boolean;
  } = $props();

  let selectedLanguage = $state('');
  let syncing = $state(false);
  let syncError = $state('');

  const languages = $derived(
    [...new Set(repos.map(r => r.language).filter(Boolean) as string[])].sort()
  );

  const filtered = $derived(
    selectedLanguage ? repos.filter(r => r.language === selectedLanguage) : repos
  );

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

  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572a5',
    Go: '#00add8',
    Rust: '#dea584',
    Java: '#b07219',
    'C#': '#178600',
    'C++': '#f34b7d',
    C: '#555555',
    Ruby: '#701516',
    PHP: '#4f5d95',
    Swift: '#f05138',
    Kotlin: '#a97bff',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#41b883',
    Svelte: '#ff3e00',
  };

  function langColor(lang: string): string {
    return LANG_COLORS[lang] ?? '#8b949e';
  }

  async function triggerSync() {
    if (syncing) return;
    syncing = true;
    syncError = '';
    try {
      const res = await fetch('/api/github/sync', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        syncError = body.message ?? 'Sync failed';
      } else {
        window.location.reload();
      }
    } catch {
      syncError = 'Cannot reach server';
    } finally {
      syncing = false;
    }
  }
</script>

<div class="space-y-4">

  <!-- Toolbar -->
  <div class="flex items-center gap-3 flex-wrap">
    {#if languages.length > 0}
      <select
        class="select text-sm h-9 px-3 rounded-lg border border-surface-300-700 bg-surface-100-900 min-w-[140px]"
        bind:value={selectedLanguage}
      >
        <option value="">All languages</option>
        {#each languages as lang}
          <option value={lang}>{lang}</option>
        {/each}
      </select>
    {/if}

    {#if hasPermission(user, 'github', 'update')}
      <button
        type="button"
        class="btn preset-tonal text-sm h-9 px-4 flex items-center gap-2 disabled:opacity-50"
        onclick={triggerSync}
        disabled={syncing || !configured}
        title={!configured ? 'Configure GITHUB_TOKEN and GITHUB_OWNER first' : undefined}
      >
        <RefreshCw class="size-3.5 {syncing ? 'animate-spin' : ''}" />
        {syncing ? 'Syncing…' : 'Sync'}
      </button>
    {/if}

    {#if syncError}
      <p class="text-sm text-error-500">{syncError}</p>
    {/if}
  </div>

  <!-- Repo list -->
  <div class="card preset-filled-surface-100-900 divide-y divide-surface-200-800">
    {#if filtered.length === 0}
      <p class="px-5 py-10 text-sm opacity-50 text-center">
        {repos.length === 0 ? 'No repositories synced yet. Click Sync to fetch from GitHub.' : 'No repositories match the selected filter.'}
      </p>
    {:else}
      {#each filtered as repo}
        <div class="px-5 py-4 flex items-start justify-between gap-4 hover:bg-black/[.025] dark:hover:bg-white/[.03] transition-colors">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-sm hover:underline text-primary-600 dark:text-primary-400 truncate"
              >
                {repo.fullName}
              </a>
            </div>
            {#if repo.description}
              <p class="text-sm opacity-60 line-clamp-2">{repo.description}</p>
            {/if}
            <div class="flex items-center gap-3 text-xs opacity-50 flex-wrap">
              {#if repo.language}
                <span class="flex items-center gap-1">
                  <span class="size-2.5 rounded-full shrink-0" style="background:{langColor(repo.language)}"></span>
                  {repo.language}
                </span>
              {/if}
              <span class="flex items-center gap-1">
                <Star class="size-3" />
                {repo.stars.toLocaleString()}
              </span>
              <span class="flex items-center gap-1">
                <CircleDot class="size-3" />
                {repo.openIssues} {repo.openIssues === 1 ? 'issue' : 'issues'}
              </span>
              <span>pushed {relativeTime(repo.lastPush)}</span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

</div>
