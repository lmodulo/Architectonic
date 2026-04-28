<script lang="ts">
  import { CreditCard, RefreshCw, Trash2, Plus, AlertCircle } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import PlaidLink from '$lib/components/PlaidLink.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let refreshing  = $state(false);
  let deletingId  = $state<string | null>(null);
  let error       = $state('');

  function fmtCurrency(n: number | null) {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function accountTypeLabel(type: string, subtype: string) {
    if (subtype) return subtype.charAt(0).toUpperCase() + subtype.slice(1);
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  async function refreshBalances() {
    refreshing = true;
    error = '';
    try {
      const res = await fetch('/api/budget/accounts?action=refresh', { method: 'POST' });
      if (!res.ok) throw new Error('Refresh failed');
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      refreshing = false;
    }
  }

  async function disconnect(itemId: string) {
    if (!confirm('Disconnect this bank? All associated transactions will be removed.')) return;
    deletingId = itemId;
    error = '';
    try {
      const res = await fetch(`/api/budget/plaid/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Disconnect failed');
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      deletingId = null;
    }
  }

  function onPlaidSuccess() {
    invalidateAll();
  }
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between flex-wrap gap-3">
    <h1 class="text-2xl font-semibold">Accounts</h1>
    <div class="flex items-center gap-2">
      {#if hasPermission(data.user, 'budget_accounts', 'read')}
        <button
          type="button"
          onclick={refreshBalances}
          disabled={refreshing}
          class="btn preset-outlined flex items-center gap-2"
        >
          <RefreshCw size={15} class={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh Balances'}
        </button>
      {/if}
      {#if hasPermission(data.user, 'budget_accounts', 'create')}
        <PlaidLink
          label="Connect Bank"
          onSuccess={onPlaidSuccess}
          class="btn preset-filled-primary-500 flex items-center gap-2"
        />
      {/if}
    </div>
  </div>

  {#if error}
    <div class="alert preset-filled-error-500 flex items-center gap-2">
      <AlertCircle size={16} /> {error}
    </div>
  {/if}

  {#if data.institutions.length === 0}
    <div class="card p-12 text-center space-y-4">
      <CreditCard class="mx-auto opacity-30" size={48} />
      <p class="font-medium">No accounts connected</p>
      <p class="text-sm opacity-60">Connect a bank account to see your balances here.</p>
    </div>
  {:else}
    {#each data.institutions as institution (institution.name)}
      <div class="card p-0 overflow-hidden">
        <!-- Institution header -->
        <div class="flex items-center justify-between px-5 py-3 bg-surface-100 dark:bg-surface-800">
          <div class="flex items-center gap-2">
            <CreditCard size={16} class="opacity-60" />
            <span class="font-semibold">{institution.name}</span>
          </div>
          {#if hasPermission(data.user, 'budget_accounts', 'delete')}
            {@const item = data.items.find((it: Record<string, unknown>) => it.institutionName === institution.name)}
            {#if item}
              <button
                type="button"
                onclick={() => disconnect(item.id as string)}
                disabled={deletingId === item.id}
                class="btn btn-sm preset-outlined-error-500 flex items-center gap-1 text-xs"
              >
                <Trash2 size={12} />
                {deletingId === item.id ? 'Disconnecting…' : 'Disconnect'}
              </button>
            {/if}
          {/if}
        </div>

        <!-- Error banner for expired items -->
        {@const item = data.items.find((it: Record<string, unknown>) => it.institutionName === institution.name)}
        {#if item?.error}
          <div class="px-5 py-2 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> Connection error — reconnect this bank to resume syncing.
          </div>
        {/if}

        <!-- Accounts table -->
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs opacity-50 uppercase tracking-wide border-b border-surface-200 dark:border-surface-700">
              <th class="text-left px-5 py-2 font-medium">Account</th>
              <th class="text-left px-4 py-2 font-medium">Type</th>
              <th class="text-right px-5 py-2 font-medium">Current</th>
              <th class="text-right px-5 py-2 font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {#each institution.accounts as acct (acct.accountId)}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035]">
                <td class="px-5 py-3">
                  <p class="font-medium">{acct.name}</p>
                  {#if acct.officialName && acct.officialName !== acct.name}
                    <p class="text-xs opacity-50">{acct.officialName}</p>
                  {/if}
                </td>
                <td class="px-4 py-3 opacity-70">{accountTypeLabel(acct.type, acct.subtype)}</td>
                <td class="px-5 py-3 text-right font-mono">{fmtCurrency(acct.current)}</td>
                <td class="px-5 py-3 text-right font-mono opacity-70">{fmtCurrency(acct.available)}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="border-t border-surface-200 dark:border-surface-700 text-xs opacity-40">
              <td colspan="4" class="px-5 py-2">
                {#if item?.updatedAt}
                  Last refreshed {fmtDate(item.updatedAt as string)}
                {:else}
                  Not yet synced
                {/if}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    {/each}
  {/if}
</div>
