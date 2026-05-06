<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Pencil, Trash2, X, UserPlus } from 'lucide-svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type User = typeof data.users[0];

  let activeTab = $state<'users' | 'roles'>(data.canReadUsers ? 'users' : 'roles');

  let users = $state([...data.users]);
  let query = $state('');
  let currentPage = $state(1);
  const PAGE_SIZE = 20;

  const filtered = $derived(
    query.trim()
      ? users.filter((u) => {
          const q = query.toLowerCase();
          return u.username?.toLowerCase().includes(q)
            || u.email?.toLowerCase().includes(q)
            || u.firstName?.toLowerCase().includes(q)
            || u.lastName?.toLowerCase().includes(q);
        })
      : users
  );

  const pageUsers = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  $effect(() => { query; currentPage = 1; });

  let newUserOpen = $state(false);
  let newForm     = $state({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
  let creating    = $state(false);
  let newError    = $state('');

  function openNewUser() {
    newForm  = { firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' };
    newError = '';
    newUserOpen = true;
  }

  async function submitNewUser() {
    if (!newForm.username || !newForm.email || !newForm.password) { newError = 'Username, email, and password are required'; return; }
    if (newForm.password !== newForm.confirmPassword) { newError = 'Passwords do not match'; return; }
    if (newForm.password.length < 8) { newError = 'Password must be at least 8 characters'; return; }
    creating = true; newError = '';
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName: newForm.firstName, lastName: newForm.lastName, username: newForm.username, email: newForm.email, password: newForm.password })
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); newError = body.message ?? 'Create failed'; return; }
      const created = await res.json();
      users = [{ ...created, createdAt: created.createdAt ?? new Date().toISOString() }, ...users];
      newUserOpen = false;
    } catch { newError = 'Network error'; }
    finally { creating = false; }
  }

  let editTarget = $state<User | null>(null);
  let editForm   = $state({ firstName: '', lastName: '', username: '', email: '' });
  let saving     = $state(false);
  let editError  = $state('');

  function openEdit(user: User) {
    editForm = { firstName: user.firstName ?? '', lastName: user.lastName ?? '', username: user.username, email: user.email };
    editError = ''; editTarget = user;
  }

  async function submitEdit() {
    if (!editTarget) return;
    saving = true; editError = '';
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(editForm)
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); editError = body.message ?? 'Update failed'; return; }
      users = users.map(u => u.id === editTarget!.id ? { ...u, ...editForm } : u);
      editTarget = null;
    } catch { editError = 'Network error'; }
    finally { saving = false; }
  }

  let deleteTarget = $state<User | null>(null);
  let deleting     = $state(false);
  let deleteError  = $state('');

  function openDelete(user: User) { deleteError = ''; deleteTarget = user; }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const body = await res.json().catch(() => ({})); deleteError = body.message ?? 'Delete failed'; return; }
      users = users.filter(u => u.id !== deleteTarget!.id);
      deleteTarget = null;
    } catch { deleteError = 'Network error'; }
    finally { deleting = false; }
  }

  const ACTIONS   = ['create', 'read', 'update', 'delete'] as const;
  const RESOURCES = ['dashboard', 'users', 'roles'] as const;

  let openRoles = $state<Set<string>>(new Set([data.roles[0]?.name]));
  function toggleRole(name: string) {
    const next = new Set(openRoles);
    next.has(name) ? next.delete(name) : next.add(name);
    openRoles = next;
  }

  let roleUsers = $state([...data.users]);

  async function assignRole(userId: string, role: string) {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role })
    });
    if (res.ok) {
      roleUsers = roleUsers.map(u => u.id === userId ? { ...u, role } : u);
      users     = users.map(u => u.id === userId ? { ...u, role } : u);
    }
  }

  let userQuery   = $state('');
  let rolesPage   = $state(1);

  const filteredRoleUsers = $derived(
    userQuery.trim()
      ? roleUsers.filter((u) => {
          const q = userQuery.toLowerCase();
          return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
            || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q);
        })
      : roleUsers
  );

  const pageRoleUsers = $derived(filteredRoleUsers.slice((rolesPage - 1) * PAGE_SIZE, rolesPage * PAGE_SIZE));
  $effect(() => { userQuery; rolesPage = 1; });
</script>

