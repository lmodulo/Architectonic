import {
  House, Bell, CalendarDays, CalendarCog,
  Milestone, KanbanSquare, GanttChart, LayoutGrid,
} from 'lucide-svelte';
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
  { label: 'Calendar', href: '/calendar-events', icon: CalendarDays },
  { label: 'Manage Events', href: '/calendar-events/admin', icon: CalendarCog, permission: { resource: 'calendar_events', action: 'create' } },
  {
    label: 'Agile Tracker',
    icon: Milestone,
    children: [
      { label: 'Overview',  href: '/agile',          icon: LayoutGrid,   permission: { resource: 'agile_milestones', action: 'read' } },
      { label: 'Board',     href: '/agile/board',    icon: KanbanSquare, permission: { resource: 'agile_milestones', action: 'read' } },
      { label: 'Timeline',  href: '/agile/timeline', icon: GanttChart,   permission: { resource: 'agile_milestones', action: 'read' } },
      { label: 'Calendar',  href: '/agile/calendar', icon: CalendarDays, permission: { resource: 'agile_milestones', action: 'read' } },
    ],
  },
];
