<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import Icon from '$lib/components/Icon.svelte';
  import MessageListItem from '$lib/components/MessageListItem.svelte';
  import { m } from '$lib/paraglide/messages.js';
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

  let query = $state('');
  const filteredList = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listData;
    return listData.filter(thread => {
      const from = activeTab === 'sent' ? thread.subject : resolveFrom(thread.latestFrom);
      return thread.subject.toLowerCase().includes(q) || from.toLowerCase().includes(q);
    });
  });
</script>

<div class="flex flex-col h-full gap-4">

  <!-- Header -->
  <div class="page-heading flex items-start gap-3 shrink-0">
    <Icon name="Mail" size={24} class="size-6 shrink-0 mt-0.5" />
    <div>
      <h1 class="text-2xl font-bold leading-none">{m.messages_title()}</h1>
      <p class="text-xs opacity-60 mt-0.5">{m.messages_subtitle()}</p>
    </div>
  </div>

  <!-- Two-panel shell -->
  <div class="flex flex-1 gap-4 items-stretch overflow-hidden">

  <!-- Left panel — message list -->
  <aside class="w-72 shrink-0 flex flex-col bg-base-200 border border-base-300 rounded-box overflow-hidden">

    <!-- Compose button -->
    <div class="px-3 py-3 border-b border-base-300">
      <a href="/messages/compose" class="btn btn-primary w-full">
        <Icon name="SquarePen" size={16} class="size-4" />
        <span>{m.messages_compose()}</span>
      </a>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-base-300 shrink-0">
      {#each ([['inbox', m.messages_inbox(), 'Inbox'], ['sent', m.messages_sent(), 'Send'], ['archived', m.messages_archive(), 'Archive']] as [Tab, string, string][]) as [tab, label, tabIcon]}
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors
            {activeTab === tab ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100'}"
          onclick={() => switchTab(tab)}
        >
          <Icon name={tabIcon} size={14} class="size-3.5" />
          {label}
        </button>
      {/each}
    </div>

    <!-- Search -->
    <div class="px-3 py-2 border-b border-base-300 shrink-0">
      <label class="input input-bordered input-sm flex items-center gap-2 w-full">
        <Icon name="Search" size={14} class="size-3.5 opacity-50" />
        <input type="search" placeholder={m.messages_search()} class="grow" bind:value={query} />
      </label>
    </div>

    <!-- Thread list -->
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <p class="text-xs text-center opacity-40 mt-8">{m.common_loading()}</p>
      {:else if listData.length === 0}
        <p class="text-xs text-center opacity-40 mt-8">{m.messages_none()}</p>
      {:else if filteredList.length === 0}
        <p class="text-xs text-center opacity-40 mt-8">{m.messages_no_results()}</p>
      {:else}
        {#each filteredList as thread (thread.threadId)}
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
              {loadingMore ? m.common_loading() : m.common_load_more()}
            </button>
          </div>
        {/if}
      {/if}
    </div>

  </aside>

  <!-- Right panel -->
  <div class="flex-1 min-w-0 bg-base-200 border border-base-300 rounded-box overflow-hidden flex flex-col">
    <main class="flex-1 overflow-y-auto bg-base-100">
      {@render children()}
    </main>
  </div>

  </div><!-- end two-panel shell -->

</div>
