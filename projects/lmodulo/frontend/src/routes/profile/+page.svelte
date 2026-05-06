<script lang="ts">
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
  <h1 class="text-2xl font-bold mb-6">Profile</h1>

  <div class="card bg-base-200 p-6 space-y-5">
    <h2 class="text-lg font-semibold">Account Information</h2>

    {#if form?.success}
      <aside class="alert alert-success p-3 rounded text-sm">
        Profile updated successfully.
      </aside>
    {/if}

    {#if form?.error}
      <aside class="alert alert-error p-3 rounded text-sm">
        {form.error}
      </aside>
    {/if}

    <form method="POST" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">First Name</span>
          <input
            type="text"
            name="firstName"
            class="input"
            bind:value={firstName}
            maxlength="50"
            autocomplete="given-name"
            placeholder="Jane"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Last Name</span>
          <input
            type="text"
            name="lastName"
            class="input"
            bind:value={lastName}
            maxlength="50"
            autocomplete="family-name"
            placeholder="Doe"
          />
        </label>
      </div>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Username</span>
        <input
          type="text"
          name="username"
          class="input"
          bind:value={username}
          minlength="2"
          maxlength="50"
          required
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          class="input"
          bind:value={email}
          required
        />
      </label>

      <button type="submit" class="btn btn-primary w-full">
        Save Changes
      </button>
    </form>
  </div>
</div>
