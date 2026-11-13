<script lang="ts">
  import { COMPANY_TYPE_COLOR, type CrmCompany } from '$lib/utils/crm';
  import HealthScoreBar from './HealthScoreBar.svelte';

  let {
    company,
    onclick,
  }: {
    company: CrmCompany;
    onclick?: () => void;
  } = $props();
</script>

<button
  type="button"
  class="w-full text-left card bg-base-200 border border-base-300 rounded-box px-4 py-3
    hover:bg-base-300/60 transition-colors cursor-pointer"
  {onclick}
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-medium text-sm">{company.name}</span>
        <span class="badge badge-xs badge-ghost">{company.industry}</span>
        <span class="badge badge-xs {COMPANY_TYPE_COLOR[company.type] ?? 'badge-ghost'}">{company.type}</span>
      </div>
      <div class="flex items-center gap-3 mt-1 text-xs opacity-50 flex-wrap">
        {#if company.domain}
          <span>{company.domain}</span>
        {/if}
        {#if company.size}
          <span>{company.size} employees</span>
        {/if}
        {#if company.dealCount !== undefined}
          <span>{company.dealCount} deal{company.dealCount !== 1 ? 's' : ''}</span>
        {/if}
      </div>
    </div>
    <div class="shrink-0 w-28">
      <HealthScoreBar score={company.healthScore ?? 0} />
    </div>
  </div>
</button>
