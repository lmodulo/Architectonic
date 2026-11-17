<script lang="ts">
  import { enhance } from '$app/forms';
  import { slide } from 'svelte/transition';
  import { LogIn } from 'lucide-svelte';
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { page } from '$app/state';
  import { m } from '$lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let resetSuccess  = $derived(page.url.searchParams.get('reset')   === '1');
  let inviteSuccess = $derived(page.url.searchParams.get('invited') === '1');
</script>

<svelte:head>
  <title>{m.auth_sign_in_title()}</title>
</svelte:head>

<AuthShell icon={LogIn} title={m.auth_sign_in_title()} subtitle={m.auth_sign_in_subtitle()} brandName={data.brandName} brandLogo={data.brandLogo}>

  {#if resetSuccess}
    <div role="alert" class="alert alert-success text-sm">
      {m.auth_password_reset_success()}
    </div>
  {/if}

  {#if inviteSuccess}
    <div role="alert" class="alert alert-success text-sm">
      {m.auth_account_activated()}
    </div>
  {/if}

  {#if form?.error}
    <div role="alert" class="alert alert-error text-sm" transition:slide={{ duration: 200 }}>{form.error}</div>
  {/if}

  <form method="POST" use:enhance class="space-y-4">
    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium">{m.common_email()}</span>
      <input
        class="input w-full"
        type="email"
        name="email"
        value={form?.email ?? ''}
        required
        autocomplete="email"
        placeholder="you@example.com"
      />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium">{m.common_password()}</span>
      <input
        class="input w-full"
        type="password"
        name="password"
        required
        autocomplete="current-password"
        placeholder="••••••••"
      />
    </label>

    <button type="submit" class="btn btn-primary w-full">
      {m.auth_sign_in_button()}
    </button>
  </form>

  <div class="flex items-center justify-center gap-2.5 text-sm text-base-content/70">
    <a href="/forgot-password" class="link">{m.auth_forgot_password()}</a>
    <span aria-hidden="true">·</span>
    <a href="/register" class="link">{m.auth_create_account()}</a>
  </div>

</AuthShell>
