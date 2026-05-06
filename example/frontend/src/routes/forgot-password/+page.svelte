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
  <div class="card bg-base-100 w-full max-w-md overflow-hidden shadow-xl border border-base-200">

    <div class="bg-primary px-8 py-8 text-center space-y-1">
      <h1 class="text-2xl font-bold text-primary-content">Forgot Password</h1>
      <p class="text-primary-content/80 text-sm">We'll send a reset link to your email</p>
    </div>

    <div class="p-8 space-y-4">
      {#if form?.sent}
        <div role="alert" class="alert alert-success text-sm">
          If that email is registered, a reset link has been sent. Check your inbox.
        </div>
      {:else}
        {#if form?.error}
          <div role="alert" class="alert alert-error text-sm">{form.error}</div>
        {/if}

        <form method="POST" use:enhance class="space-y-4">
          <div class="form-control gap-1">
            <span class="label-text font-medium">Email</span>
            <input class="input input-bordered w-full" type="email" name="email"
              required autocomplete="email" placeholder="you@example.com" />
          </div>

          <button type="submit" class="btn btn-primary w-full">Send Reset Link</button>
        </form>
      {/if}

      <p class="text-center text-sm opacity-60">
        <a href="/login" class="link link-primary">Back to Sign In</a>
      </p>
    </div>
  </div>
</div>
