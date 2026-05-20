<svelte:head>
  <title>Calendar & Events — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Calendar & Events</h1>
    <p class="text-base opacity-70 leading-relaxed">
      lmodulo includes a shared calendar system for team coordination, individual scheduling, and event discovery. Events can be shared across the team, restricted to specific users, or published publicly.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Event Types</h2>
    <p class="text-sm opacity-70 leading-relaxed">Events carry a type that controls how they appear and what reminders are generated.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">upcoming_event</td><td class="text-sm opacity-70">General team events — all-hands meetings, demos, milestones</td></tr>
          <tr><td class="font-mono text-xs">standup</td><td class="text-sm opacity-70">Daily or recurring standups</td></tr>
          <tr><td class="font-mono text-xs">sprint_planning</td><td class="text-sm opacity-70">Sprint kickoff ceremonies</td></tr>
          <tr><td class="font-mono text-xs">sprint_review</td><td class="text-sm opacity-70">End-of-sprint demos and retrospectives</td></tr>
          <tr><td class="font-mono text-xs">deadline</td><td class="text-sm opacity-70">Hard deadlines tied to deliverables</td></tr>
          <tr><td class="font-mono text-xs">personal</td><td class="text-sm opacity-70">Individual events not shared with the team</td></tr>
          <tr><td class="font-mono text-xs">time_off</td><td class="text-sm opacity-70">Vacation or absence blocks — visible to the team</td></tr>
          <tr><td class="font-mono text-xs">one_on_one</td><td class="text-sm opacity-70">1:1 meetings between two people</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Views</h2>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">My Calendar — <code class="font-mono text-xs">/my-calendar</code></p>
        <p class="text-sm opacity-60 leading-relaxed">A grid calendar showing events you own or are shared with. Displays your personal events alongside team events. Requires the <code class="bg-base-300 px-1 rounded text-xs">calendar_events.read</code> permission.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Public Events — <code class="font-mono text-xs">/calendar-events</code></p>
        <p class="text-sm opacity-60 leading-relaxed">A searchable list of all team events, visible to all authenticated users. Upcoming events are also visible to unauthenticated visitors at <code class="bg-base-300 px-1 rounded text-xs">/upcoming-events</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Manage Events — <code class="font-mono text-xs">/calendar-events/admin</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Admin view for creating, editing, and deleting any team event. Requires <code class="bg-base-300 px-1 rounded text-xs">calendar_events.create</code>.</p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Creating Events</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">title</td><td>Yes</td><td class="text-sm opacity-70">Short event name shown in the calendar</td></tr>
          <tr><td class="font-mono text-xs">description</td><td>No</td><td class="text-sm opacity-70">Longer event details and notes</td></tr>
          <tr><td class="font-mono text-xs">eventType</td><td>Yes</td><td class="text-sm opacity-70">One of the event type values above</td></tr>
          <tr><td class="font-mono text-xs">startDate</td><td>Yes</td><td class="text-sm opacity-70">ISO date string</td></tr>
          <tr><td class="font-mono text-xs">endDate</td><td>No</td><td class="text-sm opacity-70">Defaults to startDate for single-day events</td></tr>
          <tr><td class="font-mono text-xs">allDay</td><td>No</td><td class="text-sm opacity-70">Boolean — hides time display in the calendar</td></tr>
          <tr><td class="font-mono text-xs">sharedWith</td><td>No</td><td class="text-sm opacity-70">Array of user IDs who can see the event in their personal calendar</td></tr>
          <tr><td class="font-mono text-xs">tags</td><td>No</td><td class="text-sm opacity-70">Free-form tags for search and filtering</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Subscriptions & Reminders</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Users can subscribe to email reminders for specific event types. Subscription preferences are stored per-user and can be updated from the Notifications settings page. A background job runs on the API and sends reminder emails at the configured lead time before each event.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Email delivery requires the <code class="bg-base-300 px-1 rounded text-xs">SMTP_*</code> environment variables to be configured. Without SMTP, subscriptions are stored but no emails are sent.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Endpoint</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">GET /calendar-events/subscriptions</td><td class="text-sm opacity-70">Fetch your current reminder settings for each event type</td></tr>
          <tr><td class="font-mono text-xs">PATCH /calendar-events/subscriptions</td><td class="text-sm opacity-70">Update which event types trigger reminders and how far in advance</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Agile Integration</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Milestones, sprints, and jobs can each link to calendar events via a <code class="bg-base-300 px-1 rounded text-xs">calendarEventIds</code> array. This lets you attach sprint planning and sprint review ceremonies to the sprint record, and connect deadline events to job deliverables.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      The Agile Calendar view at <code class="bg-base-300 px-1 rounded text-xs">/agile/calendar</code> renders all sprint-linked events in a monthly grid so the team can see their agile ceremonies alongside dates.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Action</th><th>Required Permission</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>View public events</td><td class="text-sm opacity-60">Public</td><td class="text-sm opacity-70">Unauthenticated users can view <code class="bg-base-300 px-1 rounded text-xs">/upcoming-events</code></td></tr>
          <tr><td>View events in My Calendar</td><td class="text-sm opacity-60">calendar_events.read</td><td class="text-sm opacity-70">All staff roles have this permission</td></tr>
          <tr><td>Create personal events</td><td class="text-sm opacity-60">calendar_events.create</td><td class="text-sm opacity-70">Lead and above</td></tr>
          <tr><td>Create and manage team events</td><td class="text-sm opacity-60">calendar_events.create</td><td class="text-sm opacity-70">Leads, admins, and owners</td></tr>
          <tr><td>Delete events</td><td class="text-sm opacity-60">calendar_events.delete</td><td class="text-sm opacity-70">Admin and owner only</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
