import { House, Package, ShoppingCart, Layers, BarChart2, Store } from 'lucide-svelte';
import type { Component } from 'svelte';

export interface NavItem {
  label:       string;
  href:        string;
  icon:        Component;
  permission?: { resource: string; action: string };
}

export interface NavGroup {
  label:    string;
  icon:     Component;
  children: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

export const navItems: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: House },
  {
    label: 'Commerce',
    icon: Store,
    children: [
      { label: 'Products',   href: '/commerce/products',   icon: Package,      permission: { resource: 'commerce_products',   action: 'read' } },
      { label: 'Orders',     href: '/commerce/orders',     icon: ShoppingCart, permission: { resource: 'commerce_orders',     action: 'read' } },
      { label: 'Categories', href: '/commerce/categories', icon: Layers,       permission: { resource: 'commerce_categories', action: 'read' } },
      { label: 'Inventory',  href: '/commerce/inventory',  icon: BarChart2,    permission: { resource: 'commerce_products',   action: 'read' } },
    ]
  },
];
