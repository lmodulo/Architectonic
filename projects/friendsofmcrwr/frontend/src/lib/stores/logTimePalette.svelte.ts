let open         = $state(false);
let prefillTaskId = $state('');
let prefillDate   = $state('');

let cachedTasks  = $state<any[]>([]);
let tasksFetched = $state(false);

let lastSavedEntry   = $state<any>(null);
let lastTimerStarted = $state<any>(null);

export const isOpen            = () => open;
export const getPrefillTaskId  = () => prefillTaskId;
export const getPrefillDate    = () => prefillDate;
export const getCachedTasks    = () => cachedTasks;
export const areTasksFetched   = () => tasksFetched;
export const getLastSavedEntry = () => lastSavedEntry;
export const getLastTimerStarted = () => lastTimerStarted;

export function openLogTimePalette(opts?: { taskId?: string; date?: string }) {
  prefillTaskId = opts?.taskId ?? '';
  prefillDate   = opts?.date   ?? '';
  open = true;
}

export function closeLogTimePalette() {
  open          = false;
  prefillTaskId = '';
  prefillDate   = '';
}

export function setCachedTasks(tasks: any[]) {
  cachedTasks  = tasks;
  tasksFetched = true;
}

export function notifyEntrySaved(entry: any)   { lastSavedEntry   = entry; }
export function notifyTimerStarted(entry: any) { lastTimerStarted = entry; }
