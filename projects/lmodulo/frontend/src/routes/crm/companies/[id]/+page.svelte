<script lang="ts">
  import { goto } from '$app/navigation';
  import { Pencil, X, Check, Milestone, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import { dragScroll } from '$lib/actions/dragScroll';
  import {
    COMPANY_TYPES, COMPANY_INDUSTRIES, COMPANY_SIZES, CRM_LEVEL,
    CONTACT_STATUS_COLOR, STAGE_COLOR, fmtCurrency, fmtDate,
    type CrmCompany, type CrmContact, type CrmDeal, type CrmActivity,
  } from '$lib/utils/crm';
  import {
    STATUS_COLOR, PRIORITY_COLOR, fmtDateRange, fmtEffort,
    type AgileMilestone,
  } from '$lib/utils/agile';
  import Breadcrumb from '$lib/components/crm/Breadcrumb.svelte';
  import HealthScoreBar from '$lib/components/crm/HealthScoreBar.svelte';
  import ActivityItem from '$lib/components/crm/ActivityItem.svelte';

  let { data }: { data: PageData } = $props();

  let company    = $state<CrmCompany>(data.company as CrmCompany);
  let contacts   = $state<CrmContact[]>((data.contacts ?? []) as CrmContact[]);
  let deals      = $state<CrmDeal[]>((data.deals ?? []) as CrmDeal[]);
  let activities = $state<CrmActivity[]>((data.activities ?? []) as CrmActivity[]);
  let milestones = $state<AgileMilestone[]>((data.milestones ?? []) as AgileMilestone[]);

  const clientEstHours    = $derived(data.clientTotalEstimatedHours ?? 0);
  const clientActHours    = $derived(data.clientTotalActualHours    ?? 0);
  const clientBillableMins= $derived(data.clientBillableMinutes     ?? 0);

  let activeTab = $state<'contacts' | 'deals' | 'activities' | 'projects'>('contacts');

  let editing   = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({ ...company });

  function startEdit() { form = { ...company }; editing = true; saveError = ''; }

  async function saveEdit() {
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/crm/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name, domain: form.domain, website: form.website,
          description: form.description, industry: form.industry,
          size: form.size, type: form.type,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); saveError = (d as any).message ?? 'Save failed'; return; }
      company = { ...company, ...form };
      editing = false;
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }

  async function markActivityComplete(id: string) {
    const res = await fetch(`/api/crm/activities/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      activities = activities.map(a => a.id === id ? { ...a, completedAt: new Date().toISOString() } : a);
    }
  }

  const crumbs = [
    { label: 'Nexus', href: '/crm', colorClass: 'badge-ghost' },
    { label: company.name, colorClass: CRM_LEVEL.company.badge },
  ];

  const totalDealValue = $derived(
    deals.filter(d => d.stage !== 'Closed Lost').reduce((s, d) => s + (d.value ?? 0), 0)
  );

  const PRIORITY_WEIGHT: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, None: 0 };

  let msSortField = $state('title');
  let msSortDir   = $state<'asc' | 'desc'>('asc');

  function toggleMsSort(field: string) {
    if (msSortField === field) msSortDir = msSortDir === 'asc' ? 'desc' : 'asc';
    else { msSortField = field; msSortDir = 'asc'; }
  }

  const sortedMilestones = $derived.by(() => {
    return [...milestones].sort((a: any, b: any) => {
      let av: any, bv: any;
      if      (msSortField === 'title')              { av = a.title                 ?? ''; bv = b.title                 ?? ''; }
      else if (msSortField === 'status')             { av = a.status                ?? ''; bv = b.status                ?? ''; }
      else if (msSortField === 'priority')           { av = PRIORITY_WEIGHT[a.priority] ?? 0; bv = PRIORITY_WEIGHT[b.priority] ?? 0; }
      else if (msSortField === 'completionPct')      { av = a.completionPct         ?? 0;  bv = b.completionPct         ?? 0; }
      else if (msSortField === 'totalEstimatedHours'){ av = a.totalEstimatedHours   ?? 0;  bv = b.totalEstimatedHours   ?? 0; }
      else if (msSortField === 'totalActualHours')   { av = a.totalActualHours      ?? 0;  bv = b.totalActualHours      ?? 0; }
      else if (msSortField === 'startDate')          { av = a.startDate             ?? ''; bv = b.startDate             ?? ''; }
      else return 0;
      if (av < bv) return msSortDir === 'asc' ? -1 : 1;
      if (av > bv) return msSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  });
</script>

<svelte:head><title>{company.name} — Nexus</title></svelte:head>

<div class="space-y-6">
  <Breadcrumb {crumbs} />

  <div class="flex items-start justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold">{company.name}</h2>
      <p class="text-sm opacity-50">{company.industry} · {company.size} employees · {company.type}</p>
    </div>
    <div class="flex gap-2 items-center">
      <div class="w-32"><HealthScoreBar score={company.healthScore ?? 0} /></div>
      {#if hasPermission(data.user, 'crm_companies', 'update') && !editing}
        <button class="btn btn-ghost btn-sm" onclick={startEdit}><Pencil class="size-4" /> Edit</button>
      {/if}
    </div>
  </div>

  {#if editing}
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Name</label>
          <input type="text" class="input w-full" bind:value={form.name} />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Domain</label>
          <input type="text" class="input w-full" bind:value={form.domain} />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Industry</label>
          <select class="select w-full" bind:value={form.industry}>
            {#each COMPANY_INDUSTRIES as i}<option value={i}>{i}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Size</label>
          <select class="select w-full" bind:value={form.size}>
            {#each COMPANY_SIZES as s}<option value={s}>{s}</option>{/each}
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Type</label>
          <select class="select w-full" bind:value={form.type}>
            {#each COMPANY_TYPES as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = false)}>
          <X class="size-4" /> Cancel
        </button>
        <button type="button" class="btn btn-primary btn-sm" disabled={saving} onclick={saveEdit}>
          <Check class="size-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  {:else}
    <div class="grid lg:grid-cols-3 gap-4 text-sm">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        {#if company.website}
          <div class="flex items-center justify-between"><span class="opacity-50">Website</span><a href={company.website} target="_blank" class="text-primary hover:underline truncate max-w-[200px]">{company.website}</a></div>
        {/if}
        {#if company.domain}
          <div class="flex items-center justify-between"><span class="opacity-50">Domain</span><span>{company.domain}</span></div>
        {/if}
        <div class="flex items-center justify-between"><span class="opacity-50">Added</span><span>{fmtDate(company.createdAt)}</span></div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <div class="flex items-center justify-between"><span class="opacity-50">Open Pipeline</span><span class="font-medium text-success">{fmtCurrency(totalDealValue)}</span></div>
        <div class="flex items-center justify-between"><span class="opacity-50">Contacts</span><span>{contacts.length}</span></div>
        <div class="flex items-center justify-between"><span class="opacity-50">Deals</span><span>{deals.length}</span></div>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="opacity-50 text-xs mb-1">Health Score</p>
        <p class="text-3xl font-bold">{company.healthScore ?? 0}</p>
        <HealthScoreBar score={company.healthScore ?? 0} showLabel={false} />
      </div>
    </div>
  {/if}

  <!-- Tabs -->
  <div class="space-y-4">
    <div use:dragScroll class="tab-scroll flex gap-1 border-b border-base-200">
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'contacts' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => activeTab = 'contacts'}
      >Contacts ({contacts.length})</button>
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'deals' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => activeTab = 'deals'}
      >Deals ({deals.length})</button>
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'activities' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => activeTab = 'activities'}
      >Activities ({activities.length})</button>
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'projects' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => activeTab = 'projects'}
      >Projects ({milestones.length})</button>
    </div>

    {#if activeTab === 'contacts'}
      <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
        {#if contacts.length === 0}
          <p class="text-xs opacity-40">No contacts yet.</p>
        {:else}
          {#each contacts as contact (contact.id)}
            <button
              type="button"
              class="w-full text-left flex items-center justify-between gap-2 py-1.5 text-sm border-b border-base-300/50 last:border-0 hover:opacity-80"
              onclick={() => goto(`/crm/contacts/${contact.id}`)}
            >
              <span class="font-medium">{contact.firstName} {contact.lastName}</span>
              <div class="flex items-center gap-2">
                <span class="badge badge-xs badge-ghost">{contact.role}</span>
                <span class="badge badge-xs {CONTACT_STATUS_COLOR[contact.status] ?? 'badge-ghost'}">{contact.status}</span>
              </div>
            </button>
          {/each}
        {/if}
      </section>

    {:else if activeTab === 'deals'}
      <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
        {#if deals.length === 0}
          <p class="text-xs opacity-40">No deals yet.</p>
        {:else}
          {#each deals as deal (deal.id)}
            <button
              type="button"
              class="w-full text-left flex items-center justify-between gap-2 py-1.5 text-sm border-b border-base-300/50 last:border-0 hover:opacity-80"
              onclick={() => goto(`/crm/deals/${deal.id}`)}
            >
              <span class="font-medium truncate">{deal.title}</span>
              <div class="flex items-center gap-2 shrink-0">
                <span class="badge badge-xs {STAGE_COLOR[deal.stage] ?? 'badge-ghost'}">{deal.stage}</span>
                <span class="text-xs text-success">{fmtCurrency(deal.value)}</span>
              </div>
            </button>
          {/each}
        {/if}
      </section>

    {:else if activeTab === 'activities'}
      <section class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-1">
        {#if activities.length === 0}
          <p class="text-xs opacity-40">No activities logged.</p>
        {:else}
          {#each activities as activity (activity.id)}
            <ActivityItem
              {activity}
              onComplete={hasPermission(data.user, 'crm_activities', 'update') ? markActivityComplete : undefined}
            />
          {/each}
        {/if}
      </section>

    {:else if activeTab === 'projects'}
      <section class="space-y-4">
        {#if milestones.length > 0}
          <div class="flex items-center gap-6 text-sm opacity-60 px-1">
            <span>{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
            <span>{fmtEffort(clientEstHours)} estimated</span>
            <span>{fmtEffort(clientActHours)} actual</span>
            <span>{Math.round(clientBillableMins / 60 * 10) / 10}h billable</span>
          </div>
        {/if}
        <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
          {#if milestones.length === 0}
            <div class="p-8 text-center">
              <Milestone class="size-8 opacity-20 mx-auto mb-2" />
              <p class="text-sm opacity-40">No milestones linked to this company.</p>
              <p class="text-xs opacity-30 mt-1">Link a client from the Agile → Milestone detail page.</p>
            </div>
          {:else}
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-300/30">
                  {#snippet sortTh(label: string, field: string, cls = '')}
                    <th class="text-xs font-medium opacity-60 uppercase tracking-wide {cls}">
                      <button type="button" class="flex items-center gap-1 hover:opacity-80 transition-opacity {cls.includes('text-right') ? 'ml-auto' : ''}" onclick={() => toggleMsSort(field)}>
                        {label}
                        {#if msSortField === field}
                          {#if msSortDir === 'asc'}<ChevronUp class="size-3 opacity-70" />{:else}<ChevronDown class="size-3 opacity-70" />{/if}
                        {:else}
                          <ChevronsUpDown class="size-3 opacity-30" />
                        {/if}
                      </button>
                    </th>
                  {/snippet}
                  {@render sortTh('Milestone', 'title')}
                  {@render sortTh('Status',    'status')}
                  {@render sortTh('Priority',  'priority',           'hidden md:table-cell')}
                  {@render sortTh('Progress',  'completionPct',      'text-right hidden lg:table-cell')}
                  {@render sortTh('Est',       'totalEstimatedHours','text-right hidden lg:table-cell')}
                  {@render sortTh('Actual',    'totalActualHours',   'text-right hidden lg:table-cell')}
                  {@render sortTh('Dates',     'startDate',          'text-right hidden xl:table-cell')}
                </tr>
              </thead>
              <tbody>
                {#each sortedMilestones as m (m.id)}
                  <tr
                    class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
                    onclick={() => goto(`/agile/milestones/${m.id}`)}
                  >
                    <td class="font-medium">{m.title}</td>
                    <td><span class="badge badge-xs {STATUS_COLOR[m.status] ?? 'badge-ghost'}">{m.status}</span></td>
                    <td class="px-4 py-3 hidden md:table-cell"><span class="badge badge-xs {PRIORITY_COLOR[m.priority] ?? 'badge-ghost'}">{m.priority}</span></td>
                    <td class="text-right hidden lg:table-cell">{Math.round(m.completionPct ?? 0)}%</td>
                    <td class="text-right hidden lg:table-cell opacity-70">{fmtEffort(m.totalEstimatedHours ?? 0)}</td>
                    <td class="text-right hidden lg:table-cell opacity-70">{fmtEffort(m.totalActualHours ?? 0)}</td>
                    <td class="text-right hidden xl:table-cell opacity-50 text-xs">{fmtDateRange(m.startDate ?? null, m.endDate ?? null)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      </section>
    {/if}
  </div>
</div>
