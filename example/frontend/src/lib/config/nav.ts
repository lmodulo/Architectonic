import { House } from 'lucide-svelte';
import type { Component } from 'svelte';

export interface NavItem {
  label:       string;
  href:        string;
  icon:        Component;
  permission?: { resource: string; action: string };
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: House },
];
