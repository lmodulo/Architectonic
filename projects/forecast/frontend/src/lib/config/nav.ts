import { House, Bell } from 'lucide-svelte';
import { LayoutDashboard } from 'lucide-svelte';
import { CreditCard } from 'lucide-svelte';
import { ArrowLeftRight } from 'lucide-svelte';
import { CalendarRange } from 'lucide-svelte';
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
  { label: 'Dashboard',     href: '/dashboard',     icon: House },
  { label: 'Notifications', href: '/notifications', icon: Bell  },
  { label: 'Budget', href: '/budget/dashboard', icon: LayoutDashboard, permission: { resource: 'budget_accounts', action: 'read' } },
  { label: 'Accounts', href: '/budget/accounts', icon: CreditCard, permission: { resource: 'budget_accounts', action: 'read' } },
  { label: 'Transactions', href: '/budget/transactions', icon: ArrowLeftRight, permission: { resource: 'budget_transactions', action: 'read' } },
  { label: 'Planning', href: '/budget/planning', icon: CalendarRange, permission: { resource: 'budget_planning', action: 'read' } },
];
