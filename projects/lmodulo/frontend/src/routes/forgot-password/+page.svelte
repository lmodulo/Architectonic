<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<AuthShell title="Forgot Password" subtitle="We'll send a reset link to your email." brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if form?.sent}
    <div role="alert" class="alert alert-success text-sm">
      If that email is registered, a reset link has been sent. Check your inbox.
    </div>
  {:else}
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
          required
          autocomplete="email"
          placeholder="you@lmodulo.com"
        />
      </label>

      <button type="submit" class="btn btn-primary w-full">
        Send Reset Link
      </button>
    </form>
  {/if}

  <div class="flex items-center justify-center text-[0.8125rem] opacity-40 pt-1">
    <a href="/login" class="link link-primary">← Back to Sign In</a>
  </div>

</AuthShell>
