<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let password = $state('');
  let confirm  = $state('');
  let mismatch = $derived(confirm.length > 0 && password !== confirm);
</script>

<svelte:head>
  <title>Accept Invitation</title>
</svelte:head>

<AuthShell title="Accept Invitation" subtitle="Set your username and password to activate your account." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if !data.token}
    <div role="alert" class="alert alert-error text-sm">
      Invalid invitation link. Please contact your administrator.
    </div>
    <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
      <a href="/login" class="link">← Back to Sign In</a>
    </div>
  {:else}
    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <input type="hidden" name="token" value={data.token} />

      <label class="flex flex-col gap-1">
        <span>Username</span>
        <input
          class="input"
          type="text"
          name="username"
          required
          minlength="2"
          maxlength="50"
          autocomplete="username"
          placeholder="johndoe"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span>Password</span>
        <input
          class="input"
          type="password"
          name="password"
          bind:value={password}
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="••••••••"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span>Confirm Password</span>
        <input
          class="input {mismatch ? 'input-error' : ''}"
          type="password"
          name="confirm"
          bind:value={confirm}
          required
          autocomplete="new-password"
          placeholder="••••••••"
        />
        {#if mismatch}
          <span class="text-xs text-error">Passwords do not match</span>
        {/if}
      </label>

      <button type="submit" class="btn btn-primary" disabled={mismatch}>
        Activate Account
      </button>
    </form>

    <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
      <a href="/login" class="link">← Back to Sign In</a>
    </div>
  {/if}

</AuthShell>
