<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const ACTIONS    = ['create', 'read', 'update', 'delete'] as const;
  const RESOURCES  = ['dashboard', 'users', 'roles'] as const;

  function permLabel(action: string) { return action[0].toUpperCase(); }

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
</script>

<svelte:head>
  <title>Roles</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Roles</h1>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  <div class="card preset-filled-surface-100-900 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-200-800">
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Role</th>
          {#each RESOURCES as resource}
            <th class="text-center px-4 py-3 font-semibold text-surface-500 capitalize">{resource}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data.roles as role}
          <tr class="border-b border-surface-200-800 last:border-0 hover:preset-tonal-surface transition-colors">
            <td class="px-4 py-3">
              <div class="font-medium">{role.label}</div>
              <div class="text-xs text-surface-500">{role.name}</div>
            </td>
            {#each RESOURCES as resource}
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  {#each ACTIONS as action}
                    <span
                      class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold {role.permissions?.[resource]?.[action] ? 'preset-filled-success-500' : 'preset-filled-surface-300-700 opacity-40'}"
                      title="{action}"
                    >
                      {permLabel(action)}
                    </span>
                  {/each}
                </div>
              </td>
            {/each}
          </tr>
        {:else}
          <tr>
            <td colspan={RESOURCES.length + 1} class="px-4 py-8 text-center text-surface-500">
              No roles found.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- User role assignments -->
  {#if data.canAssign && users.length > 0}
    <div class="space-y-3">
      <h2 class="text-lg font-semibold">User Assignments</h2>
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
            {#each users as user}
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
      </div>
    </div>
  {/if}

  <div class="text-xs text-surface-500 space-y-1">
    <p><span class="font-semibold">C</span> = create &nbsp; <span class="font-semibold">R</span> = read &nbsp; <span class="font-semibold">U</span> = update &nbsp; <span class="font-semibold">D</span> = delete</p>
  </div>
</div>
