import {
  CircleGauge, CalendarRange, Milestone, Handshake,
  Receipt, LayoutDashboard, CreditCard, Ticket,
  FolderKanban, FileText, ClipboardList, FileSignature, History, FolderLock,
} from 'lucide-svelte';
import type { Component } from 'svelte';
import { m } from '$lib/paraglide/messages.js';

export interface NavItem {
  label:         () => string;
  href:          string;
  icon:          Component;
  permission?:   { resource: string; action: string };
  matchPrefix?:  boolean;
  customerOnly?: boolean;
}

export interface NavGroup {
  label:    () => string;
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

export const navItems: NavEntry[] = [
  // Staff-only items (hidden from customers via customerOnly filter)
  { label: () => m.nav_dashboard(),     href: '/dashboard',       icon: CircleGauge },
  { label: () => m.nav_agile(),         href: '/agile',           icon: Milestone,       matchPrefix: true, permission: { resource: 'agile_milestones', action: 'read' } },
  { label: () => m.nav_nexus(),         href: '/crm',             icon: Handshake,       matchPrefix: true, permission: { resource: 'crm_contacts',      action: 'read' } },
  { label: () => m.nav_folio(),         href: '/folio',           icon: Receipt,         matchPrefix: true, permission: { resource: 'finance_invoices',   action: 'read' } },
  { label: () => m.nav_contracts(),     href: '/contracts',       icon: FileSignature,   matchPrefix: true, permission: { resource: 'contracts',          action: 'read' } },
  { label: () => m.nav_calendar(),      href: '/calendar-events', icon: CalendarRange,   matchPrefix: true },
  { label: () => m.nav_vault(),         href: '/vault',           icon: FolderLock,      matchPrefix: true, permission: { resource: 'vault_documents', action: 'read' } },
  { label: () => m.nav_audit_log(),     href: '/audit-log',       icon: History,         permission: { resource: 'audit', action: 'read' } },

  // Customer-only items
  { label: () => m.nav_client_portal(), href: '/client-portal',           icon: LayoutDashboard, customerOnly: true },
  { label: () => m.nav_projects(),      href: '/client-portal/projects',  icon: FolderKanban,    customerOnly: true, matchPrefix: true },
  { label: () => m.nav_invoices(),      href: '/client-portal/invoices',  icon: FileText,        customerOnly: true, matchPrefix: true },
  { label: () => m.nav_estimates(),     href: '/client-portal/estimates', icon: ClipboardList,   customerOnly: true, matchPrefix: true },
  { label: () => m.nav_tickets(),       href: '/client-portal/tickets',   icon: Ticket,          customerOnly: true, matchPrefix: true },
  { label: () => m.nav_payments(),      href: '/payments',                icon: CreditCard,      customerOnly: true },
];
