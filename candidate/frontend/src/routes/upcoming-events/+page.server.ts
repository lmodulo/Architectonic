import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async () => {
  let events: unknown[] = [];
  try {
    const res = await fetch(`${API_URL}/events/public`);
    if (res.ok) events = await res.json();
  } catch { /* degrade gracefully */ }

  return { events };
};
