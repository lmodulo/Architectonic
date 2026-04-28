<script lang="ts">
  import { ArrowLeft, Bell, AlertCircle, Trash2, Check } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface Bill {
    id:            string;
    merchant:      string;
    amount:        number;
    frequencyDays: number;
    lastPaid:      string;
    nextDue:       string;
    confirmed:     boolean;
    daysUntilDue:  number;
  }

  let error  = $state('');
  let saving = $state<string | null>(null);

  let upcoming = $derived(
    (data.bills as Bill[]).filter(b => b.daysUntilDue <= 7)
  );

  function fmtCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function frequencyLabel(days: number) {
    if (days >= 28 && days <= 31) return 'Monthly';
    if (days >= 13 && days <= 15) return 'Biweekly';
    if (days === 7)               return 'Weekly';
    if (days >= 85 && days <= 95) return 'Quarterly';
    if (days >= 360)              return 'Yearly';
    return `Every ${days} days`;
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    saving = id;
    error  = '';
    try {
      const res = await fetch(`/api/budget/planning/bills/${id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = null;
    }
  }

  async function dismiss(id: string) {
    if (!confirm('Dismiss this bill? It will no longer appear here.')) return;
    await patch(id, { dismissed: true });
  }

  async function confirm_(id: string) {
    await patch(id, { confirmed: true });
  }
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center gap-3">
    <a href="/budget/planning" class="opacity-60 hover:opacity-100"><ArrowLeft size={18} /></a>
    <h1 class="text-2xl font-semibold">Bill Tracking</h1>
  </div>

  {#if error}
    <div class="alert preset-filled-error-500 flex items-center gap-2">
      <AlertCircle size={16} /> {error}
    </div>
  {/if}

  {#if upcoming.length > 0}
    <div class="alert preset-tonal-warning flex items-start gap-3">
      <Bell size={16} class="mt-0.5 shrink-0" />
      <div>
        <p class="font-medium">Upcoming bills</p>
        <ul class="text-sm mt-1 space-y-0.5">
          {#each upcoming as b}
            <li>
              <strong>{b.merchant}</strong> — {fmtCurrency(b.amount)} due
              {b.daysUntilDue <= 0 ? 'today' : `in ${b.daysUntilDue} day${b.daysUntilDue === 1 ? '' : 's'}`}
              ({fmtDate(b.nextDue)})
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}

  {#if (data.bills as Bill[]).length === 0}
    <div class="card p-12 text-center space-y-3">
      <Bell class="mx-auto opacity-30" size={40} />
      <p class="font-medium">No recurring bills detected</p>
      <p class="text-sm opacity-50">
        As you import more transaction history, recurring payments will be identified automatically.
      </p>
    </div>
  {:else}
    <div class="card p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-xs opacity-50 uppercase tracking-wide border-b border-surface-200 dark:border-surface-700">
            <th class="text-left px-5 py-3 font-medium">Merchant</th>
            <th class="text-left px-4 py-3 font-medium hidden sm:table-cell">Frequency</th>
            <th class="text-right px-4 py-3 font-medium">Amount</th>
            <th class="text-right px-4 py-3 font-medium">Next Due</th>
            {#if hasPermission(data.user, 'budget_planning', 'update')}
              <th class="text-right px-5 py-3 font-medium">Actions</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each data.bills as bill (bill.id)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
              <td class="px-5 py-3">
                <p class="font-medium">{bill.merchant}</p>
                {#if !bill.confirmed}
                  <span class="badge preset-tonal-warning text-xs mt-0.5">Unconfirmed</span>
                {/if}
              </td>
              <td class="px-4 py-3 opacity-70 hidden sm:table-cell">
                {frequencyLabel(bill.frequencyDays)}
              </td>
              <td class="px-4 py-3 text-right font-mono">{fmtCurrency(bill.amount)}</td>
              <td class="px-4 py-3 text-right {bill.daysUntilDue <= 7 ? 'text-warning-600 dark:text-warning-400 font-semibold' : ''}">
                {fmtDate(bill.nextDue)}
                {#if bill.daysUntilDue <= 7}
                  <span class="text-xs ml-1">({bill.daysUntilDue}d)</span>
                {/if}
              </td>
              {#if hasPermission(data.user, 'budget_planning', 'update')}
                <td class="px-5 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    {#if !bill.confirmed}
                      <button
                        type="button"
                        onclick={() => confirm_(bill.id)}
                        disabled={saving === bill.id}
                        class="btn btn-sm preset-outlined-success-500 flex items-center gap-1"
                        title="Confirm"
                      >
                        <Check size={12} />
                      </button>
                    {/if}
                    <button
                      type="button"
                      onclick={() => dismiss(bill.id)}
                      disabled={saving === bill.id}
                      class="btn btn-sm preset-outlined-error-500 flex items-center gap-1"
                      title="Dismiss"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
