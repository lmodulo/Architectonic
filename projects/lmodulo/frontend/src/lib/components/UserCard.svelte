<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Avatar from './Avatar.svelte';
  import { Mail, Phone, Users, MessageSquare } from 'lucide-svelte';
  import { isOpen, getPopX, getPopY, isAbove, getUser, isLoading, closeCard, handleDocClick } from '$lib/stores/userCard.svelte';

  function dname(u: ReturnType<typeof getUser>) {
    if (!u) return '';
    return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '';
  }

  onMount(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCard(); };
    document.addEventListener('click', handleDocClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', handleDocClick, true);
      document.removeEventListener('keydown', onKey);
    };
  });
</script>

{#if isOpen()}
  {@const u = getUser()}
  <div
    data-user-card
    class="fixed z-[9999] w-72 rounded-xl bg-base-100 border border-base-200 overflow-hidden"
    style="{isAbove() ? `bottom:${getPopY()}px` : `top:${getPopY()}px`}; left:{getPopX()}px; box-shadow:0 0 22px rgba(0,0,0,0.15);"
    role="tooltip"
  >
    {#if u}
      <div class="flex items-start gap-3 p-4">
        <Avatar user={u} size="lg" class="shrink-0 mt-0.5" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-sm leading-snug truncate">{dname(u)}</p>
          {#if u.username}
            <p class="text-xs opacity-50 truncate">@{u.username}</p>
          {/if}
          {#if u.role}
            <span class="badge badge-ghost badge-sm mt-1.5 capitalize">{u.role}</span>
          {/if}
        </div>
      </div>

      <div class="border-t border-base-200 px-4 py-3 space-y-2">
        {#if u.email}
          <div class="flex items-center gap-2 text-xs">
            <Mail class="size-3 opacity-40 shrink-0" />
            <a href="mailto:{u.email}" class="truncate opacity-70 hover:opacity-100 hover:underline">{u.email}</a>
          </div>
        {/if}
        {#if u.phone}
          <div class="flex items-center gap-2 text-xs">
            <Phone class="size-3 opacity-40 shrink-0" />
            <span class="opacity-70">{u.phone}</span>
          </div>
        {/if}
        {#if isLoading()}
          <p class="text-xs opacity-30 pl-5">Loading…</p>
        {:else if u.teams?.length}
          <div class="flex items-start gap-2 text-xs">
            <Users class="size-3 opacity-40 shrink-0 mt-0.5" />
            <div class="flex flex-wrap gap-1">
              {#each u.teams as team}
                <span class="badge badge-ghost badge-sm">{team}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      {#if u.id}
        <div class="border-t border-base-200 px-4 py-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm w-full justify-start gap-2 text-xs"
            onclick={() => { const id = u.id; closeCard(); goto(`/messages/compose?to=${id}`); }}
          >
            <MessageSquare class="size-3.5 opacity-60" />
            Message
          </button>
        </div>
      {/if}
    {/if}
  </div>
{/if}
