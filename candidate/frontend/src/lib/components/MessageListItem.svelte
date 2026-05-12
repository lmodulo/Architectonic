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
  class="flex items-start gap-3 px-4 py-3 border-b border-base-200 transition-colors cursor-pointer
    {active ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'}"
>
  <div class="mt-1.5 shrink-0 size-2 rounded-full {unreadCount > 0 ? 'bg-primary' : 'bg-transparent'}"></div>

  <div class="flex-1 min-w-0">
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-sm truncate {unreadCount > 0 ? 'font-semibold' : 'font-normal opacity-80'}">
        {latestFrom}
      </span>
      <span class="text-[10px] opacity-50 shrink-0">{date()}</span>
    </div>
    <p class="text-xs truncate mt-0.5 {unreadCount > 0 ? 'opacity-90' : 'opacity-50'}">{subject}</p>
  </div>

  {#if unreadCount > 0}
    <span class="shrink-0 mt-1 bg-primary min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white">
      {unreadCount}
    </span>
  {/if}
</a>
