<script lang="ts">
  import { page } from '$app/state';
  import { FileSignature, LayoutTemplate } from 'lucide-svelte';
  import { hasPermission } from '$lib/permissions';
  import { dragScroll } from '$lib/actions/dragScroll';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  const isSignPage = $derived(page.url.pathname.startsWith('/contracts/sign/'));

  const navLinks = [
    { href: '/contracts',           label: 'All Contracts', icon: FileSignature,  permission: null },
    { href: '/contracts/templates', label: 'Templates',     icon: LayoutTemplate, permission: 'contract_templates' as const },
  ];

  const isActive = (href: string) =>
    href === '/contracts'
      ? page.url.pathname === '/contracts' || (page.url.pathname.startsWith('/contracts/') && !page.url.pathname.startsWith('/contracts/templates'))
      : page.url.pathname.startsWith(href);
</script>

{#if isSignPage}
  {@render children()}
{:else}
  <div class="flex flex-col gap-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold leading-none">Contracts</h1>
      <p class="text-xs opacity-50 mt-0.5">Agreements · Templates</p>
    </div>

    <!-- Sub-navigation -->
    <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-2">
      {#each navLinks as link}
        {#if !link.permission || hasPermission(data.user, link.permission, 'read')}
          <a
            href={link.href}
            class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
              {isActive(link.href)
                ? 'bg-primary text-primary-content'
                : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
          >
            <svelte:component this={link.icon} class="size-4" />
            {link.label}
          </a>
        {/if}
      {/each}
    </nav>

    <!-- Page content -->
    {@render children()}
  </div>
{/if}
