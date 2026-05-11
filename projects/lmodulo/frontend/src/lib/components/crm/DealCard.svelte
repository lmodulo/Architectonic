<script lang="ts">
  import { STAGE_COLOR, fmtCurrency, fmtDate, type CrmDeal } from '$lib/utils/crm';

  let {
    deal,
    draggable = false,
    ondragstart,
    onclick,
  }: {
    deal: CrmDeal;
    draggable?: boolean;
    ondragstart?: (e: DragEvent) => void;
    onclick?: () => void;
  } = $props();
</script>

<div
  class="card bg-base-100 border border-base-300 rounded-box px-3 py-2.5 shadow-sm
    hover:shadow-md transition-shadow select-none"
  class:cursor-grab={draggable}
  class:cursor-pointer={!draggable && !!onclick}
  {draggable}
  ondragstart={ondragstart}
  role={onclick ? 'button' : undefined}
  tabindex={onclick ? 0 : undefined}
  onclick={onclick}
  onkeydown={onclick ? (e) => e.key === 'Enter' && onclick?.() : undefined}
>
  <div class="font-medium text-sm leading-snug mb-1">{deal.title}</div>
  {#if deal.companyName}
    <div class="text-xs opacity-50 mb-2">{deal.companyName}</div>
  {/if}
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <span class="font-bold text-sm text-success">{fmtCurrency(deal.value, deal.currency)}</span>
    <span class="badge badge-xs {STAGE_COLOR[deal.stage] ?? 'badge-ghost'}">{deal.probability}%</span>
  </div>
  {#if deal.expectedCloseDate}
    <div class="text-xs opacity-40 mt-1">Close {fmtDate(deal.expectedCloseDate)}</div>
  {/if}
</div>
