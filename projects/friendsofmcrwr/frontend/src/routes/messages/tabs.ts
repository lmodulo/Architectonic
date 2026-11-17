// The /messages list tabs. The active one is the `?tab=` query parameter (absent = inbox), so it survives opening a
// thread (the root layout remounts the page on every path change) and the phone's back link can return to it.
export const MESSAGE_TABS = ['inbox', 'sent', 'archived'] as const;
export type MessageTab = (typeof MESSAGE_TABS)[number];

/** API path suffix per tab: `/messages${suffix}` on the API, `/api/messages${suffix}` through the web proxies. */
export const TAB_PATHS: Record<MessageTab, string> = { inbox: '', sent: '/sent', archived: '/archived' };

export function parseTab(value: string | null): MessageTab {
  return (MESSAGE_TABS as readonly string[]).includes(value ?? '') ? (value as MessageTab) : 'inbox';
}
