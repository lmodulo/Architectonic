<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { Pencil, Trash2, X, Check } from 'lucide-svelte';
  import Breadcrumb from '$lib/components/folio/Breadcrumb.svelte';
  import { slide } from 'svelte/transition';
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
    createdAt?:    string;
  };

  type Company = { id: string; name: string };

  const expense   = $derived(data.expense   as Expense);
  const companies = $derived(data.companies as Company[]);

  const CATEGORIES = ['hosting', 'software', 'contractor', 'travel', 'meals', 'equipment', 'other'];

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

  function companyName(id?: string | null) {
    if (!id) return null;
    return companies.find(c => c.id === id)?.name ?? null;
  }

  // Edit mode
  let editing  = $state(false);
  let saving   = $state(false);
  let saveError = $state('');
  let form = $state({
    description: '',
    vendor:      '',
    category:    '',
    amount:      '',
    expenseDate: '',
    status:      '',
    companyId:   '',
    billable:    false,
    notes:       '',
    receiptUrl:  '',
  });

  function startEdit() {
    form = {
      description: expense.description,
      vendor:      expense.vendor,
      category:    expense.category,
      amount:      String(expense.amount),
      expenseDate: expense.expenseDate ? expense.expenseDate.slice(0, 10) : '',
      status:      expense.status,
      companyId:   expense.companyId ?? '',
      billable:    expense.billable,
      notes:       expense.notes ?? '',
      receiptUrl:  expense.receiptUrl ?? '',
    };
    saveError = '';
    editing = true;
  }

  async function saveEdit() {
    if (!form.description.trim()) { saveError = 'Description is required'; return; }
    if (!form.vendor.trim())      { saveError = 'Vendor is required'; return; }
    if (!form.amount || Number(form.amount) <= 0) { saveError = 'Amount must be > 0'; return; }
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          description: form.description,
          vendor:      form.vendor,
          category:    form.category,
          amount:      Number(form.amount),
          expenseDate: form.expenseDate,
          status:      form.status,
          companyId:   form.companyId || null,
          billable:    form.billable,
          notes:       form.notes,
          receiptUrl:  form.receiptUrl || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        saveError = (d as any).message ?? 'Failed to save';
        return;
      }
      editing = false;
      invalidateAll();
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }

  // Delete
  let deleting    = $state(false);
  let deleteError = $state('');

  async function deleteExpense() {
    if (!confirm(`Delete ${expense.expenseNumber}? This cannot be undone.`)) return;
    deleting = true;
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        deleteError = 'Failed to delete expense';
        return;
      }
      goto('/folio/expenses');
    } catch { deleteError = 'Network error'; }
    finally { deleting = false; }
  }
</script>

<svelte:head><title>{expense.expenseNumber} · Expenses · Folio</title></svelte:head>

