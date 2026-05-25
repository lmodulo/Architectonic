<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import { FileSignature, FileText, Shield, LayoutTemplate, Plus, Pencil, Trash2, Check, X } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const TYPE_ICONS: Record<string, any> = { msa: FileSignature, sow: FileText, nda: Shield, custom: LayoutTemplate };
  const TYPE_LABELS: Record<string, string> = { msa: 'MSA', sow: 'SOW', nda: 'NDA', custom: 'Custom' };

  // Edit state
  let editingId    = $state<string | null>(null);
  let editName     = $state('');
  let editDesc     = $state('');
  let editContent  = $state('');
  let saving       = $state(false);
  let err          = $state('');

  // New template modal
  let showNew      = $state(false);
  let newName      = $state('');
  let newType      = $state('custom');
  let newDesc      = $state('');
  let newContent   = $state('');
  let creating     = $state(false);
  let newErr       = $state('');

  function startEdit(t: any) {
    editingId   = t.id;
    editName    = t.name;
    editDesc    = t.description ?? '';
    editContent = t.content ?? '';
    err         = '';
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { err = 'Name is required.'; return; }
    saving = true;
    err = '';
    try {
      const res = await fetch(`/api/contracts/templates/${id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ name: editName.trim(), description: editDesc, content: editContent }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        err = (d as any).message ?? 'Failed to save.';
        return;
      }
      editingId = null;
      await invalidateAll();
    } catch {
      err = 'Network error.';
    } finally {
      saving = false;
    }
  }

  async function deleteTemplate(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    const res = await fetch(`/api/contracts/templates/${id}`, { method: 'DELETE' });
    if (res.ok) await invalidateAll();
  }

  async function createTemplate() {
    if (!newName.trim()) { newErr = 'Name is required.'; return; }
    creating = true;
    newErr = '';
    try {
      const res = await fetch('/api/contracts/templates', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ name: newName.trim(), type: newType, description: newDesc, content: newContent }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        newErr = (d as any).message ?? 'Failed to create.';
        return;
      }
      showNew = false;
      newName = ''; newType = 'custom'; newDesc = ''; newContent = '';
      await invalidateAll();
    } catch {
      newErr = 'Network error.';
    } finally {
      creating = false;
    }
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <p class="text-sm text-base-content/60">
      Manage reusable contract templates. Default templates cannot be deleted.
    </p>
    {#if hasPermission(data.user, 'contract_templates', 'create')}
      <button class="btn btn-primary btn-sm" onclick={() => showNew = true}>
        <Plus class="size-4" /> New Template
      </button>
    {/if}
  </div>

  {#if err}
    <div class="alert alert-error text-sm">{err}</div>
  {/if}

  <div class="flex flex-col gap-3">
    {#each data.templates as t}
      {@const Icon = TYPE_ICONS[t.type] ?? LayoutTemplate}
      <div class="card card-bordered">
        <div class="card-body p-4">
          {#if editingId === t.id}
            <div class="flex flex-col gap-3">
              <input type="text" class="input input-bordered input-sm w-full" bind:value={editName} placeholder="Template name" />
              <input type="text" class="input input-bordered input-sm w-full" bind:value={editDesc} placeholder="Description" />
              <textarea
                class="textarea textarea-bordered font-mono text-xs min-h-[300px]"
                bind:value={editContent}
                placeholder={'HTML content with {{variable}} placeholders'}
              ></textarea>
              <div class="flex gap-2 justify-end">
                <button class="btn btn-ghost btn-sm" onclick={() => editingId = null}><X class="size-4" /> Cancel</button>
                <button class="btn btn-primary btn-sm" onclick={() => saveEdit(t.id)} disabled={saving}>
                  <Check class="size-4" /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <Icon class="size-5 mt-0.5 text-base-content/60 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm">{t.name}</span>
                    <span class="badge badge-ghost badge-xs">{TYPE_LABELS[t.type] ?? t.type}</span>
                    {#if t.isDefault}
                      <span class="badge badge-primary badge-xs">Default</span>
                    {/if}
                  </div>
                  {#if t.description}
                    <p class="text-xs text-base-content/60 mt-0.5">{t.description}</p>
                  {/if}
                  {#if t.variables?.length}
                    <div class="flex flex-wrap gap-1 mt-1.5">
                      {#each t.variables as v}
                        <code class="text-xs bg-base-200 px-1.5 py-0.5 rounded">{'{{' + v + '}}'}</code>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                {#if hasPermission(data.user, 'contract_templates', 'update')}
                  <button class="btn btn-ghost btn-xs" onclick={() => startEdit(t)}>
                    <Pencil class="size-3" />
                  </button>
                {/if}
                {#if !t.isDefault && hasPermission(data.user, 'contract_templates', 'delete')}
                  <button class="btn btn-ghost btn-xs text-error" onclick={() => deleteTemplate(t.id, t.name)}>
                    <Trash2 class="size-3" />
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showNew}
  <Modal size="lg" label="New Template">
    <header class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-base-300 shrink-0">
      <h3 class="font-semibold text-lg">New Template</h3>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => showNew = false}>
        <X class="size-4" />
      </button>
    </header>
    <div class="px-5 py-4 flex flex-col gap-3 overflow-y-auto flex-1">
      {#if newErr}
        <div class="alert alert-error text-sm">{newErr}</div>
      {/if}
      <div class="grid grid-cols-2 gap-3">
        <label class="form-control">
          <div class="label"><span class="label-text">Name</span></div>
          <input type="text" class="input input-bordered input-sm" bind:value={newName} placeholder="Template name" />
        </label>
        <label class="form-control">
          <div class="label"><span class="label-text">Type</span></div>
          <select class="select select-bordered select-sm" bind:value={newType}>
            <option value="msa">MSA</option>
            <option value="sow">SOW</option>
            <option value="nda">NDA</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>
      <label class="form-control">
        <div class="label pb-1"><span class="label-text">Description</span></div>
        <input type="text" class="input input-bordered input-sm" bind:value={newDesc} placeholder="Short description" />
      </label>
      <label class="form-control">
        <div class="label pb-1"><span class="label-text">Content (HTML)</span></div>
        <textarea
          class="textarea textarea-bordered font-mono text-xs min-h-[250px]"
          bind:value={newContent}
          placeholder={'Use {{variable}} for placeholders'}
        ></textarea>
      </label>
    </div>
    <footer class="flex justify-end gap-2 px-5 pb-4 pt-3 border-t border-base-300 shrink-0">
      <button class="btn btn-ghost" onclick={() => showNew = false}>Cancel</button>
      <button class="btn btn-primary" onclick={createTemplate} disabled={creating}>
        {creating ? 'Creating…' : 'Create Template'}
      </button>
    </footer>
  </Modal>
{/if}
