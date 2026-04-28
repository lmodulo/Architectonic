<script lang="ts">
  import { ArrowLeft, Save, Tag, Flag } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const tx = data.transaction as Record<string, unknown>;

  let userCategory = $state((tx.userCategory as string) ?? '');
  let userNote     = $state((tx.userNote     as string) ?? '');
  let userTags     = $state((tx.userTags     as string[]).join(', '));
  let flagged      = $state((tx.flagged      as boolean) ?? false);
  let saving       = $state(false);
  let saved        = $state(false);
  let saveError    = $state('');

  async function save() {
    saving    = true;
    saveError = '';
    saved     = false;
    try {
      const tags = userTags.split(',').map(t => t.trim()).filter(Boolean);
      const res  = await fetch(`/api/budget/transactions/${tx.id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ userCategory: userCategory || null, userNote: userNote || null, userTags: tags, flagged }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Save failed');
      saved = true;
      await invalidateAll();
    } catch (e) {
      saveError = (e as Error).message;
    } finally {
      saving = false;
    }
  }

  function fmtCurrency(n: number) {
    return Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString('en-US', { dateStyle: 'full' });
  }
</script>

<div class="p-6 max-w-2xl mx-auto space-y-6">
  <a href="/budget/transactions" class="flex items-center gap-1 text-sm opacity-60 hover:opacity-100">
    <ArrowLeft size={14} /> Back to Transactions
  </a>

  <div class="card p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold">{tx.merchant || tx.description}</h1>
        <p class="text-sm opacity-60 mt-1">{fmtDate(tx.date as string)}</p>
      </div>
      <div class="text-right">
        <p class="text-2xl font-mono font-bold {(tx.amount as number) >= 0 ? 'text-success-600' : ''}">
          {(tx.amount as number) >= 0 ? '+' : '-'}{fmtCurrency(tx.amount as number)}
        </p>
        {#if tx.pending}
          <span class="badge preset-filled-warning-500 text-xs mt-1">Pending</span>
        {/if}
      </div>
    </div>

    <!-- Details grid -->
    <dl class="grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt class="opacity-50">Plaid Category</dt>
        <dd class="font-medium mt-0.5">{tx.category ?? '—'}</dd>
      </div>
      <div>
        <dt class="opacity-50">Sub-category</dt>
        <dd class="font-medium mt-0.5">{tx.subCategory ?? '—'}</dd>
      </div>
      <div>
        <dt class="opacity-50">Currency</dt>
        <dd class="font-medium mt-0.5">{tx.currencyCode ?? 'USD'}</dd>
      </div>
      <div>
        <dt class="opacity-50">Account ID</dt>
        <dd class="font-medium mt-0.5 font-mono text-xs truncate">{tx.accountId}</dd>
      </div>
    </dl>

    <hr class="opacity-10" />

    <!-- User overrides -->
    {#if hasPermission(data.user, 'budget_transactions', 'update')}
      <div class="space-y-4">
        <h2 class="font-semibold text-sm opacity-70 uppercase tracking-wide">Your Overrides</h2>

        <label class="block space-y-1">
          <span class="text-sm font-medium">Category</span>
          <input
            type="text"
            placeholder="{tx.category ?? 'Override category…'}"
            bind:value={userCategory}
            class="input w-full text-sm"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium flex items-center gap-1"><Tag size={13} /> Tags</span>
          <input
            type="text"
            placeholder="groceries, monthly, auto-pay…"
            bind:value={userTags}
            class="input w-full text-sm"
          />
          <p class="text-xs opacity-40">Comma-separated</p>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium">Note</span>
          <textarea
            placeholder="Add a note…"
            bind:value={userNote}
            rows="2"
            class="textarea w-full text-sm"
          ></textarea>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" bind:checked={flagged} class="checkbox" />
          <span class="text-sm flex items-center gap-1"><Flag size={13} /> Flag for review</span>
        </label>

        {#if saveError}
          <p class="text-sm text-error-500">{saveError}</p>
        {/if}
        {#if saved}
          <p class="text-sm text-success-600">Saved.</p>
        {/if}

        <button
          type="button"
          onclick={save}
          disabled={saving}
          class="btn preset-filled-primary-500 flex items-center gap-2"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    {/if}
  </div>
</div>
