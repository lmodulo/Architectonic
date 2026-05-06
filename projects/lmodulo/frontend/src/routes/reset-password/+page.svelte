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
  <title>Reset Password</title>
</svelte:head>

<AuthShell title="Reset Password" subtitle="Enter a new password for your account." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if !data.token}
    <div class="auth-alert auth-alert--error">
      Invalid reset link. Please request a new one.
    </div>
    <div class="auth-links">
      <a href="/forgot-password" class="link link-primary">Request new link</a>
    </div>
  {:else}
    {#if form?.error}
      <div class="auth-alert auth-alert--error">{form.error}</div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <input type="hidden" name="token" value={data.token} />

      <label class="flex flex-col gap-1">
        <span>New Password</span>
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

      <button type="submit" class="btn btn-primary w-full" disabled={mismatch}>
        Set New Password
      </button>
    </form>

    <div class="auth-links">
      <a href="/login" class="link link-primary">← Back to Sign In</a>
    </div>
  {/if}

</AuthShell>

<style>
  .auth-alert {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border: 1px solid transparent;
  }

  .auth-alert--error {
    background: rgba(220, 80, 60, 0.08);
    border-color: rgba(220, 80, 60, 0.2);
    color: var(--color-error);
  }

  .auth-links {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
    color: rgba(230, 226, 216, 0.4);
    padding-top: 0.25rem;
  }
</style>
