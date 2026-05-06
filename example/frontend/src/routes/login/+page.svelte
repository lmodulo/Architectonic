<script lang="ts">
  import { enhance } from '$app/forms';
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import type { ActionData } from './$types';

  import { page } from '$app/stores';

  let { form }: { form: ActionData } = $props();
  let resetSuccess = $derived($page.url.searchParams.get('reset') === '1');
</script>

<svelte:head>
  <title>Sign In</title>
</svelte:head>

<MarketingNav />

<div class="flex min-h-screen items-center justify-center p-4 pt-14">
  <div class="card bg-base-100 w-full max-w-md overflow-hidden shadow-xl border border-base-200">

    <div class="bg-primary px-8 py-8 text-center space-y-1">
      <h1 class="text-2xl font-bold text-primary-content">Sign In</h1>
      <p class="text-primary-content/80 text-sm">Welcome back</p>
    </div>

    <div class="p-8 space-y-4">
      {#if resetSuccess}
        <div role="alert" class="alert alert-success text-sm">
          Password reset successfully. Sign in with your new password.
        </div>
      {/if}

      {#if form?.error}
        <div role="alert" class="alert alert-error text-sm">
          {form.error}
        </div>
      {/if}

      <form method="POST" use:enhance class="space-y-4">
        <div class="form-control gap-1">
          <span class="label-text font-medium">Email</span>
          <input
            class="input input-bordered w-full"
            type="email"
            name="email"
            value={form?.email ?? ''}
            required
            autocomplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div class="form-control gap-1">
          <span class="label-text font-medium">Password</span>
          <input
            class="input input-bordered w-full"
            type="password"
            name="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full">Sign In</button>

        <p class="text-center text-sm opacity-60">
          <a href="/forgot-password" class="link link-primary">Forgot password?</a>
        </p>

        <p class="text-center text-sm opacity-60">
          Don't have an account? <a href="/register" class="link link-primary">Sign up</a>
        </p>
      </form>
    </div>
  </div>
</div>
