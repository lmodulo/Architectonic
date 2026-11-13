// Forked from modules/agile's lib/utils/agile.ts so modules/crm has no
// build-time dependency on modules/agile — only used to render the
// optional "linked milestones" panel on a company's detail page.

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export const STATUS_COLOR: Record<string, string> = {
  Planning:    'badge-primary badge-outline',
  Active:      'badge-success badge-outline',
  'On Hold':   'badge-warning badge-outline',
  Completed:   'badge-success',
  Cancelled:   'badge-ghost',
  Review:      'badge-secondary badge-outline',
  Backlog:     'badge-ghost',
  Ready:       'badge-primary badge-outline',
  'In Progress': 'badge-success badge-outline',
  Blocked:     'badge-error badge-outline',
  Done:        'badge-success',
};

export const PRIORITY_COLOR: Record<string, string> = {
  Low:      'badge-ghost',
  Medium:   'badge-primary badge-outline',
  High:     'badge-warning badge-outline',
  Critical: 'badge-error badge-outline',
};

export function fmtEffort(hours: number): string {
  if (!hours) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`;
}

function fmtDate(val: string | Date | null | undefined): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateRange(start: string | Date | null, end: string | Date | null): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s === '—' && e === '—') return '—';
  if (s === e) return s;
  return `${s} – ${e}`;
}

export interface AgileAttachment {
  name: string;
  url: string;
  mimetype?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface AgileMilestone {
  id: string;
  title: string;
  description?: string;
  strategicGoal?: string;
  priority: Priority;
  status: string;
  startDate?: string;
  endDate?: string;
  clientId?: string | null;
  clientName?: string | null;
  calendarEventIds?: string[];
  attachments?: AgileAttachment[];
  completionPct?: number;
  totalEstimatedHours?: number;
  totalActualHours?: number;
  sprintCount?: number;
  taskCount?: number;
  createdAt?: string;
}
