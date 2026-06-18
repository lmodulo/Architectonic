<script lang="ts">
  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { Send, X, Paperclip, FileText } from 'lucide-svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import UserSelect from '$lib/components/UserSelect.svelte';
  import type { LayoutData } from '../$types';

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
    if (!toIds.length) { error = 'Add at least one recipient'; return; }
    if (!subject.trim()) { error = 'Subject is required'; return; }
    if (!body.trim() || body === '<p></p>') { error = 'Message body is required'; return; }

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

<svelte:head><title>New Message</title></svelte:head>

<input bind:this={fileInput} type="file" class="hidden" onchange={onFileSelect} />

<div class="p-6 space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold">New Message</h1>
    <a href="/messages" class="btn btn-ghost btn-sm btn-square" aria-label="Cancel"><X class="size-5" /></a>
  </div>

  {#if error}
    <aside class="alert alert-error p-3 rounded text-sm">{error}</aside>
  {/if}

  <!-- To field -->
  <div class="space-y-1">
    <label class="text-xs font-medium opacity-60 uppercase tracking-wide">To</label>
    <UserSelect users={allUsers} multiple placeholder="Type a name…" bind:value={toIds} />
  </div>

  <!-- Subject -->
  <div class="space-y-1">
    <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="subject">Subject</label>
    <input
      id="subject"
      type="text"
      class="input w-full"
      placeholder="Subject"
      bind:value={subject}
      maxlength="200"
    />
  </div>

  <!-- Body -->
  <div class="space-y-1">
    <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Message</label>
    <MessageEditor bind:html={body} />
  </div>

  <!-- Attachments -->
  {#if pendingFiles.length > 0}
    <ul class="space-y-1">
      {#each pendingFiles as f (f.name)}
        <li class="flex items-center gap-2 text-sm p-2 rounded bg-base-300/40">
          <FileText class="size-4 shrink-0 opacity-50" />
          <span class="flex-1 truncate">{f.name}</span>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100"
            onclick={() => removePending(f.name)}
            aria-label="Remove {f.name}"
          >
            <X class="size-3.5" />
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
      <Paperclip class="size-4" />
      Attach
    </button>
    <button type="button" class="btn btn-primary" disabled={sending} onclick={send}>
      <Send class="size-4" />
      {sending ? 'Sending…' : 'Send'}
    </button>
  </div>
</div>
