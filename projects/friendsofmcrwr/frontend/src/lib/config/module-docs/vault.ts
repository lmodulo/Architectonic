import { FolderLock } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'vault', label: 'Vault', icon: FolderLock, order: 70, description: 'Document library with folders, versions, and visibility levels.' },
] satisfies DocsPage[];