<div class="space-y-6 -mt-6">
  <Breadcrumb crumbs={[{ label: 'Folio', href: '/folio' }, { label: 'Expenses', href: '/folio/expenses' }, { label: expense.expenseNumber }]} />

  <!-- Header -->
  <div class="flex items-start justify-between gap-4">
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold">{expense.vendor}</h2>
        <span class="badge badge-sm {STATUS_CLASS[expense.status] ?? 'badge-ghost'}">{expense.status}</span>
        <span class="badge badge-sm {CATEGORY_CLASS[expense.category] ?? 'badge-ghost'}">{expense.category}</span>
        {#if expense.billable}
          <span class="badge badge-sm badge-outline">billable</span>
        {/if}
      </div>
      <p class="text-sm opacity-60 mt-0.5">{expense.expenseNumber} · {fmtDate(expense.expenseDate)}</p>
    </div>
    <div class="flex gap-2 shrink-0">
      {#if hasPermission(data.user, 'finance_expenses', 'update') && !editing}
        <button type="button" class="btn btn-ghost btn-sm" onclick={startEdit}>
          <Pencil class="size-4" /> Edit
        </button>
      {/if}
      {#if hasPermission(data.user, 'finance_expenses', 'delete')}
        <button type="button" class="btn btn-ghost btn-sm text-error" onclick={deleteExpense} disabled={deleting}>
          <Trash2 class="size-4" /> {deleting ? 'Deleting…' : 'Delete'}
        </button>
      {/if}
    </div>
  </div>

  {#if deleteError}
    <aside class="alert alert-error p-3 rounded text-sm">{deleteError}</aside>
  {/if}

  {#if editing}
    <!-- Edit form -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-4" transition:slide={{ duration: 200 }}>
      {#if saveError}
        <aside class="alert alert-error p-3 rounded text-sm">{saveError}</aside>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-desc">Description *</label>
          <input id="edit-desc" type="text" class="input w-full" bind:value={form.description} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-vendor">Vendor *</label>
          <input id="edit-vendor" type="text" class="input w-full" bind:value={form.vendor} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-category">Category</label>
          <select id="edit-category" class="select w-full" bind:value={form.category}>
            {#each CATEGORIES as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-amount">Amount *</label>
          <input id="edit-amount" type="number" class="input w-full" min="0.01" step="0.01" bind:value={form.amount} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-date">Expense date *</label>
          <input id="edit-date" type="date" class="input w-full" bind:value={form.expenseDate} />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-status">Status</label>
          <select id="edit-status" class="select w-full" bind:value={form.status}>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-company">Client</label>
          <select id="edit-company" class="select w-full" bind:value={form.companyId}>
            <option value="">— None —</option>
            {#each companies as c (c.id)}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
        </div>

        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-receipt">Receipt URL</label>
          <input id="edit-receipt" type="url" class="input w-full" placeholder="https://…" bind:value={form.receiptUrl} />
        </div>

        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-notes">Notes</label>
          <textarea id="edit-notes" class="textarea w-full" rows="2" bind:value={form.notes}></textarea>
        </div>

        <div class="col-span-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.billable} />
            <span class="text-sm">Billable to client</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = false)}>
          <X class="size-4" /> Cancel
        </button>
        <button type="button" class="btn btn-primary btn-sm" disabled={saving} onclick={saveEdit}>
          <Check class="size-4" /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  {:else}
    <!-- Detail view -->
    <div class="card bg-base-200 border border-base-300 rounded-box p-6">
      <dl class="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
        <div>
          <dt class="text-xs opacity-50 uppercase tracking-wide">Amount</dt>
          <dd class="text-2xl font-bold mt-0.5">{fmtCurrency(expense.amount)}</dd>
        </div>
        <div>
          <dt class="text-xs opacity-50 uppercase tracking-wide">Description</dt>
          <dd class="text-sm mt-0.5">{expense.description}</dd>
        </div>
        <div>
          <dt class="text-xs opacity-50 uppercase tracking-wide">Date</dt>
          <dd class="text-sm mt-0.5">{fmtDate(expense.expenseDate)}</dd>
        </div>
        {#if companyName(expense.companyId)}
          <div>
            <dt class="text-xs opacity-50 uppercase tracking-wide">Client</dt>
            <dd class="text-sm mt-0.5">{companyName(expense.companyId)}</dd>
          </div>
        {/if}
        {#if expense.notes}
          <div class="col-span-2 sm:col-span-3">
            <dt class="text-xs opacity-50 uppercase tracking-wide">Notes</dt>
            <dd class="text-sm mt-0.5 whitespace-pre-wrap">{expense.notes}</dd>
          </div>
        {/if}
        {#if expense.receiptUrl}
          <div class="col-span-2 sm:col-span-3">
            <dt class="text-xs opacity-50 uppercase tracking-wide">Receipt</dt>
            <dd class="text-sm mt-0.5">
              <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" class="link link-primary">View receipt ↗</a>
            </dd>
          </div>
        {/if}
      </dl>
    </div>
  {/if}
</div>
