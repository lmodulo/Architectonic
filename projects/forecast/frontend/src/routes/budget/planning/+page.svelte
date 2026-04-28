<script lang="ts">
  import { TrendingUp, Zap, Calendar } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { LayoutData } from './$types';

  let { data }: { data: LayoutData } = $props();
</script>

<div class="p-6 space-y-6">
  <h1 class="text-2xl font-semibold">Planning</h1>
  <p class="opacity-60">Tools to forecast your finances and automate transaction management.</p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
    {#if hasPermission(data.user, 'budget_planning', 'read')}
      <a href="/budget/planning/cashflow" class="card p-6 hover:shadow-md transition-shadow space-y-3">
        <TrendingUp size={28} class="text-primary-500" />
        <h2 class="font-semibold text-lg">Cash Flow Projections</h2>
        <p class="text-sm opacity-60">
          12-month forward balance forecast based on your income patterns, recurring expenses,
          and known bills.
        </p>
        <p class="text-xs text-primary-500 font-medium">View projections →</p>
      </a>

      <a href="/budget/planning/rules" class="card p-6 hover:shadow-md transition-shadow space-y-3">
        <Zap size={28} class="text-primary-500" />
        <h2 class="font-semibold text-lg">Automation Rules</h2>
        <p class="text-sm opacity-60">
          Create rules to automatically categorize, tag, and annotate transactions
          as they arrive from your bank.
        </p>
        <p class="text-xs text-primary-500 font-medium">Manage rules →</p>
      </a>

      <a href="/budget/planning/bills" class="card p-6 hover:shadow-md transition-shadow space-y-3">
        <Calendar size={28} class="text-primary-500" />
        <h2 class="font-semibold text-lg">Bill Tracking</h2>
        <p class="text-sm opacity-60">
          Automatically detected recurring payments with upcoming due date alerts
          to help avoid late fees.
        </p>
        <p class="text-xs text-primary-500 font-medium">View bills →</p>
      </a>
    {:else}
      <p class="opacity-50 col-span-3 text-center py-12">
        You don't have permission to access Planning.
      </p>
    {/if}
  </div>
</div>
