<script lang="ts">
  // The landing page at `/`, the site's one hand-built page (every other page is CMS content). Loaded by
  // $lib/server/module-home/00-landing.ts: the menu, links to CMS pages found by slug (site.ts PAGE_SLUGS), and
  // the next public events from the Calendar.
  //
  // Photos: every image slot is in PHOTOS (and REFUGES) below. An empty `src` shows a big-sky placeholder
  // labelled with what belongs there. To use a photo, put the file in static/images/ and set its src, e.g.
  // src: '/images/hero-mcnary-sunrise.jpg'. Landscape photos with a lot of sky suit the slots best.
  import { page } from '$app/state';
  import {
    ArrowRight, Bird, CalendarDays, GraduationCap, Hammer, HandHeart, HeartHandshake, MapPin, Megaphone, Sailboat,
    Users, Facebook,
  } from 'lucide-svelte';
  import Shell from './Shell.svelte';
  import SkyImage from './SkyImage.svelte';
  import { SITE, type SiteLinks } from './site';
  import { eventTimes, type EventsData, type SiteEvent } from '$lib/utils/siteEvents';
  import type { SiteMenu } from '$lib/cms/types';

  let { data }: { data: { menu: SiteMenu; links: SiteLinks; events: EventsData } } = $props();

  type Sky = 'dawn' | 'day' | 'dusk' | 'storm' | 'sage';
  type Photo = { src: string; alt: string; label: string; sky: Sky };

  const PHOTOS = {
    hero:      { src: '', alt: 'A wide sky over the Columbia River and shrub-steppe at sunrise', label: 'Hero: big-sky landscape over the river', sky: 'dawn' },
    whoWeAre:  { src: '', alt: 'Friends volunteers on a refuge trail', label: 'People on a refuge trail', sky: 'sage' },
    vision:    { src: '', alt: 'Sandhill cranes crossing an evening sky', label: 'Full width: evening sky with birds', sky: 'dusk' },
    member:    { src: '', alt: 'Members counting birds on a survey', label: 'Members on a bird survey', sky: 'day' },
    donate:    { src: '', alt: 'A restored wetland under a big sky', label: 'Restored wetland', sky: 'storm' },
    volunteer: { src: '', alt: 'Volunteers planting native shrubs', label: 'Volunteers planting', sky: 'sage' },
  } satisfies Record<string, Photo>;

  // From the Friends' refuge pages; one photo slot each
  const REFUGES: { name: string; kind: string; where: string; fact: string; sky: Sky; src: string }[] = [
    { name: 'McNary', kind: 'National Wildlife Refuge', where: 'Burbank, WA', fact: 'Established in 1956. Winter home to huge flocks of Pacific Flyway mallards.', sky: 'dawn', src: '' },
    { name: 'Umatilla', kind: 'National Wildlife Refuge', where: 'Along the Columbia, OR & WA', fact: '23,555 acres in five units of river, wetland and shrub-steppe.', sky: 'day', src: '' },
    { name: 'Cold Springs', kind: 'National Wildlife Refuge', where: 'Near Hermiston, OR', fact: '3,102 acres around a reservoir that draws waterfowl and shorebirds.', sky: 'sage', src: '' },
    { name: 'McKay Creek', kind: 'National Wildlife Refuge', where: 'Near Pendleton, OR', fact: '1,837 acres of reservoir and grassland in the Blue Mountain foothills.', sky: 'storm', src: '' },
    { name: 'Hanford Reach', kind: 'National Monument', where: 'Near the Tri-Cities, WA', fact: '196,000 acres along the last free-flowing stretch of the Columbia in the U.S.', sky: 'dusk', src: '' },
    { name: 'Columbia', kind: 'National Wildlife Refuge', where: 'Near Othello, WA', fact: 'Basalt cliffs and lakes; up to 75,000 ducks, geese and sandhill cranes each spring.', sky: 'day', src: '' },
    { name: 'Toppenish', kind: 'National Wildlife Refuge', where: 'Yakima Valley, WA', fact: 'Wetlands for waterfowl and streams for Mid-Columbia steelhead.', sky: 'sage', src: '' },
    { name: 'Conboy Lake', kind: 'National Wildlife Refuge', where: 'Glenwood, WA', fact: 'Oregon spotted frogs and greater sandhill cranes beneath Mount Adams.', sky: 'dawn', src: '' },
  ];

  const links = $derived(data.links);

  const WORK: { icon: typeof Hammer; title: string; text: string; href?: string }[] = $derived([
    { icon: Hammer, title: 'Projects', text: 'Habitat restoration, pollinator gardens, clean-ups, signs and displays on the refuges.', href: links.projects },
    { icon: GraduationCap, title: 'Education', text: 'Student field trips and free shrub-steppe learning tools for classrooms.', href: links.education },
    { icon: CalendarDays, title: 'Events', text: 'Winter Birds, Native Plant Day, Celebrate Invertebrates and National Public Lands Day.', href: links.events },
    { icon: Bird, title: 'Wildlife', text: 'Biological surveys and bird banding alongside refuge staff.', href: links.refuges },
    { icon: Sailboat, title: 'Activities', text: 'Guided kayak tours on McNary and Umatilla, hikes, and trails worth exploring.', href: links.activities },
    { icon: Megaphone, title: 'Advocacy', text: 'A community voice for the refuges, their wildlife and public lands.' },
  ]);

  const INVOLVED = $derived([
    { photo: PHOTOS.member, icon: Users, title: 'Become a member', text: 'Memberships start at $15 a year. Members join surveys, field trips, clean-ups and habitat projects.', href: links.membership, cta: 'See membership levels', style: 'btn-accent' },
    { photo: PHOTOS.donate, icon: HandHeart, title: 'Donate', text: 'Gifts of every size fund projects, programs and events on the refuges.', href: links.donate, cta: 'Make a donation', style: 'btn-primary' },
    { photo: PHOTOS.volunteer, icon: HeartHandshake, title: 'Volunteer', text: 'Lend a hand at events, workdays and wildlife surveys through the year.', href: links.volunteer ?? links.contact, cta: links.volunteer ? 'Volunteer with us' : 'Get in touch', style: 'btn-outline' },
  ]);

  const heroPrimary = $derived(
    links.membership ? { href: links.membership, label: 'Become a member' }
    : links.donate ? { href: links.donate, label: 'Donate' }
    : links.about ? { href: links.about, label: 'About the Friends' }
    : null,
  );
  const heroSecondary = $derived({ href: links.refuges ?? '#refuges', label: 'Explore the refuges' });

  // ── Events (dates are UTC calendar days; see $lib/utils/siteEvents.ts) ──
  const events = $derived('events' in data.events ? data.events.events : []);
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => day(iso).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
  function when(e: SiteEvent) {
    if (e.end === e.start) return fmt(e.start, { weekday: 'long', month: 'long', day: 'numeric' });
    const sameMonth = e.start.slice(0, 7) === e.end.slice(0, 7);
    return `${fmt(e.start, { month: 'long', day: 'numeric' })} – ${sameMonth ? fmt(e.end, { day: 'numeric' }) : fmt(e.end, { month: 'long', day: 'numeric' })}`;
  }
