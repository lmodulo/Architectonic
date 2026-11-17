import { House, Bell, Mail, Zap, Building2, History } from 'lucide-svelte';
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

export const navItems: NavEntry[] = [
  { label: m.nav_dashboard(),     href: '/dashboard',           icon: House },
  { label: m.nav_messages(),      href: '/messages',            icon: Mail,  matchPrefix: true },
  { label: m.nav_notifications(), href: '/notifications',       icon: Bell  },
  { label: m.nav_automation(),    href: '/settings/automation', icon: Zap,        permission: { resource: 'automation', action: 'read' } },
  { label: m.nav_workspace(),     href: '/settings/workspaces', icon: Building2,  permission: { resource: 'workspaces', action: 'read' } },
  { label: m.nav_audit_log(),     href: '/audit-log',           icon: History,    permission: { resource: 'audit',      action: 'read' } },
];
