<script lang="ts">
  import { enhance } from '$app/forms';
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let password = $state('');
  let confirm  = $state('');
  let mismatch = $derived(confirm.length > 0 && password !== confirm);
</script>

<svelte:head>
  <title>Reset Password</title>
</svelte:head>

<MarketingNav />

<div class="flex min-h-screen items-center justify-center p-4 pt-14">
  <div class="card bg-base-100 w-full max-w-md overflow-hidden shadow-xl border border-base-200">

    <div class="bg-primary px-8 py-8 text-center space-y-1">
      <h1 class="text-2xl font-bold text-primary-content">Reset Password</h1>
      <p class="text-primary-content/80 text-sm">Enter a new password for your account</p>
    </div>

    <div class="p-8 space-y-4">
      {#if !data.token}
        <div role="alert" class="alert alert-error text-sm">
          Invalid reset link. Please request a new one.
        </div>
        <p class="text-center text-sm">
          <a href="/forgot-password" class="link link-primary">Request new link</a>
        </p>
      {:else}
        {#if form?.error}
          <div role="alert" class="alert alert-error text-sm">{form.error}</div>
        {/if}

        <form method="POST" use:enhance class="space-y-4">
          <input type="hidden" name="token" value={data.token} />

          <div class="form-control gap-1">
            <span class="label-text font-medium">New Password</span>
            <input class="input input-bordered w-full" type="password" name="password"
              bind:value={password} required minlength="8" autocomplete="new-password"
              placeholder="••••••••" />
          </div>

          <div class="form-control gap-1">
            <span class="label-text font-medium">Confirm Password</span>
            <input class="input input-bordered w-full {mismatch ? 'input-error' : ''}"
              type="password" name="confirm" bind:value={confirm}
              required autocomplete="new-password" placeholder="••••••••" />
            {#if mismatch}
              <span class="text-xs text-error">Passwords do not match</span>
            {/if}
          </div>

          <button type="submit" class="btn btn-primary w-full" disabled={mismatch}>
            Set New Password
          </button>
        </form>

        <p class="text-center text-sm opacity-60">
          <a href="/login" class="link link-primary">Back to Sign In</a>
        </p>
      {/if}
    </div>
  </div>
</div>
