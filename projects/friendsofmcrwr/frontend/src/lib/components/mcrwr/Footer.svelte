<script lang="ts">
  // Site footer: the white logo with the Content → Settings footer text (or the mission), the top-level menu,
  // contact details, and the Content → Settings footer links (privacy and the like) in the bottom bar.
  import { MapPin, Facebook, Mail } from 'lucide-svelte';
  import { isExternal, safeHref } from '$lib/cms/links';
  import Ridge from './Ridge.svelte';
  import { SITE, type SiteLinks } from './site';
  import type { SiteMenu } from '$lib/cms/types';

  let { menu, links }: { menu: SiteMenu; links: SiteLinks } = $props();

  const explore = $derived(menu.items.filter(i => i.href));
  const legal = $derived(menu.footer.links.flatMap(l => {
    const href = safeHref(l.href);
    return href ? [{ ...l, href }] : [];
  }));
  const year = new Date().getFullYear();
  const rel = (href: string, newTab?: boolean) => (newTab || isExternal(href) ? 'noopener noreferrer' : undefined);
</script>

<footer class="relative mt-auto bg-neutral text-neutral-content">
  <!-- The near bank of the river, rising out of the page into the footer -->
  <Ridge edge class="absolute bottom-full left-0 w-full h-10 md:h-14 fill-neutral" />

  <div class="max-w-6xl mx-auto px-5 pt-12 pb-10 md:pt-16 grid gap-10 md:grid-cols-12">
    <div class="md:col-span-5 flex flex-col gap-5">
      <a href="/" class="self-start">
        <img src="/brand/logo-white.png" alt={SITE.name} width="960" height="406" loading="lazy" class="h-20 md:h-24 w-auto" />
      </a>
      <p class="text-sm leading-relaxed text-neutral-content/80 max-w-sm whitespace-pre-line">{menu.footer.text || SITE.description}</p>
      <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" class="self-start inline-flex items-center gap-2 text-sm font-medium rounded-full border border-white/20 px-4 py-2 hover:bg-white/10 transition-colors">
        <Facebook class="size-4" /> Follow us on Facebook
      </a>
    </div>

    {#if explore.length}
      <nav aria-label="Footer" class="md:col-span-3">
        <h2 class="mw-eyebrow text-neutral-content/60 mb-4">Explore</h2>
        <ul class="grid grid-cols-2 md:grid-cols-1 gap-x-6 gap-y-2.5 text-[0.95rem]">
          {#each explore as item (item.id)}
            <li>
              <a href={item.href} target={item.newTab ? '_blank' : undefined} rel={rel(item.href, item.newTab)} class="hover:underline underline-offset-4 decoration-accent">{item.title}</a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}

    <div class="md:col-span-4 {explore.length ? '' : 'md:col-start-9'}">
      <h2 class="mw-eyebrow text-neutral-content/60 mb-4">Get in touch</h2>
      <address class="not-italic text-[0.95rem] leading-relaxed flex gap-3">
        <MapPin class="size-4 mt-1 shrink-0 text-accent" aria-hidden="true" />
        <span>
          <span class="block text-neutral-content/60 text-sm">Mailing address</span>
          {#each SITE.mailingAddress as line}<span class="block">{line}</span>{/each}
        </span>
      </address>
      {#if links.contact}
        <a href={links.contact} class="mt-5 inline-flex items-center gap-3 text-[0.95rem] hover:underline underline-offset-4 decoration-accent">
          <Mail class="size-4 text-accent" aria-hidden="true" /> Send us a message
        </a>
      {/if}
      {#if links.membership || links.donate}
        <div class="mt-6 flex flex-wrap gap-2">
          {#if links.membership}<a href={links.membership} class="btn btn-accent btn-sm mw-btn">Become a member</a>{/if}
          {#if links.donate}<a href={links.donate} class="btn btn-sm mw-btn btn-outline border-white/30 text-neutral-content hover:bg-white/10">Donate</a>{/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="border-t border-white/10">
    <div class="max-w-6xl mx-auto px-5 py-5 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between text-xs text-neutral-content/65">
      <p>© {year} {SITE.name}. All rights reserved.</p>
      {#if legal.length}
        <ul class="flex flex-wrap gap-x-5 gap-y-1.5">
          {#each legal as link}
            <li><a href={link.href} target={link.newTab ? '_blank' : undefined} rel={rel(link.href, link.newTab)} class="hover:text-neutral-content hover:underline underline-offset-4">{link.label}</a></li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</footer>
