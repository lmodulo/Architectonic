import { Receipt } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'folio', label: 'Folio', icon: Receipt, order: 30, description: 'Estimates, invoices, recurring billing, expenses, and Stripe payments.' },
] satisfies DocsPage[];
