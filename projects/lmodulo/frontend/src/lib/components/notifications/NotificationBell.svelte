<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { goto } from '$app/navigation';
  import { m } from '$lib/paraglide/messages.js';
  import {
    getUnreadCount,
    getNotifications,
    markRead,
    markAllRead,
    setRecentNotifications,
  } from '$lib/stores/notifications.svelte';
  import NotificationItem from './NotificationItem.svelte';
  import type { AppNotification } from '$lib/stores/notifications.svelte';

  let loading = $state(false);
  let detailsEl: HTMLDetailsElement = $state()!;

  const count = $derived(getUnreadCount());
  const items = $derived(getNotifications().slice(0, 10));

  async function onOpen() {
    loading = true;
    try {
      const res = await fetch('/api/notifications/recent');
      if (res.ok) {
        const data = await res.json() as AppNotification[];
        setRecentNotifications(data);
      }
    } finally {
      loading = false;
    }
  }

  async function handleItem(n: AppNotification) {
    if (!n.read) await markRead(n._id);
    detailsEl?.removeAttribute('open');
    if (n.link) goto(n.link);
  }

  async function handleMarkAll() {
    await markAllRead();
  }
</script>

<details
  class="dropdown dropdown-end"
  bind:this={detailsEl}
  ontoggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) onOpen(); }}
>
  <summary
    class="btn btn-ghost btn-sm btn-square relative"
    aria-label={m.notifications_title()}
  >
    <Icon name="Bell" size={20} class="size-5" />
    {#if count > 0}
      <span class="bg-error absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-error-content">
        {count > 99 ? '99+' : count}
      </span>
    {/if}
  </summary>

  <div class="dropdown-content card bg-base-200 border border-base-300 shadow-xl p-0 w-80 z-30 mt-1">

    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-base-300">
      <span class="text-sm font-semibold">{m.notifications_title()}</span>
      {#if count > 0}
        <button
          type="button"
          class="text-xs text-primary hover:underline"
          onclick={handleMarkAll}
        >
          {m.notifications_mark_all_read()}
        </button>
      {/if}
    </div>

    <!-- List -->
    <div class="max-h-80 overflow-y-auto">
      {#if loading}
        <div class="px-4 py-6 text-center text-sm opacity-50">{m.common_loading()}</div>
      {:else if items.length === 0}
        <div class="px-4 py-6 text-center text-sm opacity-50">{m.notifications_none()}</div>
      {:else}
        {#each items as n (n._id)}
          <NotificationItem notification={n} onclick={handleItem} />
        {/each}
      {/if}
    </div>

    <!-- Footer -->
    <div class="border-t border-base-300 px-3 py-2">
      <a
        href="/notifications"
        class="text-xs text-primary hover:underline"
        onclick={() => detailsEl?.removeAttribute('open')}
      >
        {m.notifications_view_all()}
      </a>
    </div>

  </div>
</details>
