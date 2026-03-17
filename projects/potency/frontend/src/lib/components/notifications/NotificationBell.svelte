<script lang="ts">
  import { Bell } from 'lucide-svelte';
  import { Menu as SkMenu } from '@skeletonlabs/skeleton-svelte';
  import { goto } from '$app/navigation';
  import {
    getUnreadCount,
    getNotifications,
    markRead,
    markAllRead,
    setRecentNotifications,
  } from '$lib/stores/notifications.svelte';
  import NotificationItem from './NotificationItem.svelte';
  import type { AppNotification } from '$lib/stores/notifications.svelte';

  let dropdownOpen = $state(false);
  let loading      = $state(false);

  const count   = $derived(getUnreadCount());
  const items   = $derived(getNotifications().slice(0, 10));

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
    if (n.link) goto(n.link);
  }

  async function handleMarkAll() {
    await markAllRead();
  }
</script>

<SkMenu positioning={{ placement: 'bottom-end' }}>
  <SkMenu.Trigger
    class="btn-icon hover:preset-tonal relative"
    aria-label="Notifications"
    onclick={onOpen}
  >
    <Bell class="size-5" />
    {#if count > 0}
      <span class="preset-filled-error-500 absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white">
        {count > 99 ? '99+' : count}
      </span>
    {/if}
  </SkMenu.Trigger>

  <SkMenu.Positioner>
    <SkMenu.Content class="card preset-filled-surface-100-900 border border-surface-200-800 shadow-xl p-0 w-80 z-30">

      <!-- Header -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-surface-200-800">
        <span class="text-sm font-semibold">Notifications</span>
        {#if count > 0}
          <button
            type="button"
            class="text-xs text-primary-500 hover:underline"
            onclick={handleMarkAll}
          >
            Mark all read
          </button>
        {/if}
      </div>

      <!-- List -->
      <div class="max-h-80 overflow-y-auto">
        {#if loading}
          <div class="px-4 py-6 text-center text-sm opacity-50">Loading…</div>
        {:else if items.length === 0}
          <div class="px-4 py-6 text-center text-sm opacity-50">No notifications</div>
        {:else}
          {#each items as n (n._id)}
            <SkMenu.Item
              value={n._id}
              onclick={() => handleItem(n)}
              class="p-0 block"
            >
              <NotificationItem notification={n} />
            </SkMenu.Item>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="border-t border-surface-200-800 px-3 py-2">
        <a
          href="/notifications"
          class="text-xs text-primary-500 hover:underline"
        >
          View all notifications →
        </a>
      </div>

    </SkMenu.Content>
  </SkMenu.Positioner>
</SkMenu>
