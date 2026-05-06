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

  <div class="card bg-base-100 border border-base-200 shadow-sm p-6 space-y-5">
    <h2 class="text-lg font-semibold">Account Information</h2>

    {#if form?.success}
      <div role="alert" class="alert alert-success text-sm">Profile updated successfully.</div>
    {/if}

    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
    {/if}

    <form method="POST" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control gap-1">
          <span class="label-text font-medium">First Name</span>
          <input type="text" name="firstName" class="input input-bordered"
            bind:value={firstName} maxlength="50" autocomplete="given-name" placeholder="Jane" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Last Name</span>
          <input type="text" name="lastName" class="input input-bordered"
            bind:value={lastName} maxlength="50" autocomplete="family-name" placeholder="Doe" />
        </div>
      </div>

      <div class="form-control gap-1">
        <span class="label-text font-medium">Username</span>
        <input type="text" name="username" class="input input-bordered"
          bind:value={username} minlength="2" maxlength="50" required />
      </div>

      <div class="form-control gap-1">
        <span class="label-text font-medium">Email</span>
        <input type="email" name="email" class="input input-bordered"
          bind:value={email} required />
      </div>

      <button type="submit" class="btn btn-primary w-full">Save Changes</button>
    </form>
  </div>
</div>
