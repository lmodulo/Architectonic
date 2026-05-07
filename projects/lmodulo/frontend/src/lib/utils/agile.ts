export type AgileStatus =
  | 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled'
  | 'Review'
  | 'Backlog' | 'In Progress' | 'Blocked' | 'Done'
  | 'Ready';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type JobCategory = 'Feature' | 'Bug' | 'Tech Debt' | 'Research';

export const STATUS_COLOR: Record<string, string> = {
  Planning:    'badge-primary badge-soft',
  Active:      'badge-success badge-soft',
  'On Hold':   'badge-warning badge-soft',
  Completed:   'badge-success',
  Cancelled:   'badge-ghost',
  Review:      'badge-secondary badge-soft',
  Backlog:     'badge-ghost',
  Ready:       'badge-primary badge-soft',
  'In Progress': 'badge-success badge-soft',
  Blocked:     'badge-error badge-soft',
  Done:        'badge-success',
};

export const PRIORITY_COLOR: Record<string, string> = {
  Low:      'badge-ghost',
  Medium:   'badge-primary badge-soft',
  High:     'badge-warning badge-soft',
  Critical: 'badge-error badge-soft',
};

export const CATEGORY_COLOR: Record<string, string> = {
  Feature:    'badge-primary badge-soft',
  Bug:        'badge-error badge-soft',
  'Tech Debt':'badge-warning badge-soft',
  Research:   'badge-secondary badge-soft',
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
