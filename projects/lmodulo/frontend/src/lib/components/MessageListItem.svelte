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
  class="flex items-start gap-3 px-4 py-3 border-b border-base-300 transition-colors cursor-pointer
    {active ? 'bg-primary text-primary-content' : 'hover:bg-base-300/50'}"
>
  <!-- Unread dot -->
  <div class="mt-1.5 shrink-0 size-2 rounded-full {unreadCount > 0 ? (active ? 'bg-primary-content opacity-60' : 'bg-primary') : 'bg-transparent'}"></div>

  <div class="flex-1 min-w-0">
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-sm truncate {unreadCount > 0 ? 'font-semibold' : 'font-normal'} {active ? 'opacity-100' : 'opacity-80'}">
        {latestFrom}
      </span>
      <span class="text-[10px] shrink-0 {active ? 'opacity-70' : 'opacity-50'}">{date()}</span>
    </div>
    <p class="text-xs truncate mt-0.5 {active ? 'opacity-80' : (unreadCount > 0 ? 'opacity-90' : 'opacity-50')}">{subject}</p>
  </div>

  {#if unreadCount > 0 && !active}
    <span class="shrink-0 mt-1 badge badge-primary text-[10px] px-1.5 py-0.5">
      {unreadCount}
    </span>
  {/if}
</a>
