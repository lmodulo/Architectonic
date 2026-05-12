<script lang="ts">
  import { enhance } from '$app/forms';
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

<svelte:head><title>Set your password</title></svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
  <div class="card bg-base-100 shadow-xl w-full max-w-md">
    <div class="card-body space-y-4">
      <h1 class="text-xl font-bold">Create your password</h1>
      <p class="text-sm opacity-60">Set a secure password to activate your account.</p>

      {#if form?.error}
        <aside class="alert alert-error p-3 rounded text-sm">{form.error}</aside>
      {/if}
      {#if mismatch}
        <aside class="alert alert-error p-3 rounded text-sm">Passwords do not match.</aside>
      {/if}

      {#if !data.token}
        <aside class="alert alert-warning p-3 rounded text-sm">
          Invalid or missing token. Please use the link from your invitation email.
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
              <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                class="input w-full"
                placeholder="At least 8 characters"
                minlength="8"
                required
                bind:value={password}
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="confirm">Confirm password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                class="input w-full"
                placeholder="Repeat password"
                required
                bind:value={confirm}
              />
            </div>
            <button type="submit" class="btn btn-primary w-full" disabled={submitting}>
              {submitting ? 'Setting password…' : 'Set password & sign in'}
            </button>
          </div>
        </form>
      {/if}

      <p class="text-xs text-center opacity-50">
        Already have a password? <a href="/login" class="link">Sign in</a>
      </p>
    </div>
  </div>
</div>
