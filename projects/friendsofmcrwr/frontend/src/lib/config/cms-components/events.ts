// Built-in registry entry (see $lib/cms/components.ts): upcoming public events from the Calendar
// module (calendar-events), read through its public proxy. Without that module the proxy is a 404
// and the component says events are unavailable; the admin warns before that reaches the site.
import EventsComponent from '$lib/components/cms/site/EventsComponent.svelte';
import { DEFAULT_LIMIT, EVENT_TYPES, MAX_LIMIT, loadEvents } from '$lib/cms/events';
import type { CmsComponentEntry } from '$lib/cms/types';

export default {
  key: 'events',
  label: 'Events',
  description: 'Upcoming public events from the Calendar, soonest first.',
  modes: ['page', 'block'],
  component: EventsComponent,
  requires: { resource: 'calendar_events', module: 'Calendar' },
  props: [
    { name: 'limit', label: 'How many to show', type: 'number', default: DEFAULT_LIMIT, help: `1 to ${MAX_LIMIT}.` },
    {
      name: 'eventType', label: 'Show', type: 'select', default: '',
      options: [{ value: '', label: 'Every type' }, ...EVENT_TYPES],
    },
  ],
  load: ({ fetch, props }) => loadEvents(fetch, props),
} satisfies CmsComponentEntry;