</script>

<svelte:head>
  <title>{SITE.name}</title>
  <meta name="description" content={SITE.description} />
  <link rel="canonical" href="{page.url.origin}/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE.name} />
  <meta property="og:title" content={SITE.name} />
  <meta property="og:description" content={SITE.description} />
  <meta property="og:url" content="{page.url.origin}/" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<Shell menu={data.menu} links={data.links} overlay>

  <!-- ── Hero ───────────────────────────────────────────────────────────── -->
  <section class="relative isolate overflow-hidden text-white min-h-[88svh] md:min-h-[92svh] flex items-end">
    <SkyImage fill eager sky={PHOTOS.hero.sky} src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} label={PHOTOS.hero.label} labelClass="top-20 right-4 lg:top-36 lg:right-6" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/5" aria-hidden="true"></div>
    <div class="relative w-full max-w-6xl mx-auto px-5 pt-32 pb-14 md:pb-20">
      <p class="mw-eyebrow text-white/85 max-w-3xl leading-relaxed">Mid-Columbia River &amp; Central Washington National Wildlife Refuges</p>
      <h1 class="mw-display mt-4 max-w-4xl [text-shadow:0_2px_30px_rgb(0_0_0/0.3)]">Big skies, open water, and room for wildlife.</h1>
      <p class="mw-lede mt-5 max-w-2xl text-white/90">
        We're the nonprofit Friends group of the refuges, connecting people with nature through projects, programs and events.
      </p>
      <div class="mt-8 flex flex-col sm:flex-row gap-3">
        {#if heroPrimary}
          <a href={heroPrimary.href} class="btn btn-accent btn-lg mw-btn px-7">{heroPrimary.label}</a>
        {/if}
        <a href={heroSecondary.href} class="btn btn-lg mw-btn px-7 bg-white/10 text-white border-white/50 hover:bg-white/20 hover:border-white backdrop-blur-sm">
          {heroSecondary.label}
        </a>
      </div>
    </div>
  </section>

  <!-- ── Who we are ─────────────────────────────────────────────────────── -->
  <section class="py-16 md:py-24">
    <div class="max-w-6xl mx-auto px-5 grid gap-10 lg:gap-16 lg:grid-cols-12 lg:items-center">
      <div class="lg:col-span-6">
        <p class="mw-eyebrow text-secondary">Who we are</p>
        <h2 class="mw-h2 mt-3">Connecting people with nature on the Mid-Columbia</h2>
        <p class="mw-lede mt-5 opacity-85">
          We support the U.S. Fish and Wildlife Service's Mid-Columbia River and Central Washington National Wildlife
          Refuge Complexes in south-east Washington and north-east Oregon, with volunteers, programs and projects.
        </p>
        <p class="mt-4 leading-relaxed opacity-80">
          We're one of eight Friends groups in Washington, part of a national network of 185 Friends groups supporting
          280 refuges and wetland management districts.
        </p>
        {#if links.about}
          <a href={links.about} class="mt-7 inline-flex items-center gap-2 font-semibold text-primary hover:gap-3 transition-[gap]">
            About the Friends <ArrowRight class="size-4" />
          </a>
        {/if}
      </div>
      <div class="lg:col-span-6">
        <SkyImage ratio="4/3" class="rounded-box" sky={PHOTOS.whoWeAre.sky} src={PHOTOS.whoWeAre.src} alt={PHOTOS.whoWeAre.alt} label={PHOTOS.whoWeAre.label} />
      </div>
    </div>

    <dl class="max-w-6xl mx-auto px-5 mt-14 md:mt-20 grid gap-8 sm:grid-cols-3 border-t border-base-300 pt-10">
      {#each [
        { n: '8', label: 'refuges and monument lands we support' },
        { n: '196,000', label: 'acres in the Hanford Reach National Monument' },
        { n: '75,000', label: 'ducks, geese and cranes at Columbia NWR in spring' },
      ] as stat}
        <div class="flex flex-col-reverse justify-end gap-2">
          <dt class="text-sm leading-snug opacity-75 max-w-[16rem]">{stat.label}</dt>
          <dd class="font-[family-name:var(--display)] text-5xl md:text-6xl font-semibold tracking-tight text-primary leading-none">{stat.n}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <!-- ── The refuges ────────────────────────────────────────────────────── -->
  <section id="refuges" class="py-16 md:py-24 bg-base-200 scroll-mt-20">
    <div class="max-w-6xl mx-auto px-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div class="max-w-2xl">
        <p class="mw-eyebrow text-secondary">The refuges</p>
        <h2 class="mw-h2 mt-3">Eight wild places to explore</h2>
        <p class="mw-lede mt-4 opacity-85">Wetlands, river islands, basalt coulees and shrub-steppe, all within a few hours of each other.</p>
      </div>
      {#if links.refuges}
        <a href={links.refuges} class="btn btn-outline btn-primary mw-btn self-start md:self-auto">Visit the refuges <ArrowRight class="size-4" /></a>
      {/if}
    </div>
    <ul class="mw-rail mt-10 flex gap-4 overflow-x-auto scroll-px-5 px-5 pb-3 max-w-6xl mx-auto lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:pb-0" aria-label="The refuges">
      {#each REFUGES as refuge (refuge.name)}
        <li class="shrink-0 w-[80%] sm:w-[46%] lg:w-auto">
          <article class="h-full rounded-box overflow-hidden bg-base-100 border border-base-300 flex flex-col">
            <SkyImage ratio="4/3" sky={refuge.sky} src={refuge.src} alt="{refuge.name} {refuge.kind}" label={refuge.name} />
            <div class="p-5 flex flex-col gap-2 flex-1">
              <p class="mw-eyebrow text-secondary text-[0.68rem]">{refuge.kind}</p>
              <h3 class="mw-h3">{refuge.name}</h3>
              <p class="text-sm opacity-70 inline-flex items-center gap-1.5"><MapPin class="size-3.5 shrink-0" aria-hidden="true" />{refuge.where}</p>
              <p class="text-[0.92rem] leading-relaxed mt-1">{refuge.fact}</p>
            </div>
          </article>
        </li>
      {/each}
    </ul>
  </section>

  <!-- ── What we do ─────────────────────────────────────────────────────── -->
  <section class="py-16 md:py-24">
    <div class="max-w-6xl mx-auto px-5">
      <div class="max-w-2xl">
        <p class="mw-eyebrow text-secondary">What we do</p>
        <h2 class="mw-h2 mt-3">Hands-on help for wildlife, and for the people who love it</h2>
      </div>
      <ul class="mt-10 grid gap-px bg-base-300 border border-base-300 rounded-box overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
        {#each WORK as item (item.title)}
          {@const Icon = item.icon}
          <li class="bg-base-100 p-6 md:p-7 flex flex-col gap-3">
            <span class="size-11 rounded-full bg-secondary/12 text-secondary grid place-items-center" aria-hidden="true"><Icon class="size-5" /></span>
            <h3 class="mw-h3">{item.title}</h3>
            <p class="text-[0.95rem] leading-relaxed opacity-80 flex-1">{item.text}</p>
            {#if item.href}
              <a href={item.href} class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-[gap]">
                Learn more <span class="sr-only">about {item.title.toLowerCase()}</span><ArrowRight class="size-4" />
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <!-- ── Upcoming events (live from the Calendar) ───────────────────────── -->
  <section class="py-16 md:py-24 bg-base-200">
    <div class="max-w-6xl mx-auto px-5 grid gap-10 lg:grid-cols-12">
      <div class="lg:col-span-4">
        <p class="mw-eyebrow text-secondary">Upcoming events</p>
        <h2 class="mw-h2 mt-3">Come out to the refuges</h2>
        <p class="mt-4 leading-relaxed opacity-80">Seasonal celebrations, guided walks and volunteer workdays through the year.</p>
        {#if links.events}
          <a href={links.events} class="btn btn-primary mw-btn mt-6">See all events <ArrowRight class="size-4" /></a>
        {/if}
      </div>
      <div class="lg:col-span-8">
        {#if events.length}
          <ul class="flex flex-col gap-3">
            {#each events as e (e.id)}
              <li>
                <article class="flex gap-4 md:gap-5 p-4 md:p-5 rounded-box bg-base-100 border border-base-300">
                  <div class="shrink-0 w-16 md:w-[4.5rem] rounded-field bg-primary text-primary-content text-center py-2.5 flex flex-col items-center" aria-hidden="true">
                    <span class="text-[0.7rem] font-semibold uppercase tracking-[0.14em] opacity-85">{fmt(e.start, { month: 'short' })}</span>
                    <span class="font-[family-name:var(--display)] text-3xl font-semibold leading-none mt-1">{fmt(e.start, { day: 'numeric' })}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="mw-h3 text-[1.15rem] break-words">{e.title}</h3>
                    <p class="text-sm opacity-75 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{when(e)}{#if eventTimes(e)}<span aria-hidden="true">{' · '}</span><span class="sr-only">{', '}</span>{eventTimes(e)}{/if}</span>
                      {#if e.location}<span class="inline-flex items-center gap-1"><MapPin class="size-3.5" aria-hidden="true" />{e.location}</span>{/if}
                    </p>
                    {#if e.summary}<p class="text-[0.92rem] leading-relaxed mt-2 opacity-85 line-clamp-2">{e.summary}</p>{/if}
                  </div>
                </article>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center flex flex-col items-center gap-3">
            <CalendarDays class="size-8 text-secondary" aria-hidden="true" />
            <p class="font-medium">Nothing on the calendar just now.</p>
            <p class="text-sm opacity-75 max-w-sm">New events are posted here as they're scheduled. Follow us on Facebook to hear first.</p>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline mw-btn mt-1"><Facebook class="size-4" /> Facebook</a>
          </div>
        {/if}
      </div>
    </div>
  </section>

  <!-- ── Vision ─────────────────────────────────────────────────────────── -->
  <section class="relative isolate overflow-hidden text-white">
    <SkyImage fill sky={PHOTOS.vision.sky} src={PHOTOS.vision.src} alt={PHOTOS.vision.alt} label={PHOTOS.vision.label} labelClass="top-4 right-4" />
    <div class="absolute inset-0 bg-black/25" aria-hidden="true"></div>
    <figure class="relative max-w-4xl mx-auto px-5 py-24 md:py-36 text-center">
      <figcaption class="mw-eyebrow text-white/80">Our vision</figcaption>
      <blockquote class="mt-6 font-[family-name:var(--display)] text-[clamp(1.65rem,2.6vw+1rem,3.1rem)] leading-[1.18] font-medium text-balance [text-shadow:0_2px_24px_rgb(0_0_0/0.3)]">
        “Engage and enlighten people of all ages to the value of wildlife and habitat.”
      </blockquote>
    </figure>
  </section>

  <!-- ── Get involved ───────────────────────────────────────────────────── -->
  <section class="py-16 md:py-24 pb-24 md:pb-32">
    <div class="max-w-6xl mx-auto px-5">
      <div class="max-w-2xl">
        <p class="mw-eyebrow text-secondary">Get involved</p>
        <h2 class="mw-h2 mt-3">Be a friend to the refuges</h2>
        <p class="mw-lede mt-4 opacity-85">Everything we do is powered by members, donors and volunteers.</p>
      </div>
      <ul class="mt-10 grid gap-5 md:grid-cols-3">
        {#each INVOLVED as card (card.title)}
          {@const Icon = card.icon}
          <li>
            <article class="h-full rounded-box overflow-hidden border border-base-300 bg-base-100 flex flex-col">
              <SkyImage ratio="3/2" sky={card.photo.sky} src={card.photo.src} alt={card.photo.alt} label={card.photo.label} />
              <div class="p-6 flex flex-col gap-3 flex-1">
                <h3 class="mw-h3 inline-flex items-center gap-2.5"><Icon class="size-5 text-secondary shrink-0" aria-hidden="true" />{card.title}</h3>
                <p class="text-[0.95rem] leading-relaxed opacity-80 flex-1">{card.text}</p>
                {#if card.href}
                  <a href={card.href} class="btn {card.style} mw-btn self-start mt-1">{card.cta}</a>
                {/if}
              </div>
            </article>
          </li>
        {/each}
      </ul>
    </div>
  </section>

</Shell>
