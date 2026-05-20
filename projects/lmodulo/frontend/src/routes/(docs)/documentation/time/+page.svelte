<svelte:head>
  <title>Time Tracking — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Time Tracking</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The time tracking module lets team members log hours against agile tasks and use a live timer. Entries are stored against the task (leaf node), with parent IDs denormalized at write time so rollup queries are plain aggregations and task re-assignment never corrupts historical records.
    </p>
  </div>

  <!-- Design principles -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Design principles</h2>
    <ul class="space-y-2 text-sm opacity-70 list-disc list-inside leading-relaxed">
      <li><strong class="opacity-100">Leaf-only logging.</strong> Time is always logged against a task. Job, sprint, and milestone IDs are denormalized onto the entry row at creation so reports don't require recursive joins and re-pointing a task mid-sprint doesn't rewrite history.</li>
      <li><strong class="opacity-100">Hierarchy for reports, not entry.</strong> You never navigate milestone → sprint → job → task to log 30 minutes. The quick-add palette fuzzy-searches the full task tree and resolves the breadcrumb for you.</li>
      <li><strong class="opacity-100">Duration snaps to 15-minute increments.</strong> The API enforces this via <code>snap15()</code> — minimum 15 minutes, rounded to the nearest quarter-hour. Both manual entries and timer stops snap the same way.</li>
      <li><strong class="opacity-100">Timer and retrospective entries are the same object.</strong> A running timer is a <code>time_entries</code> document with <code>timerRunning: true</code> and <code>durationMinutes: 0</code>. Stopping it sets <code>timerRunning: false</code> and writes the snapped elapsed time. No separate "timer" collection.</li>
      <li><strong class="opacity-100">Auto-split on task switch.</strong> Starting a timer when one is already running automatically stops the first one (snapping its duration) before creating the new entry.</li>
    </ul>
  </div>

  <!-- Data model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data model — <code class="text-base">time_entries</code></h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">userId</td><td class="text-xs opacity-60">ObjectId</td><td class="text-sm opacity-70">Who logged the time</td></tr>
          <tr><td class="font-mono text-xs">taskId</td><td class="text-xs opacity-60">ObjectId</td><td class="text-sm opacity-70">The task being worked on (required)</td></tr>
          <tr><td class="font-mono text-xs">jobId</td><td class="text-xs opacity-60">ObjectId</td><td class="text-sm opacity-70">Denormalized from task.jobId at write time</td></tr>
          <tr><td class="font-mono text-xs">sprintId</td><td class="text-xs opacity-60">ObjectId</td><td class="text-sm opacity-70">Denormalized from job.sprintId at write time</td></tr>
          <tr><td class="font-mono text-xs">milestoneId</td><td class="text-xs opacity-60">ObjectId</td><td class="text-sm opacity-70">Denormalized from sprint.milestoneId at write time</td></tr>
          <tr><td class="font-mono text-xs">date</td><td class="text-xs opacity-60">string (YYYY-MM-DD)</td><td class="text-sm opacity-70">Calendar date the work occurred</td></tr>
          <tr><td class="font-mono text-xs">durationMinutes</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Snapped to nearest 15 min. 0 while timer is running.</td></tr>
          <tr><td class="font-mono text-xs">note</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Optional free-text note (never required)</td></tr>
          <tr><td class="font-mono text-xs">billable</td><td class="text-xs opacity-60">boolean</td><td class="text-sm opacity-70">Whether this time is billable to the client. Default <code>true</code>.</td></tr>
          <tr><td class="font-mono text-xs">timerRunning</td><td class="text-xs opacity-60">boolean</td><td class="text-sm opacity-70">True while a live timer is active. Only one per user at a time.</td></tr>
          <tr><td class="font-mono text-xs">timerStartedAt</td><td class="text-xs opacity-60">Date | null</td><td class="text-sm opacity-70">Wall-clock timestamp when the timer was started. Null for manual entries.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="bg-base-200 rounded-box p-4 text-sm opacity-70 leading-relaxed">
      <strong class="opacity-100">Why denormalize parent IDs?</strong> Agile tasks can be moved between sprints mid-project. If the entry derived its sprint at query time, that re-point would silently rewrite every past sprint's burndown chart. Freezing the IDs at log time makes historical reports stable. It also means rollup is a single <code>$group</code> on the pre-joined collection — no <code>$lookup</code> chains at report time.
    </div>
  </div>

  <!-- API -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API endpoints</h2>
    <p class="text-sm opacity-70">All routes are under <code>/agile/time-entries</code> and require the <code>agile_time_entries</code> permission.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Permission</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td class="font-mono text-xs text-success">GET</td>
            <td class="font-mono text-xs">/agile/time-entries</td>
            <td class="text-xs opacity-60">read</td>
            <td class="text-sm opacity-70">List entries. Filters: <code>userId</code>, <code>taskId</code>, <code>sprintId</code>, <code>milestoneId</code>, <code>dateFrom</code>, <code>dateTo</code>.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-success">GET</td>
            <td class="font-mono text-xs">/agile/time-entries/active-timer</td>
            <td class="text-xs opacity-60">read</td>
            <td class="text-sm opacity-70">Current user's running timer entry + its task. Returns <code>&#123; entry: null, task: null &#125;</code> when idle.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-success">GET</td>
            <td class="font-mono text-xs">/agile/time-entries/summary</td>
            <td class="text-xs opacity-60">read</td>
            <td class="text-sm opacity-70">Aggregated totals grouped by task. Returns <code>totalMinutes</code>, <code>billableMinutes</code>, <code>entryCount</code> per task.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-primary">POST</td>
            <td class="font-mono text-xs">/agile/time-entries</td>
            <td class="text-xs opacity-60">create</td>
            <td class="text-sm opacity-70">Create a manual entry. Requires <code>taskId</code>, <code>date</code>, <code>durationMinutes</code>.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-primary">POST</td>
            <td class="font-mono text-xs">/agile/time-entries/timer/start</td>
            <td class="text-xs opacity-60">create</td>
            <td class="text-sm opacity-70">Start a timer for a task. Auto-stops any currently running timer first. Requires <code>taskId</code>.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-primary">POST</td>
            <td class="font-mono text-xs">/agile/time-entries/timer/stop</td>
            <td class="text-xs opacity-60">update</td>
            <td class="text-sm opacity-70">Stop the current user's running timer. Snaps elapsed time to 15-min increment and writes <code>durationMinutes</code>.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-warning">PATCH</td>
            <td class="font-mono text-xs">/agile/time-entries/:id</td>
            <td class="text-xs opacity-60">update</td>
            <td class="text-sm opacity-70">Edit <code>durationMinutes</code>, <code>date</code>, <code>note</code>, or <code>billable</code>. Users can only edit their own entries.</td>
          </tr>
          <tr>
            <td class="font-mono text-xs text-error">DELETE</td>
            <td class="font-mono text-xs">/agile/time-entries/:id</td>
            <td class="text-xs opacity-60">delete</td>
            <td class="text-sm opacity-70">Delete an entry. Users can only delete their own entries.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Timer lifecycle -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Timer lifecycle</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>User clicks "Start timer" on Task A
  → POST /timer/start &#123; taskId: "A" &#125;
  → API creates entry &#123; timerRunning: true, timerStartedAt: now, durationMinutes: 0 &#125;

