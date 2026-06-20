<script lang="ts">
  import { enhance } from '$app/forms';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let password = $state('');
  let confirm  = $state('');
  let mismatch = $derived(confirm.length > 0 && password !== confirm);
</script>

<svelte:head>
  <title>{m.auth_reset_title()}</title>
</svelte:head>

<AuthShell title={m.auth_reset_title()} subtitle={m.auth_reset_subtitle()} brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if !data.token}
    <div role="alert" class="alert alert-error text-sm">
      {m.auth_reset_invalid_link()}
    </div>
    <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
      <a href="/forgot-password" class="link">{m.auth_reset_request_link()}</a>
    </div>
  {:else}
    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <input type="hidden" name="token" value={data.token} />

      <label class="flex flex-col gap-1">
        <span>{m.auth_reset_new_password()}</span>
        <input
          class="input"
          type="password"
          name="password"
          bind:value={password}
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="••••••••"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span>{m.auth_reset_confirm_password()}</span>
        <input
          class="input {mismatch ? 'input-error' : ''}"
          type="password"
          name="confirm"
          bind:value={confirm}
          required
          autocomplete="new-password"
          placeholder="••••••••"
        />
        {#if mismatch}
          <span class="text-xs text-error">{m.auth_reset_mismatch()}</span>
        {/if}
      </label>

      <button type="submit" class="btn btn-primary" disabled={mismatch}>
        {m.auth_reset_button()}
      </button>
    </form>

    <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1">
      <a href="/login" class="link">{m.common_back_to_sign_in()}</a>
    </div>
  {/if}

</AuthShell>
