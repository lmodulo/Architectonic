<script lang="ts">
  import { enhance } from '$app/forms';
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Create Account</title>
</svelte:head>

<MarketingNav />

<div class="flex min-h-screen items-center justify-center p-4 pt-14">
  <div class="card preset-filled-surface-100-900 w-full max-w-md overflow-hidden">

    <header class="preset-filled-primary-500 p-8 text-center space-y-1">
      <h1 class="h2 font-bold">Create Account</h1>
      <p class="opacity-80 text-sm">Join us today</p>
    </header>

    <section class="p-8 space-y-4">
      {#if form?.error}
        <div class="preset-filled-error-500 rounded-base p-3 text-sm">
          {form.error}
        </div>
      {/if}

      <form method="POST" use:enhance class="space-y-4">
        <label class="label">
          <span class="label-text">Username</span>
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
            minlength="8"
            autocomplete="new-password"
            placeholder="••••••••"
          />
        </label>

        <button type="submit" class="btn preset-filled-primary-500 w-full">
          Create Account
        </button>

        <p class="text-center text-sm opacity-60">
          Already have an account? <a href="/login" class="anchor">Sign in</a>
        </p>
      </form>
    </section>

  </div>
</div>
