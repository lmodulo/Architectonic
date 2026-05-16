<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface Condition { field: string; op: '==' | '!=' | 'contains'; value: string }
  interface RuleAction { type: string; params: Record<string, string> }
  interface Rule {
    id: string; name: string;
    trigger: { event: string; conditions: Condition[] };
    actions: RuleAction[];
    enabled: boolean;
    createdAt: string;
  }

  const TRIGGER_LABELS: Record<string, string> = {
    'auth.user.registered':     'User registered',
    'auth.user.invited':        'User invited',
    'auth.user.invite.accepted':'User accepted invite',
    'calendar.event.created':   'Calendar event created',
  };

  const ACTION_LABELS: Record<string, string> = {
    'notification.send':     'Send notification',
    'message.send':          'Send message',
    'calendar.event.create': 'Create calendar event',
  };

  // Action param definitions: field name → label
  const ACTION_PARAMS: Record<string, { key: string; label: string; required?: boolean; hint?: string }[]> = {
    'notification.send': [
      { key: 'title',  label: 'Title',       required: true,  hint: 'Supports {{ field.path }}' },
      { key: 'body',   label: 'Body',         hint: 'Optional — supports {{ field.path }}' },
      { key: 'link',   label: 'Link',         hint: 'Optional URL to navigate on click' },
      { key: 'type',   label: 'Type key',     hint: 'e.g. automation.user_registered' },
      { key: 'userId', label: 'Recipient ID', hint: 'Leave blank to notify all admins' },
    ],
    'message.send': [
      { key: 'to',      label: 'Recipient ID', required: true, hint: 'User ID to send message to' },
      { key: 'subject', label: 'Subject',      required: true, hint: 'Supports {{ field.path }}' },
      { key: 'body',    label: 'Body',         required: true, hint: 'Supports {{ field.path }}' },
    ],
    'calendar.event.create': [
      { key: 'title',     label: 'Title',      required: true, hint: 'Supports {{ field.path }}' },
      { key: 'content',   label: 'Content',    hint: 'Optional description' },
      { key: 'startDate', label: 'Start date', hint: 'ISO date or {{ field.path }}' },
    ],
  };

  const canEdit   = $derived(hasPermission(data.user, 'automation', 'update'));
  const canCreate = $derived(hasPermission(data.user, 'automation', 'create'));
  const canDelete = $derived(hasPermission(data.user, 'automation', 'delete'));

  // Modal state
  let showModal  = $state(false);
  let editingId  = $state<string | null>(null);
  let saving     = $state(false);
  let modalError = $state('');

  // Form fields
  let ruleName       = $state('');
  let triggerEvent   = $state('');
  let conditions     = $state<Condition[]>([]);
  let actions        = $state<RuleAction[]>([{ type: 'notification.send', params: {} }]);

  // Logs drawer
  let logsRuleId   = $state<string | null>(null);
  let logsRuleName = $state('');
  let logs         = $state<{ id: string; event: string; success: boolean; error: string | null; executedAt: string }[]>([]);
  let logsLoading  = $state(false);

  function openCreate() {
    editingId    = null;
    ruleName     = '';
    triggerEvent = data.meta.triggerEvents[0] ?? '';
    conditions   = [];
    actions      = [{ type: 'notification.send', params: {} }];
    modalError   = '';
    showModal    = true;
  }

  function openEdit(rule: Rule) {
    editingId    = rule.id;
    ruleName     = rule.name;
    triggerEvent = rule.trigger.event;
    conditions   = rule.trigger.conditions.map(c => ({ ...c, value: String(c.value) }));
    actions      = rule.actions.map(a => ({ type: a.type, params: { ...a.params as Record<string, string> } }));
    modalError   = '';
    showModal    = true;
  }

  function closeModal() { showModal = false; }

  function addCondition() {
    conditions = [...conditions, { field: '', op: '==', value: '' }];
  }
  function removeCondition(i: number) {
    conditions = conditions.filter((_, idx) => idx !== i);
  }
  function addAction() {
    actions = [...actions, { type: 'notification.send', params: {} }];
  }
  function removeAction(i: number) {
    actions = actions.filter((_, idx) => idx !== i);
  }
  function setActionType(i: number, type: string) {
    actions = actions.map((a, idx) => idx === i ? { type, params: {} } : a);
  }
  function setParam(actionIdx: number, key: string, val: string) {
    actions = actions.map((a, idx) => {
      if (idx !== actionIdx) return a;
      return { ...a, params: { ...a.params, [key]: val } };
    });
  }

  async function save() {
    if (!ruleName.trim())  { modalError = 'Name is required';          return; }
    if (!triggerEvent)     { modalError = 'Trigger event is required'; return; }
    if (!actions.length)   { modalError = 'At least one action';       return; }

    saving = true; modalError = '';
    try {
      const body = {
        name:    ruleName.trim(),
        trigger: { event: triggerEvent, conditions },
        actions,
      };

      const url    = editingId ? `/api/automation/${editingId}` : '/api/automation';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        modalError = (d as { message?: string }).message ?? 'Save failed';
        return;
      }

      showModal = false;
      await invalidateAll();
    } catch { modalError = 'Network error'; }
    finally { saving = false; }
  }

  async function toggleEnabled(rule: Rule) {
    if (!canEdit) return;
    await fetch(`/api/automation/${rule.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    await invalidateAll();
  }

  async function deleteRule(rule: Rule) {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    await fetch(`/api/automation/${rule.id}`, { method: 'DELETE' });
    await invalidateAll();
  }

  async function openLogs(rule: Rule) {
    logsRuleId   = rule.id;
    logsRuleName = rule.name;
    logsLoading  = true;
    logs         = [];
    try {
      const res = await fetch(`/api/automation/${rule.id}/logs`);
      if (res.ok) logs = (await res.json()).logs;
    } finally { logsLoading = false; }
  }
  function closeLogs() { logsRuleId = null; }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <PageHeader title="Automation" subtitle="Event-driven rules that connect modules and trigger actions." />
    {#if canCreate}
      <button type="button" class="btn btn-primary btn-sm" onclick={openCreate}>New Rule</button>
    {/if}
  </div>

  <!-- Rules table -->
  <div class="card bg-base-100 border border-base-200 overflow-hidden">
    {#if data.rules.length === 0}
      <p class="px-5 py-10 text-sm opacity-50 text-center">No automation rules yet.</p>
    {:else}
      <table class="table table-sm w-full">
        <thead>
          <tr class="text-xs opacity-50">
            <th>Name</th>
            <th>Trigger</th>
            <th class="text-center">Actions</th>
            <th class="text-center">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.rules as rule (rule.id)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td class="font-medium text-sm">{rule.name}</td>
              <td class="text-sm">
                <span class="badge badge-ghost badge-sm font-mono">
                  {TRIGGER_LABELS[rule.trigger.event] ?? rule.trigger.event}
                </span>
              </td>
              <td class="text-center text-sm">{rule.actions.length}</td>
              <td class="text-center">
                <input
                  type="checkbox"
                  class="toggle toggle-success toggle-sm"
                  checked={rule.enabled}
                  disabled={!canEdit}
                  onchange={() => toggleEnabled(rule)}
                />
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <button type="button" class="btn btn-ghost btn-xs" onclick={() => openLogs(rule)}>Logs</button>
                  {#if canEdit}
                    <button type="button" class="btn btn-ghost btn-xs" onclick={() => openEdit(rule)}>Edit</button>
                  {/if}
                  {#if canDelete}
                    <button type="button" class="btn btn-ghost btn-xs text-error" onclick={() => deleteRule(rule)}>Delete</button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<!-- Create/Edit modal -->
{#if showModal}
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl space-y-5 overflow-y-auto max-h-[90vh]">
      <h3 class="font-semibold text-base">{editingId ? 'Edit Rule' : 'New Rule'}</h3>

      <!-- Name -->
      <div class="form-control space-y-1">
        <label class="label py-0"><span class="label-text text-xs font-medium">Rule Name</span></label>
        <input type="text" class="input input-bordered input-sm w-full" placeholder="e.g. Welcome new customer" bind:value={ruleName} />
      </div>

      <!-- Trigger event -->
      <div class="form-control space-y-1">
        <label class="label py-0"><span class="label-text text-xs font-medium">Trigger Event</span></label>
        <select class="select select-bordered select-sm w-full" bind:value={triggerEvent}>
          {#each data.meta.triggerEvents as ev}
            <option value={ev}>{TRIGGER_LABELS[ev] ?? ev}</option>
          {/each}
        </select>
      </div>

      <!-- Conditions -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium opacity-70">Conditions <span class="opacity-50">(all must match)</span></span>
          <button type="button" class="btn btn-ghost btn-xs" onclick={addCondition}>+ Add</button>
        </div>
        {#each conditions as cond, i}
          <div class="flex items-center gap-2">
            <input type="text" class="input input-bordered input-xs flex-1 min-w-0" placeholder="field.path" bind:value={conditions[i].field} />
            <select class="select select-bordered select-xs w-28 shrink-0" bind:value={conditions[i].op}>
              <option value="==">equals</option>
              <option value="!=">not equals</option>
              <option value="contains">contains</option>
            </select>
            <input type="text" class="input input-bordered input-xs flex-1 min-w-0" placeholder="value" bind:value={conditions[i].value} />
            <button type="button" class="btn btn-ghost btn-xs text-error shrink-0" onclick={() => removeCondition(i)}>✕</button>
          </div>
        {/each}
        {#if conditions.length === 0}
          <p class="text-xs opacity-40 italic">No conditions — rule fires on every matching event.</p>
        {/if}
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium opacity-70">Actions</span>
          <button type="button" class="btn btn-ghost btn-xs" onclick={addAction}>+ Add</button>
        </div>
        {#each actions as action, i}
          <div class="card bg-base-200 p-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <select class="select select-bordered select-xs flex-1" value={action.type} onchange={e => setActionType(i, (e.target as HTMLSelectElement).value)}>
                {#each data.meta.actionTypes as at}
                  <option value={at}>{ACTION_LABELS[at] ?? at}</option>
                {/each}
              </select>
              {#if actions.length > 1}
                <button type="button" class="btn btn-ghost btn-xs text-error shrink-0" onclick={() => removeAction(i)}>✕</button>
              {/if}
            </div>
            {#each (ACTION_PARAMS[action.type] ?? []) as field}
              <div class="space-y-0.5">
                <label class="text-xs opacity-60">{field.label}{field.required ? ' *' : ''}</label>
                <input
                  type="text"
                  class="input input-bordered input-xs w-full"
                  placeholder={field.hint ?? ''}
                  value={action.params[field.key] ?? ''}
                  oninput={e => setParam(i, field.key, (e.target as HTMLInputElement).value)}
                />
              </div>
            {/each}
          </div>
        {/each}
      </div>

      {#if modalError}
        <div role="alert" class="alert alert-error text-sm py-2">{modalError}</div>
      {/if}

      <div class="modal-action pt-0">
        <button type="button" class="btn btn-ghost btn-sm" disabled={saving} onclick={closeModal}>Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" disabled={saving} onclick={save}>
          {saving ? 'Saving…' : 'Save Rule'}
        </button>
      </div>
    </div>
    <button type="button" class="modal-backdrop" onclick={closeModal} aria-label="Close"></button>
  </div>
{/if}

<!-- Logs drawer -->
{#if logsRuleId}
  <div class="modal modal-open">
    <div class="modal-box max-w-xl space-y-4 overflow-y-auto max-h-[90vh]">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-base">Logs — {logsRuleName}</h3>
        <button type="button" class="btn btn-ghost btn-xs" onclick={closeLogs}>Close</button>
      </div>

      {#if logsLoading}
        <p class="text-sm opacity-50 text-center py-4">Loading…</p>
      {:else if logs.length === 0}
        <p class="text-sm opacity-50 text-center py-4">No executions yet.</p>
      {:else}
        <div class="space-y-2">
          {#each logs as log (log.id)}
            <div class="flex items-start gap-3 text-sm border border-base-200 rounded p-2.5">
              <span class="badge {log.success ? 'badge-success' : 'badge-error'} badge-sm shrink-0 mt-0.5">
                {log.success ? 'ok' : 'fail'}
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-mono text-xs opacity-50">{new Date(log.executedAt).toLocaleString()}</p>
                {#if log.error}
                  <p class="text-xs text-error mt-0.5 break-words">{log.error}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <button type="button" class="modal-backdrop" onclick={closeLogs} aria-label="Close"></button>
  </div>
{/if}
