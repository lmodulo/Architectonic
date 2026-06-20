<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import { m } from '$lib/paraglide/messages.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
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

  function startEdit(s: Setting) { editingKey = s.key; editValue = s.value; saveError = ''; }
  function cancelEdit() { editingKey = null; editValue = null; saveError = ''; }

  async function save(key: string) {
    saving = true; saveError = '';
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: editValue })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        saveError = (d as { message?: string }).message ?? m.errors_save_failed();
        return;
      }
      editingKey = null;
      await invalidateAll();
    } catch { saveError = m.errors_network_error(); }
    finally { saving = false; }
  }

  const canEdit = $derived(hasPermission(data.user, 'settings', 'update'));

  const currentLogo      = $derived((data.settings.find(s => s.key === 'brand.logo')?.value as string) ?? '');
  const currentBrandName = $derived((data.settings.find(s => s.key === 'brand.name')?.value as string) ?? '');

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
      if (!res.ok) { const b = await res.json().catch(() => ({})); brandError = b.message ?? m.errors_upload_failed(); return; }
      logoFiles = null;
      await invalidateAll();
    } catch { brandError = m.errors_network_error(); }
    finally { uploading = false; }
  }

  async function removeLogo() {
    uploading = true; brandError = '';
    try {
      const res = await fetch('/api/settings/brand.logo', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: '' })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); brandError = b.message ?? m.errors_remove_failed(); return; }
      await invalidateAll();
    } catch { brandError = m.errors_network_error(); }
    finally { uploading = false; }
  }

  let brandNameInput = $state('');
  let editingBrandName = $state(false);
  let savingBrandName = $state(false);

  function startBrandNameEdit() { brandNameInput = currentBrandName; editingBrandName = true; brandError = ''; }
  function cancelBrandNameEdit() { editingBrandName = false; brandError = ''; }

  async function saveBrandName() {
    savingBrandName = true; brandError = '';
    try {
      const [nameRes, logoRes] = await Promise.all([
        fetch('/api/settings/brand.name', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: brandNameInput }) }),
        fetch('/api/settings/brand.logo', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: '' }) })
      ]);
      if (!nameRes.ok || !logoRes.ok) { brandError = m.errors_save_failed(); return; }
      editingBrandName = false;
      await invalidateAll();
    } catch { brandError = m.errors_network_error(); }
    finally { savingBrandName = false; }
  }

  async function clearBrandName() {
    savingBrandName = true; brandError = '';
    try {
      const res = await fetch('/api/settings/brand.name', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: '' }) });
      if (!res.ok) { brandError = m.errors_clear_failed(); return; }
      await invalidateAll();
    } catch { brandError = m.errors_network_error(); }
    finally { savingBrandName = false; }
  }

  const genericSettings = $derived(data.settings.filter(s => s.key !== 'brand.name' && s.key !== 'brand.logo'));

  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    pt: 'Portuguese', it: 'Italian', nl: 'Dutch', ja: 'Japanese',
    zh: 'Chinese', ko: 'Korean', ar: 'Arabic'
  };

  function langLabel(code: string) { return LANGUAGE_NAMES[code] ?? code; }
</script>

