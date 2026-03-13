<script lang="ts">
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let username = $state(data.user?.username ?? '');
  let email    = $state(data.user?.email    ?? '');
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

<div class="max-w-lg">
  <h1 class="text-2xl font-bold mb-6">Profile</h1>

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
