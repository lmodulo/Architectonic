<script lang="ts">
  import { invalidate, invalidateAll, goto } from '$app/navigation';
  import { Send, Paperclip, FileText, X, Mail, ChevronRight } from 'lucide-svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Thread = {
    threadId:   string;
    subject:    string;
    latestFrom: string;
    latestAt:   string;
    unreadCount: number;
  };

  const user       = data.user!;
  const staffUsers = data.staffUsers as Array<{ id: string; username: string; firstName?: string; lastName?: string }>;
  const staffIds   = staffUsers.map(u => u.id);

  let threads     = $state<Thread[]>(data.threads as Thread[]);
  let hasMore     = $state(data.hasMore ?? false);
  let loadingMore = $state(false);

  // Compose state
  let subject      = $state(`CLIENT ${user.firstName} ${user.lastName} portal message`);
  let body         = $state('');
  let sending      = $state(false);
  let sendError    = $state('');
  let sendSuccess  = $state(false);
  let pendingFiles = $state<File[]>([]);
  let fileInput: HTMLInputElement;

  function formatDate(d: string) {
    return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function onFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file   = target.files?.[0];
    target.value = '';
    if (!file) return;
    if (!pendingFiles.some(f => f.name === file.name)) pendingFiles = [...pendingFiles, file];
  }

  function removePending(name: string) {
    pendingFiles = pendingFiles.filter(f => f.name !== name);
  }

  async function send() {
    if (!subject.trim())                    { sendError = 'Subject is required'; return; }
    if (!body.trim() || body === '<p></p>') { sendError = 'Message body is required'; return; }
    if (!staffIds.length)                   { sendError = 'No staff recipients found'; return; }

    sending = true; sendError = '';
    try {
      const res = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ to: staffIds, subject: subject.trim(), body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        sendError = (d as { message?: string }).message ?? 'Send failed';
        return;
      }
      const { threadId, messageId } = await res.json();

      for (const file of pendingFiles) {
        const form = new FormData();
        form.append('file', file);
        await fetch(`/api/messages/${messageId}/attachments`, { method: 'POST', body: form });
      }

      body         = '';
      pendingFiles = [];
      sendSuccess  = true;
      await Promise.all([invalidate('app:unread'), invalidateAll()]);
      setTimeout(() => { sendSuccess = false; }, 3000);
    } catch {
      sendError = 'Network error';
    } finally {
      sending = false;
    }
  }

  async function loadMore() {
    const oldest = threads[threads.length - 1];
    if (!oldest || loadingMore) return;
    loadingMore = true;
    try {
      const before = encodeURIComponent(new Date(oldest.latestAt).toISOString());
      const res = await fetch(`/api/messages?limit=25&before=${before}`);
      if (res.ok) {
        const d = await res.json();
        threads = [...threads, ...(d.threads ?? [])];
        hasMore = d.hasMore ?? false;
      }
    } catch { /* non-fatal */ } finally {
      loadingMore = false;
    }
  }
</script>

<svelte:head><title>Client Portal</title></svelte:head>

<input bind:this={fileInput} type="file" class="hidden" onchange={onFileSelect} />

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Client Portal</h1>
    <p class="text-sm opacity-60 mt-0.5">Send a message to our team or view your conversation history.</p>
  </div>

  <!-- Compose -->
  <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-4">
    <h2 class="text-sm font-semibold">Message our team</h2>

    {#if sendSuccess}
      <aside class="alert alert-success p-3 rounded text-sm">Message sent!</aside>
    {/if}
    {#if sendError}
      <aside class="alert alert-error p-3 rounded text-sm">{sendError}</aside>
    {/if}

    <!-- Subject -->
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="portal-subject">Subject</label>
      <input
        id="portal-subject"
        type="text"
        class="input w-full"
        maxlength="200"
        bind:value={subject}
      />
    </div>

    <!-- Body -->
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide">Message</label>
      <MessageEditor bind:html={body} />
    </div>

    <!-- Pending attachments -->
    {#if pendingFiles.length > 0}
      <ul class="space-y-1">
        {#each pendingFiles as f (f.name)}
          <li class="flex items-center gap-2 text-sm p-2 rounded bg-base-300/40">
            <FileText class="size-4 shrink-0 opacity-50" />
            <span class="flex-1 truncate">{f.name}</span>
            <button type="button" class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100" onclick={() => removePending(f.name)}>
              <X class="size-3.5" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="flex items-center justify-between">
      <button type="button" class="btn btn-ghost btn-sm gap-1.5 opacity-60 hover:opacity-100" onclick={() => fileInput.click()}>
        <Paperclip class="size-4" />
        Attach
      </button>
      <button type="button" class="btn btn-primary" disabled={sending} onclick={send}>
        <Send class="size-4" />
        {sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  </div>

  <!-- Thread list -->
  <div class="space-y-2">
    <h2 class="text-sm font-semibold">Conversation history</h2>

    {#if threads.length === 0}
      <div class="card bg-base-200 border border-base-300 rounded-box p-8 text-center">
        <Mail class="size-8 opacity-20 mx-auto mb-2" />
        <p class="text-sm opacity-40">No messages yet.</p>
      </div>
    {:else}
      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden divide-y divide-base-300">
        {#each threads as thread (thread.threadId)}
          <button
            type="button"
            class="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-base-300/40 transition-colors"
            onclick={() => goto(`/messages/${thread.threadId}`)}
          >
            <Mail class="size-4 shrink-0 opacity-40" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate {thread.unreadCount > 0 ? 'font-semibold' : ''}">{thread.subject}</p>
                {#if thread.unreadCount > 0}
                  <span class="badge badge-error badge-xs shrink-0">{thread.unreadCount}</span>
                {/if}
              </div>
              <p class="text-xs opacity-40">{formatDate(thread.latestAt)}</p>
            </div>
            <ChevronRight class="size-4 shrink-0 opacity-30" />
          </button>
        {/each}
      </div>

      {#if hasMore}
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full text-xs opacity-60 hover:opacity-100"
          disabled={loadingMore}
          onclick={loadMore}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      {/if}
    {/if}
  </div>
</div>
