import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';
import { normalizeEvent, type CalendarEvent } from '$lib/utils/calendarEvents';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ url, locals, cookies }) => {
  const type = url.searchParams.get('type') ?? '';

  // ── Unauthenticated: public events only ──────────────────────────────────
  if (!locals.user) {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    let events: CalendarEvent[] = [];
    let eventTypes: string[]    = [];
    try {
      const res = await fetch(`${API_URL}/calendar-events/public${qs}`);
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>[];
        events = data.map(normalizeEvent);
        if (type) {
          const allRes = await fetch(`${API_URL}/calendar-events/public`);
          if (allRes.ok) {
            const all = (await allRes.json()) as Record<string, unknown>[];
            eventTypes = [...new Set(all.map(e => String(e.eventType ?? 'upcoming_event')))].sort();
          }
        } else {
          eventTypes = [...new Set(events.map(e => e.eventType))].sort();
        }
      }
    } catch { /* degrade gracefully */ }
    return { events, eventTypes, activeType: type, tasks: [], users: [] };
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const sessionCookie = cookies.get('session');
  const headers  = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const userId   = (locals.user as { id: string }).id;
  const isAdmin  = hasPermission(locals.user, 'calendar_events', 'create');
  const evUrl    = `${API_URL}/calendar-events?limit=200${isAdmin ? '&all=1' : ''}`;

  const canSeeCrmActivities = hasPermission(locals.user, 'crm_activities', 'read');

  const [evRes, tasksRes, usersRes, activitiesRes] = await Promise.all([
    fetch(evUrl, { headers }).catch(() => null),
    fetch(`${API_URL}/agile/tasks?assignedTo=${userId}&limit=500`, { headers }).catch(() => null),
    fetch(`${API_URL}/users`, { headers }).catch(() => null),
    canSeeCrmActivities
      ? fetch(`${API_URL}/crm/activities?assignedTo=${userId}&limit=200`, { headers }).catch(() => null)
      : Promise.resolve(null),
  ]);

  let events: CalendarEvent[] = [];
  if (evRes?.ok) {
    const raw = (await evRes.json()) as { events?: Record<string, unknown>[] };
    events = (raw.events ?? []).map(normalizeEvent);
  }

  const tasks = tasksRes?.ok ? ((await tasksRes.json()).tasks ?? []) : [];

  let users: { id: string; username: string; firstName: string; lastName: string }[] = [];
  if (usersRes?.ok) {
    const raw = await usersRes.json().catch(() => []);
    users = (Array.isArray(raw) ? raw : []).map((u: Record<string, unknown>) => ({
      id:        String(u.id ?? u._id ?? ''),
      username:  String(u.username ?? ''),
      firstName: String(u.firstName ?? ''),
      lastName:  String(u.lastName ?? ''),
    }));
  }

  const crmActivities = activitiesRes?.ok
    ? ((await activitiesRes.json()).activities ?? []).map((a: Record<string, unknown>) => ({
        id:          String(a.id ?? a._id ?? ''),
        title:       String(a.title ?? ''),
        type:        String(a.type ?? ''),
        scheduledAt: a.scheduledAt ? String(a.scheduledAt) : null,
        entityType:  String(a.entityType ?? ''),
        entityId:    String(a.entityId ?? ''),
      }))
    : [];

  return { events, eventTypes: [], activeType: type, tasks, users, crmActivities };
};
