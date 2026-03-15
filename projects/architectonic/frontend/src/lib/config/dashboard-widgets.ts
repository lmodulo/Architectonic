import type { Component } from 'svelte';
import ContributionChart from '$lib/components/github/ContributionChart.svelte';

export interface DashboardWidget {
  component: Component;
  permission: { resource: string; action: string };
  order: number;
}

export const dashboardWidgets: DashboardWidget[] = [
  { component: ContributionChart, permission: { resource: 'github', action: 'read' }, order: 10 },
];
