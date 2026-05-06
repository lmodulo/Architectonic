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
  <div class="card bg-base-100 w-full max-w-md overflow-hidden shadow-xl border border-base-200">

    <div class="bg-primary px-8 py-8 text-center space-y-1">
      <h1 class="text-2xl font-bold text-primary-content">Create Account</h1>
      <p class="text-primary-content/80 text-sm">Join us today</p>
    </div>

    <div class="p-8 space-y-4">
      {#if form?.error}
        <div role="alert" class="alert alert-error text-sm">{form.error}</div>
      {/if}

      <form method="POST" use:enhance class="space-y-4">
        <div class="form-control gap-1">
          <span class="label-text font-medium">Username</span>
          <input class="input input-bordered w-full" type="text" name="username"
            value={form?.username ?? ''} required minlength="2" maxlength="50"
            autocomplete="username" placeholder="johndoe" />
        </div>

        <div class="form-control gap-1">
          <span class="label-text font-medium">Email</span>
          <input class="input input-bordered w-full" type="email" name="email"
            value={form?.email ?? ''} required autocomplete="email" placeholder="you@example.com" />
        </div>

        <div class="form-control gap-1">
          <span class="label-text font-medium">Password</span>
          <input class="input input-bordered w-full" type="password" name="password"
            required minlength="8" autocomplete="new-password" placeholder="••••••••" />
        </div>

        <button type="submit" class="btn btn-primary w-full">Create Account</button>

        <p class="text-center text-sm opacity-60">
          Already have an account? <a href="/login" class="link link-primary">Sign in</a>
        </p>
      </form>
    </div>
  </div>
</div>