User clicks "Switch task" → Task B
  → POST /timer/start &#123; taskId: "B" &#125;
  → API finds existing running timer for Task A
  → Computes elapsed = snap15(now - timerStartedAt)
  → Updates Task A entry: &#123; timerRunning: false, durationMinutes: elapsed &#125;
  → Creates new entry for Task B

User clicks "Stop"
  → POST /timer/stop
  → API computes elapsed, updates entry, returns completed entry</code></pre>
  </div>

  <!-- Frontend: week grid -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Frontend — <code class="text-base">/agile/time</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The week grid is the primary interface. It is a table where rows are tasks and columns are the seven days of the selected week.
    </p>
    <ul class="space-y-2 text-sm opacity-70 list-disc list-inside leading-relaxed">
      <li><strong class="opacity-100">Rows</strong> are the union of tasks assigned to the current user and tasks referenced by any entry in the current week — so unassigned tasks you've logged time against still appear.</li>
      <li><strong class="opacity-100">Cells</strong> show total minutes for that task on that day, formatted as <code>Xh Ym</code>. Clicking any cell opens a dialog to view, add, or delete entries for that slot.</li>
      <li><strong class="opacity-100">Today's column</strong> is highlighted in the primary color.</li>
      <li><strong class="opacity-100">Totals row</strong> at the bottom shows daily and weekly totals.</li>
      <li><strong class="opacity-100">Week navigation</strong> via arrows or <code>?week=YYYY-MM-DD</code> query param (ISO date of Monday). SSR loads the correct week server-side.</li>
    </ul>
  </div>

  <!-- Quick-add palette -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Quick-add palette</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The palette is the fastest way to log time. It opens with <kbd class="kbd kbd-sm">⌘K</kbd> or the "+ Log time" button and provides a two-step flow:
    </p>
    <ol class="space-y-2 text-sm opacity-70 list-decimal list-inside leading-relaxed">
      <li><strong class="opacity-100">Search:</strong> type any part of the task title or job title. Results are ranked by your assigned tasks in active sprints. The full breadcrumb (<em>Sprint name › Job name</em>) is shown for each result so you can distinguish similarly-named tasks without navigating the tree.</li>
      <li><strong class="opacity-100">Form:</strong> choose date (defaults to today), duration in minutes (snapped to 15), and an optional note. An alternative "Start timer instead" button creates a live timer for the selected task and closes the palette.</li>
    </ol>
    <div class="bg-base-200 rounded-box p-4 text-sm opacity-70">
      The palette also opens when you click any cell in the week grid, pre-filling the task and date so logging a repeat entry is two clicks.
    </div>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Role</th><th>Create</th><th>Read</th><th>Update</th><th>Delete</th></tr></thead>
        <tbody>
          <tr><td>owner</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td></tr>
          <tr><td>admin</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td></tr>
          <tr><td>lead</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td></tr>
          <tr><td>contributor</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td><td class="text-success">✓</td></tr>
          <tr><td>viewer</td><td class="text-error">✗</td><td class="text-success">✓</td><td class="text-error">✗</td><td class="text-error">✗</td></tr>
          <tr><td>customer</td><td class="text-error">✗</td><td class="text-error">✗</td><td class="text-error">✗</td><td class="text-error">✗</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-60">
      All PATCH and DELETE operations additionally enforce that the entry's <code>userId</code> matches the authenticated user — admins with the <code>update</code> permission cannot edit another user's entries via the API.
    </p>
  </div>

  <!-- MongoDB indexes -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Indexes</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>time_entries: &#123; userId: 1, date: 1 &#125;           // week grid load
