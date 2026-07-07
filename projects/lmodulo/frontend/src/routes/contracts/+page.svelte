<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { hasPermission } from '$lib/permissions';
  import { Plus, Building2, DollarSign, FileSignature, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const STATUS_FILTERS = [
    { value: '',                    label: 'All' },
    { value: 'draft',               label: 'Draft' },
    { value: 'pending_signature',   label: 'Pending Signature' },
    { value: 'signed',              label: 'Signed' },
    { value: 'active',              label: 'Active' },
    { value: 'expired',             label: 'Expired' },
    { value: 'voided',              label: 'Voided' },
  ];

  const TYPE_LABELS: Record<string, string> = {
    msa:    'MSA',
    sow:    'SOW',
    nda:    'NDA',
    custom: 'Custom',
  };

  const STATUS_COLORS: Record<string, string> = {
    draft:              'badge-ghost',
    pending_signature:  'badge-warning',
    signed:             'badge-success',
    active:             'badge-primary',
    expired:            'badge-error',
    voided:             'badge-neutral',
  };

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtCurrency(v: number | null, currency = 'USD') {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);
  }

  const PAGE_SIZE = 25;
  let currentPage = $state(1);

  let sortField = $state('updatedAt');
  let sortDir   = $state<'asc' | 'desc'>('desc');

  function toggleSort(field: string) {
    if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortField = field; sortDir = 'asc'; }
  }

  const sorted = $derived.by(() => {
    return [...data.contracts].sort((a: any, b: any) => {
      let av: any, bv: any;
      if      (sortField === 'title')     { av = a.title ?? '';        bv = b.title ?? ''; }
      else if (sortField === 'type')      { av = a.type ?? '';         bv = b.type ?? ''; }
      else if (sortField === 'company')   { av = a.companyName ?? '';  bv = b.companyName ?? ''; }
      else if (sortField === 'value')     { av = a.value ?? 0;         bv = b.value ?? 0; }
      else if (sortField === 'updatedAt') { av = a.updatedAt ?? '';    bv = b.updatedAt ?? ''; }
      else if (sortField === 'status')    { av = a.status ?? '';       bv = b.status ?? ''; }
      else return 0;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  const paged = $derived(sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  $effect(() => { data.filter; sortField; sortDir; currentPage = 1; });

  function setFilter(value: string) {
    const params = new URLSearchParams(page.url.searchParams);
    if (value) params.set('status', value);
    else params.delete('status');
    goto(`/contracts?${params}`, { replaceState: true });
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Toolbar -->
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex gap-1 flex-wrap">
      {#each STATUS_FILTERS as f}
        <button
          type="button"
          class="btn btn-xs {data.filter === f.value ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => setFilter(f.value)}
        >{f.label}</button>
      {/each}
    </div>
    {#if hasPermission(data.user, 'contracts', 'create')}
      <a href="/contracts/new" class="btn btn-primary btn-sm">
        <Plus class="size-4" />
        New Contract
      </a>
    {/if}
  </div>

  <!-- Table -->
  {#if data.contracts.length === 0}
    <div class="text-center py-16 text-base-content/50">
      <FileSignature class="size-8 opacity-20 mx-auto mb-2" />
      <p class="text-sm">No contracts found.</p>
      {#if hasPermission(data.user, 'contracts', 'create')}
        <a href="/contracts/new" class="btn btn-primary btn-sm mt-4">Create your first contract</a>
      {/if}
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <table class="table table-sm">
        <thead>
          <tr class="bg-base-300/30">
            {#snippet sortTh(label: string, field: string, cls = '')}
              <th class={cls}>
                <button type="button" class="flex items-center gap-1 hover:opacity-80 transition-opacity" onclick={() => toggleSort(field)}>
                  {label}
                  {#if sortField === field}
                    {#if sortDir === 'asc'}<ChevronUp class="size-3 opacity-70" />{:else}<ChevronDown class="size-3 opacity-70" />{/if}
                  {:else}
                    <ChevronsUpDown class="size-3 opacity-30" />
                  {/if}
                </button>
              </th>
            {/snippet}
            {@render sortTh('Title', 'title')}
            {@render sortTh('Type', 'type')}
            {@render sortTh('Company', 'company', 'hidden sm:table-cell')}
            {@render sortTh('Value', 'value', 'hidden md:table-cell')}
            {@render sortTh('Updated', 'updatedAt', 'hidden lg:table-cell')}
            {@render sortTh('Status', 'status')}
          </tr>
        </thead>
        <tbody>
          {#each paged as c}
            <tr
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
              onclick={() => goto(`/contracts/${c.id}`)}
            >
              <td class="font-medium">{c.title}</td>
              <td>
                <span class="badge badge-ghost badge-sm">{TYPE_LABELS[c.type] ?? c.type}</span>
              </td>
              <td class="hidden sm:table-cell">
                {#if c.companyName}
                  <span class="flex items-center gap-1 text-sm">
                    <Building2 class="size-3 opacity-50" />
                    {c.companyName}
                  </span>
                {:else}
                  <span class="opacity-40">—</span>
                {/if}
              </td>
              <td class="hidden md:table-cell">
                {#if c.value}
                  <span class="flex items-center gap-1 text-sm">
                    <DollarSign class="size-3 opacity-50" />
                    {fmtCurrency(c.value, c.currency)}
                  </span>
                {:else}
                  <span class="opacity-40">—</span>
                {/if}
              </td>
              <td class="hidden lg:table-cell text-sm opacity-60">{fmtDate(c.updatedAt)}</td>
              <td>
                <span class="badge badge-sm {STATUS_COLORS[c.status] ?? 'badge-ghost'}">
                  {c.status.replace(/_/g, ' ')}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if sorted.length > 0}
        <div class="border-t border-base-300 px-4 py-2">
          <Pagination
            total={sorted.length}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onPage={(n) => (currentPage = n)}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>
