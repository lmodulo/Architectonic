import type { Component } from 'svelte';

export interface DashboardWidget {
  component: Component;
  permission: { resource: string; action: string };
  order: number;
}

// Modules add entries here via module.json "widgets" (merged by arch.js before the closing bracket).
export const dashboardWidgets: DashboardWidget[] = [
];
