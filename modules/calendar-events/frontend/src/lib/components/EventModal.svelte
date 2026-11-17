<script lang="ts">
  import { fade, scale, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { X } from 'lucide-svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import EventMediaEditor from './EventMediaEditor.svelte';
  import { hasPermission } from '$lib/permissions';
  import { typeLabel, type CalendarEvent } from '$lib/utils/calendarEvents';
  import { EventMediaUploads } from '$lib/utils/eventMediaUploads.svelte';

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
    startTime:  '',
    endTime:    '',
    location:   '',
    tags:       '',
    status:     'active',
    visibility: 'public',
  });

  let loading      = $state(false);
  let err          = $state('');
  let deletePrompt = $state(false);
  /** The form's photos and videos; a fresh list each time the modal opens */
  let media        = $state<EventMediaUploads | null>(null);

  // Fill the form each time the modal opens, and if the event changes while it's open. Keyed on `open` as well as
  // `event`: opening New twice in a row passes null both times, and an event-only effect kept the last form's values.
  // `.pre` so the form is filled before the modal renders: the description editor (Tiptap) reads its content once,
  // when it's created, and a plain $effect ran after that, leaving the description empty when editing.
  $effect.pre(() => {
    if (!open) return;
    if (event) {
      form = {
        title:      event.title,
        content:    event.content,
        eventType:  event.eventType,
        startDate:  event.startDate,
        endDate:    event.endDate,
        singleDay:  event.singleDay,
        allDay:     event.allDay,
        startTime:  event.startTime,
        endTime:    event.endTime,
        location:   event.location,
        tags:       event.tags.join(', '),
        status:     event.status ?? 'active',
        visibility: event.visibility ?? 'public',
      };
    } else {
      form = {
        title: '', content: '', eventType: 'upcoming_event',
        startDate: today, endDate: today, singleDay: true, allDay: false, startTime: '', endTime: '',
        location: '', tags: '', status: 'active', visibility: 'public',
      };
    }
    err          = '';
    deletePrompt = false;
    // Closing (or switching events) stops this form's uploads and deletes any its save didn't take
    const uploads = new EventMediaUploads(event?.media ?? [], event?.id ?? null);
    media = uploads;
    return () => uploads.dispose();
  });

  $effect(() => {
    if (form.singleDay) form.endDate = form.startDate;
  });

  // Times are wall-clock "HH:MM" at the event, with no time zone: the start time is on the start date, the end
  // time on the end date. The end time is optional ("starts at 7 PM").
  const oneDay = $derived(form.singleDay || !form.endDate || form.endDate <= form.startDate);
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const hhmm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

  // Moving the start time keeps the event's length on a one-day event, and the first start time chosen gets an
  // end an hour later (both stop at 11:59 PM), as calendar apps do. Clearing the end time leaves it cleared.
  function setStartTime(value: string) {
    const before = form.startTime;
    form.startTime = value;
    if (!value || !oneDay) return;
    if (!before && !form.endTime) {
      form.endTime = hhmm(Math.min(minutes(value) + 60, 23 * 60 + 59));
    } else if (before && form.endTime && minutes(form.endTime) > minutes(before)) {
      form.endTime = hhmm(Math.min(minutes(value) + minutes(form.endTime) - minutes(before), 23 * 60 + 59));
    }
  }

  async function save() {
    if (!form.title.trim()) { err = 'Title is required'; return; }
    if (!form.startDate)    { err = 'Start date is required'; return; }
    if (!form.allDay && !form.startTime) { err = 'Choose a start time, or tick All day'; return; }
    if (!form.allDay && form.endTime && oneDay && form.endTime <= form.startTime) {
      err = 'End time must be after the start time'; return;
    }
    if (media?.busy) { err = 'Wait for the uploads to finish'; return; }
    loading = true; err = '';
    const body = {
      title:      form.title.trim(),
      content:    form.content,
      eventType:  form.eventType,
      startDate:  form.startDate,
      endDate:    form.singleDay ? form.startDate : (form.endDate || form.startDate),
      singleDay:  form.singleDay,
      allDay:     form.allDay,
      startTime:  form.allDay ? null : form.startTime,
      endTime:    form.allDay ? null : form.endTime || null,
      location:   form.location,
      tags:       form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status:     form.status,
      visibility: form.visibility,
      media:      media?.ids ?? [],
    };
    // The parent closes the modal when the save succeeds, which disposes the uploads: these are now the event's
    media?.keep(body.media);
    try {
      await onSave(body);
    } catch (e: unknown) {
      media?.keep([]);
      err = e instanceof Error ? e.message : 'Save failed';
    } finally {
      loading = false;
    }
  }

  async function confirmDelete() {
    loading = true; err = '';
    try {
      await onDelete();
      deletePrompt = false; // the prompt sits outside {#if open}, so closing the modal doesn't close it
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
      class="card bg-base-200 border border-base-300 rounded-box w-full max-w-2xl shadow-xl mx-4 flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{event ? 'Edit Event' : 'New Event'}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={onClose} aria-label="Close">
          <X class="size-5" />
        </button>
      </header>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if err}
          <aside class="alert alert-error p-3 rounded text-sm">{err}</aside>
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

        <!-- Times (not for an all-day event): lined up under the dates they belong to -->
        {#if !form.allDay}
          <div class="grid grid-cols-2 gap-4" transition:slide={{ duration: 200 }}>
            <div class="space-y-1">
              <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-start-time">Start Time</label>
              <input id="ev-start-time" type="time" class="input w-full" required
                value={form.startTime} oninput={(e) => setStartTime(e.currentTarget.value)} />
            </div>
            <div class="space-y-1">
              <label class="label text-xs font-medium opacity-60 uppercase tracking-wide" for="ev-end-time">End Time</label>
              <input id="ev-end-time" type="time" class="input w-full" aria-describedby="ev-end-time-hint"
                bind:value={form.endTime} min={oneDay && form.startTime ? form.startTime : undefined} />
              <p id="ev-end-time-hint" class="text-xs opacity-60">{oneDay ? 'Optional.' : 'Optional. On the end date.'}</p>
            </div>
          </div>
        {/if}

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

        <!-- Photos and videos -->
        {#if media}
          <EventMediaEditor uploads={media} />
        {/if}
      </div>

      <footer class="flex items-center justify-between px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
        <div>
          {#if event && hasPermission(user, 'calendar_events', 'delete')}
            <button type="button" class="btn btn-error btn-soft" disabled={loading}
              onclick={() => (deletePrompt = true)}>
              Delete
            </button>
          {/if}
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-ghost" onclick={onClose}>Cancel</button>
          <button type="button" class="btn btn-primary" disabled={loading || media?.busy} onclick={save}>
            {loading ? 'Saving…' : media?.busy ? 'Uploading…' : 'Save'}
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
      class="card bg-base-200 border border-base-300 rounded-box w-full max-w-sm shadow-xl mx-4"
    >
      <div class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">Delete event?</h2>
        <p class="text-sm opacity-70">
          "<strong>{form.title}</strong>" will be permanently removed. This cannot be undone.
        </p>
        {#if err}
          <aside class="alert alert-error p-3 rounded text-sm">{err}</aside>
        {/if}
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (deletePrompt = false)}>Cancel</button>
        <button type="button" class="btn btn-error" disabled={loading} onclick={confirmDelete}>
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </div>
  </div>
{/if}
