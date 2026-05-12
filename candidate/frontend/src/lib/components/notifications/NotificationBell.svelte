<script lang="ts">
  import { Bell } from 'lucide-svelte';
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

  const count = $derived(getUnreadCount());
  const items = $derived(getNotifications().slice(0, 10));

  async function open() {
    dropdownOpen = true;
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

  function close() {
    dropdownOpen = false;
  }

  async function handleItem(n: AppNotification) {
    close();
    if (!n.read) await markRead(n._id);
    if (n.link) goto(n.link);
  }

  async function handleMarkAll() {
    await markAllRead();
  }
</script>

<!-- Use DaisyUI dropdown (CSS focus-based) with onclick to trigger fetch -->
<div class="dropdown dropdown-end">
  <div
    tabindex="0"
    role="button"
    class="btn btn-ghost btn-circle btn-sm relative"
    aria-label="Notifications"
    onclick={open}
  >
    <Bell class="size-5" />
    {#if count > 0}
      <span class="bg-error absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white">
        {count > 99 ? '99+' : count}
      </span>
    {/if}
  </div>

  <div tabindex="0" class="dropdown-content bg-base-100 rounded-box border border-base-200 shadow-xl w-80 z-30 mt-1">

    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-base-200">
      <span class="text-sm font-semibold">Notifications</span>
      {#if count > 0}
        <button type="button" class="text-xs text-primary hover:underline" onclick={handleMarkAll}>
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
          <NotificationItem notification={n} onclick={handleItem} />
        {/each}
      {/if}
    </div>

    <!-- Footer -->
    <div class="border-t border-base-200 px-3 py-2">
      <a href="/notifications" class="text-xs text-primary hover:underline" onclick={close}>
        View all notifications →
      </a>
    </div>
  </div>
</div>
