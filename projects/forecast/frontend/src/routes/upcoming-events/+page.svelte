<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type PublicEvent = {
    id: string;
    title: string;
    content: string;
    startDate: string;
    endDate: string;
    singleDay: boolean;
  };

  const events = (data.events ?? []) as PublicEvent[];

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function fmtRange(ev: PublicEvent): string {
    const start = new Date(ev.startDate);
    if (ev.singleDay) return fmtDate(ev.startDate);
    const end = new Date(ev.endDate);
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }

  function monthLabel(iso: string): string {
    return new Date(iso).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  // Group events by month of startDate
  type Group = { month: string; items: PublicEvent[] };
  const groups = events.reduce<Group[]>((acc, ev) => {
    const month = monthLabel(ev.startDate);
    const existing = acc.find(g => g.month === month);
    if (existing) existing.items.push(ev);
    else acc.push({ month, items: [ev] });
    return acc;
  }, []);
</script>

<svelte:head><title>Upcoming Events</title></svelte:head>

<div class="max-w-3xl mx-auto px-4 py-10 space-y-10">

  <div>
    <h1 class="text-3xl font-bold">Upcoming Events</h1>
    <p class="text-sm opacity-60 mt-1">Events scheduled over the next 12 months.</p>
  </div>

  {#if groups.length === 0}
    <div class="card preset-filled-surface-100-900 p-10 text-center space-y-2">
      <p class="text-lg font-semibold opacity-50">No upcoming events scheduled.</p>
      <p class="text-sm opacity-40">Check back soon.</p>
    </div>
  {:else}
    {#each groups as group}
      <section class="space-y-4">
        <h2 class="text-xs font-semibold uppercase tracking-widest opacity-50 border-b border-surface-200-800 pb-2">{group.month}</h2>
        {#each group.items as ev}
          <article class="card preset-filled-surface-100-900 overflow-hidden">
            <div class="px-6 py-5 border-b border-surface-200-800 flex items-start gap-4">
              <!-- Date badge -->
              <div class="shrink-0 flex flex-col items-center justify-center rounded-lg preset-tonal-warning w-14 h-14">
                <span class="text-xs font-semibold uppercase opacity-70 leading-none">
                  {new Date(ev.startDate).toLocaleString('en-US', { month: 'short' })}
                </span>
                <span class="text-2xl font-bold leading-none">
                  {new Date(ev.startDate).getDate()}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold leading-tight">{ev.title}</h3>
                <p class="text-sm opacity-60 mt-0.5">{fmtRange(ev)}</p>
              </div>
            </div>
            {#if ev.content && ev.content !== '<p></p>'}
              <div class="px-6 py-5 prose prose-sm dark:prose-invert max-w-none">
                {@html ev.content}
              </div>
            {/if}
          </article>
        {/each}
      </section>
    {/each}
  {/if}

</div>
