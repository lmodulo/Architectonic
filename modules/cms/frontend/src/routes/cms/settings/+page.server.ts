import { env } from '$env/dynamic/private';
import type { CmsNode, CmsSettings } from '$lib/cms/types';
import type { MediaFolder } from '$lib/cms/media.svelte';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Site settings: the home page, the footer and the Website Media folder. The node list feeds the
// home and link pickers.
export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session');
  const headers: Record<string, string> = session ? { cookie: `session=${session}` } : {};
  const [settingsRes, nodesRes, foldersRes] = await Promise.all([
    fetch(`${API_URL}/cms/settings`, { headers }).catch(() => null),
    fetch(`${API_URL}/cms/nodes`, { headers }).catch(() => null),
    // Vault folders for the Website Media setting; not available without Vault or Vault access
    fetch(`${API_URL}/cms/media/folders`, { headers }).catch(() => null),
  ]);
  if (!settingsRes?.ok || !nodesRes?.ok) return { settings: null, nodes: [] as CmsNode[], folders: null, loadFailed: true };
  const media = foldersRes?.ok ? ((await foldersRes.json()) as { available: boolean; folders: MediaFolder[] }) : null;
  return {
    settings: (await settingsRes.json()) as CmsSettings,
    nodes: (await nodesRes.json()) as CmsNode[],
    folders: media?.available ? media.folders : null,
    loadFailed: false,
  };
};
