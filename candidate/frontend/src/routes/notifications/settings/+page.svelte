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
    { type: 'message.received',   label: 'New message received',       group: 'Messages'   },
    { type: 'message.reply',      label: 'Reply to your message',      group: 'Messages'   },
    { type: 'auth.password',      label: 'Password changed',           group: 'Account'    },
    { type: 'role.changed',       label: 'Role / permissions updated', group: 'Account'    },
    { type: 'order.placed',       label: 'New order placed',           group: 'Storefront' },
    { type: 'order.status',       label: 'Order status changed',       group: 'Storefront' },
    { type: 'product.low_stock',  label: 'Low stock alert',            group: 'Storefront' },
  ];

  const groups = [...new Set(KNOWN_TYPES.map(t => t.group))];

  let emailEnabled  = $state(prefs?.channels.email   ?? false);
  let quietEnabled  = $state(prefs?.quiet.enabled    ?? false);
  let quietStart    = $state(prefs?.quiet.start      ?? '22:00');
  let quietEnd      = $state(prefs?.quiet.end        ?? '08:00');
  let quietTimezone = $state(prefs?.quiet.timezone   ?? 'UTC');
  let muted         = $state<string[]>(prefs?.muted  ?? []);

  function toggleMuted(type: string) {
    muted = muted.includes(type) ? muted.filter(t => t !== type) : [...muted, type];
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
    <Settings class="size-5 text-primary" />
    <h1 class="text-xl font-semibold">Notification Preferences</h1>
  </div>

  {#if form?.success}
    <div role="alert" class="alert alert-success text-sm">Preferences saved.</div>
  {/if}
  {#if form?.error}
    <div role="alert" class="alert alert-error text-sm">{form.error}</div>
  {/if}

  <form method="POST" use:enhance class="space-y-8">

    <section class="bg-base-100 border border-base-200 rounded-box p-4 space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Delivery Channels</h2>
      <label class="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" class="checkbox" checked disabled />
        <span>Push (in-app, always on)</span>
      </label>
      <label class="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="email_channel" class="checkbox" bind:checked={emailEnabled} />
        <span>Email digest (15-minute batches)</span>
      </label>
    </section>

    <section class="bg-base-100 border border-base-200 rounded-box p-4 space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Notification Types</h2>
      <p class="text-xs opacity-50">Uncheck to silence a notification type.</p>

      {#each muted as m}
        <input type="hidden" name="muted" value={m} />
      {/each}

      {#each groups as group}
        <div class="space-y-2">
          <p class="text-xs font-medium opacity-60">{group}</p>
          {#each KNOWN_TYPES.filter(t => t.group === group) as t}
            <label class="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" class="checkbox" checked={!muted.includes(t.type)}
                onchange={() => toggleMuted(t.type)} />
              <span>{t.label}</span>
            </label>
          {/each}
        </div>
      {/each}
    </section>

    <section class="bg-base-100 border border-base-200 rounded-box p-4 space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">Quiet Hours</h2>
      <label class="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="quiet_enabled" class="checkbox" bind:checked={quietEnabled} />
        <span>Enable do-not-disturb window</span>
      </label>

      {#if quietEnabled}
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control gap-1">
            <span class="label-text text-xs opacity-60">Start</span>
            <input type="time" name="quiet_start" class="input input-bordered input-sm"
              bind:value={quietStart} />
          </div>
          <div class="form-control gap-1">
            <span class="label-text text-xs opacity-60">End</span>
            <input type="time" name="quiet_end" class="input input-bordered input-sm"
              bind:value={quietEnd} />
          </div>
        </div>
        <div class="form-control gap-1">
          <span class="label-text text-xs opacity-60">Timezone</span>
          <select name="quiet_timezone" class="select select-bordered select-sm" bind:value={quietTimezone}>
            {#each TIMEZONES as tz}
              <option value={tz}>{tz}</option>
            {/each}
          </select>
        </div>
      {:else}
        <input type="hidden" name="quiet_start"    value={quietStart} />
        <input type="hidden" name="quiet_end"      value={quietEnd} />
        <input type="hidden" name="quiet_timezone" value={quietTimezone} />
      {/if}
    </section>

    <div class="flex items-center gap-3">
      <button type="submit" class="btn btn-primary">Save Preferences</button>
      <a href="/notifications" class="btn btn-ghost">Back</a>
    </div>

  </form>
</div>
