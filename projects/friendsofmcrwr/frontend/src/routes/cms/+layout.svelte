<script lang="ts">
  // The Content admin shell (README "Module Page Layout"): the section banner and the tab bar.
  import { LayoutTemplate, ListTree, Settings2 } from 'lucide-svelte';
  import { page } from '$app/state';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { dragScroll } from '$lib/actions/dragScroll';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const navLinks = [
    { href: '/cms', label: 'Site', icon: ListTree },
    { href: '/cms/settings', label: 'Settings', icon: Settings2 },
  ];

  // "Site" covers the tree and the page builder
  const isActive = (href: string) =>
    href === '/cms' ? !page.url.pathname.startsWith('/cms/settings') : page.url.pathname.startsWith(href);
</script>

<div data-no-anim class="flex flex-col gap-6">
  <PageHeader icon={LayoutTemplate} title="Content" subtitle="Site · Settings" />

  <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-6" aria-label="Content sections">
    {#each navLinks as link (link.href)}
      <a
        href={link.href}
        aria-current={isActive(link.href) ? 'page' : undefined}
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors
          {isActive(link.href) ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
      >
        <link.icon size={16} class="size-4" />
        {link.label}
      </a>
    {/each}
  </nav>

  {#key page.url.pathname}
    <div class="page-content pt-6">
      {@render children()}
    </div>
  {/key}
</div>
