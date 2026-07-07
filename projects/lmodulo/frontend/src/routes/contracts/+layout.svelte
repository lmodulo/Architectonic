<script lang="ts">
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import { hasPermission } from '$lib/permissions';
  import { m } from '$lib/paraglide/messages.js';
  import { dragScroll } from '$lib/actions/dragScroll';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  const isSignPage = $derived(page.url.pathname.startsWith('/contracts/sign/'));

  const navLinks = $derived([
    { href: '/contracts',           label: m.contracts_tab_all(),       icon: 'FileSignature',  permission: null },
    { href: '/contracts/templates', label: m.contracts_tab_templates(), icon: 'LayoutTemplate', permission: 'contract_templates' as const },
  ]);

  const isActive = (href: string) =>
    href === '/contracts'
      ? page.url.pathname === '/contracts' || (page.url.pathname.startsWith('/contracts/') && !page.url.pathname.startsWith('/contracts/templates'))
      : page.url.pathname.startsWith(href);
</script>

{#if isSignPage}
  {@render children()}
{:else}
  <div data-no-anim class="flex flex-col gap-6">
    <!-- Page header -->
    <div class="page-heading flex items-start gap-3">
      <Icon name="FileSignature" size={24} class="size-6 shrink-0 mt-0.5" />
      <div>
        <h1 class="text-2xl font-bold leading-none">{m.contracts_title()}</h1>
        <p class="text-xs opacity-60 mt-0.5">{m.contracts_subtitle()}</p>
      </div>
    </div>

    <!-- Sub-navigation -->
    <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-6">
      {#each navLinks as link}
        {#if !link.permission || hasPermission(data.user, link.permission, 'read')}
          <a
            href={link.href}
            class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
              {isActive(link.href)
                ? 'bg-primary text-primary-content'
                : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
          >
            <Icon name={link.icon} size={16} class="size-4" />
            {link.label}
          </a>
        {/if}
      {/each}
    </nav>

    <!-- Page content -->
    {#key page.url.pathname}
      <div class="page-content pt-6">
        {@render children()}
      </div>
    {/key}
  </div>
{/if}
