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

  // --- Brand ---
  const currentLogo = $derived((data.settings.find(s => s.key === 'brand.logo')?.value as string) ?? '');
  const currentBrandName = $derived((data.settings.find(s => s.key === 'brand.name')?.value as string) ?? '');

  // Logo upload
  let logoFiles = $state<FileList | null>(null);
  let uploading = $state(false);
  let brandError = $state('');

  async function uploadLogo() {
    if (!logoFiles?.length) return;
    uploading = true; brandError = '';
    const fd = new FormData();
    fd.append('file', logoFiles[0]);
    try {
      const res = await fetch('/api/settings/logo', { method: 'POST', body: fd });
      if (!res.ok) { const b = await res.json().catch(() => ({})); brandError = b.message ?? 'Upload failed'; return; }
      logoFiles = null;
      await invalidateAll();
    } catch { brandError = 'Network error'; }
    finally { uploading = false; }
  }

  async function removeLogo() {
    uploading = true; brandError = '';
    try {
      const res = await fetch('/api/settings/brand.logo', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: '' })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); brandError = b.message ?? 'Remove failed'; return; }
      await invalidateAll();
    } catch { brandError = 'Network error'; }
    finally { uploading = false; }
  }

  // Brand name edit
  let brandNameInput = $state('');
  let editingBrandName = $state(false);
  let savingBrandName = $state(false);

  function startBrandNameEdit() {
    brandNameInput = currentBrandName;
    editingBrandName = true;
    brandError = '';
  }

  function cancelBrandNameEdit() {
    editingBrandName = false;
    brandError = '';
  }

  async function saveBrandName() {
    savingBrandName = true; brandError = '';
    try {
      const nameRes = await fetch('/api/settings/brand.name', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: brandNameInput })
      });
      if (!nameRes.ok) { brandError = 'Save failed'; return; }
      editingBrandName = false;
      await invalidateAll();
    } catch { brandError = 'Network error'; }
    finally { savingBrandName = false; }
  }

  async function clearBrandName() {
    savingBrandName = true; brandError = '';
    try {
      const res = await fetch('/api/settings/brand.name', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: '' })
      });
      if (!res.ok) { brandError = 'Clear failed'; return; }
      await invalidateAll();
    } catch { brandError = 'Network error'; }
    finally { savingBrandName = false; }
  }

  // Filter out brand settings from the generic table (managed in the Brand card above)
  const genericSettings = $derived(data.settings.filter(s => s.key !== 'brand.name' && s.key !== 'brand.logo'));
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-xl font-bold">Settings</h1>
    <p class="text-sm opacity-60 mt-1">Application-wide configuration. Changes take effect immediately.</p>
  </div>

  <!-- Brand card -->
  <div class="card bg-base-200 p-5 space-y-4">
    <div>
      <h2 class="font-semibold text-sm">Brand</h2>
      <p class="text-xs opacity-50 mt-0.5">Any combination is allowed. Only fields with values display in the nav.</p>
    </div>

    {#if brandError}<aside class="alert alert-error p-3 rounded text-sm">{brandError}</aside>{/if}

    <!-- Brand Name -->
    <div class="space-y-1">
      <p class="text-xs font-medium opacity-70">Brand Name</p>
      {#if editingBrandName}
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="input text-sm flex-1"
            placeholder="e.g. Acme Corp"
            bind:value={brandNameInput}
          />
          <button type="button" class="btn btn-primary btn-sm shrink-0" disabled={savingBrandName} onclick={saveBrandName}>
            {savingBrandName ? 'Saving…' : 'Save'}
          </button>
          <button type="button" class="btn btn-ghost btn-sm shrink-0" disabled={savingBrandName} onclick={cancelBrandNameEdit}>Cancel</button>
        </div>
      {:else}
        <div class="flex items-center gap-2">
          <span class="text-sm font-mono opacity-80 flex-1">{currentBrandName || '—'}</span>
          {#if canEdit}
            <button type="button" class="btn btn-ghost btn-sm shrink-0" onclick={startBrandNameEdit}>Edit</button>
            {#if currentBrandName}
              <button type="button" class="btn btn-soft btn-error btn-sm shrink-0" disabled={savingBrandName} onclick={clearBrandName}>Clear</button>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <!-- Logo -->
    <div class="space-y-1">
      <p class="text-xs font-medium opacity-70">Logo</p>
      <div class="flex items-center gap-4">
        <div class="size-12 shrink-0 flex items-center justify-center rounded border border-base-300 overflow-hidden bg-base-100">
          {#if currentLogo}
            <img src={currentLogo} alt="Brand logo" class="size-full object-contain p-1" />
          {:else}
            <LogoIcon class="size-6 text-base-content/40" />
          {/if}
        </div>
        <div class="flex-1 space-y-2">
          {#if canEdit}
            <div class="flex items-center gap-2 flex-wrap">
              <input type="file" class="input text-sm flex-1 min-w-0" accept="image/*" bind:files={logoFiles} />
              <button type="button" class="btn btn-primary btn-sm shrink-0" disabled={uploading || !logoFiles?.length} onclick={uploadLogo}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              {#if currentLogo}
                <button type="button" class="btn btn-soft btn-error btn-sm shrink-0" disabled={uploading} onclick={removeLogo}>Remove</button>
              {/if}
            </div>
          {/if}
          <p class="text-xs opacity-50">Square PNG or SVG recommended, at least 64×64px.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="card bg-base-200 divide-y divide-base-300">
    {#each genericSettings as setting (setting.key)}
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
                <span class="text-xs text-error">{saveError}</span>
              {/if}

              <button
                type="button"
                class="btn btn-primary btn-sm"
                disabled={saving}
                onclick={() => save(setting.key)}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
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
                <span class="badge {setting.value ? 'badge-success' : 'badge-neutral'} text-xs">
                  {setting.value ? 'Enabled' : 'Disabled'}
                </span>
              {:else}
                {setting.value}
              {/if}
            </span>
            {#if canEdit}
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onclick={() => startEdit(setting)}
              >
                Edit
              </button>
            {/if}
          {/if}
        </div>

      </div>
    {/each}

    {#if !genericSettings.length}
      <p class="px-5 py-8 text-sm opacity-50 text-center">No settings found.</p>
    {/if}
  </div>
</div>
