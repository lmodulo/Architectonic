<script lang="ts">
  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import UserSelect from '$lib/components/UserSelect.svelte';
  import type { LayoutData } from '../$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: { data: LayoutData } = $props();

  const allUsers = data.allUsers as Array<{ id: string; username: string; firstName?: string; lastName?: string }>;

  const preselected = page.url.searchParams.get('to');
  let toIds        = $state<string[]>(
    preselected && allUsers.some(u => u.id === preselected) ? [preselected] : []
  );
  let subject      = $state('');
  let body         = $state('');
  let sending      = $state(false);
  let error        = $state('');
  let pendingFiles = $state<File[]>([]);
  let fileInput: HTMLInputElement;

  function onFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file   = target.files?.[0];
    target.value = '';
    if (!file) return;
    if (!pendingFiles.some(f => f.name === file.name)) {
      pendingFiles = [...pendingFiles, file];
    }
  }

  function removePending(name: string) {
    pendingFiles = pendingFiles.filter(f => f.name !== name);
  }

  async function send() {
    if (!toIds.length) { error = m.messages_compose_no_recipient(); return; }
    if (!subject.trim()) { error = m.messages_compose_subject_required(); return; }
    if (!body.trim() || body === '<p></p>') { error = m.messages_compose_body_required(); return; }

    sending = true; error = '';
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: toIds, subject: subject.trim(), body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        error = (d as { message?: string }).message ?? 'Send failed';
        return;
      }
      const { threadId, messageId } = await res.json();

      for (const file of pendingFiles) {
        const form = new FormData();
        form.append('file', file);
        await fetch(`/api/messages/${messageId}/attachments`, { method: 'POST', body: form });
      }

      await Promise.all([invalidate('app:unread'), invalidateAll()]);
      goto(`/messages/${threadId}`);
    } catch {
      error = 'Network error';
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head><title>{m.messages_compose_title()}</title></svelte:head>

<input bind:this={fileInput} type="file" class="hidden" onchange={onFileSelect} />

<div class="p-6 space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold">{m.messages_compose_title()}</h1>
    <a href="/messages" class="btn btn-ghost btn-sm btn-square" aria-label="{m.common_cancel()}"><Icon name="X" size={20} class="size-5" /></a>
  </div>

  {#if error}
    <aside class="alert alert-error p-3 rounded text-sm">{error}</aside>
  {/if}

  <!-- To field -->
  <div class="space-y-1">
    <label class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.messages_compose_to()}</label>
    <UserSelect users={allUsers} multiple placeholder={m.messages_compose_to_placeholder()} bind:value={toIds} />
  </div>

  <!-- Subject -->
  <div class="space-y-1">
    <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="subject">{m.messages_compose_subject()}</label>
    <input
      id="subject"
      type="text"
      class="input w-full"
      placeholder={m.messages_compose_subject()}
      bind:value={subject}
      maxlength="200"
    />
  </div>

  <!-- Body -->
  <div class="space-y-1">
    <label class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.messages_compose_body()}</label>
    <MessageEditor bind:html={body} />
  </div>

  <!-- Attachments -->
  {#if pendingFiles.length > 0}
    <ul class="space-y-1">
      {#each pendingFiles as f (f.name)}
        <li class="flex items-center gap-2 text-sm p-2 rounded bg-base-300/40">
          <Icon name="FileText" size={16} class="size-4 shrink-0 opacity-50" />
          <span class="flex-1 truncate">{f.name}</span>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100"
            onclick={() => removePending(f.name)}
            aria-label="Remove {f.name}"
          >
            <Icon name="X" size={14} class="size-3.5" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="flex items-center justify-between">
    <button
      type="button"
      class="btn btn-ghost btn-sm gap-1.5 opacity-60 hover:opacity-100"
      onclick={() => fileInput.click()}
      aria-label="Attach file"
    >
      <Icon name="Paperclip" size={16} class="size-4" />
      {m.client_portal_attach()}
    </button>
    <button type="button" class="btn btn-primary" disabled={sending} onclick={send}>
      <Icon name="Send" size={16} class="size-4" />
      {sending ? m.common_sending() : m.common_send()}
    </button>
  </div>
</div>
