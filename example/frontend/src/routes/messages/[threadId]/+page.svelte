<script lang="ts">
  import { invalidate, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Reply } from 'lucide-svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Message = {
    id: string;
    threadId: string;
    from: { id: string; username: string; name: string };
    subject: string;
    body: string;
    createdAt: string | Date;
  };

  let messages = $state<Message[]>(data.messages as Message[]);
  let replyOpen = $state(false);
  let replyBody = $state('');
  let sending = $state(false);
  let error = $state('');

  onMount(() => { invalidate('app:unread'); });

  $effect(() => {
    messages = data.messages as Message[];
    replyOpen = false;
    replyBody = '';
    error = '';
  });

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  const threadId = $derived(messages[0]?.threadId ?? '');

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
      replyBody = '';
      replyOpen = false;
      await Promise.all([invalidate('app:unread'), invalidateAll()]);
    } catch {
      error = 'Network error';
    } finally {
      sending = false;
    }
  }
</script>

<div class="flex flex-col h-full">

  {#if messages.length > 0}
    <div class="px-6 py-3 border-b border-base-200 shrink-0">
      <h1 class="text-base font-semibold truncate">{messages[0].subject}</h1>
      <p class="text-xs opacity-50 mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    {#each messages as msg (msg.id)}
      <div class="flex gap-3">
        <div class="shrink-0 size-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-content">
          {initials(msg.from.name)}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="text-sm font-medium">{msg.from.name}</span>
            <span class="text-[11px] opacity-40">{formatDate(msg.createdAt)}</span>
          </div>
          <div class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html msg.body}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="shrink-0 border-t border-base-200 px-6 py-4">
    {#if error}
      <div role="alert" class="alert alert-error text-sm mb-3">{error}</div>
    {/if}

    {#if replyOpen}
      <div class="space-y-3">
        <MessageEditor bind:html={replyBody} />
        <div class="flex gap-2 justify-end">
          <button type="button" class="btn btn-ghost btn-sm"
            onclick={() => { replyOpen = false; replyBody = ''; error = ''; }}>Cancel</button>
          <button type="button" class="btn btn-primary btn-sm" disabled={sending} onclick={sendReply}>
            <Reply class="size-4" />
            {sending ? 'Sending…' : 'Reply'}
          </button>
        </div>
      </div>
    {:else}
      <button type="button" class="btn btn-ghost w-full text-sm opacity-70 hover:opacity-100"
        onclick={() => (replyOpen = true)}>
        <Reply class="size-4" /> Reply
      </button>
    {/if}
  </div>

</div>
