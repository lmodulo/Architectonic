export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

let connected    = $state(false);
let notifications = $state<AppNotification[]>([]);
let unreadCount  = $state(0);

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
let lastTimestamp: string | null = null;
let shouldReconnect = true;

export const isConnected    = () => connected;
export const getNotifications = () => notifications;
export const getUnreadCount  = () => unreadCount;

export function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  shouldReconnect = true;
  openSocket();
}

export function disconnect() {
  shouldReconnect = false;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  ws?.close();
  ws = null;
  connected = false;
}

function openSocket() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url   = `${proto}//${window.location.hostname}:4000/notifications/ws`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    connected = true;
    reconnectDelay = 1000;
    // Sync any missed notifications since last known
    if (lastTimestamp) {
      ws!.send(JSON.stringify({ type: 'sync', since: lastTimestamp }));
    }
  };

  ws.onclose = () => {
    connected = false;
    ws = null;
    if (shouldReconnect) scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };

  ws.onmessage = (event) => {
    let msg: { type: string; [key: string]: unknown };
    try { msg = JSON.parse(event.data as string); } catch { return; }

    if (msg.type === 'init') {
      unreadCount = (msg.unreadCount as number) ?? 0;

    } else if (msg.type === 'notification') {
      const n = msg.payload as AppNotification;
      // Dedup by _id
      if (!notifications.some(x => x._id === n._id)) {
        notifications = [n, ...notifications];
        lastTimestamp = n.createdAt;
      }
      unreadCount += 1;

    } else if (msg.type === 'count-update') {
      unreadCount = (msg.unreadCount as number) ?? 0;

    } else if (msg.type === 'read-confirmed') {
      const id = msg.notificationId as string;
      notifications = notifications.map(n => n._id === id ? { ...n, read: true } : n);

    } else if (msg.type === 'sync-response') {
      const incoming = (msg.notifications as AppNotification[]) ?? [];
      for (const n of incoming) {
        if (!notifications.some(x => x._id === n._id)) {
          notifications = [...notifications, n];
        }
      }
      notifications = notifications.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      unreadCount = (msg.unreadCount as number) ?? 0;
      if (incoming.length > 0) lastTimestamp = incoming[0].createdAt;
    }
  };
}

function scheduleReconnect() {
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSocket();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
}

export async function markRead(id: string) {
  try {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    if (res.ok) {
      notifications = notifications.map(n => n._id === id ? { ...n, read: true } : n);
      const data = await res.json() as { unreadCount?: number };
      if (data.unreadCount !== undefined) unreadCount = data.unreadCount;
    }
  } catch { /* ignore */ }
}

export async function markAllRead() {
  try {
    const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
    if (res.ok) {
      notifications = notifications.map(n => ({ ...n, read: true }));
      unreadCount = 0;
    }
  } catch { /* ignore */ }
}

export function addNotification(n: AppNotification) {
  if (!notifications.some(x => x._id === n._id)) {
    notifications = [n, ...notifications];
  }
}

export function setRecentNotifications(items: AppNotification[]) {
  notifications = items;
}
