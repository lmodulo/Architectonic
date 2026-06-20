<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{m.auth_forgot_title()}</title>
</svelte:head>

<AuthShell title={m.auth_forgot_title()} subtitle={m.auth_forgot_subtitle()} brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if form?.sent}
    <div role="alert" class="alert alert-success text-sm">
      {m.auth_forgot_sent()}
    </div>
  {:else}
    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <label class="flex flex-col gap-1">
        <span>{m.common_email()}</span>
        <input
          class="input"
          type="email"
          name="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
        />
      </label>

      <button type="submit" class="btn btn-primary">
        {m.auth_forgot_send()}
      </button>
    </form>
  {/if}

  <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
    <a href="/login" class="link">{m.common_back_to_sign_in()}</a>
  </div>

</AuthShell>
