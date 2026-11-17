<script lang="ts">
  import { invalidate, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { Reply } from 'lucide-svelte';
  import { m } from '$lib/paraglide/messages.js';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
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

  const messages = $derived(data.messages as Message[]);
  const threadId = $derived(messages[0]?.threadId ?? '');
  const subject  = $derived(messages[0]?.subject ?? '');

  let replyOpen = $state(false);
  let replyBody = $state('');
  let sending   = $state(false);
  let error     = $state('');

  // The API marks the thread read on GET: refresh the header badge and the list's unread dots
  onMount(() => { invalidate('app:unread'); });

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function closeReply() {
    replyOpen = false;
    replyBody = '';
    error = '';
  }

  async function sendReply() {
    if (!replyBody.trim() || replyBody === '<p></p>') { error = m.messages_reply_required(); return; }
    sending = true; error = '';
    try {
      const res = await fetch(`/api/messages/${threadId}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        error = (d as { message?: string }).message ?? m.errors_send_failed();
        return;
      }
      closeReply();
      await Promise.all([invalidate('app:unread'), invalidateAll()]);
    } catch {
      error = m.errors_network_error();
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head><title>{subject || m.messages_title()}</title></svelte:head>

<!-- Phones: one column that scrolls with the page. md and up: fills the panel, messages scroll, reply stays put. -->
<div class="flex-1 min-h-0 flex flex-col">

  <div class="px-4 md:px-6 py-3 border-b border-base-300 shrink-0">
    <h2 class="text-lg font-semibold leading-snug break-words">{subject}</h2>
    <p class="text-xs opacity-50 mt-0.5">{m.messages_count({ count: messages.length })}</p>
  </div>

  <ol class="md:flex-1 md:min-h-0 md:overflow-y-auto divide-y divide-base-300">
    {#each messages as msg (msg.id)}
      <li class="px-4 md:px-6 py-4">
        <div class="flex items-center gap-3">
          <Avatar user={{ username: msg.from.username }} size="md" />
          <div class="min-w-0 flex flex-wrap items-baseline gap-x-2">
            <span class="text-sm font-medium truncate">{msg.from.name}</span>
            <time class="text-xs opacity-50" datetime={new Date(msg.createdAt).toISOString()}>{formatDate(msg.createdAt)}</time>
          </div>
        </div>
        <!-- Full width under the sender on phones; lined up with the name (avatar 2rem + gap 0.75rem) from md -->
        <div class="message-body mt-2 md:pl-11 text-sm leading-relaxed">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html msg.body}
        </div>
      </li>
    {/each}
  </ol>

  <div class="shrink-0 border-t border-base-300 px-4 md:px-6 py-4">
    {#if replyOpen}
      <div transition:slide={{ duration: 200 }} class="space-y-4">
        {#if error}
          <aside class="alert alert-error p-3 rounded text-sm">{error}</aside>
        {/if}
        <div class="space-y-1">
          <p class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.messages_reply()}</p>
          <MessageEditor bind:html={replyBody} />
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn btn-ghost" onclick={closeReply}>{m.common_cancel()}</button>
          <button type="button" class="btn btn-primary" disabled={sending} onclick={sendReply}>
            <Reply class="size-4" />
            {sending ? m.common_sending() : m.messages_reply()}
          </button>
        </div>
      </div>
    {:else}
      <div transition:slide={{ duration: 200 }} class="flex justify-end">
        <button type="button" class="btn btn-primary w-full sm:w-auto" onclick={() => (replyOpen = true)}>
          <Reply class="size-4" />
          {m.messages_reply()}
        </button>
      </div>
    {/if}
  </div>

</div>

<style>
  /* Message bodies are Tiptap HTML. Tailwind's preflight strips paragraph spacing and list markers and there is no
     typography plugin, so the editor's own formatting is restored here (MessageEditor styles only `.tiptap`). */
  .message-body { overflow-wrap: anywhere; }
  .message-body :global(* + *) { margin-top: 0.75em; }
  .message-body :global(ul) { list-style: disc; padding-left: 1.5rem; }
  .message-body :global(ol) { list-style: decimal; padding-left: 1.5rem; }
  .message-body :global(li + li) { margin-top: 0.25em; }
  .message-body :global(blockquote) { border-left: 3px solid var(--color-primary); padding-left: 0.75rem; opacity: 0.8; }
  .message-body :global(a) { text-decoration: underline; }
</style>
