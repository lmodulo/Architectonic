import { LayoutTemplate } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'cms', label: 'Content', icon: LayoutTemplate, order: 80, description: 'The public website: site tree, page builder, Vault images, and custom components.' },
] satisfies DocsPage[];
