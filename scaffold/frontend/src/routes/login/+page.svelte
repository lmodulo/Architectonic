<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Sign In</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="card preset-filled-surface-100-900 w-full max-w-md overflow-hidden">

    <header class="preset-filled-primary-500 p-8 text-center space-y-1">
      <h1 class="h2 font-bold">Sign In</h1>
      <p class="opacity-80 text-sm">Welcome back</p>
    </header>

    <section class="p-8 space-y-4">
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
      </form>
    </section>

    <footer class="p-4 text-center text-sm opacity-60 border-t border-surface-200-800">
      Don't have an account?
      <a href="/register" class="anchor font-semibold ml-1">Register</a>
    </footer>

  </div>
</div>
