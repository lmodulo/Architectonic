<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { CircleUser } from 'lucide-svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import AvatarCropper from '$lib/components/AvatarCropper.svelte';
  import type { PageData, ActionData } from './$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const myTeams = $derived(data.myTeams ?? []);

  let firstName = $state(data.user?.firstName ?? '');
  let lastName  = $state(data.user?.lastName  ?? '');
  let username  = $state(data.user?.username  ?? '');
  let email     = $state(data.user?.email     ?? '');
  let phone     = $state(data.user?.phone     ?? '');

  let activeTab = $state<'profile' | 'avatar' | 'teams'>('profile');

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
      avatarSuccess = m.profile_photo_updated();
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
      avatarSuccess = m.profile_photo_removed();
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
      avatarSuccess = m.profile_color_saved();
      await invalidateAll();
    } catch { avatarError = 'Network error'; }
    finally { colorSaving = false; }
  }
</script>

<svelte:head>
  <title>{m.profile_title()}</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-2xl">

  <!-- Page heading -->
  <div class="page-heading flex items-start gap-3">
    <CircleUser class="size-6 shrink-0 mt-0.5" />
    <div>
      <h1 class="text-2xl font-bold leading-none">{m.profile_title()}</h1>
      <p class="text-xs opacity-60 mt-0.5">{m.profile_subtitle()}</p>
    </div>
  </div>

  <!-- Tabs -->
  <nav class="tab-scroll flex gap-1 border-b border-base-300 -mb-6">
    <button type="button"
      class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
        {activeTab === 'profile' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
      onclick={() => (activeTab = 'profile')}>
      {m.profile_tab_profile()}
    </button>
    <button type="button"
      class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
        {activeTab === 'avatar' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
      onclick={() => (activeTab = 'avatar')}>
      {m.profile_tab_avatar()}
    </button>
    {#if myTeams.length > 0}
    <button type="button"
      class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
        {activeTab === 'teams' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
      onclick={() => (activeTab = 'teams')}>
      {m.profile_tab_teams()}
    </button>
    {/if}
  </nav>

  <!-- Tab content -->
  <div class="pt-6">

    <!-- ── Profile tab ─────────────────────────────────────────────── -->
    {#if activeTab === 'profile'}
    <div class="bg-base-200 border border-base-300 rounded-box p-6 space-y-5">
      <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">{m.profile_account_info()}</p>

      {#if form?.success}
        <div role="alert" class="alert alert-success text-sm">{m.profile_updated()}</div>
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
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Phone</span>
          <input type="tel" name="phone" class="input" bind:value={phone} maxlength="30" placeholder="+1 555 000 0000" autocomplete="tel" />
        </label>
        <button type="submit" class="btn btn-primary w-full">{m.common_save_changes()}</button>
      </form>
    </div>

    <!-- ── Avatar tab ──────────────────────────────────────────────── -->
    {:else if activeTab === 'avatar'}
    <div class="bg-base-200 border border-base-300 rounded-box p-6 space-y-5">
      <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">{m.profile_avatar()}</p>

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
            {m.profile_photo()}
          </button>
          <button role="tab" type="button" class="tab {avatarTab === 'color' ? 'tab-active' : ''}" onclick={() => (avatarTab = 'color')}>
            {m.profile_color()}
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
              {localAvatarUrl ? m.profile_change_photo() : m.profile_upload_photo()}
            </button>
            {#if localAvatarUrl}
              <button
                type="button"
                class="btn btn-ghost btn-sm text-error w-full"
                disabled={avatarUploading}
                onclick={removeAvatar}
              >
                {m.profile_remove_photo()}
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
              {colorSaving ? m.common_saving() : m.profile_save_color()}
            </button>
          </div>
        {/if}
      {/if}
    </div>

    <!-- ── Teams tab ───────────────────────────────────────────────── -->
    {:else if activeTab === 'teams'}
    <div class="bg-base-200 border border-base-300 rounded-box p-6 space-y-4">
      <p class="text-[10px] font-semibold uppercase tracking-widest opacity-40">{m.profile_my_teams()}</p>
      {#if myTeams.length > 0}
        <ul class="divide-y divide-base-300">
          {#each myTeams as team}
            <li class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span class="font-medium">{team.name}</span>
              {#if team.description}
                <span class="text-sm opacity-50">{team.description}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm opacity-50">{m.profile_no_teams()}</p>
      {/if}
    </div>
    {/if}

  </div>
</div>
