<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Avatar from '$lib/components/Avatar.svelte';
  import AvatarCropper from '$lib/components/AvatarCropper.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let firstName = $state(data.user?.firstName ?? '');
  let lastName  = $state(data.user?.lastName  ?? '');
  let username  = $state(data.user?.username  ?? '');
  let email     = $state(data.user?.email     ?? '');

  // ── Avatar state ──────────────────────────────────────────────────────
  let localAvatarUrl   = $state(data.user?.avatarUrl   ?? '');
  let localAvatarColor = $state(data.user?.avatarColor || '#6b5fa5');

  const COLORS = [
    '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4',
    '#10b981', '#14b8a6', '#84cc16', '#f59e0b',
    '#f97316', '#ef4444', '#ec4899', '#a855f7',
  ];

  let avatarTab       = $state<'photo' | 'color'>('photo');
  let cropSrc         = $state('');
  let fileInput: HTMLInputElement;
  let avatarUploading = $state(false);
  let avatarError     = $state('');
  let avatarSuccess   = $state('');
  let colorSaving     = $state(false);

  const avatarUser = $derived({
    firstName:   data.user?.firstName ?? '',
    lastName:    data.user?.lastName  ?? '',
    username:    data.user?.username  ?? '',
    avatarUrl:   localAvatarUrl,
    avatarColor: localAvatarColor,
  });

  function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { cropSrc = ev.target?.result as string; };
    reader.readAsDataURL(file);
  }

  async function onCropApply(blob: Blob) {
    cropSrc = '';
    avatarUploading = true;
    avatarError = ''; avatarSuccess = '';
    try {
      const fd = new FormData();
      fd.append('file', blob, 'avatar.jpg');
      const res = await fetch('/api/auth/avatar', { method: 'POST', body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { avatarError = (d as { message?: string }).message ?? 'Upload failed'; return; }
      localAvatarUrl = (d as { url: string }).url;
      avatarSuccess = 'Photo updated.';
      fileInput.value = '';
      await invalidateAll();
    } catch { avatarError = 'Network error'; }
    finally { avatarUploading = false; }
  }

  function onCropCancel() { cropSrc = ''; if (fileInput) fileInput.value = ''; }

  async function removeAvatar() {
    avatarUploading = true; avatarError = ''; avatarSuccess = '';
    try {
      const res = await fetch('/api/auth/avatar', { method: 'DELETE' });
      if (!res.ok) { avatarError = 'Remove failed'; return; }
      localAvatarUrl = '';
      avatarSuccess = 'Photo removed.';
      await invalidateAll();
    } catch { avatarError = 'Network error'; }
    finally { avatarUploading = false; }
  }

  async function saveColor() {
    colorSaving = true; avatarError = ''; avatarSuccess = '';
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ avatarColor: localAvatarColor }),
      });
      if (!res.ok) { avatarError = 'Save failed'; return; }
      avatarSuccess = 'Color saved.';
      await invalidateAll();
    } catch { avatarError = 'Network error'; }
    finally { colorSaving = false; }
  }
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

<div class="max-w-lg space-y-6">
  <h1 class="text-2xl font-bold">Profile</h1>

  <!-- ── Avatar card ─────────────────────────────────────────────────── -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-5">
    <h2 class="text-lg font-semibold">Avatar</h2>

    {#if avatarError}
      <div role="alert" class="alert alert-error text-sm">{avatarError}</div>
    {/if}
    {#if avatarSuccess}
      <div role="alert" class="alert alert-success text-sm">{avatarSuccess}</div>
    {/if}

    <div class="flex justify-center">
      <Avatar user={avatarUser} size="xl" />
    </div>

    {#if cropSrc}

      <AvatarCropper src={cropSrc} onApply={onCropApply} onCancel={onCropCancel} />

    {:else}

      <div role="tablist" class="tabs tabs-box">
        <button role="tab" type="button" class="tab {avatarTab === 'photo' ? 'tab-active' : ''}" onclick={() => (avatarTab = 'photo')}>
          Photo
        </button>
        <button role="tab" type="button" class="tab {avatarTab === 'color' ? 'tab-active' : ''}" onclick={() => (avatarTab = 'color')}>
          Color
        </button>
      </div>

      {#if avatarTab === 'photo'}
        <div class="space-y-2">
          <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onFileChange} />
          <button
            type="button"
            class="btn btn-outline w-full"
            disabled={avatarUploading}
            onclick={() => fileInput.click()}
          >
            {localAvatarUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          {#if localAvatarUrl}
            <button
              type="button"
              class="btn btn-ghost btn-sm text-error w-full"
              disabled={avatarUploading}
              onclick={removeAvatar}
            >
              Remove Photo
            </button>
          {/if}
        </div>

      {:else}
        <div class="space-y-4">
          <div class="grid grid-cols-6 gap-2">
            {#each COLORS as color}
              <button
                type="button"
                class="size-9 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                style="background:{color}; border-color:{localAvatarColor === color ? 'white' : 'transparent'}"
                onclick={() => { localAvatarColor = color; }}
                aria-label="Select color {color}"
                aria-pressed={localAvatarColor === color}
              >
                {#if localAvatarColor === color}
                  <svg class="size-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
          <button
            type="button"
            class="btn btn-primary btn-sm w-full"
            disabled={colorSaving}
            onclick={saveColor}
          >
            {colorSaving ? 'Saving…' : 'Save Color'}
          </button>
        </div>
      {/if}

    {/if}
  </div>

  <!-- ── My Teams card ─────────────────────────────────────────────────── -->
  {#if data.myTeams && data.myTeams.length > 0}
    <div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-3">
      <h2 class="text-lg font-semibold">My Teams</h2>
      <ul class="space-y-2">
        {#each data.myTeams as team}
          <li class="flex items-center justify-between gap-3">
            <div>
              <span class="font-medium">{team.name}</span>
              {#if team.description}
                <span class="ml-2 text-sm opacity-50">{team.description}</span>
              {/if}
            </div>
            <span class="badge badge-ghost text-xs shrink-0">
              {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- ── Account info card ───────────────────────────────────────────── -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-5">
    <h2 class="text-lg font-semibold">Account Information</h2>

    {#if form?.success}
      <div role="alert" class="alert alert-success text-sm">Profile updated successfully.</div>
    {/if}
    {#if form?.error}
      <div role="alert" class="alert alert-error text-sm">{form.error}</div>
    {/if}

    <form method="POST" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">First Name</span>
          <input type="text" name="firstName" class="input" bind:value={firstName} maxlength="50" autocomplete="given-name" placeholder="Jane" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Last Name</span>
          <input type="text" name="lastName" class="input" bind:value={lastName} maxlength="50" autocomplete="family-name" placeholder="Doe" />
        </label>
      </div>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Username</span>
        <input type="text" name="username" class="input" bind:value={username} minlength="2" maxlength="50" required />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Email</span>
        <input type="email" name="email" class="input" bind:value={email} required />
      </label>
      <button type="submit" class="btn btn-primary w-full">Save Changes</button>
    </form>
  </div>
</div>
