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
  <div class="card preset-filled-surface-100-900 w-full max-w-md overflow-hidden">

    <header class="preset-filled-primary-500 p-8 text-center space-y-1">
      <h1 class="h2 font-bold">Sign In</h1>
      <p class="opacity-80 text-sm">Welcome back</p>
    </header>

    <section class="p-8 space-y-4">
      {#if resetSuccess}
        <div class="preset-filled-success-500 rounded-base p-3 text-sm">
          Password reset successfully. Sign in with your new password.
        </div>
      {/if}

      {#if form?.error}
        <div class="preset-filled-error-500 rounded-base p-3 text-sm">
          {form.error}
        </div>
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
            placeholder="you@example.com"
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

        <p class="text-center text-sm opacity-60">
          <a href="/forgot-password" class="anchor">Forgot password?</a>
        </p>
      </form>
    </section>


  </div>
</div>
