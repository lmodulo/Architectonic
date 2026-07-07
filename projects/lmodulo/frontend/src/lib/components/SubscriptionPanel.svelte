<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { typeLabel } from '$lib/utils/calendarEvents';

  type Sub = {
    subscribed: boolean;
    eventTypes: string[];
    notifyOn: { newEvent: boolean; reminder: boolean; reminderDays: number };
    channels: { inApp: boolean; email: boolean };
  };

  let {
    user,
    eventTypes = [],
  }: {
    user: unknown;
    eventTypes?: string[];
  } = $props();

  let sub     = $state<Sub | null>(null);
  let loading = $state(false);
  let saved   = $state(false);
  let err     = $state('');

  const isLoggedIn = $derived(Boolean((user as { id?: string } | null)?.id));

  onMount(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch('/api/calendar-events/subscriptions');
      if (res.ok) sub = await res.json();
    } catch { /* non-critical */ }
  });

  async function toggleSubscription() {
    if (!sub) return;
    if (sub.subscribed) {
      await unsubscribe();
    } else {
      sub = { ...sub, subscribed: true };
      await save();
    }
  }

  async function save() {
    if (!sub) return;
    loading = true; err = ''; saved = false;
    try {
      const res = await fetch('/api/calendar-events/subscriptions', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventTypes:  sub.eventTypes,
          notifyOn:    sub.notifyOn,
          channels:    sub.channels,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        err = (d as { message?: string }).message ?? 'Save failed';
        return;
      }
      sub = { ...sub, subscribed: true };
      saved = true;
      setTimeout(() => (saved = false), 2500);
    } catch {
      err = 'Network error';
    } finally {
      loading = false;
    }
  }

  async function unsubscribe() {
    loading = true; err = '';
    try {
      const res = await fetch('/api/calendar-events/subscriptions', { method: 'DELETE' });
      if (res.status === 204 || res.ok) {
        sub = { subscribed: false, eventTypes: [], notifyOn: { newEvent: true, reminder: false, reminderDays: 1 }, channels: { inApp: true, email: false } };
      }
    } catch {
      err = 'Network error';
    } finally {
      loading = false;
    }
  }

  function toggleType(type: string) {
    if (!sub) return;
    if (sub.eventTypes.includes(type)) {
      sub.eventTypes = sub.eventTypes.filter(t => t !== type);
    } else {
      sub.eventTypes = [...sub.eventTypes, type];
    }
  }
</script>

{#if !isLoggedIn}
  <div class="card bg-base-200 border border-base-300 rounded-box p-4 flex items-center gap-3 text-sm">
    <Icon name="Bell" size={16} class="size-4 opacity-50" />
    <span class="opacity-70">
      <a href="/login" class="link link-primary">{m.event_sub_sign_in()}</a>
    </span>
  </div>

{:else if sub === null}
  <!-- Loading -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-4 animate-pulse h-14"></div>

{:else}
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        {#if sub.subscribed}
          <Icon name="BellRing" size={16} class="size-4 text-primary" />
          <span class="font-medium text-sm">{m.event_sub_subscribed()}</span>
        {:else}
          <Icon name="BellOff" size={16} class="size-4 opacity-50" />
          <span class="font-medium text-sm opacity-70">{m.event_sub_not_subscribed()}</span>
        {/if}
      </div>
      <button
        type="button"
        class="btn btn-sm {sub.subscribed ? 'btn-error btn-soft' : 'btn-primary'}"
        disabled={loading}
        onclick={toggleSubscription}
      >
        {sub.subscribed ? m.event_sub_unsubscribe() : m.event_sub_subscribe()}
      </button>
    </div>

    {#if sub.subscribed}
      {#if err}
        <aside class="alert alert-error p-3 rounded text-sm">{err}</aside>
      {/if}

      <!-- Event types -->
      {#if eventTypes.length > 0}
        <div class="space-y-2">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.event_sub_notify_about()}</p>
          <div class="flex flex-wrap gap-3">
            {#each eventTypes as type}
              <label class="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  class="checkbox"
                  checked={sub.eventTypes.length === 0 || sub.eventTypes.includes(type)}
                  onchange={() => toggleType(type)}
                />
                {typeLabel(type)}
              </label>
            {/each}
            <label class="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                class="checkbox"
                checked={sub.eventTypes.length === 0}
                onchange={() => { if (sub) sub.eventTypes = []; }}
              />
              {m.event_sub_all_types()}
            </label>
          </div>
        </div>
      {/if}

      <!-- Triggers -->
      <div class="space-y-2">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.event_sub_when()}</p>
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" class="checkbox" bind:checked={sub.notifyOn.newEvent} />
            {m.event_sub_new_event()}
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" class="checkbox" bind:checked={sub.notifyOn.reminder} />
            {m.event_sub_reminder()}
          </label>
          {#if sub.notifyOn.reminder}
            <div class="pl-6 flex items-center gap-2 text-sm">
              <input
                type="number" class="input w-20 text-sm" min="0" max="30"
                bind:value={sub.notifyOn.reminderDays}
              />
              <span class="opacity-70">{m.event_sub_days_before()}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Email -->
      <div class="space-y-2">
        <p class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.event_sub_channels()}</p>
        <label class="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input type="checkbox" class="checkbox" bind:checked={sub.channels.email} />
          {m.event_sub_email()}
        </label>
      </div>

      <div class="flex items-center justify-end gap-3">
        {#if saved}
          <span class="text-sm text-success">{m.event_sub_saved()}</span>
        {/if}
        <button type="button" class="btn btn-sm btn-primary" disabled={loading} onclick={save}>
          {loading ? m.common_saving() : m.event_sub_save()}
        </button>
      </div>
    {/if}
  </div>
{/if}
