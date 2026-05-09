<script lang="ts">
  import { onMount } from 'svelte';
  import { MessageSquare, Send, Pencil, Trash2, X, Check } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import UserNameLink from '$lib/components/UserNameLink.svelte';

  let {
    jobId  = '',
    taskId = '',
    user,
    users = [],
  }: {
    jobId?:  string;
    taskId?: string;
    user: any;
    users: any[];
  } = $props();

  interface Comment {
    id: string;
    jobId?:  string;
    taskId?: string;
    text: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }

  let comments  = $state<Comment[]>([]);
  let loading   = $state(true);
  let newText   = $state('');
  let posting   = $state(false);
  let postError = $state('');
  let editingId = $state('');
  let editText  = $state('');
  let saving    = $state(false);

  function userName(id: string): string {
    const u = users.find((u: any) => u.id === id);
    if (!u) return 'Unknown';
    return (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.username;
  }

  function initials(id: string): string {
    return userName(id).charAt(0).toUpperCase();
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function feedQs(): string {
    if (taskId) return `taskId=${taskId}`;
    return `jobId=${jobId}`;
  }

  function postBody(text: string): Record<string, string> {
    if (taskId) return { taskId, text };
    return { jobId, text };
  }

  async function load() {
    loading = true;
    try {
      const res = await fetch(`/api/agile/comments?${feedQs()}`);
      if (res.ok) {
        const data = await res.json();
        comments = ((data.comments ?? []) as Comment[]).reverse();
      }
    } finally { loading = false; }
  }

  onMount(load);

  async function post() {
    if (!newText.trim()) return;
    posting = true; postError = '';
    try {
      const res = await fetch('/api/agile/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(postBody(newText.trim())),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { postError = (d as any).message ?? 'Post failed'; return; }
      comments = [...comments, d as Comment];
      newText = '';
    } catch { postError = 'Network error'; }
    finally { posting = false; }
  }

  async function saveEdit() {
    if (!editText.trim()) return;
    saving = true;
    try {
      const res = await fetch(`/api/agile/comments/${editingId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() }),
      });
      if (!res.ok) return;
      comments = comments.map(c => c.id === editingId ? { ...c, text: editText.trim() } : c);
      editingId = '';
    } finally { saving = false; }
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/agile/comments/${id}`, { method: 'DELETE' });
    if (res.ok) comments = comments.filter(c => c.id !== id);
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) post();
  }
</script>

<div class="space-y-4">
  {#if loading}
    <p class="text-xs opacity-40 text-center py-4">Loading…</p>
  {:else if comments.length === 0}
    <div class="flex flex-col items-center gap-1 py-6 opacity-35">
      <MessageSquare class="size-5" />
      <p class="text-xs">No comments yet</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each comments as c (c.id)}
        <div class="flex gap-3 group">
          <div class="size-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 select-none">
            {initials(c.createdBy)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <UserNameLink user={users.find((u: any) => u.id === c.createdBy)} class="text-xs font-semibold" />
              <span class="text-[10px] opacity-40">{timeAgo(c.createdAt)}</span>
              {#if c.createdBy === user?.id || hasPermission(user, 'agile_comments', 'delete')}
                <span class="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {#if c.createdBy === user?.id}
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-square"
                      onclick={() => { editingId = c.id; editText = c.text; }}
                      aria-label="Edit comment"
                    >
                      <Pencil class="size-3" />
                    </button>
                  {/if}
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-square text-error"
                    onclick={() => deleteComment(c.id)}
                    aria-label="Delete comment"
                  >
                    <Trash2 class="size-3" />
                  </button>
                </span>
              {/if}
            </div>
            {#if editingId === c.id}
              <div class="flex gap-2 mt-1.5">
                <textarea
                  class="textarea textarea-sm flex-1 text-sm resize-none"
                  rows="2"
                  bind:value={editText}
                ></textarea>
                <div class="flex flex-col gap-1 shrink-0">
                  <button type="button" class="btn btn-primary btn-xs btn-square" onclick={saveEdit} disabled={saving}>
                    <Check class="size-3" />
                  </button>
                  <button type="button" class="btn btn-ghost btn-xs btn-square" onclick={() => (editingId = '')}>
                    <X class="size-3" />
                  </button>
                </div>
              </div>
            {:else}
              <p class="text-sm leading-relaxed whitespace-pre-wrap mt-0.5">{c.text}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if hasPermission(user, 'agile_comments', 'create')}
    {#if postError}
      <p class="text-xs text-error">{postError}</p>
    {/if}
    <div class="flex gap-2">
      <textarea
        class="textarea textarea-sm flex-1 text-sm resize-none"
        rows="2"
        placeholder="Add a comment… (Ctrl+Enter to post)"
        bind:value={newText}
        onkeydown={handleKey}
      ></textarea>
      <button
        type="button"
        class="btn btn-primary btn-sm self-end"
        onclick={post}
        disabled={posting || !newText.trim()}
        aria-label="Post comment"
      >
        <Send class="size-3.5" />
      </button>
    </div>
  {/if}
</div>
