<script lang="ts">
  import { goto } from '$app/navigation';
  import { Bell } from 'lucide-svelte';
  import NotificationItem from '$lib/components/notifications/NotificationItem.svelte';
  import { markRead, setRecentNotifications } from '$lib/stores/notifications.svelte';
  import type { AppNotification } from '$lib/stores/notifications.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let items     = $state<AppNotification[]>(data.items as AppNotification[]);
  let loading   = $state(false);
  let curPage   = $state(data.page as number);
  let totalPages = $state(data.pages as number);
  let filter    = $state((data.filter as string) ?? 'all');

  async function setFilter(f: string) {
    filter = f;
    goto(`/notifications?filter=${f}`, { replaceState: true });
    await loadPage(1);
  }

  async function loadPage(p: number) {
    loading = true;
    try {
      const res  = await fetch(`/api/notifications?filter=${filter}&page=${p}`);
      if (res.ok) {
        const d = await res.json() as { items: AppNotification[]; total: number; page: number; pages: number };
        items = p === 1 ? d.items : [...items, ...d.items];
        curPage    = d.page;
        totalPages = d.pages;
      }
    } finally {
      loading = false;
    }
  }

  async function handleItem(n: AppNotification) {
    if (!n.read) {
      await markRead(n._id);
      items = items.map(x => x._id === n._id ? { ...x, read: true } : x);
    }
    if (n.link) goto(n.link);
  }

  async function handleMarkAll() {
    const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
    if (res.ok) {
      items = items.map(x => ({ ...x, read: true }));
      setRecentNotifications(items);
    }
  }
</script>

<svelte:head>
  <title>Notifications</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Bell class="size-5 text-primary" />
      <h1 class="text-xl font-semibold">Notifications</h1>
    </div>
    <div class="flex items-center gap-3">
      <a href="/notifications/settings" class="text-sm text-primary hover:underline">Preferences</a>
      {#if items.some(n => !n.read)}
        <button type="button" class="text-sm text-primary hover:underline" onclick={handleMarkAll}>
          Mark all read
        </button>
      {/if}
    </div>
  </div>

  <!-- Filter tabs -->
  <div class="flex gap-1 border-b border-base-200">
    {#each ['all', 'unread'] as f}
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
          {filter === f ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}"
        onclick={() => setFilter(f)}
      >
        {f === 'all' ? 'All' : 'Unread'}
      </button>
    {/each}
  </div>

  <!-- List -->
  <div class="bg-base-100 border border-base-200 rounded-box divide-y divide-base-200">
    {#if items.length === 0 && !loading}
      <div class="py-12 text-center opacity-50">
        <Bell class="size-8 mx-auto mb-2" />
        <p class="text-sm">No notifications</p>
      </div>
    {:else}
      {#each items as n (n._id)}
        <NotificationItem notification={n} onclick={handleItem} />
      {/each}
    {/if}

    {#if loading}
      <div class="py-4 text-center text-sm opacity-50">Loading…</div>
    {/if}
  </div>

  {#if curPage < totalPages && !loading}
    <div class="text-center">
      <button type="button" class="btn btn-ghost btn-sm" onclick={() => loadPage(curPage + 1)}>
        Load more
      </button>
    </div>
  {/if}
</div>
