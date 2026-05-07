import type { Component } from 'svelte';

export interface DashboardWidget {
  component: Component;
  permission: { resource: string; action: string };
  order: number;
}

export const dashboardWidgets: DashboardWidget[] = [];
