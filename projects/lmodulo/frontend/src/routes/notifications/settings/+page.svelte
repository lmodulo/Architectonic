<script lang="ts">
  import { enhance } from '$app/forms';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData, ActionData } from './$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const prefs = data.prefs as {
    channels: { websocket: boolean; email: boolean };
    muted: string[];
    quiet: { enabled: boolean; start: string; end: string; timezone: string };
  } | null;

  const KNOWN_TYPES = $derived([
    { type: 'message.received',          label: m.notifications_prefs_new_message(),   group: m.notifications_prefs_messages() },
    { type: 'message.reply',             label: m.notifications_prefs_reply(),          group: m.notifications_prefs_messages() },
    { type: 'auth.password',             label: m.notifications_prefs_password_changed(), group: m.notifications_prefs_account() },
    { type: 'role.changed',              label: m.notifications_prefs_role_updated(),   group: m.notifications_prefs_account() },
    { type: 'agile_task.assigned',       label: m.notifications_prefs_task_assigned(),  group: m.notifications_prefs_tasks()    },
    { type: 'agile_task.status_changed', label: m.notifications_prefs_task_status(),    group: m.notifications_prefs_tasks()    },
    { type: 'agile_job.status_changed',  label: m.notifications_prefs_job_status(),     group: m.notifications_prefs_jobs()     },
    { type: 'agile_job.comment',         label: m.notifications_prefs_job_comment(),    group: m.notifications_prefs_jobs()     },
    { type: 'agile_sprint.status_changed', label: m.notifications_prefs_sprint_status(), group: m.notifications_prefs_sprints() },
  ]);

  const groups = $derived([...new Set(KNOWN_TYPES.map(t => t.group))]);

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
  <title>{m.notifications_prefs_title()}</title>
</svelte:head>

<div class="space-y-8 max-w-xl">
  <div class="flex items-center gap-2">
    <Icon name="Settings" size={20} class="size-5 text-primary" />
    <h1 class="text-xl font-semibold">{m.notifications_prefs_title()}</h1>
  </div>

  {#if form?.success}
    <div class="alert alert-success text-sm px-4 py-2 rounded-box">
      {m.notifications_prefs_saved()}
    </div>
  {/if}
  {#if form?.error}
    <div class="alert alert-error text-sm px-4 py-2 rounded-box">
      {form.error}
    </div>
  {/if}

  <form method="POST" use:enhance class="space-y-8">

    <!-- Channels -->
    <section class="card bg-base-200 border border-base-300 p-4 space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">{m.notifications_prefs_channels()}</h2>
      <label class="flex items-center gap-3 text-sm">
        <input type="checkbox" class="checkbox" checked disabled />
        <span>{m.notifications_prefs_push()}</span>
      </label>
      <label class="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="email_channel"
          class="checkbox"
          bind:checked={emailEnabled}
        />
        <span>{m.notifications_prefs_email()}</span>
      </label>
    </section>

    <!-- Muted types -->
    <section class="card bg-base-200 border border-base-300 p-4 space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">{m.notifications_prefs_types()}</h2>
      <p class="text-xs opacity-50">{m.notifications_prefs_types_hint()}</p>

      {#each muted as mutedType}
        <input type="hidden" name="muted" value={mutedType} />
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
    <section class="card bg-base-200 border border-base-300 p-4 space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide opacity-60">{m.notifications_prefs_quiet()}</h2>
      <label class="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="quiet_enabled"
          class="checkbox"
          bind:checked={quietEnabled}
        />
        <span>{m.notifications_prefs_dnd()}</span>
      </label>

      {#if quietEnabled}
        <div class="grid grid-cols-2 gap-4">
          <label class="space-y-1">
            <span class="text-xs opacity-60">{m.notifications_prefs_start()}</span>
            <input
              type="time"
              name="quiet_start"
              class="input text-sm"
              bind:value={quietStart}
            />
          </label>
          <label class="space-y-1">
            <span class="text-xs opacity-60">{m.notifications_prefs_end()}</span>
            <input
              type="time"
              name="quiet_end"
              class="input text-sm"
              bind:value={quietEnd}
            />
          </label>
        </div>
        <label class="space-y-1">
          <span class="text-xs opacity-60">{m.notifications_prefs_timezone()}</span>
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
      <button type="submit" class="btn btn-primary">{m.notifications_prefs_save()}</button>
      <a href="/notifications" class="btn btn-ghost">{m.notifications_prefs_back()}</a>
    </div>

  </form>
</div>
