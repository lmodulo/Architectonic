<script lang="ts">
  import { FolderKanban, Paperclip, Download } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Attachment = { name: string; url: string; mimetype: string };

  type Milestone = {
    id:            string;
    title:         string;
    description:   string;
    status:        string;
    priority:      string;
    startDate:     string | null;
    endDate:       string | null;
    completionPct: number;
    sprintCount:   number;
    taskCount:     number;
    attachments:   Attachment[];
  };

  const milestones = data.milestones as Milestone[];

  const STATUS_BADGE: Record<string, string> = {
    'Planning':  'badge-ghost',
    'Active':    'badge-info',
    'On Hold':   'badge-warning',
    'Completed': 'badge-success',
    'Cancelled': 'badge-neutral',
  };

  const PRIORITY_BADGE: Record<string, string> = {
    'Low':      'badge-ghost',
    'Medium':   'badge-info',
    'High':     'badge-warning',
    'Critical': 'badge-error',
  };

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="p-6 max-w-5xl mx-auto">
  <div class="flex items-center gap-3 mb-6">
    <FolderKanban class="w-6 h-6 opacity-60" />
    <div>
      <h1 class="text-xl font-semibold">Projects</h1>
      <p class="text-sm opacity-60">Track the progress of your active projects</p>
    </div>
  </div>

  {#if milestones.length === 0}
    <div class="text-center py-16 opacity-40">
      <FolderKanban class="w-10 h-10 mx-auto mb-3" />
      <p>No projects yet</p>
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      {#each milestones as m (m.id)}
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <span class="font-semibold text-base">{m.title}</span>
                  <span class="badge badge-sm {STATUS_BADGE[m.status] ?? 'badge-ghost'}">{m.status}</span>
                  <span class="badge badge-sm {PRIORITY_BADGE[m.priority] ?? 'badge-ghost'}">{m.priority}</span>
                </div>
                {#if m.description}
                  <p class="text-sm opacity-60 line-clamp-2">{m.description}</p>
                {/if}
              </div>
              <div class="text-right text-sm opacity-60 shrink-0">
                <div>{fmtDate(m.startDate)} – {fmtDate(m.endDate)}</div>
                <div>{m.sprintCount} sprint{m.sprintCount !== 1 ? 's' : ''} · {m.taskCount} task{m.taskCount !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <!-- Progress -->
            <div class="mt-3">
              <div class="flex justify-between text-xs opacity-60 mb-1">
                <span>Progress</span>
                <span>{Math.round(m.completionPct)}%</span>
              </div>
              <progress class="progress progress-primary w-full" value={m.completionPct} max="100"></progress>
            </div>

            <!-- Attachments / deliverables -->
            {#if m.attachments?.length > 0}
              <div class="mt-3 border-t border-base-200 pt-3">
                <p class="text-xs font-medium opacity-60 mb-2 flex items-center gap-1">
                  <Paperclip class="w-3 h-3" /> Deliverables
                </p>
                <div class="flex flex-wrap gap-2">
                  {#each m.attachments as att}
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-xs btn-ghost gap-1 border border-base-300"
                    >
                      <Download class="w-3 h-3" />
                      {att.name}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
