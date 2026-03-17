<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import { SquarePen, Inbox, Send, Archive, Mail } from 'lucide-svelte';
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
  let activeTab = $state<Tab>('inbox');
  let listData = $state<Thread[]>(data.inbox as Thread[]);
  let loading = $state(false);

  async function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    activeTab = tab;
    loading = true;
    try {
      const endpoints: Record<Tab, string> = {
        inbox:    '/api/messages',
        sent:     '/api/messages/sent',
        archived: '/api/messages/archived',
      };
      const res = await fetch(endpoints[tab]);
      if (res.ok) listData = await res.json();
    } catch { /* non-fatal */ } finally {
      loading = false;
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
    <div class="flex items-center gap-2">
      <Mail class="size-5 text-primary-500" />
      <h1 class="text-2xl font-bold">Messages</h1>
    </div>
    <p class="text-sm opacity-60 mt-0.5">Inbox, sent mail, and archived conversations</p>
  </div>

  <!-- Two-panel shell -->
  <div class="flex flex-1 overflow-hidden border border-surface-200-800 rounded-container">

  <!-- Left panel — message list -->
  <aside class="w-72 shrink-0 flex flex-col border-r border-surface-200-800 overflow-hidden">

    <!-- Compose button -->
    <div class="px-3 py-3 border-b border-surface-200-800">
      <a href="/messages/compose" class="btn preset-filled-primary-500 w-full">
        <SquarePen class="size-4" />
        <span>Compose</span>
      </a>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-surface-200-800 shrink-0">
      {#each ([['inbox', 'Inbox', Inbox], ['sent', 'Sent', Send], ['archived', 'Archive', Archive]] as const) as [tab, label, Icon]}
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors
            {activeTab === tab ? 'preset-tonal-primary border-b-2 border-primary-500' : 'opacity-60 hover:opacity-100'}"
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
      {/if}
    </div>

  </aside>

  <!-- Right panel -->
  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>

  </div><!-- end two-panel shell -->

</div>
