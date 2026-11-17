<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { SquarePen, Inbox, Send, Archive, ChevronLeft, MailIcon } from 'lucide-svelte';
  import { m } from '$lib/paraglide/messages.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MessageListItem from '$lib/components/MessageListItem.svelte';
  import MessageComposeModal from '$lib/components/MessageComposeModal.svelte';
  import { TAB_PATHS, type MessageTab } from './tabs';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  type Thread = {
    threadId: string;
    subject: string;
    latestFrom: string;
    latestAt: string;
    unreadCount: number;
    totalCount?: number;
  };

  const TABS = [
    ['inbox', m.messages_inbox, Inbox],
    ['sent', m.messages_sent, Send],
    ['archived', m.messages_archive, Archive],
  ] as const;

  const tab = $derived(data.tab as MessageTab);
  const tabLabel = $derived(TABS.find(([t]) => t === tab)![1]());

  // First page from the layout load (re-run when ?tab= changes); "Load more" appends to it here.
  let threads = $derived(data.threads as Thread[]);
  let hasMore = $derived(data.hasMore);
  let loadingMore = $state(false);

  async function loadMore() {
    const oldest = threads[threads.length - 1];
    if (!oldest || loadingMore) return;
    loadingMore = true;
    try {
      const before = encodeURIComponent(new Date(oldest.latestAt).toISOString());
      const res = await fetch(`/api/messages${TAB_PATHS[tab]}?limit=25&before=${before}`);
      if (res.ok) {
        const d = await res.json();
        threads = [...threads, ...(d.threads ?? [])];
        hasMore = d.hasMore ?? false;
      }
    } catch { /* non-fatal */ } finally {
      loadingMore = false;
    }
  }

  const currentThreadId = $derived(page.params.threadId ?? null);

  // ?tab= rides along on every link so the list, and the phone's back link, stay on the tab you came from.
  const tabQuery = $derived(tab === 'inbox' ? '' : `?tab=${tab}`);
  const tabHref = (t: MessageTab) => `${page.url.pathname}${t === 'inbox' ? '' : `?tab=${t}`}`;

  // ── Compose: a modal over whatever is showing, opened by ?compose (/messages/compose redirects here) ──
  const composeOpen = $derived(page.url.searchParams.has('compose'));
  const composeHref = $derived(`${page.url.pathname}${tabQuery}${tabQuery ? '&' : '?'}compose`);
  // Opened from the button here: closing steps back in history, so Back doesn't reopen it. Arrived on the URL
  // directly: there's nothing of ours to step back to, so the parameter is replaced away instead.
  let composePushed = false;
  $effect(() => { if (!composeOpen) composePushed = false; });

  function closeCompose() {
    if (composePushed) { composePushed = false; history.back(); return; }
    goto(`${page.url.pathname}${tabQuery}`, { replaceState: true, noScroll: true, keepFocus: true });
  }

  async function onSent(threadId: string) {
    // The new thread is in Sent; replace the compose entry so Back returns to where compose was opened from.
    composePushed = false;
    await goto(`/messages/${threadId}?tab=sent`, { replaceState: true, invalidateAll: true });
  }

  function resolveFrom(userId: string) {
    const u = data.allUsers.find((x: { id: string }) => x.id === userId);
    if (!u) return userId;
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
  }
</script>

<svelte:head><title>{m.messages_title()}</title></svelte:head>

<!-- Mobile first. On phones the page scrolls as one column and shows one panel at a time: the list on /messages,
     the open thread (with a back link) on /messages/<id>. From md up the two panels sit side by side and fill the
     space under the app's top bar exactly, each scrolling on its own: 100dvh minus the top bar (h-16, 4rem) and the
     content column's bottom padding (pb-6, 1.5rem), both in routes/+layout.svelte.
     No overflow-hidden on this wrapper: it would crop PageHeader's full-width banner to the content column. -->
<div class="flex flex-col gap-4 md:h-[calc(100dvh-5.5rem)]">

  <div class="shrink-0">
    <PageHeader icon={MailIcon} title={m.messages_title()} subtitle={m.messages_subtitle()}>
      {#snippet actions()}
        <a href={composeHref} class="btn btn-primary btn-sm" data-sveltekit-noscroll onclick={() => (composePushed = true)}>
          <SquarePen class="size-4" />
          {m.messages_compose()}
        </a>
      {/snippet}
    </PageHeader>
  </div>

  <div class="md:flex md:flex-1 md:min-h-80 bg-base-200 border border-base-300 rounded-box overflow-hidden">

    <!-- Thread list -->
    <aside class="{currentThreadId ? 'hidden' : 'flex'} md:flex flex-col md:w-80 lg:w-96 shrink-0 md:border-r border-base-300 min-h-0">
      <div class="flex border-b border-base-300 shrink-0" role="tablist">
        {#each TABS as [t, label, Icon] (t)}
          <a
            href={tabHref(t)}
            role="tab"
            aria-selected={tab === t}
            data-sveltekit-noscroll
            data-sveltekit-replacestate
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 -mb-px text-sm font-medium border-b-2 transition-colors
              {tab === t ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
          >
            <Icon class="size-4" />
            {label()}
          </a>
        {/each}
      </div>

      <div class="md:flex-1 md:overflow-y-auto">
        {#if threads.length === 0}
          <p class="text-sm text-center opacity-50 py-12">{m.messages_none()}</p>
        {:else}
          {#each threads as thread (thread.threadId)}
            <!-- Sent: you sent the latest message, so the subject leads and the count follows -->
            <MessageListItem
              threadId={thread.threadId}
              href="/messages/{thread.threadId}{tabQuery}"
              subject={tab === 'sent' ? m.messages_count({ count: thread.totalCount ?? 1 }) : thread.subject}
              latestFrom={tab === 'sent' ? thread.subject : resolveFrom(thread.latestFrom)}
              latestAt={thread.latestAt}
              unreadCount={thread.unreadCount}
              active={currentThreadId === thread.threadId}
            />
          {/each}
          {#if hasMore}
            <div class="p-3">
              <button type="button" class="btn btn-ghost btn-sm w-full" disabled={loadingMore} onclick={loadMore}>
                {loadingMore ? m.common_loading() : m.common_load_more()}
              </button>
            </div>
          {/if}
        {/if}
      </div>
    </aside>

    <!-- Open thread (on /messages: the "select a conversation" placeholder, desktop only) -->
    <section class="{currentThreadId ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 min-h-0 flex-col">
      {#if currentThreadId}
        <a
          href="/messages{tabQuery}"
          class="md:hidden flex items-center gap-1 px-4 py-2.5 text-sm font-medium border-b border-base-300 shrink-0 hover:bg-base-300/50 transition-colors"
        >
          <ChevronLeft class="size-4" />
          {tabLabel}
        </a>
      {/if}
      {@render children()}
    </section>
  </div>
</div>

{#if composeOpen}
  <MessageComposeModal users={data.allUsers} onClose={closeCompose} {onSent} />
{/if}
