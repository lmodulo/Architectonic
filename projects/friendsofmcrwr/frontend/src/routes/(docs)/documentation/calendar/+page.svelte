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
          <tr><td class="font-mono text-xs">/calendar-events</td><td class="text-sm">Signed-in users</td><td class="text-sm opacity-70">Current and upcoming events grouped by month, filterable by type, with the notification subscription panel.</td></tr>
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
          <tr><td class="font-mono text-xs">startDate / endDate</td><td class="text-sm">Dates</td><td class="text-sm opacity-70">With <code class="bg-base-300 px-1 rounded text-xs">singleDay</code> and <code class="bg-base-300 px-1 rounded text-xs">allDay</code> flags. Date only, with no time zone.</td></tr>
          <tr><td class="font-mono text-xs">startTime / endTime</td><td class="font-mono text-xs">HH:MM · null</td><td class="text-sm opacity-70">Wall-clock times at the event (24-hour, no time zone, shown as entered): <code class="bg-base-300 px-1 rounded text-xs">startTime</code> is on the start date, <code class="bg-base-300 px-1 rounded text-xs">endTime</code> on the end date. Both are null for an all-day event; the end time is optional. On a one-day event the end must be after the start (400 otherwise). The form asks for them when All day is off; events saved before times existed have none and show just their dates.</td></tr>
          <tr><td class="font-mono text-xs">title · content · location · tags</td><td class="text-sm">Text</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">content</code> is rich text from the editor.</td></tr>
          <tr><td class="font-mono text-xs">media</td><td class="text-sm">List, in order</td><td class="text-sm opacity-70">Photos and MP4 videos (see below): <code class="bg-base-300 px-1 rounded text-xs">id</code>, <code class="bg-base-300 px-1 rounded text-xs">kind</code> (image or video), <code class="bg-base-300 px-1 rounded text-xs">url</code>, <code class="bg-base-300 px-1 rounded text-xs">mimetype</code>, the uploader's file <code class="bg-base-300 px-1 rounded text-xs">name</code> and <code class="bg-base-300 px-1 rounded text-xs">size</code>. Up to 50.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Photos and videos -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Photos &amp; Videos</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      An event can carry photos (JPEG, PNG, WebP, GIF or AVIF, up to 20 MB each) and MP4 videos (up to 250 MB each),
      50 at most. They're added in the event form, under Photos &amp; videos (pick files or drop them there), and can
      be reordered with the arrows on each tile. Files upload as soon as they're picked, but the event only changes
      when the form is saved: a file removed in the form is deleted on save, and closing the form without saving
      discards that session's uploads.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Every view of an event shows them as a gallery. On the Calendar page and on a public Events page that's a grid
      where videos play in the browser's own player and a photo opens full-size in a viewer (arrow keys step through
      everything, Escape closes). An events block on a Content page shows a row of four tiles, with "+N" when there are
      more. Manage Events lists the count ("3 photos · 1 video").
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      What a file is comes from its first bytes, not its name: a text file named .jpg, a QuickTime .mov renamed .mp4,
      HEIC photos and audio-only files are refused with a message on the tile. Files are sent in 8 MB chunks, under the
      web server's <code class="bg-base-300 px-1 rounded text-xs">BODY_SIZE_LIMIT</code> (10M in docker-compose.yml), so large videos need no server setup, and a
      chunk that fails or is rate limited is retried. They're stored through the API's storage provider (local
      <code class="bg-base-300 px-1 rounded text-xs">uploads/calendar-events/</code> or S3) under random names, in the
      <code class="bg-base-300 px-1 rounded text-xs">calendar_event_media</code> collection until an event's save attaches them. Uploads no event took are deleted
      after a day. The size limits are constants in <code class="bg-base-300 px-1 rounded text-xs">api/src/routes/calendar-events/media.ts</code>.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Videos need byte-range requests to play in Safari and to seek anywhere. The scaffold's
      <code class="bg-base-300 px-1 rounded text-xs">/uploads/[...path]</code> proxy passes <code class="bg-base-300 px-1 rounded text-xs">Range</code> through, so stored videos answer 206. iPhones record
      HEVC by default, which some browsers can't play; export clips as H.264 MP4 for the widest support.
    </p>
  </div>

  <!-- Public website (Content) -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Events on the Public Website (with Content)</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      With the Content module installed, the Calendar adds an <strong>Events</strong> type: a component item in the
      site tree (a whole page, grouped by month) or a block on any page (one list). It shows the date, title, location,
      a plain-text description and the event's photos and videos, soonest first. Settings: how many to show (1–50, default 10) and which event type.
      The Calendar ships it as a Content registry entry
      (<code class="bg-base-300 px-1 rounded text-xs">$lib/config/cms-components/events.ts</code>, with
      <code class="bg-base-300 px-1 rounded text-xs">$lib/utils/siteEvents.ts</code> and
      <code class="bg-base-300 px-1 rounded text-xs">$lib/components/calendar-events/EventsComponent.svelte</code>); without
      Content nothing reads those files.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      The list comes from the public feed: active, public events up to a year ahead that haven't ended. Today's events
      and events already under way are listed too. Events have no time zone, so one stays listed until its last day is
      over everywhere. An event that isn't all day shows its start and end times as they were entered. If the feed
      can't be read, the page or block says events are unavailable.
    </p>
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
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/public</td><td class="text-sm">Public</td><td class="text-sm opacity-70">Active, public events that haven't ended, up to a year ahead, soonest first (for public pages). Events have no time zone, so one stays listed until its last day is over everywhere. Media come with id, kind and url only.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events</td><td class="text-sm">calendar_events.read</td><td class="text-sm opacity-70">List events. Query: type, status, visibility, search, from, to, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/calendar-events</td><td class="text-sm">calendar_events.create</td><td class="text-sm opacity-70">Create an event. Body: title, content, eventType, startDate, endDate, singleDay, allDay, startTime, endTime, location, tags, status, visibility, media (upload ids, in order: finished uploads of yours that no event has yet).</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/:id</td><td class="text-sm">calendar_events.read</td><td class="text-sm opacity-70">Get one event.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/calendar-events/:id</td><td class="text-sm">calendar_events.update</td><td class="text-sm opacity-70">Update any event fields. <code class="bg-base-300 px-1 rounded text-xs">media</code> is the whole list it keeps, in order; files the event had that aren't listed are deleted.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/calendar-events/:id</td><td class="text-sm">calendar_events.delete</td><td class="text-sm opacity-70">Delete an event and its photos and videos.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/calendar-events/media</td><td class="text-sm">calendar_events.create (new event) or .update (with eventId)</td><td class="text-sm opacity-70">Start an upload. Body: name, size, type, eventId?. Answers id and chunkSize; 415 for a type that isn't taken, 413 over the size limit.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PUT</span></td><td class="font-mono text-xs">/calendar-events/media/:id?offset=N</td><td class="text-sm">The uploader</td><td class="text-sm opacity-70">The next chunk as <code class="bg-base-300 px-1 rounded text-xs">application/octet-stream</code> (8 MB at most). Answers received, then the stored item after the last chunk. 409 with received for a chunk at the wrong offset; 415 when the first bytes aren't a photo or MP4.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/calendar-events/media/:id</td><td class="text-sm">The uploader</td><td class="text-sm opacity-70">Cancel an upload, or drop one no event has yet (409 once it's on an event).</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/subscriptions/me</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Your subscription settings.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PUT</span></td><td class="font-mono text-xs">/calendar-events/subscriptions/me</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Save settings. Body: eventTypes[], notifyOn &#123; newEvent, reminder, reminderDays &#125;, channels &#123; inApp, email &#125;.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/calendar-events/subscriptions/me</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Unsubscribe.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
