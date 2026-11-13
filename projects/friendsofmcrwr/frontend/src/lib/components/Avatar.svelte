<script lang="ts">
  type AvatarUser = {
    firstName?:   string;
    lastName?:    string;
    username?:    string;
    avatarUrl?:   string;
    avatarColor?: string;
  };

  let { user, size = 'md', class: cls = '' }: {
    user: AvatarUser;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  } = $props();

  const sizes: Record<string, string> = {
    xs: 'size-6 text-[9px]',
    sm: 'size-7 text-[10px]',
    md: 'size-8 text-xs',
    lg: 'size-10 text-sm',
    xl: 'size-20 text-xl',
  };

  function getInitials(u: AvatarUser): string {
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    if (u.username)  return u.username.slice(0, 2).toUpperCase();
    return '?';
  }

  const initials = $derived(getInitials(user));
  const bg       = $derived(user.avatarColor || '#6b5fa5');
</script>

<div class="rounded-full overflow-hidden shrink-0 select-none {sizes[size]} {cls}">
  {#if user.avatarUrl}
    <img src={user.avatarUrl} alt="" class="w-full h-full object-cover" />
  {:else}
    <div
      class="w-full h-full flex items-center justify-center font-bold leading-none"
      style="background:{bg}; color:#fff;"
    >
      {initials}
    </div>
  {/if}
</div>
