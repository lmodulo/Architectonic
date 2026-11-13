import type { Component } from 'svelte';
import CommerceDashboardWidget from '$lib/components/commerce/CommerceDashboardWidget.svelte';
import CrmDashboardWidget from '$lib/components/crm/CrmDashboardWidget.svelte';
import AgileDashboardWidget from '$lib/components/agile/AgileDashboardWidget.svelte';
import FolioDashboardWidget from '$lib/components/folio/FolioDashboardWidget.svelte';
import ContractsDashboardWidget from '$lib/components/contracts/ContractsDashboardWidget.svelte';
import VaultDashboardWidget from '$lib/components/vault/VaultDashboardWidget.svelte';

export interface DashboardWidget {
  component: Component;
  permission: { resource: string; action: string };
  order: number;
}

// Modules add entries here via module.json "widgets" (merged by arch.js before the closing bracket).
export const dashboardWidgets: DashboardWidget[] = [
  { component: CommerceDashboardWidget, permission: { resource: 'commerce_orders', action: 'read' }, order: 10 },
  { component: CrmDashboardWidget, permission: { resource: 'crm_contacts', action: 'read' }, order: 20 },
  { component: AgileDashboardWidget, permission: { resource: 'agile_milestones', action: 'read' }, order: 30 },
  { component: FolioDashboardWidget, permission: { resource: 'finance_invoices', action: 'read' }, order: 40 },
  { component: ContractsDashboardWidget, permission: { resource: 'contracts', action: 'read' }, order: 50 },
  { component: VaultDashboardWidget, permission: { resource: 'vault_documents', action: 'read' }, order: 60 },
];
