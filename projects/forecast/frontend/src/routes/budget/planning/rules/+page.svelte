<script lang="ts">
  import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, X, AlertCircle } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface Condition {
    field:    string;
    operator: string;
    value:    string | number;
  }

  interface Action {
    type:  string;
    value: string;
  }

  interface Rule {
    id:             string;
    name:           string;
    order:          number;
    active:         boolean;
    conditionLogic: 'all' | 'any';
    conditions:     Condition[];
    actions:        Action[];
  }

  let rules   = $state<Rule[]>(data.rules as Rule[]);
  let error   = $state('');
  let busy    = $state(false);

  // ── Modal state ────────────────────────────────────────────────────
  let showModal = $state(false);
  let editId    = $state<string | null>(null);

  // Form fields
  let formName           = $state('');
  let formLogic          = $state<'all' | 'any'>('all');
  let formConditions     = $state<Condition[]>([{ field: 'merchant_name', operator: 'contains', value: '' }]);
  let formActions        = $state<Action[]>([{ type: 'set_category', value: '' }]);

  const FIELDS    = ['merchant_name', 'category', 'amount', 'description'];
  const OPERATORS = { merchant_name: ['contains', 'equals', 'starts_with'], category: ['contains', 'equals'], amount: ['greater_than', 'less_than', 'equals'], description: ['contains', 'equals', 'starts_with'] };
  const ACTION_TYPES = ['set_category', 'add_tag', 'set_note', 'flag'];

  function openCreate() {
    editId         = null;
    formName       = '';
    formLogic      = 'all';
    formConditions = [{ field: 'merchant_name', operator: 'contains', value: '' }];
    formActions    = [{ type: 'set_category', value: '' }];
    showModal      = true;
  }

  function openEdit(rule: Rule) {
    editId         = rule.id;
    formName       = rule.name;
    formLogic      = rule.conditionLogic;
    formConditions = rule.conditions.map(c => ({ ...c, value: String(c.value) }));
    formActions    = rule.actions.map(a => ({ ...a }));
    showModal      = true;
  }

  function addCondition()  { formConditions = [...formConditions, { field: 'merchant_name', operator: 'contains', value: '' }]; }
  function removeCondition(i: number) { formConditions = formConditions.filter((_, j) => j !== i); }
  function addAction()     { formActions = [...formActions, { type: 'set_category', value: '' }]; }
  function removeAction(i: number) { formActions = formActions.filter((_, j) => j !== i); }

  async function saveRule() {
    if (!formName.trim()) { error = 'Rule name is required'; return; }
    busy  = true;
    error = '';
    try {
      const body = {
        name:           formName.trim(),
        conditionLogic: formLogic,
        conditions:     formConditions,
        actions:        formActions,
      };
      const url    = editId ? `/api/budget/planning/rules/${editId}` : '/api/budget/planning/rules';
      const method = editId ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Save failed');
      showModal = false;
      await invalidateAll();
      rules = data.rules as Rule[];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return;
    busy  = true;
    error = '';
    try {
      const res = await fetch(`/api/budget/planning/rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await invalidateAll();
      rules = data.rules as Rule[];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }

  async function toggleActive(rule: Rule) {
    try {
      await fetch(`/api/budget/planning/rules/${rule.id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ active: !rule.active }),
      });
      await invalidateAll();
      rules = data.rules as Rule[];
    } catch { /* ignore */ }
  }

  async function move(rule: Rule, dir: -1 | 1) {
    const idx    = rules.findIndex(r => r.id === rule.id);
    const target = rules[idx + dir];
    if (!target) return;

    const newOrder = rules.map((r, i) => {
      if (r.id === rule.id)   return { id: r.id, order: target.order };
      if (r.id === target.id) return { id: r.id, order: rule.order };
      return { id: r.id, order: r.order };
    });

    try {
      await fetch('/api/budget/planning/rules/reorder', {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ order: newOrder }),
      });
      await invalidateAll();
      rules = data.rules as Rule[];
    } catch { /* ignore */ }
  }

  function actionLabel(type: string) {
    return { set_category: 'Set category', add_tag: 'Add tag', set_note: 'Set note', flag: 'Flag' }[type] ?? type;
  }
