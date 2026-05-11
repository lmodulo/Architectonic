<script lang="ts">
  import { goto } from '$app/navigation';
  import { X } from 'lucide-svelte';
  import { DEAL_STAGES, fmtCurrency, type CrmDeal } from '$lib/utils/crm';
  import DealCard from './DealCard.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let {
    deals = [],
    onStageChange,
  }: {
    deals?: CrmDeal[];
    onStageChange?: (id: string, stage: string, lostReason?: string) => Promise<void>;
  } = $props();

  // Group deals by stage
  const byStage = $derived(
    DEAL_STAGES.reduce<Record<string, CrmDeal[]>>((acc, s) => {
      acc[s] = deals.filter(d => d.stage === s);
      return acc;
    }, {} as Record<string, CrmDeal[]>)
  );

  const stageTotal = (stage: string) =>
    (byStage[stage] ?? []).reduce((s, d) => s + (d.value ?? 0), 0);

  // Drag state
  let draggingId = $state('');
  let dragOverStage = $state('');

  // Closed Lost modal
  let lostModalOpen = $state(false);
  let lostReason    = $state('');
  let pendingId     = $state('');
  let saving        = $state(false);

  function onDragStart(e: DragEvent, id: string) {
    draggingId = id;
    e.dataTransfer!.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, stage: string) {
    e.preventDefault();
    dragOverStage = stage;
  }

  function onDragLeave() {
    dragOverStage = '';
  }

  async function onDrop(e: DragEvent, stage: string) {
    e.preventDefault();
    dragOverStage = '';
    if (!draggingId || !onStageChange) return;
    const deal = deals.find(d => d.id === draggingId);
    if (!deal || deal.stage === stage) { draggingId = ''; return; }

    if (stage === 'Closed Lost') {
      pendingId    = draggingId;
      lostReason   = '';
      lostModalOpen = true;
      draggingId   = '';
      return;
    }

    await onStageChange(draggingId, stage);
    draggingId = '';
  }

  async function confirmLost() {
    if (!lostReason.trim() || !onStageChange) return;
    saving = true;
    await onStageChange(pendingId, 'Closed Lost', lostReason.trim());
    saving      = false;
    lostModalOpen = false;
    pendingId   = '';
    lostReason  = '';
  }

  const STAGE_COLUMN_CLASS: Record<string, string> = {
    'Closed Won':  'border-t-2 border-t-success',
    'Closed Lost': 'border-t-2 border-t-error opacity-80',
  };
</script>

<div class="flex gap-3 overflow-x-auto pb-4 min-h-[420px]">
  {#each DEAL_STAGES as stage}
    {@const stageDrop = (e: DragEvent) => onDrop(e, stage)}
    {@const stageDragOver = (e: DragEvent) => onDragOver(e, stage)}
    <div
      class="flex flex-col gap-2 min-w-[220px] w-[220px] shrink-0 rounded-box bg-base-200 p-3
        border border-base-300 transition-colors
        {STAGE_COLUMN_CLASS[stage] ?? ''}
        {dragOverStage === stage ? 'bg-base-300' : ''}"
      ondragover={stageDragOver}
      ondragleave={onDragLeave}
      ondrop={stageDrop}
      role="region"
      aria-label={stage}
    >
      <!-- Column header -->
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-semibold uppercase tracking-wide opacity-70">{stage}</span>
        <span class="badge badge-xs badge-ghost">{byStage[stage]?.length ?? 0}</span>
      </div>
      <div class="text-xs font-medium text-success mb-2">{fmtCurrency(stageTotal(stage))}</div>

      <!-- Deal cards -->
      {#each byStage[stage] ?? [] as deal (deal.id)}
        <DealCard
          {deal}
          draggable={true}
          ondragstart={(e) => onDragStart(e, deal.id)}
          onclick={() => goto(`/crm/deals/${deal.id}`)}
        />
      {/each}

      {#if (byStage[stage]?.length ?? 0) === 0}
        <div class="flex-1 flex items-center justify-center text-xs opacity-30 py-8">
          Drop here
        </div>
      {/if}
    </div>
  {/each}
</div>

<!-- Closed Lost reason modal -->
{#if lostModalOpen}
  <Modal size="sm" label="Mark as Closed Lost">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-base font-semibold">Reason for closing</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (lostModalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>
    <div class="p-6 space-y-3">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="lost-reason">Lost reason *</label>
      <input
        id="lost-reason"
        type="text"
        class="input w-full"
        placeholder="e.g. Budget constraints, went with competitor…"
        bind:value={lostReason}
      />
    </div>
    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost btn-sm" onclick={() => (lostModalOpen = false)}>Cancel</button>
      <button
        type="button"
        class="btn btn-error btn-sm"
        disabled={!lostReason.trim() || saving}
        onclick={confirmLost}
      >
        {saving ? 'Saving…' : 'Confirm Lost'}
      </button>
    </footer>
  </Modal>
{/if}
