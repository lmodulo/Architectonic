<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Pencil, Trash2, X, UserPlus, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type User = typeof data.users[0];

  let users = $state([...data.users]);
  let query = $state('');
  let currentPage = $state(1);

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

  const PAGE_SIZE = 20;
  const pageUsers = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  // Reset to page 1 whenever search query changes
  $effect(() => { query; currentPage = 1; });

  // --- New User modal ---
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
    if (!newForm.username || !newForm.email || !newForm.password) {
      newError = 'Username, email, and password are required';
      return;
    }
    if (newForm.password !== newForm.confirmPassword) {
      newError = 'Passwords do not match';
      return;
    }
    if (newForm.password.length < 8) {
      newError = 'Password must be at least 8 characters';
      return;
    }
    creating = true;
    newError = '';
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: newForm.firstName,
          lastName:  newForm.lastName,
          username:  newForm.username,
          email:     newForm.email,
          password:  newForm.password,
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        newError = body.message ?? 'Create failed';
        return;
      }
      const created = await res.json();
      users = [{ ...created, createdAt: created.createdAt ?? new Date().toISOString() }, ...users];
      newUserOpen = false;
    } catch {
      newError = 'Network error';
    } finally {
      creating = false;
    }
  }

  // --- Edit modal ---
  let editTarget = $state<User | null>(null);
  let editForm   = $state({ firstName: '', lastName: '', username: '', email: '' });
  let saving     = $state(false);
  let editError  = $state('');

  function openEdit(user: User) {
    editForm = { firstName: user.firstName ?? '', lastName: user.lastName ?? '', username: user.username, email: user.email };
    editError  = '';
    editTarget = user;
  }

  async function submitEdit() {
    if (!editTarget) return;
    saving = true;
    editError = '';
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        editError = body.message ?? 'Update failed';
        return;
      }
      // Update local state
      users = users.map(u => u.id === editTarget!.id ? { ...u, ...editForm } : u);
      editTarget = null;
    } catch {
      editError = 'Network error';
    } finally {
      saving = false;
    }
  }

  // --- Delete modal ---
  let deleteTarget  = $state<User | null>(null);
  let deleting      = $state(false);
  let deleteError   = $state('');

  function openDelete(user: User) {
    deleteError  = '';
    deleteTarget = user;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true;
    deleteError = '';
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        deleteError = body.message ?? 'Delete failed';
        return;
      }
      users = users.filter(u => u.id !== deleteTarget!.id);
      deleteTarget = null;
    } catch {
      deleteError = 'Network error';
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Manage Users</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Manage Users</h1>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  <!-- Search + New User -->
  <div class="flex items-center gap-3">
    <div class="input-group grid-cols-[auto_1fr] flex-1">
      <div class="ig-cell preset-tonal">
        <Search class="size-4" />
      </div>
      <input
        type="search"
        placeholder="Search by name or email…"
        class="ig-input"
        bind:value={query}
      />
    </div>
    {#if hasPermission(data.user, 'users', 'create')}
      <button type="button" class="btn preset-filled-primary-500 shrink-0" onclick={openNewUser}>
        <UserPlus class="size-4" />
        <span>New User</span>
      </button>
    {/if}
  </div>

  <!-- Table -->
  <div class="card preset-filled-surface-100-900 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-200-800">
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Name</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Email</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Role</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Joined</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {#each pageUsers as user}
          <tr class="border-b border-surface-200-800 last:border-0 hover:preset-tonal-surface transition-colors">
            <td class="px-4 py-3">
              {#if user.firstName || user.lastName}
                <div class="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</div>
                <div class="text-xs text-surface-500">{user.username}</div>
              {:else}
                <div class="font-medium">{user.username}</div>
              {/if}
            </td>
            <td class="px-4 py-3 text-surface-400">{user.email}</td>
            <td class="px-4 py-3">
              <span class="badge preset-tonal-primary text-xs">{user.role ?? 'viewer'}</span>
            </td>
            <td class="px-4 py-3 text-surface-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                {#if hasPermission(data.user, 'users', 'update')}
                  <button
                    type="button"
                    class="btn-icon btn-sm hover:preset-tonal-primary"
                    aria-label="Edit {user.username}"
                    onclick={() => openEdit(user)}
                  >
                    <Pencil class="size-4" />
                  </button>
                {/if}
                {#if hasPermission(data.user, 'users', 'delete')}
                  <button
                    type="button"
                    class="btn-icon btn-sm hover:preset-tonal-error"
                    aria-label="Delete {user.username}"
                    onclick={() => openDelete(user)}
                  >
                    <Trash2 class="size-4" />
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="px-4 py-8 text-center text-surface-500">
              No users found.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Pagination toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-t border-surface-200-800">
      <span class="text-surface-500 text-xs">
        {filtered.length === 0
          ? 'No users'
          : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
      </span>
      <Pagination
        count={filtered.length}
        pageSize={PAGE_SIZE}
        page={currentPage}
        onPageChange={(e) => (currentPage = e.page)}
        siblingCount={1}
      >
        <Pagination.FirstTrigger class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronFirst class="size-4" /></Pagination.FirstTrigger>
        <Pagination.PrevTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLeft  class="size-4" /></Pagination.PrevTrigger>
        <Pagination.Context>
          {#snippet children(pagination)}
            {#each pagination().pages as p (p)}
              {#if p.type === 'page'}
                <Pagination.Item {...p} class="btn-icon btn-sm {p.value === currentPage ? 'preset-tonal-primary' : 'hover:preset-tonal'}">{p.value}</Pagination.Item>
              {:else}
                <Pagination.Ellipsis index={p.index} class="btn-icon btn-sm opacity-50">…</Pagination.Ellipsis>
              {/if}
            {/each}
          {/snippet}
        </Pagination.Context>
        <Pagination.NextTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronRight class="size-4" /></Pagination.NextTrigger>
        <Pagination.LastTrigger  class="btn-icon btn-sm hover:preset-tonal-primary"><ChevronLast  class="size-4" /></Pagination.LastTrigger>
      </Pagination>
    </div>

  </div>
</div>

<!-- New User modal -->
{#if newUserOpen}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="New user"
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-md shadow-xl"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">New User</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (newUserOpen = false)} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4">
        {#if newError}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{newError}</aside>
        {/if}

        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span class="label-text text-sm font-medium">First Name</span>
            <input type="text" class="input mt-1" bind:value={newForm.firstName} maxlength="50" placeholder="Jane" />
          </label>
          <label class="label">
            <span class="label-text text-sm font-medium">Last Name</span>
            <input type="text" class="input mt-1" bind:value={newForm.lastName} maxlength="50" placeholder="Doe" />
          </label>
        </div>

        <label class="label">
          <span class="label-text text-sm font-medium">Username <span class="text-error-500">*</span></span>
          <input type="text" class="input mt-1" bind:value={newForm.username} minlength="2" maxlength="50" placeholder="johndoe" />
        </label>

        <label class="label">
          <span class="label-text text-sm font-medium">Email <span class="text-error-500">*</span></span>
          <input type="email" class="input mt-1" bind:value={newForm.email} placeholder="you@example.com" />
        </label>

        <label class="label">
          <span class="label-text text-sm font-medium">Password <span class="text-error-500">*</span></span>
          <input type="password" class="input mt-1" bind:value={newForm.password} minlength="8" placeholder="Min. 8 characters" />
        </label>

        <label class="label">
          <span class="label-text text-sm font-medium">Confirm Password <span class="text-error-500">*</span></span>
          <input type="password" class="input mt-1" bind:value={newForm.confirmPassword} minlength="8" placeholder="••••••••" />
        </label>
      </div>

      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (newUserOpen = false)}>Cancel</button>
        <button type="button" class="btn preset-filled-primary-500" disabled={creating} onclick={submitNewUser}>
          {creating ? 'Creating…' : 'Create User'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Edit modal -->
{#if editTarget}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Edit user"
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-md shadow-xl"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">Edit User</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (editTarget = null)} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4">
        {#if editError}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{editError}</aside>
        {/if}

        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span class="label-text text-sm font-medium">First Name</span>
            <input type="text" class="input mt-1" bind:value={editForm.firstName} maxlength="50" />
          </label>
          <label class="label">
            <span class="label-text text-sm font-medium">Last Name</span>
            <input type="text" class="input mt-1" bind:value={editForm.lastName} maxlength="50" />
          </label>
        </div>

        <label class="label">
          <span class="label-text text-sm font-medium">Username</span>
          <input type="text" class="input mt-1" bind:value={editForm.username} minlength="2" maxlength="50" required />
        </label>

        <label class="label">
          <span class="label-text text-sm font-medium">Email</span>
          <input type="email" class="input mt-1" bind:value={editForm.email} required />
        </label>
      </div>

      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (editTarget = null)}>Cancel</button>
        <button type="button" class="btn preset-filled-primary-500" disabled={saving} onclick={submitEdit}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Delete confirm modal -->
{#if deleteTarget}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Delete user"
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-sm shadow-xl"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800">
        <h2 class="text-lg font-semibold">Delete User</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={() => (deleteTarget = null)} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-3">
        {#if deleteError}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{deleteError}</aside>
        {/if}
        <p class="text-sm">
          Are you sure you want to delete <span class="font-semibold">{deleteTarget.username}</span>? This action cannot be undone.
        </p>
      </div>

      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (deleteTarget = null)}>Cancel</button>
        <button type="button" class="btn preset-filled-error-500" disabled={deleting} onclick={confirmDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
