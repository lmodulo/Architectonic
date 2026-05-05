<script lang="ts">
  import TaskCard from './TaskCard.svelte';
  import { TASK_STATUSES } from '$lib/utils/agile';
  import type { AgileTask } from '$lib/utils/agile';

  let {
    tasks,
    canUpdate = false,
    onTaskClick,
    onStatusChange,
  }: {
    tasks:          AgileTask[];
    canUpdate?:     boolean;
    onTaskClick?:   (task: AgileTask) => void;
    onStatusChange?: (taskId: string, newStatus: string) => Promise<void>;
  } = $props();

  let draggedId   = $state<string | null>(null);
  let dropTarget  = $state<string | null>(null);
  let localTasks  = $state<AgileTask[]>([...tasks]);

  $effect(() => { localTasks = [...tasks]; });

  function byStatus(status: string) {
    return localTasks.filter(t => t.status === status);
  }

  const COLUMN_LABELS: Record<string, string> = {
    Backlog:      'Backlog',
    Ready:        'Ready',
    'In Progress':'In Progress',
    Blocked:      'Blocked',
    Review:       'Review',
    Done:         'Done',
  };

  const COLUMN_COLOR: Record<string, string> = {
    Backlog:      'border-t-surface-400',
    Ready:        'border-t-primary-500',
    'In Progress':'border-t-success-500',
    Blocked:      'border-t-error-500',
    Review:       'border-t-secondary-500',
    Done:         'border-t-success-700',
  };

  function onDragStart(e: DragEvent, task: AgileTask) {
    draggedId = task.id;
    e.dataTransfer?.setData('text/plain', task.id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, status: string) {
    e.preventDefault();
    dropTarget = status;
    e.dataTransfer!.dropEffect = 'move';
  }

  function onDragLeave() {
    dropTarget = null;
  }

  async function onDrop(e: DragEvent, newStatus: string) {
    e.preventDefault();
    dropTarget = null;
    const id = e.dataTransfer?.getData('text/plain') ?? draggedId;
    if (!id) return;
    const task = localTasks.find(t => t.id === id);
    if (!task || task.status === newStatus) { draggedId = null; return; }

    // Optimistic update
    localTasks = localTasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    draggedId = null;

    if (canUpdate && onStatusChange) {
      try {
        await onStatusChange(id, newStatus);
      } catch {
        // Revert on failure
        localTasks = [...tasks];
      }
    }
  }
</script>

<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[400px]">
  {#each TASK_STATUSES as status}
    {@const columnTasks = byStatus(status)}
    <div
      class="flex flex-col gap-2"
      ondragover={e => onDragOver(e, status)}
      ondragleave={onDragLeave}
      ondrop={e => onDrop(e, status)}
      role="region"
      aria-label="{status} column"
    >
      <!-- Column header -->
      <div class="card preset-filled-surface-100-900 px-3 py-2 border-t-2 {COLUMN_COLOR[status] ?? 'border-t-surface-400'}
        {dropTarget === status ? 'ring-2 ring-primary-500/50' : ''}">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold">{COLUMN_LABELS[status]}</span>
          <span class="badge text-[10px] preset-tonal-surface min-w-[20px] text-center">{columnTasks.length}</span>
        </div>
      </div>

      <!-- Drop zone + cards -->
      <div
        class="flex-1 flex flex-col gap-2 min-h-[100px] rounded-lg p-1 transition-colors
          {dropTarget === status ? 'bg-primary-500/5 ring-1 ring-dashed ring-primary-500/40' : ''}"
      >
        {#each columnTasks as task (task.id)}
          <TaskCard
            {task}
            draggable={canUpdate}
            onclick={() => onTaskClick?.(task)}
            ondragstart={e => onDragStart(e, task)}
          />
        {/each}
        {#if columnTasks.length === 0}
          <div class="flex-1 flex items-center justify-center text-xs opacity-30 py-4">
            {dropTarget === status ? 'Drop here' : 'No tasks'}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
