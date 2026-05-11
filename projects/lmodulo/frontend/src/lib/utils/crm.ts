export type DealStage =
  | 'Discovery' | 'Proposal' | 'Negotiation' | 'Contract' | 'Closed Won' | 'Closed Lost';

export type ContactStatus = 'Prospect' | 'Active' | 'Churned' | 'Partner';
export type ContactRole   = 'Decision Maker' | 'Champion' | 'Technical' | 'Finance' | 'Other';
export type CompanyType   = 'Prospect' | 'Customer' | 'Partner' | 'Vendor';
export type ActivityType  = 'Call' | 'Email' | 'Meeting' | 'Demo' | 'Note' | 'Task';

export const DEAL_STAGES: DealStage[] = [
  'Discovery', 'Proposal', 'Negotiation', 'Contract', 'Closed Won', 'Closed Lost',
];

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  'Discovery':    10,
  'Proposal':     30,
  'Negotiation':  60,
  'Contract':     85,
  'Closed Won':  100,
  'Closed Lost':   0,
};

export const CONTACT_STATUSES: ContactStatus[] = ['Prospect', 'Active', 'Churned', 'Partner'];
export const CONTACT_ROLES: ContactRole[]       = ['Decision Maker', 'Champion', 'Technical', 'Finance', 'Other'];
export const CONTACT_SOURCES                    = ['Inbound', 'Referral', 'Conference', 'Outreach', 'Other'] as const;
export const COMPANY_TYPES: CompanyType[]       = ['Prospect', 'Customer', 'Partner', 'Vendor'];
export const COMPANY_INDUSTRIES                 = ['SaaS', 'Enterprise', 'Startup', 'Agency', 'Government', 'Other'] as const;
export const COMPANY_SIZES                      = ['1-10', '11-50', '51-200', '200+'] as const;
export const ACTIVITY_TYPES: ActivityType[]     = ['Call', 'Email', 'Meeting', 'Demo', 'Note', 'Task'];
export const ACTIVITY_OUTCOMES                  = ['Answered', 'No-show', 'Left Voicemail', 'Productive', 'N/A'] as const;

export const CRM_LEVEL = {
  company:  { label: 'Company',  badge: 'badge-primary',   text: 'text-primary'   },
  contact:  { label: 'Contact',  badge: 'badge-secondary', text: 'text-secondary' },
  deal:     { label: 'Deal',     badge: 'badge-success',   text: 'text-success'   },
  activity: { label: 'Activity', badge: 'badge-accent',    text: 'text-accent'    },
} as const;

export const STAGE_COLOR: Record<string, string> = {
  'Discovery':   'badge-primary badge-soft',
  'Proposal':    'badge-secondary badge-soft',
  'Negotiation': 'badge-warning badge-soft',
  'Contract':    'badge-success badge-soft',
  'Closed Won':  'badge-success',
  'Closed Lost': 'badge-ghost',
};

export const CONTACT_STATUS_COLOR: Record<string, string> = {
  'Prospect': 'badge-primary badge-soft',
  'Active':   'badge-success badge-soft',
  'Churned':  'badge-ghost',
  'Partner':  'badge-secondary badge-soft',
};

export const COMPANY_TYPE_COLOR: Record<string, string> = {
  'Prospect': 'badge-primary badge-soft',
  'Customer': 'badge-success badge-soft',
  'Partner':  'badge-secondary badge-soft',
  'Vendor':   'badge-ghost',
};

export const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  'Call':    'badge-primary badge-soft',
  'Email':   'badge-secondary badge-soft',
  'Meeting': 'badge-success badge-soft',
  'Demo':    'badge-warning badge-soft',
  'Note':    'badge-ghost',
  'Task':    'badge-accent badge-soft',
};

export function fmtCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(value);
}

export function fmtDate(val: string | Date | null | undefined): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function toDateInput(val: string | Date | null | undefined): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function healthColor(score: number): string {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function pipelineTotal(deals: { value?: number; stage?: string }[], stage?: string): number {
  return deals
    .filter(d => !stage || d.stage === stage)
    .reduce((s, d) => s + (d.value ?? 0), 0);
}

export interface CrmContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role: ContactRole;
  status: ContactStatus;
  source?: string;
  companyId?: string | null;
  companyName?: string;
  assignedTo?: string | null;
  linkedInUrl?: string;
  timezone?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmCompany {
  id: string;
  name: string;
  domain?: string | null;
  website?: string | null;
  description?: string;
  industry: string;
  size: string;
  type: CompanyType;
  assignedTo?: string | null;
  tags?: string[];
  healthScore?: number;
  dealCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  companyId?: string | null;
  companyName?: string;
  contactIds: string[];
  stage: DealStage;
  value: number;
  currency: string;
  probability: number;
  type: string;
  expectedCloseDate?: string | null;
  description?: string;
  lostReason?: string;
  assignedTo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmActivity {
  id: string;
  type: ActivityType;
  title: string;
  body?: string;
  entityType?: string | null;
  entityId?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  outcome?: string;
  assignedTo?: string | null;
  createdBy?: string;
  createdAt?: string;
}
