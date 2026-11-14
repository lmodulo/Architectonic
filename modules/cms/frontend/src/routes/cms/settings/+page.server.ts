import { env } from '$env/dynamic/private';
import type { CmsNode, CmsSettings } from '$lib/cms/types';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Site settings: the home page and the footer. The node list feeds the home and link pickers.
export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session');
  const headers: Record<string, string> = session ? { cookie: `session=${session}` } : {};
  const [settingsRes, nodesRes] = await Promise.all([
    fetch(`${API_URL}/cms/settings`, { headers }).catch(() => null),
    fetch(`${API_URL}/cms/nodes`, { headers }).catch(() => null),
  ]);
  if (!settingsRes?.ok || !nodesRes?.ok) return { settings: null, nodes: [] as CmsNode[], loadFailed: true };
  return {
    settings: (await settingsRes.json()) as CmsSettings,
    nodes: (await nodesRes.json()) as CmsNode[],
    loadFailed: false,
  };
};
