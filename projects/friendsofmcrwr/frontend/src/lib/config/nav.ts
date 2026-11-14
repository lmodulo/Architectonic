import { House, Mail, History } from 'lucide-svelte';
import { Milestone } from 'lucide-svelte';
import { FolderKanban } from 'lucide-svelte';
import { CalendarDays } from 'lucide-svelte';
import { CalendarCog } from 'lucide-svelte';
import { Package } from 'lucide-svelte';
import { ShoppingCart } from 'lucide-svelte';
import { Layers } from 'lucide-svelte';
import { BarChart2 } from 'lucide-svelte';
import { FileSignature } from 'lucide-svelte';
import { Handshake } from 'lucide-svelte';
import { Receipt } from 'lucide-svelte';
import { FileText } from 'lucide-svelte';
import { ClipboardList } from 'lucide-svelte';
import { FolderLock } from 'lucide-svelte';
import { LayoutTemplate } from 'lucide-svelte';
import { Files } from 'lucide-svelte';
import type { Component } from 'svelte';
import { m } from '$lib/paraglide/messages.js';

export interface NavItem {
  label:         string;
  href:          string;
  icon:          Component;
  permission?:   { resource: string; action: string };
  matchPrefix?:  boolean;
  customerOnly?: boolean;
}

export interface NavGroup {
  label:    string;
  icon:     Component;
  children: NavItem[];
}

export interface NavSeparator { separator: true; }

export type NavEntry = NavItem | NavGroup | NavSeparator;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

export function isSeparator(entry: NavEntry): entry is NavSeparator {
  return 'separator' in entry;
}

// Hidden for launch (commented out below): Messages, Agile, Categories, Inventory, Contracts, Folio.
// The client will use them later; uncomment a line to restore it. The pages still work by URL.
export const navItems: NavEntry[] = [
  { label: m.nav_dashboard(),     href: '/dashboard',           icon: House },
  // { label: m.nav_messages(),      href: '/messages',            icon: Mail,  matchPrefix: true },
  { label: m.nav_audit_log(),     href: '/audit-log',           icon: History,    permission: { resource: 'audit',      action: 'read' } },
  { label: 'Content', href: '/cms', icon: LayoutTemplate, permission: { resource: 'cms_nodes', action: 'read' }, matchPrefix: true },
  // { label: 'Agile', href: '/agile', icon: Milestone, permission: { resource: 'agile_milestones', action: 'read' } },
  { label: 'Projects', href: '/client-portal/projects', icon: FolderKanban, permission: { resource: 'agile_milestones', action: 'read' }, matchPrefix: true, customerOnly: true },
  { label: 'Calendar', href: '/calendar-events', icon: CalendarDays },
  { label: 'Manage Events', href: '/calendar-events/admin', icon: CalendarCog, permission: { resource: 'calendar_events', action: 'create' } },
  { label: 'Products', href: '/commerce/products', icon: Package, permission: { resource: 'commerce_products', action: 'read' } },
  { label: 'Orders', href: '/commerce/orders', icon: ShoppingCart, permission: { resource: 'commerce_orders', action: 'read' } },
  // { label: 'Categories', href: '/commerce/categories', icon: Layers, permission: { resource: 'commerce_categories', action: 'read' } },
  // { label: 'Inventory', href: '/commerce/inventory', icon: BarChart2, permission: { resource: 'commerce_products', action: 'read' } },
  // { label: 'Contracts', href: '/contracts', icon: FileSignature, permission: { resource: 'contracts', action: 'read' } },
  { label: 'Nexus', href: '/crm', icon: Handshake, permission: { resource: 'crm_contacts', action: 'read' } },
  // { label: 'Folio', href: '/folio', icon: Receipt, permission: { resource: 'finance_invoices', action: 'read' } },
  { label: 'Invoices', href: '/client-portal/invoices', icon: FileText, permission: { resource: 'finance_invoices', action: 'read' }, matchPrefix: true, customerOnly: true },
  { label: 'Estimates', href: '/client-portal/estimates', icon: ClipboardList, permission: { resource: 'finance_estimates', action: 'read' }, matchPrefix: true, customerOnly: true },
  { label: 'Vault', href: '/vault', icon: FolderLock, permission: { resource: 'vault_documents', action: 'read' } },
  { label: 'Documents', href: '/client-portal/vault', icon: Files, permission: { resource: 'vault_documents', action: 'read' }, matchPrefix: true, customerOnly: true },
];
