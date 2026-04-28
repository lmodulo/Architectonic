<script lang="ts">
  import { enhance } from '$app/forms';
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<MarketingNav />

<div class="flex min-h-screen items-center justify-center p-4 pt-14">
  <div class="card preset-filled-surface-100-900 w-full max-w-md overflow-hidden">

    <header class="preset-filled-primary-500 p-8 text-center space-y-1">
      <h1 class="h2 font-bold">Forgot Password</h1>
      <p class="opacity-80 text-sm">We'll send a reset link to your email</p>
    </header>

    <section class="p-8 space-y-4">
      {#if form?.sent}
        <div class="preset-filled-success-500 rounded-base p-3 text-sm">
          If that email is registered, a reset link has been sent. Check your inbox.
        </div>
      {:else}
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
              required
              autocomplete="email"
              placeholder="you@example.com"
            />
          </label>

          <button type="submit" class="btn preset-filled-primary-500 w-full">
            Send Reset Link
          </button>
        </form>
      {/if}

      <p class="text-center text-sm opacity-60">
        <a href="/signin" class="anchor">Back to Sign In</a>
      </p>
    </section>

  </div>
</div>
