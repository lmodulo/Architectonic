export type CardUser = {
  id?:          string;
  name?:        string;
  username?:    string;
  firstName?:   string;
  lastName?:    string;
  email?:       string;
  phone?:       string;
  role?:        string;
  avatarUrl?:   string;
  avatarColor?: string;
  teams?:       string[];
};

let open    = $state(false);
let popX    = $state(0);
let popY    = $state(0);
let above   = $state(false);
let user    = $state<CardUser | null>(null);
let loading = $state(false);

// Non-reactive: only read in event handlers
let triggerEl: Element | null = null;

export const isOpen    = () => open;
export const getPopX   = () => popX;
export const getPopY   = () => popY;
export const isAbove   = () => above;
export const getUser   = () => user;
export const isLoading = () => loading;

export function isThisTheOpenTrigger(el: Element): boolean {
  return open && triggerEl === el;
}

export function closeCard() {
  open      = false;
  user      = null;
  loading   = false;
  triggerEl = null;
}

export async function openCard(u: CardUser, rect: DOMRect, trigger: Element) {
  const CARD_W = 288;
  const CARD_H = 220; // used only for show-above decision, not positioning

  above     = (window.innerHeight - rect.bottom) < CARD_H + 8;
  // below: top = bottom of trigger + gap
  // above: store as distance from viewport bottom so card sits right above trigger
  popY      = above
    ? window.innerHeight - rect.top + 6
    : rect.bottom + 6;
  popX      = Math.min(Math.max(rect.left, 8), window.innerWidth - CARD_W - 8);
  user      = u;
  triggerEl = trigger;
  open      = true;

  if (u.id && u.teams === undefined) {
    loading = true;
    try {
      const res = await fetch(`/api/users/${u.id}`);
      if (res.ok) {
        const full = await res.json();
        user = { ...u, ...full };
      }
    } catch { /* non-fatal */ } finally {
      loading = false;
    }
  }
}

export function handleDocClick(e: MouseEvent) {
  if (!open) return;
  const target = e.target as Element;
  if (target.closest?.('[data-user-card]')) return;
  if (triggerEl?.contains(target)) return;
  closeCard();
}
