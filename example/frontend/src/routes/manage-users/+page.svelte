<script lang="ts">
  import { Search, Pencil, Trash2 } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let query = $state('');

  const filtered = $derived(
    query.trim()
      ? data.users.filter((u: { username: string; email: string }) => {
          const q = query.toLowerCase();
          return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        })
      : data.users
  );
</script>

<svelte:head>
  <title>Manage Users</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Manage Users</h1>

  {#if data.error}
    <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{data.error}</aside>
  {/if}

  <!-- Search -->
  <div class="input-group grid-cols-[auto_1fr]">
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

  <!-- Table -->
  <div class="card preset-filled-surface-100-900 overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-200-800">
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Username</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Email</th>
          <th class="text-left px-4 py-3 font-semibold text-surface-500">Joined</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as user}
          <tr class="border-b border-surface-200-800 last:border-0 hover:preset-tonal-surface transition-colors">
            <td class="px-4 py-3 font-medium">{user.username}</td>
            <td class="px-4 py-3 text-surface-400">{user.email}</td>
            <td class="px-4 py-3 text-surface-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="btn-icon btn-sm hover:preset-tonal-primary"
                  aria-label="Edit {user.username}"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  type="button"
                  class="btn-icon btn-sm hover:preset-tonal-error"
                  aria-label="Delete {user.username}"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4" class="px-4 py-8 text-center text-surface-500">
              No users found.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="text-sm text-surface-500">
    {filtered.length} user{filtered.length !== 1 ? 's' : ''}
  </p>
</div>
