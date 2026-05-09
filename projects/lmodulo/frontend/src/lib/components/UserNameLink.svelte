<script lang="ts">
  import type { CardUser } from '$lib/stores/userCard.svelte';
  import { isThisTheOpenTrigger, openCard, closeCard } from '$lib/stores/userCard.svelte';

  let { user, class: cls = '' }: { user: CardUser | null | undefined; class?: string } = $props();

  function dname(u: typeof user) {
    if (!u) return '—';
    return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '—';
  }

  function handleClick(e: MouseEvent) {
    if (!user) return;
    const el = e.currentTarget as HTMLElement;
    if (isThisTheOpenTrigger(el)) { closeCard(); return; }
    openCard(user, el.getBoundingClientRect(), el);
  }
</script>

{#if user}
  <button
    type="button"
    data-user-trigger
    class="cursor-pointer underline decoration-dotted hover:decoration-solid underline-offset-2 bg-transparent border-none p-0 font-[inherit] text-[inherit] {cls}"
    onclick={handleClick}
  >{dname(user)}</button>
{:else}
  <span class={cls}>—</span>
{/if}
