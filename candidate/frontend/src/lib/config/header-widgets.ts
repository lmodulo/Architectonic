import type { Component } from 'svelte';

export interface HeaderWidget {
  component: Component;
  position: 'before-avatar' | 'after-avatar';
  permission?: { resource: string; action: string };
}

export const headerWidgets: HeaderWidget[] = [];
