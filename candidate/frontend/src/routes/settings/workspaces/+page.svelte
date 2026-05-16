<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const canUpdate = $derived(hasPermission(data.user, 'workspaces', 'update'));
  const canDelete = $derived(hasPermission(data.user, 'workspaces', 'delete'));

  // --- General tab ---
  let activeTab  = $state<'general' | 'members'>('general');
  let editName   = $state(data.workspace?.name ?? '');
  let editDesc   = $state(data.workspace?.description ?? '');
  let saving     = $state(false);
  let saveError  = $state('');
  let saveOk     = $state(false);

  async function saveGeneral() {
    if (!data.workspace) return;
    saving = true; saveError = ''; saveOk = false;
    try {
      const res = await fetch(`/api/workspaces/${data.workspace.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        saveError = (d as { message?: string }).message ?? 'Save failed';
        return;
      }
      saveOk = true;
      await invalidateAll();
    } catch { saveError = 'Network error'; }
    finally { saving = false; }
  }

  // --- Members tab ---
  let addEmail     = $state('');
  let addRole      = $state('contributor');
  let addError     = $state('');
  let addLoading   = $state(false);

  const ROLES = ['owner', 'admin', 'lead', 'contributor', 'viewer', 'customer'];

  async function addMember() {
    if (!data.workspace || !addEmail.trim()) return;
    addLoading = true; addError = '';
    try {
      const res = await fetch(`/api/workspaces/${data.workspace.id}/members`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        addError = (d as { message?: string }).message ?? 'Failed to add member';
        return;
      }
      addEmail = '';
      await invalidateAll();
    } catch { addError = 'Network error'; }
    finally { addLoading = false; }
  }

  async function changeRole(memberId: string, role: string) {
    if (!data.workspace) return;
    await fetch(`/api/workspaces/${data.workspace.id}/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    await invalidateAll();
  }

  async function removeMember(memberId: string) {
    if (!data.workspace) return;
    await fetch(`/api/workspaces/${data.workspace.id}/members/${memberId}`, { method: 'DELETE' });
    await invalidateAll();
  }
</script>

<PageHeader title="Workspace Settings" />

<!-- Tabs -->
<div class="tabs tabs-bordered mb-6">
  <button
    class="tab {activeTab === 'general' ? 'tab-active' : ''}"
    onclick={() => (activeTab = 'general')}
  >General</button>
  <button
    class="tab {activeTab === 'members' ? 'tab-active' : ''}"
    onclick={() => (activeTab = 'members')}
  >Members</button>
</div>

{#if activeTab === 'general'}
  <div class="card bg-base-200 max-w-xl">
    <div class="card-body gap-4">
      <div class="form-control">
        <label class="label" for="ws-name"><span class="label-text">Name</span></label>
        <input
          id="ws-name"
          type="text"
          class="input input-bordered"
          bind:value={editName}
          disabled={!canUpdate}
        />
      </div>
      <div class="form-control">
        <label class="label" for="ws-desc"><span class="label-text">Description</span></label>
        <textarea
          id="ws-desc"
          class="textarea textarea-bordered"
          rows="3"
          bind:value={editDesc}
          disabled={!canUpdate}
        ></textarea>
      </div>
      {#if saveError}
        <p class="text-error text-sm">{saveError}</p>
      {/if}
      {#if saveOk}
        <p class="text-success text-sm">Saved.</p>
      {/if}
      {#if canUpdate}
        <div class="card-actions justify-end">
          <button class="btn btn-primary btn-sm" onclick={saveGeneral} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      {/if}
    </div>
  </div>

{:else if activeTab === 'members'}
  <div class="flex flex-col gap-6 max-w-2xl">

    <!-- Member list -->
    <div class="card bg-base-200">
      <div class="card-body p-0">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              {#if canUpdate}<th></th>{/if}
            </tr>
          </thead>
          <tbody>
            {#each (data.members ?? []) as m (m.id)}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                <td>
                  <div class="flex items-center gap-2">
                    <Avatar user={m} size="xs" />
                    <div>
                      <p class="font-medium text-sm">{m.firstName} {m.lastName}</p>
                      <p class="text-xs opacity-50">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  {#if canUpdate}
                    <select
                      class="select select-sm select-bordered"
                      value={m.role}
                      onchange={e => changeRole(m.id, (e.target as HTMLSelectElement).value)}
                    >
                      {#each ROLES as r}
                        <option value={r}>{r}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="badge badge-sm badge-ghost">{m.role}</span>
                  {/if}
                </td>
                {#if canUpdate}
                  <td class="text-right">
                    {#if m.id !== data.user?.id}
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        onclick={() => removeMember(m.id)}
                      >Remove</button>
                    {/if}
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add member form -->
    {#if canUpdate}
      <div class="card bg-base-200">
        <div class="card-body gap-4">
          <h3 class="font-semibold">Add Member</h3>
          <div class="flex gap-2 flex-wrap">
            <input
              type="email"
              class="input input-bordered input-sm flex-1 min-w-48"
              placeholder="Email address"
              bind:value={addEmail}
            />
            <select class="select select-bordered select-sm" bind:value={addRole}>
              {#each ROLES as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
            <button
              class="btn btn-primary btn-sm"
              onclick={addMember}
              disabled={addLoading || !addEmail.trim()}
            >
              {addLoading ? 'Adding…' : 'Add'}
            </button>
          </div>
          {#if addError}
            <p class="text-error text-sm">{addError}</p>
          {/if}
        </div>
      </div>
    {/if}

  </div>
{/if}
