<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '$lib/paraglide/messages.js';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let password        = $state('');
  let confirm         = $state('');
  let mismatch        = $state(false);
  let submitting      = $state(false);

  function validate() {
    mismatch = password !== confirm;
    return !mismatch;
  }
</script>

<svelte:head><title>{m.auth_set_password_heading()}</title></svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
  <div class="card bg-base-100 shadow-xl w-full max-w-md">
    <div class="card-body space-y-4">
      <h1 class="text-xl font-bold">{m.auth_set_password_heading()}</h1>
      <p class="text-sm opacity-60">{m.auth_set_password_subtitle()}</p>

      {#if form?.error}
        <aside class="alert alert-error p-3 rounded text-sm">{form.error}</aside>
      {/if}
      {#if mismatch}
        <aside class="alert alert-error p-3 rounded text-sm">{m.auth_reset_mismatch()}</aside>
      {/if}

      {#if !data.token}
        <aside class="alert alert-warning p-3 rounded text-sm">
          {m.auth_set_password_invalid()}
        </aside>
      {:else}
        <form method="POST" use:enhance={() => {
          if (!validate()) return () => {};
          submitting = true;
          return async ({ update }) => { submitting = false; await update(); };
        }}>
          <input type="hidden" name="token" value={data.token} />

          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="password">{m.common_password()}</label>
              <input
                id="password"
                name="password"
                type="password"
                class="input w-full"
                placeholder={m.auth_set_password_hint()}
                minlength="8"
                required
                bind:value={password}
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="confirm">{m.auth_reset_confirm_password()}</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                class="input w-full"
                placeholder={m.auth_set_password_repeat()}
                required
                bind:value={confirm}
              />
            </div>
            <button type="submit" class="btn btn-primary w-full" disabled={submitting}>
              {submitting ? m.auth_set_password_submitting() : m.auth_set_password_button()}
            </button>
          </div>
        </form>
      {/if}

      <p class="text-xs text-center opacity-50">
        {m.auth_set_password_already()} <a href="/login" class="link">{m.auth_sign_in_link()}</a>
      </p>
    </div>
  </div>
</div>
