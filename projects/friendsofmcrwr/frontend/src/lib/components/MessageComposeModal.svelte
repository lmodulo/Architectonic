<script lang="ts">
  // New-message form for /messages, in the app's standard Modal (header, labelled fields, Cancel + primary footer).
  // The messages layout opens it for `?compose`; `onSent` gets the new thread's id.
  import { invalidate } from '$app/navigation';
  import { Send, X } from 'lucide-svelte';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Modal from '$lib/components/Modal.svelte';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import { m } from '$lib/paraglide/messages.js';

  type User = { id: string; username: string; firstName?: string; lastName?: string };

  let {
    users,
    onClose,
    onSent,
  }: {
    users: User[];
    onClose: () => void;
    onSent: (threadId: string) => void | Promise<void>;
  } = $props();

  let toInput = $state('');
  let toIds   = $state<string[]>([]);
  let subject = $state('');
  let body    = $state('');
  let sending = $state(false);
  let error   = $state('');

  const fullName = (u: User) => [u.firstName, u.lastName].filter(Boolean).join(' ');
  const displayName = (u: User) => (fullName(u) ? `${fullName(u)} (${u.username})` : u.username);
  const recipientName = (id: string) => {
    const u = users.find(x => x.id === id);
    return u ? fullName(u) || u.username : id;
  };

  // Typed text or a picked suggestion matches a username or "Full Name (username)"
  function matchUser(value: string) {
    const v = value.trim().toLowerCase();
    return v ? users.find(u => u.username.toLowerCase() === v || displayName(u).toLowerCase() === v) : undefined;
  }

  function addRecipient(id: string) {
    if (!toIds.includes(id)) toIds = [...toIds, id];
    toInput = '';
  }

  function onToKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      const match = matchUser(toInput);
      if (match) { e.preventDefault(); addRecipient(match.id); }
    } else if (e.key === 'Backspace' && !toInput && toIds.length) {
      toIds = toIds.slice(0, -1);
    }
  }

  async function send() {
    if (!toIds.length)                       { error = m.messages_compose_no_recipient(); return; }
    if (!subject.trim())                     { error = m.messages_compose_subject_required(); return; }
    if (!body.trim() || body === '<p></p>')  { error = m.messages_compose_body_required(); return; }

    sending = true; error = '';
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: toIds, subject: subject.trim(), body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        error = (d as { message?: string }).message ?? m.errors_send_failed();
        return;
      }
      const { threadId } = await res.json();
      await invalidate('app:unread');
      await onSent(threadId);
    } catch {
      error = m.errors_network_error();
    } finally {
      sending = false;
    }
  }
</script>

<Modal size="lg" label={m.messages_compose_title()}>
  <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
    <h2 class="text-lg font-semibold">{m.messages_compose_title()}</h2>
    <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={onClose} aria-label={m.common_cancel()}>
      <X class="size-5" />
    </button>
  </header>

  <div class="p-6 space-y-4 overflow-y-auto flex-1">
    {#if error}
      <aside class="alert alert-error p-3 rounded text-sm">{error}</aside>
    {/if}

    <!-- To: the field is the `input` box itself, holding a chip per recipient and the text box for the next one -->
    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="compose-to">{m.messages_compose_to()}</label>
      <div class="input w-full h-auto min-h-10 flex flex-wrap items-center gap-1.5 py-1.5">
        {#each toIds as id (id)}
          <span transition:scale={{ duration: 200, start: 0.95, easing: cubicOut }} class="badge badge-primary badge-soft gap-1">
            {recipientName(id)}
            <button
              type="button"
              class="opacity-60 hover:opacity-100"
              aria-label="{m.common_remove()} {recipientName(id)}"
              onclick={() => (toIds = toIds.filter(x => x !== id))}
            >
              <X class="size-3" />
            </button>
          </span>
        {/each}
        <input
          id="compose-to"
          type="text"
          class="flex-1 min-w-32"
          placeholder={toIds.length ? '' : m.messages_compose_to_placeholder()}
          list="compose-users"
          autocomplete="off"
          bind:value={toInput}
          onkeydown={onToKeydown}
          onchange={() => { const u = matchUser(toInput); if (u) addRecipient(u.id); }}
        />
      </div>
      <datalist id="compose-users">
        {#each users.filter(u => !toIds.includes(u.id)) as u (u.id)}
          <option value={u.username}>{displayName(u)}</option>
        {/each}
      </datalist>
    </div>

    <div class="space-y-1">
      <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="compose-subject">{m.messages_compose_subject()}</label>
      <input id="compose-subject" type="text" class="input w-full" bind:value={subject} maxlength="200" />
    </div>

    <div class="space-y-1">
      <p class="text-xs font-medium opacity-60 uppercase tracking-wide">{m.messages_compose_body()}</p>
      <MessageEditor bind:html={body} />
    </div>
  </div>

  <footer class="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-base-300 shrink-0">
    <button type="button" class="btn btn-ghost" onclick={onClose}>{m.common_cancel()}</button>
    <button type="button" class="btn btn-primary" disabled={sending} onclick={send}>
      <Send class="size-4" />
      {sending ? m.common_sending() : m.common_send()}
    </button>
  </footer>
</Modal>
