import {
  House, Bell, Mail, CalendarRange, Milestone,
} from 'lucide-svelte';
import type { Component } from 'svelte';

export interface NavItem {
  label:        string;
  href:         string;
  icon:         Component;
  permission?:  { resource: string; action: string };
  matchPrefix?: boolean;
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
  { label: 'Dashboard',     href: '/dashboard',       icon: House },
  { label: 'Agile Tracker', href: '/agile',           icon: Milestone,    matchPrefix: true, permission: { resource: 'agile_milestones', action: 'read' } },
  { label: 'Calendar',      href: '/calendar-events', icon: CalendarRange, matchPrefix: true },
  { separator: true },
  { label: 'Messages',      href: '/messages',        icon: Mail,         matchPrefix: true },
  { label: 'Notifications', href: '/notifications',   icon: Bell },
];
