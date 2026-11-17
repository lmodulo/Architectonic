// friendsofmcrwr's landing page owns `/` (see the scaffold's $lib/server/module-home.ts). The file name starts
// with 00- so it sorts before cms's loader and always wins: the landing page is hand-built
// ($lib/components/mcrwr/Landing.svelte) and the CMS serves every other page. Content → Settings → Home page
// therefore has no effect on this site.
import type { ServerLoadEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loadMenu } from '$lib/server/cms/site';
import { loadEvents, type EventsData } from '$lib/utils/siteEvents';
import { resolveLinks } from '$lib/components/mcrwr/site';
import type { SiteTreeItem } from '$lib/cms/types';

const API_URL = env.API_URL ?? 'http://localhost:4000';
const UNAVAILABLE: EventsData = { unavailable: true };

/** Every published page (not only the ones in the menu), so the page's links find pages wherever they are */
async function loadTree(): Promise<SiteTreeItem[]> {
  try {
    const res = await fetch(`${API_URL}/cms/site/tree`);
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: SiteTreeItem[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

/** The next few public events from the Calendar module; a slow or failed Calendar just hides them */
function nextEvents(event: ServerLoadEvent): Promise<EventsData> {
  const timeout = new Promise<EventsData>(resolve => setTimeout(() => resolve(UNAVAILABLE), 4000));
  return Promise.race([loadEvents(event.fetch, { limit: 3 }).catch(() => UNAVAILABLE), timeout]);
}

export default async function landing(event: ServerLoadEvent) {
  const [menu, tree, events] = await Promise.all([loadMenu(), loadTree(), nextEvents(event)]);
  return { menu, links: resolveLinks(tree.length ? tree : menu.items), events };
}
