<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { page } from '$app/state';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let resetSuccess  = $derived(page.url.searchParams.get('reset')   === '1');
  let inviteSuccess = $derived(page.url.searchParams.get('invited') === '1');
</script>

<svelte:head>
  <title>Sign In</title>
</svelte:head>

<AuthShell title="Sign In" subtitle="Welcome back." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if resetSuccess}
    <div role="alert" class="alert alert-success text-sm">
      Password reset successfully. Sign in with your new password.
    </div>
  {/if}

  {#if inviteSuccess}
    <div role="alert" class="alert alert-success text-sm">
      Account activated! Sign in with your new credentials.
    </div>
  {/if}

  {#if form?.error}
    <div role="alert" class="alert alert-error text-sm">{form.error}</div>
  {/if}

  <form method="POST" use:enhance class="space-y-4">
    <label class="flex flex-col gap-1">
      <span>Email</span>
      <input
        class="input"
        type="email"
        name="email"
        value={form?.email ?? ''}
        required
        autocomplete="email"
        placeholder="you@example.com"
      />
    </label>

    <label class="flex flex-col gap-1">
      <span>Password</span>
      <input
        class="input"
        type="password"
        name="password"
        required
        autocomplete="current-password"
        placeholder="••••••••"
      />
    </label>

    <button type="submit" class="btn btn-primary">
      Sign In
    </button>
  </form>

  <div class="flex items-center justify-center gap-2.5 text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
    <a href="/forgot-password" class="link">Forgot password?</a>
    <span>·</span>
    <a href="/register" class="link">Create account</a>
  </div>

</AuthShell>
