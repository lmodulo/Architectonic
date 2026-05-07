<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Create Account</title>
</svelte:head>

<AuthShell title="Create Account" subtitle="Get started today." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if data.registrationOpen === false}
    <div role="alert" class="alert alert-warning text-sm">
      Registration is currently closed.
    </div>
    <div class="flex items-center justify-center text-[0.8125rem] opacity-40 pt-1">
      <a href="/login" class="link link-primary">← Back to Sign In</a>
    </div>
  {:else}
    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
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
          minlength="8"
          autocomplete="new-password"
          placeholder="••••••••"
        />
      </label>

      <button type="submit" class="btn btn-primary w-full">
        Create Account
      </button>
    </form>

    <div class="flex items-center justify-center gap-1.5 text-[0.8125rem] opacity-40 pt-1">
      Already have an account?
      <a href="/login" class="link link-primary">Sign in</a>
    </div>
  {/if}

</AuthShell>
