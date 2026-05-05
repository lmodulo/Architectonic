<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<AuthShell title="Forgot Password" subtitle="We'll send a reset link to your email." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if form?.sent}
    <div class="auth-alert auth-alert--success">
      If that email is registered, a reset link has been sent. Check your inbox.
    </div>
  {:else}
    {#if form?.error}
      <div class="auth-alert auth-alert--error">{form.error}</div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <label class="label">
        <span class="label-text">Email</span>
        <input
          class="input"
          type="email"
          name="email"
          required
          autocomplete="email"
          placeholder="you@lmodulo.com"
        />
      </label>

      <button type="submit" class="btn preset-filled-primary-500 w-full">
        Send Reset Link
      </button>
    </form>
  {/if}

  <div class="auth-links">
    <a href="/login" class="anchor">← Back to Sign In</a>
  </div>

</AuthShell>

<style>
  .auth-alert {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border: 1px solid transparent;
  }

  .auth-alert--success {
    background: rgba(100, 200, 150, 0.08);
    border-color: rgba(100, 200, 150, 0.2);
    color: var(--color-success-400);
  }

  .auth-alert--error {
    background: rgba(220, 80, 60, 0.08);
    border-color: rgba(220, 80, 60, 0.2);
    color: var(--color-error-400);
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
