<script lang="ts">
  import { Pencil, Plus, Trash2, X, FileSignature, FileText, Shield, LayoutTemplate } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import Modal from '$lib/components/Modal.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const TYPE_ICONS = { msa: FileSignature, sow: FileText, nda: Shield, custom: LayoutTemplate };
  const TYPE_LABELS: Record<string, string> = { msa: 'MSA', sow: 'SOW', nda: 'NDA', custom: 'Custom' };

  // Edit modal state
  let editModal  = $state(false);
  let editTarget = $state<any>(null);
  let editForm   = $state({ name: '', desc: '', content: '' });
  let saving     = $state(false);
  let err        = $state('');

  // New template modal state
  let showNew  = $state(false);
  let newForm  = $state({ name: '', type: 'custom', desc: '', content: '' });
  let creating = $state(false);
  let newErr   = $state('');

  function openEditModal(t: any) {
    editTarget       = t;
    editForm.name    = t.name;
    editForm.desc    = t.description ?? '';
    editForm.content = t.content ?? '';
    err              = '';
    editModal        = true;
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim()) { err = 'Name is required.'; return; }
    saving = true;
    err = '';
    try {
      const res = await fetch(`/api/contracts/templates/${id}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ name: editForm.name.trim(), description: editForm.desc, content: editForm.content }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        err = (d as any).message ?? 'Failed to save.';
        return;
      }
      editModal = false;
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
    if (!newForm.name.trim()) { newErr = 'Name is required.'; return; }
    creating = true;
    newErr = '';
    try {
      const res = await fetch('/api/contracts/templates', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ name: newForm.name.trim(), type: newForm.type, description: newForm.desc, content: newForm.content }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        newErr = (d as any).message ?? 'Failed to create.';
        return;
      }
      showNew = false;
      newForm = { name: '', type: 'custom', desc: '', content: '' };
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
      <button class="btn btn-primary btn-sm" onclick={() => (showNew = true)}>
        <Plus size={16} class="size-4" /> New Template
      </button>
    {/if}
  </div>

  <div class="flex flex-col gap-3">
    {#each data.templates as t}
      {@const TplIcon = TYPE_ICONS[t.type as keyof typeof TYPE_ICONS] ?? LayoutTemplate}
      <div class="card bg-base-200 border border-base-300 rounded-box">
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <TplIcon size={20} class="size-5 mt-0.5 text-base-content/60 shrink-0" />
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
                      <code class="text-xs bg-base-300 px-1.5 py-0.5 rounded">{'{{' + v + '}}'}</code>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            <div class="flex gap-1 shrink-0">
              {#if hasPermission(data.user, 'contract_templates', 'update')}
                <button class="btn btn-ghost btn-xs" onclick={() => openEditModal(t)}>
                  <Pencil size={12} class="size-3" />
                </button>
              {/if}
              {#if !t.isDefault && hasPermission(data.user, 'contract_templates', 'delete')}
                <button class="btn btn-ghost btn-xs text-error" onclick={() => deleteTemplate(t.id, t.name)}>
                  <Trash2 size={12} class="size-3" />
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if editModal}
  <Modal size="lg" label="Edit Template">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">Edit Template</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editModal = false)}>
        <X size={20} class="size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if err}
        <aside class="alert alert-error p-3 rounded text-sm">{err}</aside>
      {/if}

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-name">Name *</label>
        <input id="edit-name" type="text" class="input w-full" bind:value={editForm.name} placeholder="Template name" />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-desc">Description</label>
        <input id="edit-desc" type="text" class="input w-full" bind:value={editForm.desc} placeholder="Short description" />
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Content</p>
        <MessageEditor bind:html={editForm.content} placeholder="Use &#123;&#123;variable&#125;&#125; for placeholders" />
      </div>
    </div>

    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (editModal = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={saving} onclick={() => saveEdit(editTarget.id)}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </footer>
  </Modal>
{/if}

{#if showNew}
  <Modal size="lg" label="New Template">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Template</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (showNew = false)}>
        <X size={20} class="size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if newErr}
        <aside class="alert alert-error p-3 rounded text-sm">{newErr}</aside>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="new-name">Name *</label>
          <input id="new-name" type="text" class="input w-full" bind:value={newForm.name} placeholder="Template name" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="new-type">Type</label>
          <select id="new-type" class="select w-full" bind:value={newForm.type}>
            <option value="msa">MSA</option>
            <option value="sow">SOW</option>
            <option value="nda">NDA</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="new-desc">Description</label>
        <input id="new-desc" type="text" class="input w-full" bind:value={newForm.desc} placeholder="Short description" />
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Content</p>
        <MessageEditor bind:html={newForm.content} placeholder="Use &#123;&#123;variable&#125;&#125; for placeholders" />
      </div>
    </div>

    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (showNew = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={creating} onclick={createTemplate}>
        {creating ? 'Creating…' : 'Create Template'}
      </button>
    </footer>
  </Modal>
{/if}
