// Documentation pages shown in the /documentation sidebar and overview.
// Core pages live in candidate (routes/(docs)/documentation/<slug>). A module documents itself by
// shipping its page at routes/(docs)/documentation/<slug>/+page.svelte plus a registry file at
// src/lib/config/module-docs/<module>.ts:
//
//   import { Handshake } from 'lucide-svelte';
//   import type { DocsPage } from '$lib/config/docs';
//   export default [{ slug: 'crm', label: 'Nexus CRM', icon: Handshake, order: 20,
//                     description: 'Companies, contacts, deals and activities.' }] satisfies DocsPage[];
//
// Only installed modules have a registry file, so the sidebar lists exactly what the project has.
import type { SvelteComponent } from 'svelte';
import type { IconProps } from 'lucide-svelte';
import { BookOpen, Rocket, Layers, Lock, ShieldCheck, Building2, Mail, Zap, Settings, Code2 } from 'lucide-svelte';

export interface DocsPage {
  /** Path under /documentation ('' = the overview page). */
  slug: string;
  label: string;
  icon: typeof SvelteComponent<IconProps>;
  /** One line for the overview page's cards. */
  description?: string;
  /** Sort order within its group (lower first). */
  order?: number;
}

export const DOCS_BASE = '/documentation';

export const CORE_DOCS: DocsPage[] = [
  { slug: '',                label: 'Overview',            icon: BookOpen },
  { slug: 'getting-started', label: 'Getting Started',     icon: Rocket,      description: 'Run the full stack with Docker in a few minutes.' },
  { slug: 'architecture',    label: 'Architecture',        icon: Layers,      description: 'How the frontend, API, database, and storage fit together.' },
  { slug: 'authentication',  label: 'Authentication',      icon: Lock,        description: 'Sessions, registration, login, password reset, and profiles.' },
  { slug: 'rbac',            label: 'Roles & Permissions', icon: ShieldCheck, description: 'The built-in roles and how permissions are enforced.' },
  { slug: 'workspaces',      label: 'Workspaces',          icon: Building2,   description: 'Multi-tenant workspaces, members, and per-workspace roles.' },
  { slug: 'messaging',       label: 'Messaging',           icon: Mail,        description: 'Threaded in-app messages with a rich-text editor.' },
  { slug: 'automation',      label: 'Automation',          icon: Zap,         description: 'Rules that react to events across modules.' },
  { slug: 'administration',  label: 'Administration',      icon: Settings,    description: 'Users, roles, settings, branding, and the audit log.' },
  { slug: 'api',             label: 'API Reference',       icon: Code2,       description: 'Core endpoints, inputs, and permissions.' },
];

const files = import.meta.glob<{ default: DocsPage[] }>('./module-docs/*.ts', { eager: true });
export const MODULE_DOCS: DocsPage[] = Object.values(files)
  .flatMap(f => f.default)
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.label.localeCompare(b.label));

export const docsHref = (slug: string) => (slug ? `${DOCS_BASE}/${slug}` : DOCS_BASE);
