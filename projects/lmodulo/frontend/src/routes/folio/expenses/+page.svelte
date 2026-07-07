<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { dragScroll } from '$lib/actions/dragScroll';
  import { Plus, Receipt, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, X } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Expense = {
    id:            string;
    expenseNumber: string;
    description:   string;
    vendor:        string;
    category:      string;
    amount:        number;
    currency:      string;
    expenseDate:   string;
    status:        string;
    companyId?:    string | null;
    milestoneId?:  string | null;
    billable:      boolean;
    notes?:        string;
    receiptUrl?:   string | null;
  };

  type Company = { id: string; name: string };

  let expenses  = $derived(data.expenses  as Expense[]);
  let companies = $derived(data.companies as Company[]);
  let total     = $derived(data.total     as number);
  let filters   = $derived(data.filters   as { status: string; category: string; skip: number; sort: string; sortDir: string });

  const LIMIT      = 25;
  const STATUSES   = ['', 'draft', 'pending', 'paid'];
  const CATEGORIES = ['', 'hosting', 'software', 'contractor', 'travel', 'meals', 'equipment', 'other'];

  const STATUS_CLASS: Record<string, string> = {
    paid:    'badge-success',
    pending: 'badge-warning',
    draft:   'badge-ghost',
  };

  const CATEGORY_CLASS: Record<string, string> = {
    hosting:    'badge-info',
    software:   'badge-primary',
    contractor: 'badge-secondary',
    travel:     'badge-accent',
    meals:      'badge-neutral',
    equipment:  'badge-warning',
    other:      'badge-ghost',
  };

  function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function buildUrl(overrides: Record<string, string | null>) {
    const url = new URL(page.url);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) url.searchParams.delete(k);
      else            url.searchParams.set(k, v);
    }
    return url.toString();
  }

  function applyFilter(field: string, value: string) {
    goto(buildUrl({ [field]: value || null, skip: null }));
  }

  function applySort(field: string) {
    const newDir = filters.sort === field && filters.sortDir === 'asc' ? 'desc' : 'asc';
    goto(buildUrl({ sort: field, sortDir: newDir, skip: null }));
  }

  function pageUrl(newSkip: number) {
    return buildUrl({ skip: String(newSkip) });
  }

  const totalPages = $derived(Math.ceil(total / LIMIT));
  const currentPage = $derived(Math.floor(filters.skip / LIMIT) + 1);

  function sortIcon(field: string) {
    if (filters.sort !== field) return ChevronsUpDown;
    return filters.sortDir === 'asc' ? ChevronUp : ChevronDown;
  }

  // Modal
  let modalOpen = $state(false);
  let saving    = $state(false);
  let saveError = $state('');
  let form = $state({
    description: '', vendor: '', category: 'other', amount: '',
    expenseDate: '', status: 'draft', companyId: '', billable: false,
    notes: '', receiptUrl: '',
  });

  function openModal() {
    form = {
      description: '', vendor: '', category: 'other', amount: '',
      expenseDate: new Date().toISOString().slice(0, 10),
      status: 'draft', companyId: '', billable: false,
      notes: '', receiptUrl: '',
    };
    saveError = '';
    modalOpen = true;
  }

  async function save() {
    if (!form.description.trim()) { saveError = 'Description is required'; return; }
    if (!form.vendor.trim())      { saveError = 'Vendor is required'; return; }
    if (!form.expenseDate)        { saveError = 'Expense date is required'; return; }
    if (!form.amount || Number(form.amount) <= 0) { saveError = 'Amount must be greater than 0'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch('/api/finance/expenses', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          description: form.description,
          vendor:      form.vendor,
          category:    form.category,
          amount:      Number(form.amount),
          expenseDate: form.expenseDate,
          status:      form.status,
          billable:    form.billable,
          notes:       form.notes,
          receiptUrl:  form.receiptUrl || undefined,
          companyId:   form.companyId || undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { saveError = (d as any).message ?? 'Failed to create expense'; return; }
      goto(`/folio/expenses/${(d as any).id}`);
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>Expenses · Folio</title></svelte:head>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-4">
    <!-- Filters -->
    <div class="flex items-center gap-2 flex-wrap">
      <select
        class="select select-sm"
        value={filters.status}
        onchange={(e) => applyFilter('status', (e.target as HTMLSelectElement).value)}
      >
        {#each STATUSES as s}
          <option value={s}>{s || 'All statuses'}</option>
        {/each}
      </select>
      <select
        class="select select-sm"
        value={filters.category}
        onchange={(e) => applyFilter('category', (e.target as HTMLSelectElement).value)}
      >
        {#each CATEGORIES as c}
          <option value={c}>{c || 'All categories'}</option>
        {/each}
      </select>
    </div>

    {#if hasPermission(data.user, 'finance_expenses', 'create')}
      <button type="button" class="btn btn-primary btn-sm shrink-0" onclick={openModal}>
        <Plus class="size-4" />
        New Expense
      </button>
    {/if}
  </div>

  {#if expenses.length === 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-12 text-center">
      <Receipt class="size-10 opacity-20 mx-auto mb-3" />
      <p class="text-sm opacity-40">No expenses yet. Log hosting costs, software subscriptions, contractor payments, and more.</p>
    </div>
  {:else}
    <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
      <div use:dragScroll class="table-scroll">
      <table class="table table-sm">
        <thead>
          <tr class="bg-base-300/30">
            <th>
              <button type="button" class="flex items-center gap-1 hover:opacity-80" onclick={() => applySort('expenseNumber')}>
                # <svelte:component this={sortIcon('expenseNumber')} class="size-3" />
              </button>
            </th>
            <th>
              <button type="button" class="flex items-center gap-1 hover:opacity-80" onclick={() => applySort('vendor')}>
                Vendor <svelte:component this={sortIcon('vendor')} class="size-3" />
              </button>
            </th>
            <th>Description</th>
            <th>
              <button type="button" class="flex items-center gap-1 hover:opacity-80" onclick={() => applySort('category')}>
                Category <svelte:component this={sortIcon('category')} class="size-3" />
              </button>
            </th>
            <th>
              <button type="button" class="flex items-center gap-1 hover:opacity-80" onclick={() => applySort('expenseDate')}>
                Date <svelte:component this={sortIcon('expenseDate')} class="size-3" />
              </button>
            </th>
            <th class="text-right">
              <button type="button" class="flex items-center gap-1 hover:opacity-80 ml-auto" onclick={() => applySort('amount')}>
                Amount <svelte:component this={sortIcon('amount')} class="size-3" />
              </button>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each expenses as exp (exp.id)}
            <tr
              class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors cursor-pointer"
              onclick={() => goto(`/folio/expenses/${exp.id}`)}
            >
              <td class="font-mono text-xs opacity-60">{exp.expenseNumber}</td>
              <td class="font-medium text-sm">{exp.vendor}</td>
              <td class="text-sm opacity-70 max-w-xs truncate">{exp.description}</td>
              <td>
                <span class="badge badge-sm {CATEGORY_CLASS[exp.category] ?? 'badge-ghost'}">{exp.category}</span>
                {#if exp.billable}
                  <span class="badge badge-sm badge-outline ml-1">billable</span>
                {/if}
              </td>
              <td class="text-sm">{fmtDate(exp.expenseDate)}</td>
              <td class="text-right text-sm font-semibold">{fmtCurrency(exp.amount)}</td>
              <td>
                <span class="badge badge-sm {STATUS_CLASS[exp.status] ?? 'badge-ghost'}">{exp.status}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>

      {#if total > 0}
        <div class="border-t border-base-300 px-4 py-2 flex items-center justify-between gap-4">
          <span class="text-xs opacity-50">
            {filters.skip + 1}–{Math.min(filters.skip + LIMIT, total)} of {total}
          </span>
          {#if totalPages > 1}
            <div class="flex items-center gap-1">
              <a
                href={pageUrl(0)}
                class="btn btn-ghost btn-xs {currentPage === 1 ? 'btn-disabled opacity-40' : ''}"
                aria-disabled={currentPage === 1}
              >«</a>
              <a
                href={pageUrl(Math.max(0, filters.skip - LIMIT))}
                class="btn btn-ghost btn-sm {currentPage === 1 ? 'btn-disabled opacity-40' : ''}"
                aria-disabled={currentPage === 1}
              >← Prev</a>

              {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
                {#if totalPages <= 7 || Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages}
                  <a
                    href={pageUrl((p - 1) * LIMIT)}
                    class="btn btn-xs {p === currentPage ? 'btn-primary' : 'btn-ghost'}"
                  >{p}</a>
                {:else if Math.abs(p - currentPage) === 3}
                  <span class="px-1 opacity-40 text-sm">…</span>
                {/if}
              {/each}

              <a
                href={pageUrl(filters.skip + LIMIT)}
                class="btn btn-ghost btn-sm {currentPage === totalPages ? 'btn-disabled opacity-40' : ''}"
                aria-disabled={currentPage === totalPages}
              >Next →</a>
              <a
                href={pageUrl((totalPages - 1) * LIMIT)}
                class="btn btn-ghost btn-xs {currentPage === totalPages ? 'btn-disabled opacity-40' : ''}"
                aria-disabled={currentPage === totalPages}
              >»</a>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if modalOpen}
  <Modal size="md" label="New Expense">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Expense</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-desc">Description *</label>
          <input id="exp-desc" type="text" class="input w-full" placeholder="e.g. AWS EC2 hosting" bind:value={form.description} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-vendor">Vendor *</label>
          <input id="exp-vendor" type="text" class="input w-full" placeholder="e.g. Amazon Web Services" bind:value={form.vendor} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-category">Category</label>
          <select id="exp-category" class="select w-full" bind:value={form.category}>
            {#each CATEGORIES.filter(Boolean) as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-amount">Amount *</label>
          <input id="exp-amount" type="number" class="input w-full" min="0.01" step="0.01" placeholder="0.00" bind:value={form.amount} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-date">Expense date *</label>
          <input id="exp-date" type="date" class="input w-full" bind:value={form.expenseDate} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-status">Status</label>
          <select id="exp-status" class="select w-full" bind:value={form.status}>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-company">Client (optional)</label>
          <select id="exp-company" class="select w-full" bind:value={form.companyId}>
            <option value="">— None —</option>
            {#each companies as c (c.id)}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
        </div>

        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-receipt">Receipt URL (optional)</label>
          <input id="exp-receipt" type="url" class="input w-full" placeholder="https://…" bind:value={form.receiptUrl} />
        </div>

        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="exp-notes">Notes</label>
          <textarea id="exp-notes" class="textarea w-full" rows="2" placeholder="Optional notes…" bind:value={form.notes}></textarea>
        </div>

        <div class="col-span-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.billable} />
            <span class="text-sm">Billable to client</span>
          </label>
        </div>
      </div>
    </div>

    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
        {saving ? 'Creating…' : 'Create Expense'}
      </button>
    </footer>
  </Modal>
{/if}
