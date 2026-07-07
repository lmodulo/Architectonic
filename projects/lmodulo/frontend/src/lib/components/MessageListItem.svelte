<script lang="ts">
  let {
    threadId,
    subject,
    latestFrom,
    latestAt,
    unreadCount = 0,
    active = false,
  }: {
    threadId: string;
    subject: string;
    latestFrom: string;
    latestAt: string | Date;
    unreadCount?: number;
    active?: boolean;
  } = $props();

  const date = $derived(() => {
    const d = new Date(latestAt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  });
</script>

<a
  href="/messages/{threadId}"
  class="flex items-start gap-3 px-4 py-3 border-b border-l-2 border-base-300 transition-colors cursor-pointer
    {active ? 'border-l-primary bg-base-300/40' : 'border-l-transparent hover:bg-base-300/40'}"
>
  <!-- Unread dot -->
  <div class="mt-1.5 shrink-0 size-2 rounded-full {unreadCount > 0 && !active ? 'bg-primary' : 'bg-transparent'}"></div>

  <div class="flex-1 min-w-0">
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-sm truncate opacity-80 {unreadCount > 0 || active ? 'font-semibold' : 'font-normal'}">
        {latestFrom}
      </span>
      <span class="text-[10px] shrink-0 opacity-50">{date()}</span>
    </div>
    <p class="text-xs truncate mt-0.5 {unreadCount > 0 && !active ? 'opacity-90' : 'opacity-50'}">{subject}</p>
  </div>

  {#if unreadCount > 0 && !active}
    <span class="shrink-0 mt-1 badge badge-primary text-[10px] px-1.5 py-0.5">
      {unreadCount}
    </span>
  {/if}
</a>
