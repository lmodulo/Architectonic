import { ShoppingCart } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'commerce', label: 'Commerce', icon: ShoppingCart, order: 60, description: 'Products, inventory, orders, sales analytics, and the public storefront.' },
] satisfies DocsPage[];
