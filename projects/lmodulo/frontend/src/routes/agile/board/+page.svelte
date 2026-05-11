<script lang="ts">
  import { Search } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { hasPermission } from '$lib/permissions';
  import KanbanBoard from '$lib/components/agile/KanbanBoard.svelte';
  import UserSelect from '$lib/components/UserSelect.svelte';
  import type { AgileTask } from '$lib/utils/agile';

  let { data }: { data: PageData } = $props();

  const allTasks   = $derived((data.tasks ?? []) as AgileTask[]);
  const milestones = $derived((data.milestones ?? []) as any[]);
  const users      = $derived((data.users ?? []) as any[]);

  let filterAssignee  = $state<string | null>(null);
  let filterMilestone = $state('');
  let filterPriority  = $state('');
  let search          = $state('');

  const filtered = $derived(allTasks.filter(t => {
    if (filterAssignee  && t.assignedTo !== filterAssignee) return false;
    if (filterPriority  && t.priority   !== filterPriority)  return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }));

  async function handleStatusChange(taskId: string, newStatus: string) {
    const res = await fetch(`/api/agile/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Update failed');
  }
</script>

<svelte:head><title>Agile Board</title></svelte:head>

<div class="space-y-5">

  <div class="flex items-start justify-between gap-4">
    <h2 class="text-lg font-semibold">Global Task Board</h2>
    <div class="flex flex-col items-end gap-2">
      <!-- Search -->
      <label class="input flex items-center gap-2 h-8 text-xs">
        <Search class="size-3.5 opacity-50" />
        <input type="search" class="grow text-xs" placeholder="Search tasks…" bind:value={search} />
      </label>
      <!-- Filters -->
      <div class="w-48">
        <UserSelect {users} placeholder="All assignees" clearable bind:value={filterAssignee} />
      </div>
      <select class="select text-xs h-8 px-2" bind:value={filterPriority}>
        <option value="">All priorities</option>
        {#each ['Low', 'Medium', 'High', 'Critical'] as p}
          <option value={p}>{p}</option>
        {/each}
      </select>
    </div>
  </div>

  <p class="text-xs opacity-50">{filtered.length} task{filtered.length !== 1 ? 's' : ''} shown</p>

  <KanbanBoard
    tasks={filtered}
    canUpdate={hasPermission(data.user, 'agile_tasks', 'update')}
    onStatusChange={handleStatusChange}
    onTaskClick={t => goto(`/agile/tasks/${t.id}`)}
  />

</div>
