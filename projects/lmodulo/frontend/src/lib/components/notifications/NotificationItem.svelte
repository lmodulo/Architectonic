<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import type { AppNotification } from '$lib/stores/notifications.svelte';

  let { notification, onclick }: {
    notification: AppNotification;
    onclick?: (n: AppNotification) => void;
  } = $props();

  function iconFor(type: string): string {
    if (type.startsWith('message.'))   return 'Mail';
    if (type.startsWith('auth.') || type.startsWith('account.')) return 'ShieldCheck';
    if (type.startsWith('role.') || type.startsWith('rbac.'))    return 'Users';
    if (type.startsWith('order.'))     return 'ShoppingCart';
    if (type.startsWith('product.') || type.startsWith('stock.')) return 'Package';
    if (type.startsWith('agile_'))    return 'Layers';
    return 'Bell';
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    if (mins < 1)   return m.time_just_now();
    if (mins < 60)  return m.time_mins_ago({ count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return m.time_hours_ago({ count: hours });
    const days  = Math.floor(hours / 24);
    return m.time_days_ago({ count: days });
  }

  const iconName = $derived(iconFor(notification.type));
</script>

<button
  type="button"
  class="w-full flex items-start gap-3 px-3 py-2.5 rounded text-left transition-colors
    {notification.read ? 'hover:bg-base-300/50 opacity-70' : 'hover:bg-primary/10'}"
  onclick={() => onclick?.(notification)}
>
  <div class="mt-0.5 shrink-0 {notification.read ? 'opacity-50' : 'text-primary'}">
    <Icon name={iconName} size={16} class="size-4" />
  </div>

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-1.5">
      {#if !notification.read}
        <span class="size-1.5 rounded-full bg-primary shrink-0"></span>
      {/if}
      <p class="text-sm font-medium truncate">{notification.title}</p>
    </div>
    {#if notification.body}
      <p class="text-xs opacity-60 truncate mt-0.5">{notification.body}</p>
    {/if}
    <p class="text-xs opacity-40 mt-0.5">{timeAgo(notification.createdAt)}</p>
  </div>
</button>
