<svelte:head>
  <title>Calendar &amp; Events — Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Calendar &amp; Events</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The Calendar module keeps a shared list of typed events — upcoming events, announcements, deadlines, and
      project scopes. Staff manage them from one admin screen; everyone else browses them and can subscribe to be
      notified when new events are posted or before they start.
    </p>
  </div>

  <!-- Pages -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Pages</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Route</th><th>Who</th><th>What it does</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">/calendar-events</td><td class="text-sm">Signed-in users</td><td class="text-sm opacity-70">Upcoming events grouped by month, filterable by type, with the notification subscription panel.</td></tr>
          <tr><td class="font-mono text-xs">/calendar-events/admin</td><td class="text-sm"><code class="bg-base-300 px-1 rounded text-xs">calendar_events.create</code></td><td class="text-sm opacity-70">"Manage Events": month grid or list view, search, type/status filters, and a modal to create, edit, or delete events.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Event fields -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Events</h2>
    <p class="text-sm opacity-70 leading-relaxed">Events are stored in the <code class="bg-base-300 px-1 rounded text-xs">calendar_events</code> collection.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Values</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">eventType</td><td class="font-mono text-xs">upcoming_event · announcement · deadline · project_scope</td><td class="text-sm opacity-70">Drives the badge color and the type filters.</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="font-mono text-xs">active · draft · cancelled</td><td class="text-sm opacity-70">Only <code class="bg-base-300 px-1 rounded text-xs">active</code> events appear on the public feed.</td></tr>
          <tr><td class="font-mono text-xs">visibility</td><td class="font-mono text-xs">public · authenticated · private</td><td class="text-sm opacity-70">Only <code class="bg-base-300 px-1 rounded text-xs">public</code> events are returned by the unauthenticated feed. The signed-in list returns all events to anyone with <code class="bg-base-300 px-1 rounded text-xs">calendar_events.read</code> and can filter by visibility.</td></tr>
          <tr><td class="font-mono text-xs">startDate / endDate</td><td class="text-sm">Dates</td><td class="text-sm opacity-70">With <code class="bg-base-300 px-1 rounded text-xs">singleDay</code> and <code class="bg-base-300 px-1 rounded text-xs">allDay</code> flags.</td></tr>
          <tr><td class="font-mono text-xs">title · content · location · tags</td><td class="text-sm">Text</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">content</code> is rich text from the editor.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Subscriptions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Notifications &amp; Reminders</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Each user can subscribe from the Events page. A subscription stores which event types to follow
      (empty = all), whether to be notified when a new event is created, whether to get a reminder a set number of
      days before an event starts, and the delivery channels (in-app, and optionally email).
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Reminders are sent by a background scheduler that starts with the API and checks every
      <code class="bg-base-300 px-1 rounded text-xs">CALENDAR_REMINDER_INTERVAL_MS</code> (default 30 minutes).
    </p>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      One resource, <code class="bg-base-300 px-1 rounded text-xs">calendar_events</code>, with create / read / update / delete.
      Admins get full access and viewers read-only when the module is installed; grant other roles as needed in
      <code class="bg-base-300 px-1 rounded text-xs">api/src/data/permissions.json</code>.
    </p>
  </div>

  <!-- ── API ─────────────────────────────────────────────── -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Calendar Events — <code class="text-base font-mono">/calendar-events</code></h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Access</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/public</td><td class="text-sm">Public</td><td class="text-sm opacity-70">Active, public events (for public pages).</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events</td><td class="text-sm">calendar_events.read</td><td class="text-sm opacity-70">List events. Query: type, status, visibility, search, from, to, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/calendar-events</td><td class="text-sm">calendar_events.create</td><td class="text-sm opacity-70">Create an event. Body: title, content, eventType, startDate, endDate, singleDay, allDay, location, tags, status, visibility.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/:id</td><td class="text-sm">calendar_events.read</td><td class="text-sm opacity-70">Get one event.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/calendar-events/:id</td><td class="text-sm">calendar_events.update</td><td class="text-sm opacity-70">Update any event fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/calendar-events/:id</td><td class="text-sm">calendar_events.delete</td><td class="text-sm opacity-70">Delete an event.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/subscriptions/me</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Your subscription settings.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PUT</span></td><td class="font-mono text-xs">/calendar-events/subscriptions/me</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Save settings. Body: eventTypes[], notifyOn &#123; newEvent, reminder, reminderDays &#125;, channels &#123; inApp, email &#125;.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/calendar-events/subscriptions/me</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Unsubscribe.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
