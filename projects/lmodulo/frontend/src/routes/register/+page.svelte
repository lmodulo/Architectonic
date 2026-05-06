<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Create Account</title>
</svelte:head>

<AuthShell title="Create Account" subtitle="Join lmodulo today." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if form?.error}
    <div class="auth-alert auth-alert--error">{form.error}</div>
  {/if}

  <form method="POST" use:enhance class="space-y-4">
    <label class="flex flex-col gap-1">
      <span>Username</span>
      <input
        class="input"
        type="text"
        name="username"
        value={form?.username ?? ''}
        required
        minlength="2"
        maxlength="50"
        autocomplete="username"
        placeholder="johndoe"
      />
    </label>

    <label class="flex flex-col gap-1">
      <span>Email</span>
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

    <label class="flex flex-col gap-1">
      <span>Password</span>
      <input
        class="input"
        type="password"
        name="password"
        required
        minlength="8"
        autocomplete="new-password"
        placeholder="••••••••"
      />
    </label>

    <button type="submit" class="btn btn-primary w-full">
      Create Account
    </button>
  </form>

  <div class="auth-links">
    Already have an account?
    <a href="/login" class="link link-primary">Sign in</a>
  </div>

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
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: rgba(230, 226, 216, 0.4);
    padding-top: 0.25rem;
  }
</style>
