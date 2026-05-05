<script lang="ts">
  import type { UserWithPermissions } from '$lib/permissions';

  let { user }: { user: UserWithPermissions | null | undefined } = $props();

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner', admin: 'Administrator', lead: 'Lead',
    contributor: 'Contributor', viewer: 'Viewer', customer: 'Customer',
  };

  const AGILE_RESOURCES = ['agile_milestones', 'agile_sprints', 'agile_jobs', 'agile_tasks'] as const;
  const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
  const RESOURCE_LABELS: Record<string, string> = {
    agile_milestones: 'Milestones',
    agile_sprints:    'Sprints',
    agile_jobs:       'Jobs',
    agile_tasks:      'Tasks',
  };

  const perms = $derived(user?.permissions ?? {});
  const roleLabel = $derived(ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? 'Unknown');

  const ROLE_BADGE: Record<string, string> = {
    owner: 'preset-tonal-error',
    admin: 'preset-tonal-primary',
    lead:  'preset-tonal-warning',
    contributor: 'preset-tonal-success',
    viewer: 'preset-tonal-surface',
    customer: 'preset-tonal-surface',
  };
</script>

<div class="card preset-filled-surface-100-900 p-4 space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold">Your Role</h3>
    <span class="badge text-xs {ROLE_BADGE[user?.role ?? ''] ?? 'preset-tonal-surface'}">
      {roleLabel}
    </span>
  </div>

  <!-- Permission grid -->
  <div class="overflow-x-auto">
    <table class="w-full text-xs">
      <thead>
        <tr>
          <th class="text-left py-1 pr-3 font-medium opacity-50">Resource</th>
          {#each ACTIONS as action}
            <th class="text-center py-1 px-1 font-medium opacity-50 capitalize">{action[0].toUpperCase()}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each AGILE_RESOURCES as resource}
          <tr class="border-t border-surface-200-800">
            <td class="py-1 pr-3 text-left opacity-70">{RESOURCE_LABELS[resource]}</td>
            {#each ACTIONS as action}
              <td class="py-1 px-1 text-center">
                {#if perms[resource]?.[action]}
                  <span class="text-success-500 font-bold">✓</span>
                {:else}
                  <span class="opacity-20">—</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
