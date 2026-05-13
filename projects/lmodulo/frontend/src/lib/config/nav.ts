import {
  House, Bell, Mail, CalendarRange, Milestone, Handshake,
  Receipt, LayoutDashboard, CreditCard, Ticket,
} from 'lucide-svelte';
import type { Component } from 'svelte';

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

export const navItems: NavEntry[] = [
  // Staff-only items (hidden from customers via customerOnly filter)
  { label: 'Dashboard',     href: '/dashboard',       icon: House },
  { label: 'Agile', href: '/agile',           icon: Milestone,       matchPrefix: true, permission: { resource: 'agile_milestones', action: 'read' } },
  { label: 'Nexus',         href: '/crm',             icon: Handshake,       matchPrefix: true, permission: { resource: 'crm_contacts',      action: 'read' } },
  { label: 'Folio',         href: '/folio',           icon: Receipt,         matchPrefix: true, permission: { resource: 'finance_invoices',   action: 'read' } },
  { label: 'Calendar',      href: '/calendar-events', icon: CalendarRange,   matchPrefix: true },
  { separator: true },
  { label: 'Messages',      href: '/messages',        icon: Mail,            matchPrefix: true },
  { label: 'Notifications', href: '/notifications',   icon: Bell },

  // Customer-only items
  { label: 'Client Portal', href: '/client-portal',         icon: LayoutDashboard, customerOnly: true },
  { label: 'Tickets',       href: '/client-portal/tickets', icon: Ticket,          customerOnly: true, matchPrefix: true },
  { label: 'Payments',      href: '/payments',              icon: CreditCard,      customerOnly: true },
];
