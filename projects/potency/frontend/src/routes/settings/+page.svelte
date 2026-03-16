<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import LogoIcon from '$lib/components/LogoIcon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface Setting {
    key:         string;
    value:       unknown;
    type:        'string' | 'boolean' | 'number' | 'select';
    label:       string;
    description: string;
    options:     string[] | null;
    updatedAt:   string;
    updatedBy:   string | null;
  }

  let editingKey: string | null = $state(null);
  let editValue: unknown = $state(null);
  let saving = $state(false);
  let saveError = $state('');

  function startEdit(s: Setting) {
    editingKey = s.key;
    editValue  = s.value;
    saveError  = '';
  }

  function cancelEdit() {
    editingKey = null;
    editValue  = null;
    saveError  = '';
  }

  async function save(key: string) {
    saving    = true;
    saveError = '';
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ value: editValue })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        saveError = (d as { message?: string }).message ?? 'Save failed';
        return;
      }
      editingKey = null;
      await invalidateAll();
    } catch {
      saveError = 'Network error';
    } finally {
      saving = false;
    }
  }

  const canEdit = $derived(hasPermission(data.user, 'settings', 'update'));

  // --- Logo upload ---
  const currentLogo = $derived((data.settings.find(s => s.key === 'app.logo')?.value as string) ?? '');
  let logoFiles = $state<FileList | null>(null);
  let uploading = $state(false);
  let logoError = $state('');

  async function uploadLogo() {
    if (!logoFiles?.length) return;
    uploading = true; logoError = '';
    const fd = new FormData();
    fd.append('file', logoFiles[0]);
    try {
      const res = await fetch('/api/settings/logo', { method: 'POST', body: fd });
      if (!res.ok) { const b = await res.json().catch(() => ({})); logoError = b.message ?? 'Upload failed'; return; }
      logoFiles = null;
      await invalidateAll();
    } catch { logoError = 'Network error'; }
    finally { uploading = false; }
  }

  async function removeLogo() {
    uploading = true; logoError = '';
    try {
      const res = await fetch('/api/settings/app.logo', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: '' })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); logoError = b.message ?? 'Remove failed'; return; }
      await invalidateAll();
    } catch { logoError = 'Network error'; }
    finally { uploading = false; }
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="h3 font-bold">Settings</h1>
    <p class="text-sm opacity-60 mt-1">Application-wide configuration. Changes take effect immediately.</p>
  </div>

  <!-- Logo upload -->
  <div class="card preset-filled-surface-100-900 p-5 space-y-3">
    <h2 class="font-semibold text-sm">Application Logo</h2>
    {#if logoError}<aside class="alert preset-tonal-error p-3 rounded-base text-sm">{logoError}</aside>{/if}
    <div class="flex items-center gap-4">
      <div class="size-12 shrink-0 flex items-center justify-center rounded border border-surface-200-800 overflow-hidden bg-surface-50-950">
        {#if currentLogo}
          <img src={currentLogo} alt="App logo" class="size-full object-contain p-1" />
        {:else}
          <LogoIcon class="size-6 text-surface-400" />
        {/if}
      </div>
      <div class="flex-1 space-y-2">
        {#if canEdit}
          <div class="flex items-center gap-2 flex-wrap">
            <input type="file" class="input text-sm flex-1 min-w-0" accept="image/*" bind:files={logoFiles} />
            <button type="button" class="btn btn-sm preset-filled-primary-500 shrink-0" disabled={uploading || !logoFiles?.length} onclick={uploadLogo}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            {#if currentLogo}
              <button type="button" class="btn btn-sm preset-tonal-error shrink-0" disabled={uploading} onclick={removeLogo}>
                Remove
              </button>
            {/if}
          </div>
        {/if}
        <p class="text-xs opacity-50">Square PNG or SVG recommended, at least 64×64px. Replaces the default icon in the header.</p>
      </div>
    </div>
  </div>

  <div class="card preset-filled-surface-100-900 divide-y divide-surface-200-800">
    {#each data.settings as setting (setting.key)}
      <div class="flex items-start gap-4 px-5 py-4">

        <!-- Label + description -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">{setting.label}</p>
          <p class="text-xs opacity-50 mt-0.5">{setting.description}</p>
          <p class="text-xs opacity-30 mt-1 font-mono">{setting.key}</p>
        </div>

        <!-- Value / edit area -->
        <div class="flex items-center gap-2 shrink-0">
          {#if editingKey === setting.key}
            <!-- Editing -->
            <div class="flex items-center gap-2">
              {#if setting.type === 'boolean'}
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    class="checkbox"
                    checked={editValue as boolean}
                    onchange={e => (editValue = (e.target as HTMLInputElement).checked)}
                  />
                  <span class="text-sm">{editValue ? 'Enabled' : 'Disabled'}</span>
                </label>
              {:else if setting.type === 'select' && setting.options}
                <select
                  class="select text-sm"
                  value={editValue as string}
                  onchange={e => (editValue = (e.target as HTMLSelectElement).value)}
                >
                  {#each setting.options as opt}
                    <option value={opt}>{opt}</option>
                  {/each}
                </select>
              {:else}
                <input
                  type={setting.type === 'number' ? 'number' : 'text'}
                  class="input text-sm w-48"
                  value={editValue as string}
                  oninput={e => (editValue = setting.type === 'number' ? Number((e.target as HTMLInputElement).value) : (e.target as HTMLInputElement).value)}
                />
              {/if}

              {#if saveError}
                <span class="text-xs text-error-500">{saveError}</span>
              {/if}

              <button
                type="button"
                class="btn btn-sm preset-filled-primary-500"
                disabled={saving}
                onclick={() => save(setting.key)}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                class="btn btn-sm preset-tonal"
                disabled={saving}
                onclick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          {:else}
            <!-- Display -->
            <span class="text-sm font-mono opacity-80">
              {#if setting.type === 'boolean'}
                <span class="badge {setting.value ? 'preset-filled-success-500' : 'preset-filled-surface-300-700'} text-xs">
                  {setting.value ? 'Enabled' : 'Disabled'}
                </span>
              {:else}
                {setting.value}
              {/if}
            </span>
            {#if canEdit}
              <button
                type="button"
                class="btn btn-sm preset-tonal"
                onclick={() => startEdit(setting)}
              >
                Edit
              </button>
            {/if}
          {/if}
        </div>

      </div>
    {/each}

    {#if !data.settings.length}
      <p class="px-5 py-8 text-sm opacity-50 text-center">No settings found.</p>
    {/if}
  </div>
</div>
