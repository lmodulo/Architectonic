<script lang="ts">
  import { enhance } from '$app/forms';
  import { Settings } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const prefs = data.prefs as {
    channels: { websocket: boolean; email: boolean };
    muted: string[];
    quiet: { enabled: boolean; start: string; end: string; timezone: string };
  } | null;

  const KNOWN_TYPES = [
    { type: 'message.received',   label: 'New message received',   group: 'Messages' },
    { type: 'message.reply',      label: 'Reply to your message',  group: 'Messages' },
    { type: 'auth.password',      label: 'Password changed',       group: 'Account'  },
    { type: 'role.changed',       label: 'Role / permissions updated', group: 'Account' },
    { type: 'order.placed',       label: 'New order placed',       group: 'Storefront' },
    { type: 'order.status',       label: 'Order status changed',   group: 'Storefront' },
    { type: 'product.low_stock',  label: 'Low stock alert',        group: 'Storefront' },
  ];

  const groups = [...new Set(KNOWN_TYPES.map(t => t.group))];

  let emailEnabled  = $state(prefs?.channels.email   ?? false);
  let quietEnabled  = $state(prefs?.quiet.enabled    ?? false);
  let quietStart    = $state(prefs?.quiet.start      ?? '22:00');
  let quietEnd      = $state(prefs?.quiet.end        ?? '08:00');
  let quietTimezone = $state(prefs?.quiet.timezone   ?? 'UTC');
  let muted         = $state<string[]>(prefs?.muted  ?? []);

  function toggleMuted(type: string) {
    if (muted.includes(type)) {
      muted = muted.filter(t => t !== type);
    } else {
      muted = [...muted, type];
    }
  }

  const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
    'Australia/Sydney',
  ];
</script>

<svelte:head>
  <title>Notification Preferences</title>
</svelte:head>

<div class="space-y-8 max-w-xl">
  <div class="flex items-center gap-2">
    <Settings class="size-5 text-primary-500" />
    <h1 class="text-xl font-semibold">Notification Preferences</h1>
  </div>

  {#if form?.success}
    <div class="alert preset-filled-success-500 text-sm px-4 py-2 rounded-container">
      Preferences saved.
    </div>
  {/if}
  {#if form?.error}
    <div class="alert preset-filled-error-500 text-sm px-4 py-2 rounded-container">
      {form.error}
    </div>
  {/if}

  <form method="POST" use:enhance class="space-y-8">

    <!-- Channels -->
    <section class="card preset-filled-surface-50-950 border border-surface-200-800 p-4 space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Delivery Channels</h2>
      <label class="flex items-center gap-3 text-sm">
        <input type="checkbox" class="checkbox" checked disabled />
        <span>Push (in-app, always on)</span>
      </label>
      <label class="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="email_channel"
          class="checkbox"
          bind:checked={emailEnabled}
        />
        <span>Email digest (15-minute batches)</span>
      </label>
    </section>

    <!-- Muted types -->
    <section class="card preset-filled-surface-50-950 border border-surface-200-800 p-4 space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Notification Types</h2>
      <p class="text-xs opacity-50">Uncheck to silence a notification type.</p>

      <!-- Hidden inputs for muted array -->
      {#each muted as m}
        <input type="hidden" name="muted" value={m} />
      {/each}

      {#each groups as group}
        <div class="space-y-2">
          <p class="text-xs font-medium opacity-60">{group}</p>
          {#each KNOWN_TYPES.filter(t => t.group === group) as t}
            <label class="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                class="checkbox"
                checked={!muted.includes(t.type)}
                onchange={() => toggleMuted(t.type)}
              />
              <span>{t.label}</span>
            </label>
          {/each}
        </div>
      {/each}
    </section>

    <!-- Quiet hours -->
    <section class="card preset-filled-surface-50-950 border border-surface-200-800 p-4 space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Quiet Hours</h2>
      <label class="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="quiet_enabled"
          class="checkbox"
          bind:checked={quietEnabled}
        />
        <span>Enable do-not-disturb window</span>
      </label>

      {#if quietEnabled}
        <div class="grid grid-cols-2 gap-4">
          <label class="space-y-1">
            <span class="text-xs opacity-60">Start</span>
            <input
              type="time"
              name="quiet_start"
              class="input text-sm"
              bind:value={quietStart}
            />
          </label>
          <label class="space-y-1">
            <span class="text-xs opacity-60">End</span>
            <input
              type="time"
              name="quiet_end"
              class="input text-sm"
              bind:value={quietEnd}
            />
          </label>
        </div>
        <label class="space-y-1">
          <span class="text-xs opacity-60">Timezone</span>
          <select name="quiet_timezone" class="select text-sm" bind:value={quietTimezone}>
            {#each TIMEZONES as tz}
              <option value={tz}>{tz}</option>
            {/each}
          </select>
        </label>
      {:else}
        <input type="hidden" name="quiet_start"    value={quietStart} />
        <input type="hidden" name="quiet_end"      value={quietEnd} />
        <input type="hidden" name="quiet_timezone" value={quietTimezone} />
      {/if}
    </section>

    <div class="flex items-center gap-3">
      <button type="submit" class="btn preset-filled-primary-500">Save Preferences</button>
      <a href="/notifications" class="btn preset-tonal">Back</a>
    </div>

  </form>
</div>
