<script lang="ts">
  import type { Snippet, SvelteComponent } from 'svelte';
  import type { IconProps } from 'lucide-svelte';

  // The one page header for app pages (the /crm look): full-bleed accent banner (`.page-heading`
  // in app.css), 24px icon, title and a small subtitle. Use the same icon as the page's nav item.
  //   <PageHeader icon={Users} title="Users" subtitle="Users · Roles · Teams" />
  //   <PageHeader icon={Package} title="Products" subtitle="…">{#snippet actions()}<button …/>{/snippet}</PageHeader>
  // `children` is an alternative to `subtitle` for rich subtitle content.
  // Only use inside the app shell: the banner background is clipped by the shell's <main>.
  let {
    icon: PageIcon,
    title,
    subtitle,
    children,
    actions,
  }: {
    icon: typeof SvelteComponent<IconProps>; // a lucide-svelte icon (class component)
    title: string;
    subtitle?: string;
    children?: Snippet;
    actions?: Snippet;
  } = $props();
</script>

{#snippet heading()}
  <PageIcon size={24} class="size-6 shrink-0 mt-0.5" />
  <div>
    <h1 class="text-2xl font-bold leading-none">{title}</h1>
    {#if subtitle}
      <p class="text-xs opacity-60 mt-0.5">{subtitle}</p>
    {:else if children}
      <p class="text-xs opacity-60 mt-0.5">{@render children()}</p>
    {/if}
  </div>
{/snippet}

{#if actions}
  <div class="page-heading flex items-center justify-between gap-4">
    <div class="flex items-start gap-3">{@render heading()}</div>
    <div class="flex items-center gap-2 shrink-0">{@render actions()}</div>
  </div>
{:else}
  <div class="page-heading flex items-start gap-3">{@render heading()}</div>
{/if}
