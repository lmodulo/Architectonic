<script lang="ts">
  import { dragScroll } from '$lib/actions/dragScroll';
  export type RetainerPeriod = {
    id:             string;
    periodStart:    string;
    periodEnd:      string;
    hoursBase:      number;
    hoursRolledOver: number;
    hoursIncluded:  number;
    hoursUsed:      number;
    status:         string;
    invoiceId:      string | null;
  };

  export type RetainerSubscription = {
    rolloverEnabled: boolean;
    rolloverCap:     number | null;
    overageRate:     number | null;
    currency:        string;
  };

  let {
    period,
    history = [],
    subscription,
  }: {
    period:       RetainerPeriod;
    history?:     RetainerPeriod[];
    subscription: RetainerSubscription;
  } = $props();

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtHours(h: number) {
    return h % 1 === 0 ? `${h}` : h.toFixed(1);
  }

  const pct          = $derived(Math.min(100, (period.hoursUsed / period.hoursIncluded) * 100));
  const hoursOver    = $derived(Math.max(0, period.hoursUsed - period.hoursIncluded));
  const hoursLeft    = $derived(Math.max(0, period.hoursIncluded - period.hoursUsed));
  const isOver       = $derived(period.hoursUsed > period.hoursIncluded);
  const potentialRollover = $derived(
    subscription.rolloverEnabled
      ? Math.min(hoursLeft, subscription.rolloverCap ?? hoursLeft)
      : 0
  );

  const closedHistory = $derived(history.filter(p => p.status === 'closed'));
</script>

<div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold">{'Retainer Balance'}</h2>
    <span class="text-xs opacity-50">{fmtDate(period.periodStart)} – {fmtDate(period.periodEnd)}</span>
  </div>

  <!-- Progress bar -->
  <div class="space-y-1.5">
    <div class="flex justify-between text-xs">
      <span class={isOver ? 'text-error font-medium' : 'opacity-60'}>
        {fmtHours(period.hoursUsed)} {'hrs used'}
      </span>
      <span class="opacity-60">{fmtHours(period.hoursIncluded)} {'hrs included'}</span>
    </div>
    <div class="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
      <div
        class="h-2.5 rounded-full transition-all {isOver ? 'bg-error' : pct >= 80 ? 'bg-warning' : 'bg-success'}"
        style="width: {pct}%"
      ></div>
    </div>
    <div class="flex justify-between text-xs">
      {#if isOver}
        <span class="text-error font-medium">{fmtHours(hoursOver)} {'hrs over retainer'}</span>
        {#if subscription.overageRate != null}
          <span class="opacity-50">
            ~{new Intl.NumberFormat('en-US', { style: 'currency', currency: subscription.currency }).format(hoursOver * subscription.overageRate)} {'overage'}
          </span>
        {/if}
      {:else}
        <span class="text-success">{fmtHours(hoursLeft)} {'hrs remaining'}</span>
        {#if subscription.rolloverEnabled && potentialRollover > 0}
          <span class="opacity-50">up to {fmtHours(potentialRollover)} {'hrs will roll over'}</span>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Stats row -->
  <div class="grid grid-cols-3 gap-3 text-xs text-center">
    <div class="bg-base-300/40 rounded p-2">
      <div class="font-semibold text-sm">{fmtHours(period.hoursBase)}</div>
      <div class="opacity-50">{'Base hrs'}</div>
    </div>
    {#if period.hoursRolledOver > 0}
      <div class="bg-base-300/40 rounded p-2">
        <div class="font-semibold text-sm">{fmtHours(period.hoursRolledOver)}</div>
        <div class="opacity-50">{'Rolled over'}</div>
      </div>
    {:else}
      <div class="bg-base-300/40 rounded p-2">
        <div class="font-semibold text-sm">{fmtHours(period.hoursIncluded)}</div>
        <div class="opacity-50">{'Included'}</div>
      </div>
    {/if}
    <div class="bg-base-300/40 rounded p-2">
      <div class="font-semibold text-sm {isOver ? 'text-error' : ''}">{fmtHours(period.hoursUsed)}</div>
      <div class="opacity-50">{'Used'}</div>
    </div>
  </div>

  <!-- History table -->
  {#if closedHistory.length > 0}
    <div class="space-y-2 pt-2 border-t border-base-300">
      <p class="text-xs font-medium opacity-50 uppercase tracking-wide">{'Period History'}</p>
      <div use:dragScroll class="table-scroll">
      <table class="table table-xs w-full">
        <thead>
          <tr class="bg-base-300/30 text-xs">
            <th>{'Period'}</th>
            <th class="text-right">{'Included'}</th>
            <th class="text-right">{'Used'}</th>
            <th class="text-right">{'+/−'}</th>
            <th class="text-right">{'Rolled'}</th>
          </tr>
        </thead>
        <tbody>
          {#each closedHistory as p (p.id)}
            {@const over = p.hoursUsed - p.hoursIncluded}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
              <td class="text-xs opacity-60">
                {fmtDate(p.periodStart)}
              </td>
              <td class="text-right text-xs">{fmtHours(p.hoursIncluded)}</td>
              <td class="text-right text-xs">{fmtHours(p.hoursUsed)}</td>
              <td class="text-right text-xs {over > 0 ? 'text-error' : 'text-success'}">
                {over > 0 ? '+' : ''}{fmtHours(over)}
              </td>
              <td class="text-right text-xs opacity-60">{fmtHours(p.hoursRolledOver)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    </div>
  {/if}
</div>
