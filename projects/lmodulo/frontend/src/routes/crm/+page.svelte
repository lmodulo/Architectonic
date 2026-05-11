<script lang="ts">
  import { TrendingUp, Users, Building2, Calendar, DollarSign } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import {
    DEAL_STAGES, fmtCurrency, fmtDate, type CrmDeal, type CrmActivity,
  } from '$lib/utils/crm';
  import ActivityItem from '$lib/components/crm/ActivityItem.svelte';
  import PipelineFunnel from '$lib/components/crm/PipelineFunnel.svelte';

  let { data }: { data: PageData } = $props();

  const deals      = $derived<CrmDeal[]>(data.deals ?? []);
  const activities = $derived<CrmActivity[]>(data.activities ?? []);

  const role    = $derived(data.user?.role ?? '');
  const isAdmin = $derived(['owner', 'admin'].includes(role));

  const openDeals       = $derived(deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'));
  const totalPipeline   = $derived(openDeals.reduce((s, d) => s + (d.value ?? 0), 0));
  const wonDeals        = $derived(deals.filter(d => d.stage === 'Closed Won'));
  const wonValue        = $derived(wonDeals.reduce((s, d) => s + (d.value ?? 0), 0));

  const now      = new Date();
  const weekAgo  = new Date(now.getTime() - 7 * 86400000);
  const weekActs = $derived(activities.filter(a => a.createdAt && new Date(a.createdAt) >= weekAgo));
</script>

<svelte:head><title>Nexus CRM</title></svelte:head>

<div class="space-y-8">

  <!-- KPI row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-primary/15"><TrendingUp class="size-4 text-primary"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Open Deals</p>
        <p class="text-2xl font-bold">{openDeals.length}</p>
        <p class="text-xs opacity-40">{fmtCurrency(totalPipeline)} pipeline</p>
      </div>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-success/15"><DollarSign class="size-4 text-success"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Closed Won</p>
        <p class="text-2xl font-bold">{wonDeals.length}</p>
        <p class="text-xs opacity-40">{fmtCurrency(wonValue)} closed</p>
      </div>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-accent/15"><Calendar class="size-4 text-accent"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Activities This Week</p>
        <p class="text-2xl font-bold">{weekActs.length}</p>
        <p class="text-xs opacity-40">{activities.length} total recent</p>
      </div>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-secondary/15"><Building2 class="size-4 text-secondary"/></div>
      <div>
        <p class="text-xs opacity-60 uppercase tracking-wide font-medium">Pipeline Stages</p>
        <p class="text-2xl font-bold">{DEAL_STAGES.length - 2}</p>
        <p class="text-xs opacity-40">active stages</p>
      </div>
    </div>
  </div>

  <!-- Two-column: funnel + recent activities -->
  <div class="grid lg:grid-cols-2 gap-6">
    <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-3">
      <h2 class="text-sm font-semibold">Pipeline by Stage</h2>
      {#if deals.length === 0}
        <p class="text-sm opacity-40 py-6 text-center">No deals yet.</p>
      {:else}
        <PipelineFunnel {deals} />
      {/if}
    </section>

    <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-1">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm font-semibold">Recent Activities</h2>
        <a href="/crm/activities" class="text-xs opacity-50 hover:opacity-100">View all →</a>
      </div>
      {#if activities.length === 0}
        <p class="text-sm opacity-40 py-6 text-center">No activities yet.</p>
      {:else}
        {#each activities.slice(0, 8) as activity (activity.id)}
          <ActivityItem {activity} />
        {/each}
      {/if}
    </section>
  </div>

</div>
