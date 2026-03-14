<script lang="ts">
  import { Search, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Pagination } from '@skeletonlabs/skeleton-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const ACTIONS   = ['create', 'read', 'update', 'delete'] as const;
  const RESOURCES = ['dashboard', 'users', 'roles'] as const;

  function permLabel(action: string) { return action[0].toUpperCase(); }

  // Accordion open state — track which role names are expanded
  let openRoles = $state<Set<string>>(new Set([data.roles[0]?.name]));

  function toggleRole(name: string) {
    const next = new Set(openRoles);
    next.has(name) ? next.delete(name) : next.add(name);
    openRoles = next;
  }

  // Local mutable users list for role select
  let users = $state([...data.users]);

  async function assignRole(userId: string, role: string) {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      users = users.map(u => u.id === userId ? { ...u, role } : u);
    }
  }

  // Search + pagination for User Assignments
  const PAGE_SIZE   = 20;
  let userQuery     = $state('');
  let currentPage   = $state(1);

  const filteredUsers = $derived(
    userQuery.trim()
      ? users.filter((u) => {
          const q = userQuery.toLowerCase();
          return u.username?.toLowerCase().includes(q)
            || u.email?.toLowerCase().includes(q)
            || u.firstName?.toLowerCase().includes(q)
            || u.lastName?.toLowerCase().includes(q);
        })
      : users
  );

  const pageUsers = $derived(filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  $effect(() => { userQuery; currentPage = 1; });
</script>

<svelte:head>
  <title>Roles</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Roles</h1>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  <!-- Roles accordion -->
  <div class="card preset-filled-surface-100-900 divide-y divide-surface-200-800 overflow-hidden">
    {#each data.roles as role}
      {@const open = openRoles.has(role.name)}
      <!-- Accordion header -->
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 text-left hover:preset-tonal-surface transition-colors"
        onclick={() => toggleRole(role.name)}
        aria-expanded={open}
      >
        <div>
          <span class="font-semibold">{role.label}</span>
          <span class="ml-2 text-xs text-surface-500">{role.name}</span>
        </div>
        <svg
          class="size-4 text-surface-400 transition-transform duration-200 {open ? 'rotate-180' : ''}"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd"/>
        </svg>
      </button>

      <!-- Accordion body -->
      {#if open}
        <div class="px-4 py-4 border-t border-surface-200-800 bg-surface-50-950/30">
          <!-- 5-column grid: label col + 4 action cols per resource -->
          <div class="grid gap-x-4 gap-y-3" style="grid-template-columns: minmax(7rem,1fr) repeat(4, 2.5rem);">

            <!-- Header row -->
            <div class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Resource</div>
            {#each ACTIONS as action}
              <div class="text-xs font-semibold text-surface-500 uppercase tracking-wide text-center">{action[0].toUpperCase()}</div>
            {/each}

            <!-- One row per resource -->
            {#each RESOURCES as resource}
              <div class="flex items-center text-sm capitalize font-medium">{resource}</div>
              {#each ACTIONS as action}
                <div class="flex items-center justify-center">
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold {role.permissions?.[resource]?.[action] ? 'preset-filled-success-500' : 'preset-filled-surface-300-700 opacity-40'}"
                    title="{action}"
                  >
                    {permLabel(action)}
                  </span>
                </div>
              {/each}
            {/each}

          </div>
          <p class="mt-3 text-xs text-surface-400">
            C = create &nbsp; R = read &nbsp; U = update &nbsp; D = delete
          </p>
        </div>
      {/if}
    {:else}
      <div class="px-4 py-8 text-center text-surface-500 text-sm">No roles found.</div>
    {/each}
  </div>

  <!-- User Assignments -->
  {#if data.canAssign && users.length > 0}
    <div class="space-y-3">
      <h2 class="text-lg font-semibold">User Assignments</h2>

      <!-- Search -->
      <div class="input-group grid-cols-[auto_1fr]">
        <div class="ig-cell preset-tonal">
          <Search class="size-4" />
        </div>
        <input
          type="search"
          placeholder="Search by name or email…"
          class="ig-input"
          bind:value={userQuery}
        />
      </div>

      <div class="card preset-filled-surface-100-900 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-surface-200-800">
              <th class="text-left px-4 py-3 font-semibold text-surface-500">User</th>
              <th class="text-left px-4 py-3 font-semibold text-surface-500">Email</th>
              <th class="text-left px-4 py-3 font-semibold text-surface-500">Role</th>
            </tr>
          </thead>
          <tbody>
            {#each pageUsers as user}
              <tr class="border-b border-surface-200-800 last:border-0">
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
                  <select
                    class="select text-xs py-1"
                    value={user.role ?? 'viewer'}
                    onchange={(e) => assignRole(user.id, (e.currentTarget as HTMLSelectElement).value)}
                  >
                    {#each data.roles as role}
                      <option value={role.name}>{role.label}</option>
                    {/each}
                  </select>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        <!-- Pagination toolbar -->
        <div class="flex items-center justify-between px-4 py-2 border-t border-surface-200-800">
          <span class="text-surface-500 text-xs">
            {filteredUsers.length === 0
              ? 'No users'
              : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of ${filteredUsers.length}`}
          </span>
          <Pagination
            count={filteredUsers.length}
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
  {/if}

</div>