<svelte:head>
  <title>User Management</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">User Management</h1>

  {#if data.error}
    <div role="alert" class="alert alert-error text-sm">{data.error}</div>
  {/if}

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-base-200">
    {#if data.canReadUsers}
      <button type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => (activeTab = 'users')}>Users</button>
    {/if}
    {#if data.canReadRoles}
      <button type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => (activeTab = 'roles')}>Roles</button>
    {/if}
  </div>

  <!-- Users tab -->
  {#if activeTab === 'users'}
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="input input-bordered flex items-center gap-2 flex-1">
          <Search class="size-4 opacity-50" />
          <input type="search" placeholder="Search by name or email…" class="grow" bind:value={query} />
        </label>
        {#if hasPermission(data.user, 'users', 'create')}
          <button type="button" class="btn btn-primary shrink-0" onclick={openNewUser}>
            <UserPlus class="size-4" /> New User
          </button>
        {/if}
      </div>

      <div class="card bg-base-100 border border-base-200 overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each pageUsers as user}
              <tr class="hover:bg-base-200/50">
                <td>
                  {#if user.firstName || user.lastName}
                    <div class="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</div>
                    <div class="text-xs opacity-50">{user.username}</div>
                  {:else}
                    <div class="font-medium">{user.username}</div>
                  {/if}
                </td>
                <td class="opacity-60">{user.email}</td>
                <td><span class="badge badge-primary badge-outline text-xs">{user.role ?? 'viewer'}</span></td>
                <td class="opacity-60">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    {#if hasPermission(data.user, 'users', 'update')}
                      <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-primary"
                        aria-label="Edit {user.username}" onclick={() => openEdit(user)}>
                        <Pencil class="size-3.5" />
                      </button>
                    {/if}
                    {#if hasPermission(data.user, 'users', 'delete')}
                      <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error"
                        aria-label="Delete {user.username}" onclick={() => openDelete(user)}>
                        <Trash2 class="size-3.5" />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="text-center opacity-50 py-8">No users found.</td></tr>
            {/each}
          </tbody>
        </table>

        <div class="flex items-center justify-between px-4 py-2 border-t border-base-200">
          <span class="text-xs opacity-60">
            {filtered.length === 0 ? 'No users' : `${(currentPage-1)*PAGE_SIZE+1}–${Math.min(currentPage*PAGE_SIZE,filtered.length)} of ${filtered.length}`}
          </span>
          <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage}
            onPageChange={e => (currentPage = e.page)} siblingCount={1} />
        </div>
      </div>
    </div>
  {/if}

  <!-- Roles tab -->
  {#if activeTab === 'roles'}
    <div class="space-y-6">
      <div class="card bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">
        {#each data.roles as role}
          {@const open = openRoles.has(role.name)}
          <button type="button"
            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-base-200/50 transition-colors"
            onclick={() => toggleRole(role.name)} aria-expanded={open}>
            <div>
              <span class="font-semibold">{role.label}</span>
              <span class="ml-2 text-xs opacity-50">{role.name}</span>
            </div>
            <svg class="size-4 opacity-40 transition-transform duration-200 {open ? 'rotate-180' : ''}"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd"/>
            </svg>
          </button>

          {#if open}
            <div class="px-4 py-4 bg-base-200/30">
              <div class="grid gap-x-4 gap-y-3" style="grid-template-columns: minmax(7rem,1fr) repeat(4, 2.5rem);">
                <div class="text-xs font-semibold opacity-50 uppercase tracking-wide">Resource</div>
                {#each ACTIONS as action}
                  <div class="text-xs font-semibold opacity-50 uppercase tracking-wide text-center">{action[0].toUpperCase()}</div>
                {/each}
                {#each RESOURCES as resource}
                  <div class="flex items-center text-sm capitalize font-medium">{resource}</div>
                  {#each ACTIONS as action}
                    <div class="flex items-center justify-center">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold
                        {role.permissions?.[resource]?.[action] ? 'bg-success text-success-content' : 'bg-base-300 opacity-40'}">
                        {action[0].toUpperCase()}
                      </span>
                    </div>
                  {/each}
                {/each}
              </div>
              <p class="mt-3 text-xs opacity-40">C = create &nbsp; R = read &nbsp; U = update &nbsp; D = delete</p>
            </div>
          {/if}
        {:else}
          <div class="px-4 py-8 text-center opacity-50 text-sm">No roles found.</div>
        {/each}
      </div>

      {#if data.canAssign && roleUsers.length > 0}
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">User Assignments</h2>

          <label class="input input-bordered flex items-center gap-2">
            <Search class="size-4 opacity-50" />
            <input type="search" placeholder="Search by name or email…" class="grow" bind:value={userQuery} />
          </label>

          <div class="card bg-base-100 border border-base-200 overflow-hidden">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {#each pageRoleUsers as user}
                  <tr class="hover:bg-base-200/50">
                    <td>
                      {#if user.firstName || user.lastName}
                        <div class="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</div>
                        <div class="text-xs opacity-50">{user.username}</div>
                      {:else}
                        <div class="font-medium">{user.username}</div>
                      {/if}
                    </td>
                    <td class="opacity-60">{user.email}</td>
                    <td>
                      <select class="select select-bordered select-xs"
                        value={user.role ?? 'viewer'}
                        onchange={(e) => assignRole(user.id, (e.currentTarget as HTMLSelectElement).value)}>
                        {#each data.roles as role}
                          <option value={role.name}>{role.label}</option>
                        {/each}
                      </select>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <div class="flex items-center justify-between px-4 py-2 border-t border-base-200">
              <span class="text-xs opacity-60">
                {filteredRoleUsers.length === 0 ? 'No users' : `${(rolesPage-1)*PAGE_SIZE+1}–${Math.min(rolesPage*PAGE_SIZE,filteredRoleUsers.length)} of ${filteredRoleUsers.length}`}
              </span>
              <Pagination count={filteredRoleUsers.length} pageSize={PAGE_SIZE} page={rolesPage}
                onPageChange={e => (rolesPage = e.page)} siblingCount={1} />
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- New User modal -->
{#if newUserOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">New User</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (newUserOpen = false)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if newError}<div role="alert" class="alert alert-error text-sm">{newError}</div>{/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control gap-1">
            <span class="label-text font-medium">First Name</span>
            <input type="text" class="input input-bordered" bind:value={newForm.firstName} maxlength="50" placeholder="Jane" />
          </div>
          <div class="form-control gap-1">
            <span class="label-text font-medium">Last Name</span>
            <input type="text" class="input input-bordered" bind:value={newForm.lastName} maxlength="50" placeholder="Doe" />
          </div>
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Username <span class="text-error">*</span></span>
          <input type="text" class="input input-bordered" bind:value={newForm.username} minlength="2" maxlength="50" placeholder="johndoe" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Email <span class="text-error">*</span></span>
          <input type="email" class="input input-bordered" bind:value={newForm.email} placeholder="you@example.com" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Password <span class="text-error">*</span></span>
          <input type="password" class="input input-bordered" bind:value={newForm.password} minlength="8" placeholder="Min. 8 characters" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Confirm Password <span class="text-error">*</span></span>
          <input type="password" class="input input-bordered" bind:value={newForm.confirmPassword} minlength="8" placeholder="••••••••" />
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (newUserOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={creating} onclick={submitNewUser}>
          {creating ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit modal -->
{#if editTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Edit User</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (editTarget = null)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if editError}<div role="alert" class="alert alert-error text-sm">{editError}</div>{/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control gap-1">
            <span class="label-text font-medium">First Name</span>
            <input type="text" class="input input-bordered" bind:value={editForm.firstName} maxlength="50" />
          </div>
          <div class="form-control gap-1">
            <span class="label-text font-medium">Last Name</span>
            <input type="text" class="input input-bordered" bind:value={editForm.lastName} maxlength="50" />
          </div>
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Username</span>
          <input type="text" class="input input-bordered" bind:value={editForm.username} minlength="2" maxlength="50" required />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Email</span>
          <input type="email" class="input input-bordered" bind:value={editForm.email} required />
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (editTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={saving} onclick={submitEdit}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete confirm modal -->
{#if deleteTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-sm shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Delete User</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (deleteTarget = null)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-3">
        {#if deleteError}<div role="alert" class="alert alert-error text-sm">{deleteError}</div>{/if}
        <p class="text-sm">Are you sure you want to delete <span class="font-semibold">{deleteTarget.username}</span>? This action cannot be undone.</p>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-error" disabled={deleting} onclick={confirmDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}
