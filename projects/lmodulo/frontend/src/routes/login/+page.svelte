<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import type { ActionData, PageData } from './$types';
  import { page } from '$app/stores';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let resetSuccess = $derived($page.url.searchParams.get('reset') === '1');
</script>

<svelte:head>
  <title>Sign In</title>
</svelte:head>

<AuthShell title="Sign In" subtitle="Welcome back to lmodulo." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if resetSuccess}
    <div class="auth-alert auth-alert--success">
      Password reset successfully. Sign in with your new password.
    </div>
  {/if}

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
        value={form?.email ?? ''}
        required
        autocomplete="email"
        placeholder="you@lmodulo.com"
      />
    </label>

    <label class="label">
      <span class="label-text">Password</span>
      <input
        class="input"
        type="password"
        name="password"
        required
        autocomplete="current-password"
        placeholder="••••••••"
      />
    </label>

    <button type="submit" class="btn preset-filled-primary-500 w-full">
      Sign In
    </button>
  </form>

  <div class="auth-links">
    <a href="/forgot-password" class="anchor">Forgot password?</a>
    <span class="auth-link-sep">·</span>
    <a href="/register" class="anchor">Create account</a>
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
    gap: 0.625rem;
    font-size: 0.8125rem;
    color: rgba(230, 226, 216, 0.4);
    padding-top: 0.25rem;
  }

  .auth-link-sep { opacity: 0.4; }
</style>
