<script lang="ts">
  import { invalidate, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Reply, Paperclip, FileText, X } from 'lucide-svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Attachment = {
    name: string;
    url: string;
    mimetype?: string;
    uploadedAt?: string;
  };

  type Message = {
    id: string;
    threadId: string;
    from: { id: string; username: string; name: string };
    subject: string;
    body: string;
    attachments: Attachment[];
    createdAt: string | Date;
  };

  let messages    = $state<Message[]>(data.messages as Message[]);
  let replyOpen   = $state(false);
  let replyBody   = $state('');
  let replyFiles  = $state<File[]>([]);
  let sending     = $state(false);
  let error       = $state('');
  let replyFileInput: HTMLInputElement;

  // Refresh badge when thread opens (API marks messages read on GET)
  onMount(() => { invalidate('app:unread'); });

  // Update messages when route changes
  $effect(() => {
    messages   = data.messages as Message[];
    replyOpen  = false;
    replyBody  = '';
    replyFiles = [];
    error      = '';
  });

  function formatDate(d: string | Date) {
    const date = new Date(d);
    return date.toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const threadId = $derived(messages[0]?.threadId ?? '');

  function onReplyFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file   = target.files?.[0];
    target.value = '';
    if (!file) return;
    if (!replyFiles.some(f => f.name === file.name)) {
      replyFiles = [...replyFiles, file];
    }
  }

  function removeReplyFile(name: string) {
    replyFiles = replyFiles.filter(f => f.name !== name);
  }

  async function sendReply() {
    if (!replyBody.trim() || replyBody === '<p></p>') { error = 'Reply body is required'; return; }
    sending = true; error = '';
    try {
      const res = await fetch(`/api/messages/${threadId}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        error = (d as { message?: string }).message ?? 'Send failed';
        return;
      }
      const { messageId } = await res.json();

      for (const file of replyFiles) {
        const form = new FormData();
        form.append('file', file);
        await fetch(`/api/messages/${messageId}/attachments`, { method: 'POST', body: form });
      }

      replyBody  = '';
      replyFiles = [];
      replyOpen  = false;
      await Promise.all([invalidate('app:unread'), invalidateAll()]);
    } catch {
      error = 'Network error';
    } finally {
      sending = false;
    }
  }
</script>

<input bind:this={replyFileInput} type="file" class="hidden" onchange={onReplyFileSelect} />

<div class="flex flex-col h-full">

  <!-- Thread subject header -->
  {#if messages.length > 0}
    <div class="px-6 py-3 border-b border-base-300 shrink-0">
      <h1 class="text-base font-semibold truncate">{messages[0].subject}</h1>
      <p class="text-xs opacity-50 mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
    </div>
  {/if}

  <!-- Messages -->
  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    {#each messages as msg (msg.id)}
      <div class="flex gap-3">
        <Avatar user={{ username: msg.from.username }} size="md" />

        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="text-sm font-medium">{msg.from.name}</span>
            <span class="text-[11px] opacity-40">{formatDate(msg.createdAt)}</span>
          </div>
          <!-- Rendered HTML body -->
          <div class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html msg.body}
          </div>
          <!-- Attachments -->
          {#if msg.attachments?.length > 0}
            <ul class="mt-2 space-y-1">
              {#each msg.attachments as att (att.name)}
                <li class="flex items-center gap-2 text-xs p-1.5 rounded bg-base-300/40 hover:bg-base-300/60 transition-colors">
                  <FileText class="size-3.5 shrink-0 opacity-50" />
                  <a href={att.url} target="_blank" rel="noreferrer" class="flex-1 truncate font-medium hover:underline">{att.name}</a>
                  {#if att.uploadedAt}
                    <span class="opacity-40 shrink-0">{formatDate(att.uploadedAt)}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Reply area -->
  <div class="shrink-0 border-t border-base-300 px-6 py-4">
    {#if error}
      <aside class="alert alert-error p-3 rounded text-sm mb-3">{error}</aside>
    {/if}

    {#if replyOpen}
      <div class="space-y-3">
        <MessageEditor bind:html={replyBody} />

        <!-- Pending reply attachments -->
        {#if replyFiles.length > 0}
          <ul class="space-y-1">
            {#each replyFiles as f (f.name)}
              <li class="flex items-center gap-2 text-sm p-2 rounded bg-base-300/40">
                <FileText class="size-4 shrink-0 opacity-50" />
                <span class="flex-1 truncate">{f.name}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100"
                  onclick={() => removeReplyFile(f.name)}
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
            onclick={() => replyFileInput.click()}
            aria-label="Attach file"
          >
            <Paperclip class="size-4" />
            Attach
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-ghost"
              onclick={() => { replyOpen = false; replyBody = ''; replyFiles = []; error = ''; }}
            >Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={sending}
              onclick={sendReply}
            >
              <Reply class="size-4" />
              {sending ? 'Sending…' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    {:else}
      <button
        type="button"
        class="btn btn-ghost w-full text-sm opacity-70 hover:opacity-100"
        onclick={() => (replyOpen = true)}
      >
        <Reply class="size-4" />
        Reply
      </button>
    {/if}
  </div>

</div>
