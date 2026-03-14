<script lang="ts">
  import { Bot, X, Send, Trash2 } from 'lucide-svelte';
  import { chatConfig } from '$lib/config/chat';
  import {
    getMessages, isLoading, getError, isOpen, getInput,
    setInput, toggleOpen, closePanel, clearHistory, sendMessage
  } from '$lib/stores/chat.svelte';

  let messagesEl: HTMLDivElement;

  $effect(() => {
    // Reactive dependency on messages + loading so scroll fires on every update
    getMessages(); isLoading();
    if (messagesEl) {
      const last = messagesEl.lastElementChild as HTMLElement | null;
      last?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatConfig.model);
    }
  }
</script>

<!-- Trigger button -->
<button
  type="button"
  class="fixed bottom-6 right-6 z-50 btn-icon preset-filled-primary-500 shadow-lg rounded-full size-14"
  onclick={toggleOpen}
  aria-label={isOpen() ? 'Close assistant' : 'Open assistant'}
>
  <Bot class="size-6" />
</button>

<!-- Chat panel -->
{#if isOpen()}
  <div
    class="fixed bottom-24 right-6 z-50 {chatConfig.panelWidth} flex flex-col card preset-filled-surface-100-900 shadow-2xl border border-surface-200-800 overflow-hidden"
    style="height: 28rem;"
    role="complementary"
    aria-label="Assistant"
  >
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 border-b border-surface-200-800 shrink-0">
      <div class="flex items-center gap-2">
        <Bot class="size-4 text-primary-500" />
        <span class="font-semibold text-sm">Assistant</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="btn-icon btn-sm hover:preset-tonal-error"
          onclick={clearHistory}
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Trash2 class="size-4" />
        </button>
        <button
          type="button"
          class="btn-icon btn-sm hover:preset-tonal"
          onclick={closePanel}
          aria-label="Close"
        >
          <X class="size-4" />
        </button>
      </div>
    </header>

    <!-- Conversation area -->
    <div bind:this={messagesEl} class="flex-1 overflow-y-auto p-4 space-y-3">

      {#if getMessages().length === 0 && !isLoading()}
        <p class="text-center text-sm opacity-40 mt-10">Ask me anything…</p>
      {/if}

      {#each getMessages() as msg (msg)}
        <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div
            class="max-w-[82%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap
              {msg.role === 'user'
                ? 'preset-filled-primary-500 rounded-2xl rounded-br-sm'
                : 'preset-filled-surface-200-800 rounded-2xl rounded-bl-sm'}"
          >
            {msg.content}
          </div>
        </div>
      {/each}

      <!-- Loading bubble -->
      {#if isLoading()}
        <div class="flex justify-start">
          <div class="preset-filled-surface-200-800 px-3 py-2 rounded-2xl rounded-bl-sm">
            <svg
              class="size-4 animate-spin text-primary-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Thinking…"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      {/if}

      <!-- Error -->
      {#if getError()}
        <aside class="alert preset-tonal-error p-2 rounded-base text-xs">
          {getError()}
        </aside>
      {/if}

    </div>

    <!-- Input footer -->
    <footer class="px-3 pb-3 pt-2 border-t border-surface-200-800 shrink-0">
      <div class="input-group grid-cols-[1fr_auto]">
        <input
          type="text"
          class="ig-input text-sm"
          placeholder="Message…"
          value={getInput()}
          oninput={(e) => setInput((e.currentTarget as HTMLInputElement).value)}
          onkeydown={handleKeydown}
          disabled={isLoading()}
          aria-label="Message"
        />
        <button
          type="button"
          class="ig-btn preset-filled-primary-500"
          onclick={() => sendMessage(chatConfig.model)}
          disabled={isLoading() || !getInput().trim()}
          aria-label="Send"
        >
          <Send class="size-4" />
        </button>
      </div>
    </footer>
  </div>
{/if}
