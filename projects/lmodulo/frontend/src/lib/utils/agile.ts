export type AgileStatus =
  | 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled'
  | 'Review'
  | 'Backlog' | 'In Progress' | 'Blocked' | 'Done'
  | 'Ready';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type JobCategory = 'Feature' | 'Bug' | 'Tech Debt' | 'Research';

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

export const CATEGORY_COLOR: Record<string, string> = {
  Feature:    'badge-primary badge-outline',
  Bug:        'badge-error badge-outline',
  'Tech Debt':'badge-warning badge-outline',
  Research:   'badge-secondary badge-outline',
};

export function fmtEffort(hours: number): string {
  if (!hours) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`;
}

export function fmtDate(val: string | Date | null | undefined): string {
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

export function toDateInput(val: string | Date | null | undefined): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function completionColor(pct: number): string {
  if (pct >= 100) return 'var(--color-success)';
  if (pct >= 60)  return 'var(--color-primary)';
  if (pct >= 30)  return 'var(--color-warning)';
  return 'var(--color-error)';
}

export const LEVEL = {
  milestone: { label: 'Milestone', text: 'text-primary',   badge: 'badge-primary',            border: 'border-primary'   },
  sprint:    { label: 'Sprint',    text: 'text-secondary',  badge: 'badge-secondary',           border: 'border-secondary' },
  job:       { label: 'Job',       text: 'text-success',    badge: 'badge-success',             border: 'border-success'   },
  task:      { label: 'Task',      text: 'text-accent',     badge: 'badge-accent',              border: 'border-accent'    },
} as const;

export const MILESTONE_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const;
export const SPRINT_STATUSES    = ['Planning', 'Active', 'Review', 'Completed', 'Cancelled'] as const;
export const JOB_STATUSES       = ['Backlog', 'In Progress', 'Blocked', 'Review', 'Done', 'Cancelled'] as const;
export const TASK_STATUSES      = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Review', 'Done'] as const;
export const PRIORITIES         = ['Low', 'Medium', 'High', 'Critical'] as const;
export const JOB_CATEGORIES     = ['Feature', 'Bug', 'Tech Debt', 'Research'] as const;

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

export interface AgileSprint {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  sprintNumber: number;
  capacity?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  calendarEventIds?: string[];
  attachments?: AgileAttachment[];
  completionPct?: number;
  velocity?: number;
  committedEffort?: number;
  jobCount?: number;
  taskCount?: number;
}

export interface AgileJob {
  id: string;
  jobNumber: number;
  sprintId: string;
  title: string;
  description?: string;
  category: JobCategory;
  blocked: boolean;
  dependencyIds?: string[];
  status: string;
  startDate?: string;
  endDate?: string;
  calendarEventIds?: string[];
  attachments?: AgileAttachment[];
  completionPct?: number;
  estimatedHours?: number;
  actualHours?: number;
  taskCount?: number;
}

export interface AgileTask {
  id: string;
  jobId: string;
  jobNumber?: number;
  title: string;
  description?: string;
  assignedTo?: string;
  estimateHours: number;
  actualHours?: number;
  remainingHours?: number;
  priority: Priority;
  status: string;
  blockedReason?: string;
  dueDate?: string;
  calendarEventIds?: string[];
  attachments?: AgileAttachment[];
}
