<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{m.auth_register_title()}</title>
</svelte:head>

<AuthShell title={m.auth_register_title()} subtitle={m.auth_register_subtitle()} brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if data.registrationOpen === false}
    <div role="alert" class="alert alert-warning text-sm">
      {m.auth_registration_closed()}
    </div>
    <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
      <a href="/login" class="link">{m.common_back_to_sign_in()}</a>
    </div>
  {:else}
    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <label class="flex flex-col gap-1">
        <span>{m.common_username()}</span>
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
        <span>{m.common_email()}</span>
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
        <span>{m.common_password()}</span>
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

      <button type="submit" class="btn btn-primary">
        {m.auth_register_button()}
      </button>
    </form>

    <div class="flex items-center justify-center gap-1.5 text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
      {m.auth_already_have_account()}
      <a href="/login" class="link">{m.auth_sign_in_link()}</a>
    </div>
  {/if}

</AuthShell>
