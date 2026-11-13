import { CalendarDays } from 'lucide-svelte';
import type { DocsPage } from '$lib/config/docs';

export default [
  { slug: 'calendar', label: 'Calendar & Events', icon: CalendarDays, order: 50, description: 'Typed events, visibility levels, and subscription reminders.' },
] satisfies DocsPage[];
