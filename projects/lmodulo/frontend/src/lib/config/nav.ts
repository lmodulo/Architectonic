import {
  House, Bell, Mail, CalendarRange, Milestone,
} from 'lucide-svelte';
import type { Component } from 'svelte';

export interface NavItem {
  label:        string;
  href:         string;
  icon:         Component;
  permission?:  { resource: string; action: string };
  matchPrefix?: boolean; // activate for all routes that start with href
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
  { label: 'Dashboard',     href: '/dashboard',              icon: House },
  { label: 'Messages',      href: '/messages',               icon: Mail, matchPrefix: true },
  { label: 'Notifications', href: '/notifications',          icon: Bell  },
  { label: 'Calendar',      href: '/calendar-events',        icon: CalendarRange, matchPrefix: true },
  { label: 'Agile Tracker', href: '/agile', matchPrefix: true, icon: Milestone,     permission: { resource: 'agile_milestones', action: 'read' } },
];
