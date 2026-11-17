// Facts and links for the Friends of Mid-Columbia River Wildlife Refuges website (landing page, header, footer).
// Everything else on the site is CMS content (Content in the staff app).

export const SITE = {
  name: 'Friends of Mid-Columbia River Wildlife Refuges',
  /** the two lines next to the emblem */
  wordmark: ['Friends of Mid-Columbia', 'River Wildlife Refuges'],
  description:
    'A nonprofit Friends group supporting the Mid-Columbia River and Central Washington National Wildlife Refuge ' +
    'Complexes, connecting people with nature through projects, programs and events.',
  mailingAddress: ['64 Maple St.', 'Burbank, WA 99323'],
  facebook: 'https://www.facebook.com/MidColumbiaRefuges',
};

/**
 * Pages the landing page, header and footer point to. They are CMS pages that editors may name and nest as they
 * like, so each is found by slug: the first published page whose last URL segment is one of these (earlier slugs
 * preferred, shallower pages before deeper ones). A link whose page doesn't exist yet is left out rather than
 * pointing at a 404, and appears by itself once the page is published.
 */
export const PAGE_SLUGS = {
  about: ['about-us', 'about', 'who-we-are'],
  refuges: ['the-refuges', 'refuges'],
  events: ['events', 'calendar', 'upcoming-events'],
  membership: ['membership', 'become-a-member', 'join', 'join-us'],
  donate: ['donate', 'donations', 'give', 'support-us'],
  volunteer: ['volunteer', 'volunteers', 'volunteering', 'get-involved'],
  education: ['education', 'programs', 'learn'],
  projects: ['projects', 'our-projects'],
  activities: ['activities', 'trails', 'trails-of-interest'],
  contact: ['contact-us', 'contact'],
} as const;

export type SiteLinkKey = keyof typeof PAGE_SLUGS;
export type SiteLinks = Partial<Record<SiteLinkKey, string>>;

/** A menu or site-tree item (cms MenuItem / SiteTreeItem) */
interface Linkable { type: string; href: string; children: Linkable[] }

function findPage(items: Linkable[], slugs: readonly string[]): string | null {
  for (const slug of slugs) {
    const queue = [...items];
    while (queue.length) {
      const item = queue.shift()!;
      // labels have no page of their own and links point elsewhere
      if ((item.type === 'page' || item.type === 'component') && item.href.split('/').pop() === slug) return item.href;
      queue.push(...item.children);
    }
  }
  return null;
}

export function resolveLinks(items: Linkable[]): SiteLinks {
  const out: SiteLinks = {};
  for (const key of Object.keys(PAGE_SLUGS) as SiteLinkKey[]) {
    const href = findPage(items, PAGE_SLUGS[key]);
    if (href) out[key] = href;
  }
  return out;
}

/** The header's call to action: Donate, else Join, else none */
export function headerCta(links: SiteLinks): { href: string; label: string } | null {
  if (links.donate) return { href: links.donate, label: 'Donate' };
  if (links.membership) return { href: links.membership, label: 'Join' };
  return null;
}
