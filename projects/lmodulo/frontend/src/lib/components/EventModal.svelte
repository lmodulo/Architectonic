<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { X } from 'lucide-svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import { hasPermission } from '$lib/permissions';
  import { typeLabel, type CalendarEvent } from '$lib/utils/calendarEvents';

  const KNOWN_TYPES = [
    'upcoming_event',
    'announcement',
    'deadline',
    'project_scope',
  ];

  let {
    event = null,
    open,
    user,
    onSave,
    onDelete,
    onClose,
  }: {
    event?: CalendarEvent | null;
    open: boolean;
    user: unknown;
    onSave: (body: Record<string, unknown>) => Promise<void>;
    onDelete: () => Promise<void>;
    onClose: () => void;
  } = $props();

  const today = new Date().toISOString().slice(0, 10);

  let form = $state({
    title:      '',
    content:    '',
    eventType:  'upcoming_event',
    startDate:  today,
    endDate:    today,
    singleDay:  true,
    allDay:     false,
    location:   '',
    tags:       '',
    status:     'active',
    visibility: 'public',
  });

  let loading      = $state(false);
  let err          = $state('');
  let deletePrompt = $state(false);

  // Populate form when event prop changes
  $effect(() => {
    if (event) {
      form = {
        title:      event.title,
        content:    event.content,
        eventType:  event.eventType,
        startDate:  event.startDate,
        endDate:    event.endDate,
        singleDay:  event.singleDay,
        allDay:     event.allDay,
        location:   event.location,
        tags:       event.tags.join(', '),
        status:     event.status ?? 'active',
        visibility: event.visibility ?? 'public',
      };
    } else {
      form = {
        title: '', content: '', eventType: 'upcoming_event',
        startDate: today, endDate: today, singleDay: true, allDay: false,
        location: '', tags: '', status: 'active', visibility: 'public',
      };
    }
    err          = '';
    deletePrompt = false;
  });

  $effect(() => {
    if (form.singleDay) form.endDate = form.startDate;
  });

  async function save() {
    if (!form.title.trim()) { err = 'Title is required'; return; }
    if (!form.startDate)    { err = 'Start date is required'; return; }
    loading = true; err = '';
    const body = {
      title:      form.title.trim(),
      content:    form.content,
      eventType:  form.eventType,
      startDate:  form.startDate,
      endDate:    form.singleDay ? form.startDate : (form.endDate || form.startDate),
      singleDay:  form.singleDay,
      allDay:     form.allDay,
      location:   form.location,
      tags:       form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status:     form.status,
      visibility: form.visibility,
    };
    try {
      await onSave(body);
    } catch (e: unknown) {
      err = e instanceof Error ? e.message : 'Save failed';
    } finally {
      loading = false;
    }
  }

  async function confirmDelete() {
    loading = true; err = '';
    try {
      await onDelete();
    } catch (e: unknown) {
      err = e instanceof Error ? e.message : 'Delete failed';
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="{event ? 'Edit Event' : 'New Event'}"
  >
    <div
      transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-2xl shadow-xl mx-4 flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-200-800 shrink-0">
        <h2 class="text-lg font-semibold">{event ? 'Edit Event' : 'New Event'}</h2>
        <button type="button" class="btn-icon hover:preset-tonal" onclick={onClose} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if err}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{err}</aside>
        {/if}

        <!-- Title -->
        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-title">Title</label>
          <input id="ev-title" type="text" class="input w-full" placeholder="Event title"
            bind:value={form.title} maxlength="200" />
        </div>

        <!-- Type + Status row -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-type">Type</label>
            <select id="ev-type" class="select w-full" bind:value={form.eventType}>
              {#each KNOWN_TYPES as t}
                <option value={t}>{typeLabel(t)}</option>
              {/each}
            </select>
          </div>
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-status">Status</label>
            <select id="ev-status" class="select w-full" bind:value={form.status}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-start">Start Date</label>
            <input id="ev-start" type="date" class="input w-full" bind:value={form.startDate} />
          </div>
          <div class="space-y-1">
            <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-end">End Date</label>
            <input id="ev-end" type="date" class="input w-full" bind:value={form.endDate}
              disabled={form.singleDay} min={form.startDate} />
          </div>
        </div>

        <!-- Toggles -->
        <div class="flex gap-6">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" class="checkbox" bind:checked={form.singleDay} />
            <span class="text-sm">Single-day</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" class="checkbox" bind:checked={form.allDay} />
            <span class="text-sm">All day</span>
          </label>
        </div>

        <!-- Visibility -->
        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-vis">Visibility</label>
          <select id="ev-vis" class="select w-full" bind:value={form.visibility}>
            <option value="public">Public</option>
            <option value="authenticated">Authenticated users</option>
            <option value="private">Private (admins only)</option>
          </select>
        </div>

        <!-- Location -->
        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-loc">Location</label>
          <input id="ev-loc" type="text" class="input w-full" placeholder="Optional location"
            bind:value={form.location} />
        </div>

        <!-- Tags -->
        <div class="space-y-1">
          <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-tags">Tags</label>
          <input id="ev-tags" type="text" class="input w-full" placeholder="Comma-separated tags"
            bind:value={form.tags} />
        </div>

        <!-- Content -->
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">Description</p>
          <MessageEditor bind:html={form.content} placeholder="Event description…" />
        </div>
      </div>

      <footer class="flex items-center justify-between px-6 pb-5 pt-3 border-t border-surface-200-800 shrink-0">
        <div>
          {#if event && hasPermission(user, 'calendar_events', 'delete')}
            <button type="button" class="btn preset-tonal-error" disabled={loading}
              onclick={() => (deletePrompt = true)}>
              Delete
            </button>
          {/if}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn preset-tonal" onclick={onClose}>Cancel</button>
          <button type="button" class="btn preset-filled-primary-500" disabled={loading} onclick={save}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<!-- Delete confirm -->
{#if deletePrompt}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-label="Confirm delete"
  >
    <div
      transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
      class="card preset-filled-surface-100-900 w-full max-w-sm shadow-xl mx-4"
    >
      <div class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">Delete event?</h2>
        <p class="text-sm opacity-70">
          "<strong>{form.title}</strong>" will be permanently removed. This cannot be undone.
        </p>
        {#if err}
          <aside class="alert preset-tonal-error p-3 rounded-base text-sm">{err}</aside>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn preset-tonal" onclick={() => (deletePrompt = false)}>Cancel</button>
        <button type="button" class="btn preset-filled-error-500" disabled={loading} onclick={confirmDelete}>
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
