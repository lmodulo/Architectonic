<script lang="ts">
  import { enhance } from '$app/forms';
  import { Bell } from 'lucide-svelte';
  import { typeLabel } from '$lib/utils/calendarEvents';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type Sub = {
    subscribed:  boolean;
    eventTypes:  string[];
    notifyOn:    { newEvent: boolean; reminder: boolean; reminderDays: number };
    channels:    { inApp: boolean; email: boolean };
  };

  const sub        = data.sub as Sub | null;
  const eventTypes = (data.eventTypes ?? []) as string[];

  const isSubscribed = $derived(Boolean((data.sub as Sub | null)?.subscribed) && !form?.unsubscribed);

  let notifyNewEvent  = $state(sub?.notifyOn.newEvent     ?? true);
  let notifyReminder  = $state(sub?.notifyOn.reminder     ?? false);
  let reminderDays    = $state(sub?.notifyOn.reminderDays ?? 1);
  let channelEmail    = $state(sub?.channels.email        ?? false);
  let checkedTypes    = $state<string[]>(sub?.eventTypes  ?? []);

  function toggleType(type: string) {
    if (checkedTypes.includes(type)) {
      checkedTypes = checkedTypes.filter(t => t !== type);
    } else {
      checkedTypes = [...checkedTypes, type];
    }
  }
</script>

<svelte:head>
  <title>Event Notification Preferences</title>
</svelte:head>

<div class="space-y-8 max-w-xl">
  <div class="flex items-center gap-2">
    <Bell class="size-5 text-primary" />
    <h1 class="text-xl font-semibold">Event Notification Preferences</h1>
  </div>

  {#if form?.success}
    <div class="alert alert-success text-sm px-4 py-2 rounded-box">Preferences saved.</div>
  {/if}
  {#if form?.unsubscribed}
    <div class="alert text-sm px-4 py-2 rounded-box">You have been unsubscribed from event notifications.</div>
  {/if}
  {#if form?.error}
    <div class="alert alert-error text-sm px-4 py-2 rounded-box">{form.error}</div>
  {/if}

  {#if !isSubscribed}
    <section class="card bg-base-200 border border-base-300 p-4 space-y-3">
      <p class="text-sm opacity-70">You are not currently subscribed to event notifications.</p>
      <form method="POST" action="?/save" use:enhance>
        <input type="hidden" name="notify_new_event" value="on" />
        <input type="hidden" name="notify_reminder"  value="" />
        <input type="hidden" name="reminder_days"    value="1" />
        <button type="submit" class="btn btn-primary btn-sm">Subscribe to notifications</button>
      </form>
    </section>
  {:else}
    <form method="POST" action="?/save" use:enhance class="space-y-6">

      {#each checkedTypes as t}
        <input type="hidden" name="eventTypes" value={t} />
      {/each}

      <!-- Event types -->
      {#if eventTypes.length > 0}
        <section class="card bg-base-200 border border-base-300 p-4 space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Event Types</h2>
          <p class="text-xs opacity-50">Receive notifications for these event types. Leave all unchecked to follow all types.</p>
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            {#each eventTypes as type}
              <label class="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  class="checkbox"
                  checked={checkedTypes.length === 0 || checkedTypes.includes(type)}
                  onchange={() => toggleType(type)}
                />
                {typeLabel(type)}
              </label>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Triggers -->
      <section class="card bg-base-200 border border-base-300 p-4 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">When to Notify</h2>
        <label class="flex items-center gap-3 text-sm">
          <input type="checkbox" name="notify_new_event" class="checkbox" bind:checked={notifyNewEvent} />
          <span>When a new event is created</span>
        </label>
        <label class="flex items-center gap-3 text-sm">
          <input type="checkbox" name="notify_reminder" class="checkbox" bind:checked={notifyReminder} />
          <span>Reminder before event starts</span>
        </label>
        {#if notifyReminder}
          <div class="pl-7 flex items-center gap-2 text-sm">
            <input
              type="number"
              name="reminder_days"
              class="input w-20 text-sm"
              min="0"
              max="30"
              bind:value={reminderDays}
            />
            <span class="opacity-70">day(s) before</span>
          </div>
        {:else}
          <input type="hidden" name="reminder_days" value={reminderDays} />
        {/if}
      </section>

      <!-- Channels -->
      <section class="card bg-base-200 border border-base-300 p-4 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Delivery Channels</h2>
        <label class="flex items-center gap-3 text-sm">
          <input type="checkbox" class="checkbox" checked disabled />
          <span>In-app (always on)</span>
        </label>
        <label class="flex items-center gap-3 text-sm">
          <input type="checkbox" name="channel_email" class="checkbox" bind:checked={channelEmail} />
          <span>Email notifications</span>
        </label>
      </section>

      <div class="flex items-center gap-3">
        <button type="submit" class="btn btn-primary">Save Preferences</button>
        <a href="/calendar-events" class="btn btn-ghost">Back</a>
      </div>

    </form>

    <form method="POST" action="?/unsubscribe" use:enhance>
      <button type="submit" class="btn btn-error btn-soft btn-sm">Unsubscribe</button>
    </form>
  {/if}
</div>
