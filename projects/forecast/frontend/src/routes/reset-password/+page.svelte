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
  <div class="card preset-filled-surface-100-900 w-full max-w-md overflow-hidden">

    <header class="preset-filled-primary-500 p-8 text-center space-y-1">
      <h1 class="h2 font-bold">Reset Password</h1>
      <p class="opacity-80 text-sm">Enter a new password for your account</p>
    </header>

    <section class="p-8 space-y-4">
      {#if !data.token}
        <div class="preset-filled-error-500 rounded-base p-3 text-sm">
          Invalid reset link. Please request a new one.
        </div>
        <p class="text-center text-sm">
          <a href="/forgot-password" class="anchor">Request new link</a>
        </p>
      {:else}
        {#if form?.error}
          <div class="preset-filled-error-500 rounded-base p-3 text-sm">
            {form.error}
          </div>
        {/if}

        <form method="POST" use:enhance class="space-y-4">
          <input type="hidden" name="token" value={data.token} />

          <label class="label">
            <span class="label-text">New Password</span>
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

          <label class="label">
            <span class="label-text">Confirm Password</span>
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
              <span class="text-xs text-error-500">Passwords do not match</span>
            {/if}
          </label>

          <button type="submit" class="btn preset-filled-primary-500 w-full" disabled={mismatch}>
            Set New Password
          </button>
        </form>

        <p class="text-center text-sm opacity-60">
          <a href="/login" class="anchor">Back to Sign In</a>
        </p>
      {/if}
    </section>

  </div>
</div>