</script>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-3">
      <a href="/budget/planning" class="opacity-60 hover:opacity-100"><ArrowLeft size={18} /></a>
      <h1 class="text-2xl font-semibold">Automation Rules</h1>
    </div>
    {#if hasPermission(data.user, 'budget_planning', 'create')}
      <button type="button" onclick={openCreate} class="btn preset-filled-primary-500 flex items-center gap-2">
        <Plus size={15} /> New Rule
      </button>
    {/if}
  </div>

  {#if error}
    <div class="alert preset-filled-error-500 flex items-center gap-2">
      <AlertCircle size={16} /> {error}
    </div>
  {/if}

  {#if rules.length === 0}
    <div class="card p-12 text-center space-y-3">
      <p class="font-medium opacity-50">No automation rules yet</p>
      <p class="text-sm opacity-40">Create a rule to automatically categorize or tag incoming transactions.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each rules as rule, i (rule.id)}
        <div class="card p-4 space-y-2">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold">{rule.name}</span>
                <span class="badge {rule.active ? 'preset-filled-success-500' : 'preset-tonal-surface'} text-xs">
                  {rule.active ? 'Active' : 'Inactive'}
                </span>
                <span class="badge preset-tonal-surface text-xs">Match {rule.conditionLogic.toUpperCase()}</span>
              </div>
              <p class="text-sm opacity-60 mt-1">
                {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                → {rule.actions.map(a => actionLabel(a.type)).join(', ')}
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <!-- Reorder -->
              {#if hasPermission(data.user, 'budget_planning', 'update')}
                <button type="button" onclick={() => move(rule, -1)} disabled={i === 0} class="btn btn-sm preset-outlined p-1" title="Move up">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onclick={() => move(rule, 1)} disabled={i === rules.length - 1} class="btn btn-sm preset-outlined p-1" title="Move down">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onclick={() => toggleActive(rule)} class="btn btn-sm preset-outlined" title="{rule.active ? 'Deactivate' : 'Activate'}">
                  {rule.active ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onclick={() => openEdit(rule)} class="btn btn-sm preset-outlined">Edit</button>
              {/if}
              {#if hasPermission(data.user, 'budget_planning', 'delete')}
                <button type="button" onclick={() => deleteRule(rule.id)} class="btn btn-sm preset-outlined-error-500 p-1" title="Delete">
                  <Trash2 size={14} />
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Rule modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
    <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5" transition:scale={{ duration: 200, easing: cubicOut }}>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{editId ? 'Edit Rule' : 'New Rule'}</h2>
        <button type="button" onclick={() => { showModal = false; error = ''; }} class="btn btn-sm preset-outlined p-1"><X size={16} /></button>
      </div>

      {#if error}
        <p class="text-sm text-error-500">{error}</p>
      {/if}

      <label class="block space-y-1">
        <span class="text-sm font-medium">Rule Name</span>
        <input type="text" bind:value={formName} placeholder="e.g. Tag Amazon orders" class="input w-full text-sm" />
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium">Match</span>
        <select bind:value={formLogic} class="select text-sm w-auto">
          <option value="all">ALL conditions (AND)</option>
          <option value="any">ANY condition (OR)</option>
        </select>
      </label>

      <!-- Conditions -->
      <div class="space-y-2">
        <p class="text-sm font-medium">Conditions</p>
        {#each formConditions as cond, i}
          <div class="flex gap-2 items-center">
            <select bind:value={cond.field} class="select text-xs flex-none w-36">
              {#each FIELDS as f}<option value={f}>{f}</option>{/each}
            </select>
            <select bind:value={cond.operator} class="select text-xs flex-none w-32">
              {#each (OPERATORS[cond.field as keyof typeof OPERATORS] ?? OPERATORS.merchant_name) as op}
                <option value={op}>{op}</option>
              {/each}
            </select>
            <input type="text" bind:value={cond.value} placeholder="value" class="input text-xs flex-1" />
            {#if formConditions.length > 1}
              <button type="button" onclick={() => removeCondition(i)} class="btn btn-sm preset-outlined p-1 shrink-0"><X size={12} /></button>
            {/if}
          </div>
        {/each}
        <button type="button" onclick={addCondition} class="btn btn-sm preset-outlined text-xs">+ Add Condition</button>
      </div>

      <!-- Actions -->
      <div class="space-y-2">
        <p class="text-sm font-medium">Actions</p>
        {#each formActions as action, i}
          <div class="flex gap-2 items-center">
            <select bind:value={action.type} class="select text-xs flex-none w-36">
              {#each ACTION_TYPES as t}<option value={t}>{actionLabel(t)}</option>{/each}
            </select>
            {#if action.type !== 'flag'}
              <input type="text" bind:value={action.value} placeholder="value" class="input text-xs flex-1" />
            {:else}
              <span class="text-xs opacity-50 flex-1">Marks the transaction for review</span>
            {/if}
            {#if formActions.length > 1}
              <button type="button" onclick={() => removeAction(i)} class="btn btn-sm preset-outlined p-1 shrink-0"><X size={12} /></button>
            {/if}
          </div>
        {/each}
        <button type="button" onclick={addAction} class="btn btn-sm preset-outlined text-xs">+ Add Action</button>
      </div>

      <div class="flex gap-2 justify-end pt-2">
        <button type="button" onclick={() => { showModal = false; error = ''; }} class="btn preset-outlined">Cancel</button>
        <button type="button" onclick={saveRule} disabled={busy} class="btn preset-filled-primary-500">
          {busy ? 'Saving…' : 'Save Rule'}
        </button>
      </div>
    </div>
  </div>
{/if}
