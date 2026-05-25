<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { hasPermission } from '$lib/permissions';
  import { Plus, Building2, DollarSign, FileSignature } from 'lucide-svelte';
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
    <div class="overflow-x-auto rounded-lg border border-base-300">
      <table class="table table-sm w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th class="hidden sm:table-cell">Company</th>
            <th class="hidden md:table-cell">Value</th>
            <th class="hidden lg:table-cell">Updated</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each data.contracts as c}
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
    </div>
  {/if}
</div>
