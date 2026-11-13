import { FileSignature } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'contracts', label: 'Contracts', icon: FileSignature, order: 40, description: 'Draft agreements from templates and collect e-signatures.' },
] satisfies DocsPage[];
