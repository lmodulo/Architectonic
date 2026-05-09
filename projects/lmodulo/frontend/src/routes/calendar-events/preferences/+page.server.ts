import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) return { sub: null, eventTypes: [] };

  const sessionCookie = cookies.get('session');
  const headers       = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [subRes, evRes] = await Promise.allSettled([
    fetch(`${API_URL}/calendar-events/subscriptions/me`, { headers }),
    fetch(`${API_URL}/calendar-events/public`),
  ]);

  const sub = subRes.status === 'fulfilled' && subRes.value.ok
    ? await subRes.value.json()
    : null;

  let eventTypes: string[] = [];
  if (evRes.status === 'fulfilled' && evRes.value.ok) {
    const events = (await evRes.value.json()) as Record<string, unknown>[];
    eventTypes = [...new Set(events.map(e => String(e.eventType ?? 'upcoming_event')))].sort();
  }

  return { sub, eventTypes };
};

export const actions: Actions = {
  save: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (sessionCookie) headers.cookie = `session=${sessionCookie}`;

    const form = await request.formData();

    const body = {
      eventTypes:  form.getAll('eventTypes').map(String),
      notifyOn: {
        newEvent:     form.get('notify_new_event') === 'on',
        reminder:     form.get('notify_reminder')  === 'on',
        reminderDays: Math.max(0, parseInt(form.get('reminder_days') as string) || 1),
      },
      channels: {
        inApp: true,
        email: form.get('channel_email') === 'on',
      },
    };

    const res = await fetch(`${API_URL}/calendar-events/subscriptions/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) return fail(res.status, { error: 'Failed to save preferences' });
    return { success: true };
  },

  unsubscribe: async ({ cookies }) => {
    const sessionCookie = cookies.get('session');
    const headers       = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

    await fetch(`${API_URL}/calendar-events/subscriptions/me`, {
      method: 'DELETE',
      headers,
    }).catch(() => null);

    return { unsubscribed: true };
  },
};
