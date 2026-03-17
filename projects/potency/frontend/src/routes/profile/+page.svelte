<script lang="ts">
  import { CircleUser } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let firstName = $state(data.user?.firstName ?? '');
  let lastName  = $state(data.user?.lastName  ?? '');
  let username  = $state(data.user?.username  ?? '');
  let email     = $state(data.user?.email     ?? '');
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

<div class="max-w-lg">
  <div class="flex items-center gap-2 mb-6">
    <CircleUser class="size-5 text-primary-500" />
    <h1 class="text-2xl font-bold">Profile</h1>
  </div>

  <div class="card preset-filled-surface-100-900 p-6 space-y-5">
    <h2 class="text-lg font-semibold">Account Information</h2>

    {#if form?.success}
      <aside class="alert preset-tonal-success p-3 rounded-base text-sm">
        Profile updated successfully.
      </aside>
    {/if}

    {#if form?.error}
      <aside class="alert preset-tonal-error p-3 rounded-base text-sm">
        {form.error}
      </aside>
    {/if}

    <form method="POST" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <label class="label">
          <span class="label-text text-sm font-medium">First Name</span>
          <input
            type="text"
            name="firstName"
            class="input mt-1"
            bind:value={firstName}
            maxlength="50"
            autocomplete="given-name"
            placeholder="Jane"
          />
        </label>
        <label class="label">
          <span class="label-text text-sm font-medium">Last Name</span>
          <input
            type="text"
            name="lastName"
            class="input mt-1"
            bind:value={lastName}
            maxlength="50"
            autocomplete="family-name"
            placeholder="Doe"
          />
        </label>
      </div>

      <label class="label">
        <span class="label-text text-sm font-medium">Username</span>
        <input
          type="text"
          name="username"
          class="input mt-1"
          bind:value={username}
          minlength="2"
          maxlength="50"
          required
        />
      </label>

      <label class="label">
        <span class="label-text text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          class="input mt-1"
          bind:value={email}
          required
        />
      </label>

      <button type="submit" class="btn preset-filled-primary-500 w-full">
        Save Changes
      </button>
    </form>
  </div>
</div>
