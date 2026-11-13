import { Handshake } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'crm', label: 'Nexus CRM', icon: Handshake, order: 20, description: 'Companies, contacts, a deal pipeline, and activity tracking.' },
] satisfies DocsPage[];