time_entries: &#123; userId: 1, timerRunning: 1 &#125;    // active-timer lookup
time_entries: &#123; taskId: 1, date: 1 &#125;            // per-task history
time_entries: &#123; sprintId: 1, date: 1 &#125;          // sprint rollup
time_entries: &#123; milestoneId: 1, date: 1 &#125;       // milestone rollup</code></pre>
  </div>

  <!-- Future work -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Planned extensions</h2>
    <ul class="space-y-2 text-sm opacity-70 list-disc list-inside leading-relaxed">
      <li><strong class="opacity-100">Day timeline view.</strong> A vertical time-of-day axis for the selected day, with gap detection that renders missing hours as dashed blocks so you can see exactly what's unlogged.</li>
      <li><strong class="opacity-100">Billable hours report.</strong> Per-client or per-sprint summary of billable vs. non-billable time, exportable to CSV for invoice generation.</li>
      <li><strong class="opacity-100">Retainer burn.</strong> Connect time entries to a subscription's monthly hour allotment so the client portal can show hours consumed vs. remaining in real time.</li>
      <li><strong class="opacity-100">Suggestion engine.</strong> Pre-populate candidate entries from git commits referencing a task ID, calendar events, and board status transitions made during the day — turning "what did I work on Tuesday" from recall into one-click confirmation.</li>
    </ul>
  </div>

</div>
