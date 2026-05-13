<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { TicketPlus, Paperclip, X, FileText, AlertCircle } from 'lucide-svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Ticket = {
    id:            string;
    title:         string;
    description:   string;
    status:        string;
    completionPct: number;
    attachments:   { name: string; url: string; mimetype: string }[];
    createdAt:     string;
    updatedAt:     string;
  };

  let tickets = $state<Ticket[]>(data.tickets as Ticket[]);

  // ── New ticket form state ──────────────────────────────────────────
  let modalOpen    = $state(false);
  let title        = $state('');
  let description  = $state('');
  let pendingFiles = $state<File[]>([]);
  let submitting   = $state(false);
  let formError    = $state('');
  let fileInput: HTMLInputElement;

  function openModal() {
    title = ''; description = ''; pendingFiles = []; formError = '';
    modalOpen = true;
  }

  function onFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files  = Array.from(target.files ?? []);
    target.value = '';
    for (const f of files) {
      if (!pendingFiles.some(p => p.name === f.name)) pendingFiles = [...pendingFiles, f];
    }
  }

  function removePending(name: string) {
    pendingFiles = pendingFiles.filter(f => f.name !== name);
  }

  async function submitTicket() {
    if (!title.trim()) { formError = 'Title is required'; return; }
    submitting = true; formError = '';
    try {
      const res = await fetch('/api/tickets', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        formError = (d as { message?: string }).message ?? 'Failed to create ticket';
        return;
      }
      const ticket = await res.json() as Ticket;

      for (const file of pendingFiles) {
        const fd = new FormData();
        fd.append('file', file);
        await fetch(`/api/tickets/${ticket.id}/attachments`, { method: 'POST', body: fd });
      }

      modalOpen = false;
      await invalidateAll();
      const listRes = await fetch('/api/tickets');
      if (listRes.ok) {
        const d = await listRes.json();
        tickets = (d.tickets ?? []) as Ticket[];
      }
    } catch {
      formError = 'An unexpected error occurred. Please try again.';
    } finally {
      submitting = false;
    }
  }

  // ── Status helpers ─────────────────────────────────────────────────
  type BadgeVariant = 'badge-ghost' | 'badge-info' | 'badge-warning' | 'badge-success' | 'badge-error' | 'badge-neutral';

  function statusBadge(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      'Backlog':     'badge-ghost',
      'In Progress': 'badge-info',
      'Blocked':     'badge-error',
      'Review':      'badge-warning',
      'Done':        'badge-success',
      'Cancelled':   'badge-neutral',
    };
    return map[status] ?? 'badge-ghost';
  }

  function progressFromStatus(status: string, pct: number): number {
    if (pct > 0) return Math.round(pct);
    const fallback: Record<string, number> = {
      'Backlog': 0, 'In Progress': 30, 'Blocked': 30, 'Review': 75, 'Done': 100, 'Cancelled': 0,
    };
    return fallback[status] ?? 0;
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold">Support Tickets</h1>
      <p class="text-base-content/60 text-sm mt-0.5">Submit and track your support requests</p>
    </div>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => openModal()}>
      <TicketPlus size={16} />
      New Ticket
    </button>
  </div>

  {#if tickets.length === 0}
    <div class="flex flex-col items-center justify-center py-20 text-base-content/40">
      <AlertCircle size={40} class="mb-3" />
      <p class="text-sm">No tickets yet. Click <strong>New Ticket</strong> to get started.</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-box border border-base-200">
      <table class="table table-sm w-full">
        <thead>
          <tr class="text-xs uppercase text-base-content/50 tracking-wide">
            <th class="w-full">Title</th>
            <th class="whitespace-nowrap">Status</th>
            <th class="whitespace-nowrap min-w-[140px]">Progress</th>
            <th class="whitespace-nowrap">Files</th>
            <th class="whitespace-nowrap">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {#each tickets as ticket (ticket.id)}
            <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
              <td>
                <div class="font-medium">{ticket.title}</div>
                {#if ticket.description}
                  <div class="text-xs text-base-content/50 truncate max-w-xs">{ticket.description}</div>
                {/if}
              </td>
              <td>
                <span class="badge badge-sm {statusBadge(ticket.status)}">{ticket.status}</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <progress class="progress progress-primary w-24 h-2" value={progressFromStatus(ticket.status, ticket.completionPct)} max="100"></progress>
                  <span class="text-xs text-base-content/60 tabular-nums">{progressFromStatus(ticket.status, ticket.completionPct)}%</span>
                </div>
              </td>
              <td>
                {#if ticket.attachments?.length}
                  <span class="flex items-center gap-1 text-xs text-base-content/60">
                    <Paperclip size={12} />
                    {ticket.attachments.length}
                  </span>
                {:else}
                  <span class="text-base-content/30 text-xs">—</span>
                {/if}
              </td>
              <td class="text-xs text-base-content/60 whitespace-nowrap">{formatDate(ticket.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if modalOpen}
  <Modal size="md" label="New Support Ticket">
    <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
      <h2 class="text-lg font-semibold">New Support Ticket</h2>
      <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (modalOpen = false)}>
        <X class="size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4 overflow-y-auto flex-1">
      {#if formError}
        <aside class="alert alert-error p-3 rounded text-sm">{formError}</aside>
      {/if}

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="tk-title">Title *</label>
        <input
          id="tk-title"
          type="text"
          class="input w-full"
          placeholder="Briefly describe the issue"
          bind:value={title}
          onkeydown={(e) => e.key === 'Enter' && submitTicket()}
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="tk-desc">Description</label>
        <textarea
          id="tk-desc"
          class="textarea w-full resize-none"
          rows="4"
          placeholder="Optional — provide any additional details"
          bind:value={description}
        ></textarea>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Attachments</p>
        {#if pendingFiles.length > 0}
          <ul class="space-y-1 mb-2">
            {#each pendingFiles as file (file.name)}
              <li class="flex items-center gap-2 text-sm bg-base-300/50 rounded px-2 py-1">
                <FileText size={14} class="shrink-0 text-base-content/50" />
                <span class="truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  onclick={() => removePending(file.name)}
                  aria-label="Remove {file.name}"
                >
                  <X size={12} />
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        <input bind:this={fileInput} type="file" multiple class="hidden" onchange={onFileSelect} />
        <button type="button" class="btn btn-ghost btn-sm gap-2" onclick={() => fileInput.click()}>
          <Paperclip size={14} />
          Attach files
        </button>
      </div>
    </div>

    <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
      <button type="button" class="btn btn-ghost" onclick={() => (modalOpen = false)}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={submitting} onclick={submitTicket}>
        {#if submitting}
          <span class="loading loading-spinner loading-xs"></span>
          Submitting…
        {:else}
          Submit Ticket
        {/if}
      </button>
    </footer>
  </Modal>
{/if}
