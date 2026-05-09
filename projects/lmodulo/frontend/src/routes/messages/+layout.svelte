<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import { SquarePen, Inbox, Send, Archive } from 'lucide-svelte';
  import MessageListItem from '$lib/components/MessageListItem.svelte';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  type Thread = {
    threadId: string;
    subject: string;
    latestFrom: string;
    latestAt: string;
    unreadCount: number;
  };

  type Tab = 'inbox' | 'sent' | 'archived';
  let activeTab   = $state<Tab>('inbox');
  let listData    = $state<Thread[]>(data.inbox as Thread[]);
  let hasMore     = $state(data.inboxHasMore ?? false);
  let loading     = $state(false);
  let loadingMore = $state(false);

  const endpoints: Record<Tab, string> = {
    inbox:    '/api/messages',
    sent:     '/api/messages/sent',
    archived: '/api/messages/archived',
  };

  async function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    activeTab = tab;
    loading = true;
    hasMore = false;
    try {
      const res = await fetch(`${endpoints[tab]}?limit=25`);
      if (res.ok) {
        const d = await res.json();
        listData = d.threads ?? [];
        hasMore  = d.hasMore ?? false;
      }
    } catch { /* non-fatal */ } finally {
      loading = false;
    }
  }

  async function loadMore() {
    const oldest = listData[listData.length - 1];
    if (!oldest || loadingMore) return;
    loadingMore = true;
    try {
      const before = encodeURIComponent(new Date(oldest.latestAt).toISOString());
      const res = await fetch(`${endpoints[activeTab]}?limit=25&before=${before}`);
      if (res.ok) {
        const d = await res.json();
        listData = [...listData, ...(d.threads ?? [])];
        hasMore  = d.hasMore ?? false;
      }
    } catch { /* non-fatal */ } finally {
      loadingMore = false;
    }
  }

  const currentThreadId = $derived(page.params.threadId ?? null);

  function resolveFrom(userId: string) {
    const u = data.allUsers.find((x: { id: string }) => x.id === userId);
    if (!u) return userId;
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return name || u.username;
  }
</script>

<div class="flex flex-col h-full overflow-hidden gap-4">

  <!-- Header -->
  <div class="shrink-0">
    <h1 class="text-2xl font-bold">Messages</h1>
    <p class="text-sm opacity-60 mt-0.5">Inbox, sent mail, and archived conversations</p>
  </div>

  <!-- Two-panel shell -->
  <div class="flex flex-1 overflow-hidden border border-base-300 rounded-box">

  <!-- Left panel — message list -->
  <aside class="w-72 shrink-0 flex flex-col border-r border-base-300 overflow-hidden">

    <!-- Compose button -->
    <div class="px-3 py-3 border-b border-base-300">
      <a href="/messages/compose" class="btn btn-primary w-full">
        <SquarePen class="size-4" />
        <span>Compose</span>
      </a>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-base-300 shrink-0">
      {#each ([['inbox', 'Inbox', Inbox], ['sent', 'Sent', Send], ['archived', 'Archive', Archive]] as const) as [tab, label, Icon]}
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors
            {activeTab === tab ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'opacity-60 hover:opacity-100'}"
          onclick={() => switchTab(tab)}
        >
          <Icon class="size-3.5" />
          {label}
        </button>
      {/each}
    </div>

    <!-- Thread list -->
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <p class="text-xs text-center opacity-40 mt-8">Loading…</p>
      {:else if listData.length === 0}
        <p class="text-xs text-center opacity-40 mt-8">No messages</p>
      {:else}
        {#each listData as thread (thread.threadId)}
          <MessageListItem
            threadId={thread.threadId}
            subject={thread.subject}
            latestFrom={activeTab === 'sent' ? thread.subject : resolveFrom(thread.latestFrom)}
            latestAt={thread.latestAt}
            unreadCount={thread.unreadCount}
            active={currentThreadId === thread.threadId}
          />
        {/each}
        {#if hasMore}
          <div class="px-3 py-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm w-full text-xs opacity-60 hover:opacity-100"
              disabled={loadingMore}
              onclick={loadMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        {/if}
      {/if}
    </div>

  </aside>

  <!-- Right panel -->
  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>

  </div><!-- end two-panel shell -->

</div>
