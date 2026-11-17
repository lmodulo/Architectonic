// The Calendar's page type and block for the Content module: upcoming public events
// ($lib/utils/siteEvents.ts). Content's registry ($lib/cms/components.ts) picks this file up when Content is
// installed; without Content nothing reads it.
// It matches Content's CmsComponentEntry structurally and must never import Content's code or types, so that
// this module still builds on its own (see "Custom Components" in the Content documentation).
import EventsComponent from '$lib/components/calendar-events/EventsComponent.svelte';
import { DEFAULT_LIMIT, EVENT_TYPES, MAX_LIMIT, loadEvents } from '$lib/utils/siteEvents';

export default {
  key: 'events',
  label: 'Events',
  description: 'Upcoming public events from the Calendar, soonest first.',
  modes: ['page', 'block'] as ('page' | 'block')[],
  component: EventsComponent,
  // The admin warns when the signed-in user's permissions don't list this resource
  requires: { resource: 'calendar_events', module: 'Calendar' },
  props: [
    { name: 'limit', label: 'How many to show', type: 'number' as const, default: DEFAULT_LIMIT, help: `1 to ${MAX_LIMIT}.` },
    {
      name: 'eventType', label: 'Show', type: 'select' as const, default: '',
      options: [{ value: '', label: 'Every type' }, ...EVENT_TYPES],
    },
  ],
  load: ({ fetch, props }: { fetch: typeof globalThis.fetch; props: Record<string, unknown> }) => loadEvents(fetch, props),
};