<div class="space-y-6">
  <PageHeader title={m.settings_title()} subtitle={m.settings_subtitle()} />

  <!-- Brand card -->
  <div class="card bg-base-100 border border-base-200 p-5 space-y-4">
    <div>
      <h2 class="font-semibold text-sm">{m.settings_brand()}</h2>
      <p class="text-xs opacity-50 mt-0.5">{m.settings_brand_hint()}</p>
    </div>

    {#if brandError}
      <div role="alert" class="alert alert-error text-sm">{brandError}</div>
    {/if}

    <!-- Brand Name -->
    <div class="space-y-1">
      <p class="text-xs font-medium opacity-70">{m.settings_brand_name()}</p>
      {#if editingBrandName}
        <div class="flex items-center gap-2">
          <input type="text" class="input input-bordered input-sm flex-1" placeholder="e.g. Acme Corp" bind:value={brandNameInput} />
          <button type="button" class="btn btn-primary btn-sm shrink-0" disabled={savingBrandName} onclick={saveBrandName}>
            {savingBrandName ? m.common_saving() : m.common_save()}
          </button>
          <button type="button" class="btn btn-ghost btn-sm shrink-0" disabled={savingBrandName} onclick={cancelBrandNameEdit}>{m.common_cancel()}</button>
        </div>
      {:else}
        <div class="flex items-center gap-2">
          <span class="text-sm font-mono opacity-80 flex-1">{currentBrandName || '—'}</span>
          {#if canEdit}
            <button type="button" class="btn btn-ghost btn-sm shrink-0" onclick={startBrandNameEdit}>{m.common_edit()}</button>
            {#if currentBrandName}
              <button type="button" class="btn btn-outline btn-error btn-sm shrink-0" disabled={savingBrandName} onclick={clearBrandName}>{m.common_clear()}</button>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <!-- Logo -->
    <div class="space-y-1">
      <p class="text-xs font-medium opacity-70">{m.settings_logo()}</p>
      <div class="flex items-center gap-4">
        <div class="size-12 shrink-0 flex items-center justify-center rounded-lg border border-base-300 overflow-hidden bg-base-200">
          {#if currentLogo}
            <img src={currentLogo} alt="Brand logo" class="size-full object-contain p-1" />
          {:else}
            <LogoIcon class="size-6 opacity-40" />
          {/if}
        </div>
        <div class="flex-1 space-y-2">
          {#if canEdit}
            <div class="flex items-center gap-2 flex-wrap">
              <input type="file" class="file-input file-input-bordered file-input-sm flex-1 min-w-0" accept="image/*" bind:files={logoFiles} />
              <button type="button" class="btn btn-primary btn-sm shrink-0" disabled={uploading || !logoFiles?.length} onclick={uploadLogo}>
                {uploading ? m.common_uploading() : m.common_upload()}
              </button>
              {#if currentLogo}
                <button type="button" class="btn btn-outline btn-error btn-sm shrink-0" disabled={uploading} onclick={removeLogo}>{m.common_remove()}</button>
              {/if}
            </div>
          {/if}
          <p class="text-xs opacity-50">{m.settings_logo_hint()}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Generic settings -->
  <div class="card bg-base-100 border border-base-200 divide-y divide-base-200">
    {#each genericSettings as setting (setting.key)}
      <div class="flex items-start gap-4 px-5 py-4">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">{setting.label}</p>
          <p class="text-xs opacity-50 mt-0.5">{setting.description}</p>
          <p class="text-xs opacity-30 mt-1 font-mono">{setting.key}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          {#if editingKey === setting.key}
            <div class="flex items-center gap-2">
              {#if setting.type === 'boolean'}
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" class="checkbox" checked={editValue as boolean}
                    onchange={e => (editValue = (e.target as HTMLInputElement).checked)} />
                  <span class="text-sm">{editValue ? m.common_enabled() : m.common_disabled()}</span>
                </label>
              {:else if setting.type === 'select' && setting.options}
                <select class="select select-bordered select-sm" value={editValue as string}
                  onchange={e => (editValue = (e.target as HTMLSelectElement).value)}>
                  {#each setting.options as opt}
                    <option value={opt}>{setting.key === 'app.language' ? langLabel(opt) : opt}</option>
                  {/each}
                </select>
              {:else}
                <input type={setting.type === 'number' ? 'number' : 'text'}
                  class="input input-bordered input-sm w-48"
                  value={editValue as string}
                  oninput={e => (editValue = setting.type === 'number'
                    ? Number((e.target as HTMLInputElement).value)
                    : (e.target as HTMLInputElement).value)} />
              {/if}

              {#if saveError}
                <span class="text-xs text-error">{saveError}</span>
              {/if}

              <button type="button" class="btn btn-primary btn-sm" disabled={saving} onclick={() => save(setting.key)}>
                {saving ? m.common_saving() : m.common_save()}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" disabled={saving} onclick={cancelEdit}>{m.common_cancel()}</button>
            </div>
          {:else}
            <span class="text-sm font-mono opacity-80">
              {#if setting.type === 'boolean'}
                <span class="badge {setting.value ? 'badge-success' : 'badge-ghost'} text-xs">
                  {setting.value ? m.common_enabled() : m.common_disabled()}
                </span>
              {:else if setting.key === 'app.language'}
                {langLabel(setting.value as string)}
              {:else}
                {setting.value}
              {/if}
            </span>
            {#if canEdit}
              <button type="button" class="btn btn-ghost btn-sm" onclick={() => startEdit(setting)}>{m.common_edit()}</button>
            {/if}
          {/if}
        </div>
      </div>
    {/each}

    {#if !genericSettings.length}
      <p class="px-5 py-8 text-sm opacity-50 text-center">{m.settings_no_settings()}</p>
    {/if}
  </div>
</div>
