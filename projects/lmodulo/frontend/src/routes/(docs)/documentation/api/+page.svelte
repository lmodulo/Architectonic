<svelte:head>
  <title>API Reference — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">API Reference</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The Fastify API runs at <code class="bg-base-300 px-1 rounded text-xs">http://localhost:4000</code> in development. All endpoints accept and return JSON. Authentication is session-cookie based — include the <code class="bg-base-300 px-1 rounded text-xs">session</code> cookie on every protected request.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Conventions</h2>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li>All list endpoints support <code class="bg-base-300 px-1 rounded text-xs">limit</code> and <code class="bg-base-300 px-1 rounded text-xs">skip</code> query params for pagination.</li>
      <li>IDs are MongoDB ObjectId strings.</li>
      <li>Dates are ISO 8601 strings (<code class="bg-base-300 px-1 rounded text-xs">2026-01-15</code>).</li>
      <li>A <code class="bg-base-300 px-1 rounded text-xs">403</code> response means the user lacks the required permission. A <code class="bg-base-300 px-1 rounded text-xs">401</code> means no valid session.</li>
    </ul>
  </div>

  <!-- Auth -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Authentication — <code class="text-base font-mono">/auth</code></h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Auth</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/auth/config</td><td>Public</td><td class="text-sm opacity-70">Returns <code class="bg-base-300 px-1 rounded">&#123; registrationOpen: boolean &#125;</code></td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/register</td><td>Public</td><td class="text-sm opacity-70">Body: username, email, password, firstName?, lastName?</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/login</td><td>Public</td><td class="text-sm opacity-70">Body: email, password. Sets session cookie on success.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/logout</td><td>Required</td><td class="text-sm opacity-70">Destroys session. Clears cookie.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/auth/me</td><td>Required</td><td class="text-sm opacity-70">Returns user object with role and permissions array.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/auth/profile</td><td>Required</td><td class="text-sm opacity-70">Body: username?, email?, firstName?, lastName?, avatarColor?</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/avatar</td><td>Required</td><td class="text-sm opacity-70">Multipart upload. Returns updated avatar URL.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/auth/avatar</td><td>Required</td><td class="text-sm opacity-70">Removes avatar, reverts to initials display.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/forgot-password</td><td>Public</td><td class="text-sm opacity-70">Body: email. Sends reset email if account exists.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/reset-password</td><td>Public</td><td class="text-sm opacity-70">Body: token, password.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Users -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Users — <code class="text-base font-mono">/users</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">users.read/create/update/delete</code> permissions.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/users</td><td class="text-sm opacity-70">List all non-customer users. Returns array of user objects.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/users</td><td class="text-sm opacity-70">Admin creates a user. Body: username, email, password, firstName?, lastName?. New users default to the <code class="bg-base-300 px-1 rounded">viewer</code> role.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/users/:id</td><td class="text-sm opacity-70">Update user profile fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/users/:id</td><td class="text-sm opacity-70">Remove user permanently.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/users/:id/role</td><td class="text-sm opacity-70">Body: <code class="bg-base-300 px-1 rounded">&#123; roleId: string &#125;</code>. Assigns a new role.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Roles -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Roles — <code class="text-base font-mono">/roles</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">roles.read/create/update</code> permissions.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/roles</td><td class="text-sm opacity-70">List all roles with their permissions arrays.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/roles</td><td class="text-sm opacity-70">Create a new role. Body: label, permissions[].</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/roles/:id</td><td class="text-sm opacity-70">Get a single role by ID.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/roles/:id</td><td class="text-sm opacity-70">Update role label or permissions array.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Settings -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Settings — <code class="text-base font-mono">/settings</code></h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Auth</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/settings</td><td>settings.read</td><td class="text-sm opacity-70">List all settings as key-value pairs.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/settings/brand</td><td>Public</td><td class="text-sm opacity-70">Returns <code class="bg-base-300 px-1 rounded">&#123; brandName, brandLogo &#125;</code> — used in the nav before login.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/settings/:key</td><td>Required</td><td class="text-sm opacity-70">Get a single setting by key.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/settings/:key</td><td>settings.update</td><td class="text-sm opacity-70">Body: <code class="bg-base-300 px-1 rounded">&#123; value: any &#125;</code>. Update any setting.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/settings/logo</td><td>settings.update</td><td class="text-sm opacity-70">Multipart upload. Saves brand logo and returns URL.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Messages -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Messages — <code class="text-base font-mono">/messages</code></h2>
    <p class="text-sm opacity-60">All endpoints require authentication.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/messages</td><td class="text-sm opacity-70">Inbox: threads where user is a recipient, not deleted.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/messages/unread-count</td><td class="text-sm opacity-70">Returns <code class="bg-base-300 px-1 rounded">&#123; count: number &#125;</code> for the unread badge.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/messages</td><td class="text-sm opacity-70">Send a new message. Body: to[], subject, body (rich HTML).</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/messages/:threadId</td><td class="text-sm opacity-70">Get all messages in a thread.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/messages/:threadId/reply</td><td class="text-sm opacity-70">Reply to an existing thread.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/messages/:threadId/archive</td><td class="text-sm opacity-70">Move thread to archive.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/messages/:threadId</td><td class="text-sm opacity-70">Soft-delete (removes from inbox, not from DB).</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Agile -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Agile Module — <code class="text-base font-mono">/agile</code></h2>

    <h3 class="text-base font-semibold">Milestones <code class="font-mono text-sm">/agile/milestones</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/milestones</td><td class="text-sm opacity-70">List milestones. Query: status, priority, search, limit, skip. Includes rollup stats.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/milestones</td><td class="text-sm opacity-70">Create a milestone. Body: title, description, strategicGoal, priority, status, startDate, endDate.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/milestones/:id</td><td class="text-sm opacity-70">Get milestone with aggregated sprint, job, and task counts.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/agile/milestones/:id</td><td class="text-sm opacity-70">Update any milestone field.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/agile/milestones/:id</td><td class="text-sm opacity-70">Delete milestone and all child records.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Sprints <code class="font-mono text-sm">/agile/sprints</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/sprints</td><td class="text-sm opacity-70">Query: milestoneId, status, limit, skip. Returns velocity, commitment, completion %.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/sprints</td><td class="text-sm opacity-70">Create sprint. Auto-increments sprintNumber within the milestone.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/sprints/:id</td><td class="text-sm opacity-70">Full sprint detail with jobs and tasks.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/agile/sprints/:id</td><td class="text-sm opacity-70">Update sprint fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/agile/sprints/:id</td><td class="text-sm opacity-70">Delete sprint and all child jobs and tasks.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Jobs <code class="font-mono text-sm">/agile/jobs</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/jobs</td><td class="text-sm opacity-70">Query: sprintId, status, category, blocked, search, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/jobs</td><td class="text-sm opacity-70">Create job with optional dependency IDs. Validates no circular dependencies.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/jobs/:id</td><td class="text-sm opacity-70">Full job with tasks, comments, attachments, and dependency list.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/agile/jobs/:id</td><td class="text-sm opacity-70">Update job. Re-validates dependency graph on change.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/agile/jobs/:id</td><td class="text-sm opacity-70">Delete job and its tasks and comments.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Tasks <code class="font-mono text-sm">/agile/tasks</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/tasks</td><td class="text-sm opacity-70">Query: jobId, assignedTo, status, priority, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/tasks</td><td class="text-sm opacity-70">Create task. assignedTo required when status is "In Progress". blockedReason required when status is "Blocked".</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/tasks/:id</td><td class="text-sm opacity-70">Full task detail.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/agile/tasks/:id</td><td class="text-sm opacity-70">Update task fields. Same validation rules as create.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/agile/tasks/:id</td><td class="text-sm opacity-70">Delete task.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Comments <code class="font-mono text-sm">/agile/comments</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/comments</td><td class="text-sm opacity-70">Query: jobId. Returns chronological list of comments.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/comments</td><td class="text-sm opacity-70">Add comment. Body: jobId, content (HTML).</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/agile/comments/:id</td><td class="text-sm opacity-70">Edit comment content. Only the author or an admin can edit.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/agile/comments/:id</td><td class="text-sm opacity-70">Delete comment.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Calendar -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Calendar Events — <code class="text-base font-mono">/calendar-events</code></h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/events</td><td class="text-sm opacity-70">Query: startDate, endDate, eventType, search, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/calendar-events/events</td><td class="text-sm opacity-70">Create event. Body: title, description, eventType, startDate, endDate, allDay, sharedWith[].</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/events/:id</td><td class="text-sm opacity-70">Get event detail.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/calendar-events/events/:id</td><td class="text-sm opacity-70">Update event fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/calendar-events/events/:id</td><td class="text-sm opacity-70">Delete event.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/calendar-events/subscriptions</td><td class="text-sm opacity-70">Get current user's reminder subscription settings.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/calendar-events/subscriptions</td><td class="text-sm opacity-70">Update reminder preferences for event types.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Time Entries -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Time Entries — <code class="text-base font-mono">/agile/time-entries</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">agile_time_entries.read/create/update/delete</code>. Users may only PATCH/DELETE their own entries.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/time-entries</td><td class="text-sm opacity-70">List entries. Query: userId, taskId, sprintId, milestoneId, dateFrom, dateTo.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/time-entries/active-timer</td><td class="text-sm opacity-70">Current user's running timer entry + task context, or null when idle.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/agile/time-entries/summary</td><td class="text-sm opacity-70">Aggregated by task: totalMinutes, billableMinutes, entryCount.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/time-entries</td><td class="text-sm opacity-70">Create manual entry. Body: taskId, date (YYYY-MM-DD), durationMinutes (snapped to 15), note?, billable?.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/time-entries/timer/start</td><td class="text-sm opacity-70">Start a live timer. Body: taskId. Auto-stops any existing running timer first.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/agile/time-entries/timer/stop</td><td class="text-sm opacity-70">Stop the current user's running timer. Snaps elapsed time to 15-minute increments.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/agile/time-entries/:id</td><td class="text-sm opacity-70">Edit entry. Body: durationMinutes?, date?, note?, billable?. Own entries only.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/agile/time-entries/:id</td><td class="text-sm opacity-70">Delete entry. Own entries only.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CRM -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Nexus CRM — <code class="text-base font-mono">/crm</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">crm_companies/crm_contacts/crm_deals/crm_activities</code> permissions per resource.</p>

    <h3 class="text-base font-semibold">Companies <code class="font-mono text-sm">/crm/companies</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/companies</td><td class="text-sm opacity-70">List companies. Query: search, type, industry, assignedTo, limit, skip. Returns healthScore.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/crm/companies</td><td class="text-sm opacity-70">Create company. Body: name, domain?, industry?, size?, type, assignedTo?, tags?.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/companies/:id</td><td class="text-sm opacity-70">Company detail with computed healthScore and dealCount.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/crm/companies/:id</td><td class="text-sm opacity-70">Update company fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/crm/companies/:id</td><td class="text-sm opacity-70">Delete company.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/companies/:id/milestones</td><td class="text-sm opacity-70">Linked agile milestones with totalEstimatedHours, totalActualHours, and billableMinutes rollup.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Contacts <code class="font-mono text-sm">/crm/contacts</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/contacts</td><td class="text-sm opacity-70">List contacts. Query: companyId, status, search, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/crm/contacts</td><td class="text-sm opacity-70">Create contact. Body: firstName, lastName, email?, phone?, role?, status, source, companyId?, assignedTo?.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/contacts/:id</td><td class="text-sm opacity-70">Contact detail.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/crm/contacts/:id</td><td class="text-sm opacity-70">Update contact fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/crm/contacts/:id</td><td class="text-sm opacity-70">Delete contact.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/crm/contacts/:id/convert</td><td class="text-sm opacity-70">Convert contact to a customer user account. Sends a 48-hour password-set token by email.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Deals <code class="font-mono text-sm">/crm/deals</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/deals</td><td class="text-sm opacity-70">List deals. Query: companyId, stage, type, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/crm/deals</td><td class="text-sm opacity-70">Create deal. Body: title, companyId, contactIds?, stage, value, probability, type, expectedCloseDate?.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/deals/:id</td><td class="text-sm opacity-70">Deal detail.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/crm/deals/:id</td><td class="text-sm opacity-70">Update deal. lostReason required when stage is "Closed Lost".</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/crm/deals/:id</td><td class="text-sm opacity-70">Delete deal.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Activities <code class="font-mono text-sm">/crm/activities</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/crm/activities</td><td class="text-sm opacity-70">List activities. Query: entityType, entityId, assignedTo, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/crm/activities</td><td class="text-sm opacity-70">Log activity. Body: entityType, entityId, type (Call/Email/Meeting/Demo/Note/Task), title, body?, scheduledAt?, assignedTo?.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/crm/activities/:id</td><td class="text-sm opacity-70">Update activity. Body: completedAt?, outcome?.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/crm/activities/:id</td><td class="text-sm opacity-70">Delete activity.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Finance -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Folio (Finance) — <code class="text-base font-mono">/finance</code></h2>
    <p class="text-sm opacity-60">Most endpoints require <code class="bg-base-300 px-1 rounded text-xs">finance_invoices/finance_estimates/finance_subscriptions/finance_expenses</code> permissions.</p>

    <h3 class="text-base font-semibold">Invoices <code class="font-mono text-sm">/finance/invoices</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/invoices</td><td class="text-sm opacity-70">List invoices. Query: customerId, companyId, status, limit, skip. Customers see own only.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/invoices</td><td class="text-sm opacity-70">Create invoice. Body: customerId, lineItems[], taxRate?, currency?, dueDate?, recurrence?. Auto-assigns INV-NNNN number.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/invoices/:id</td><td class="text-sm opacity-70">Invoice detail with line items, totals, and payment history.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/finance/invoices/:id</td><td class="text-sm opacity-70">Update draft invoice fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/finance/invoices/:id</td><td class="text-sm opacity-70">Delete draft invoice.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/invoices/:id/send</td><td class="text-sm opacity-70">Transition invoice to "sent" status.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/invoices/:id/pay</td><td class="text-sm opacity-70">Create Stripe PaymentIntent for customer payment. Returns clientSecret for Stripe Elements.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/stripe/webhook</td><td class="text-sm opacity-70">Stripe webhook. Handles payment_intent.succeeded → sets invoice to paid.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Estimates <code class="font-mono text-sm">/finance/estimates</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/estimates</td><td class="text-sm opacity-70">List estimates. Customers see own only (where they are the contact).</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/estimates</td><td class="text-sm opacity-70">Create estimate. Auto-assigns EST-NNNN number.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/estimates/:id</td><td class="text-sm opacity-70">Estimate detail.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/finance/estimates/:id</td><td class="text-sm opacity-70">Update estimate fields.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/finance/estimates/:id</td><td class="text-sm opacity-70">Delete estimate.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/estimates/:id/send</td><td class="text-sm opacity-70">Transition estimate to "sent".</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/estimates/:id/accept</td><td class="text-sm opacity-70">Customer accepts estimate. Sets status to "accepted".</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/estimates/:id/decline</td><td class="text-sm opacity-70">Customer declines estimate.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/estimates/:id/convert</td><td class="text-sm opacity-70">Convert accepted estimate to a draft invoice. Returns 409 if already converted.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Subscriptions <code class="font-mono text-sm">/finance/subscriptions</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/subscriptions</td><td class="text-sm opacity-70">List subscriptions. Query: status, customerId.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/subscriptions</td><td class="text-sm opacity-70">Create subscription. Body: name, customerId, lineItems[], billingCycle, startDate, taxRate?, retainerEnabled?.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/subscriptions/:id</td><td class="text-sm opacity-70">Subscription detail with retainer period if applicable.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/finance/subscriptions/:id</td><td class="text-sm opacity-70">Update or pause/cancel subscription.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/finance/subscriptions/:id</td><td class="text-sm opacity-70">Delete subscription.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Expenses <code class="font-mono text-sm">/finance/expenses</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/expenses</td><td class="text-sm opacity-70">List expenses. Query: status, category, companyId, milestoneId.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/finance/expenses</td><td class="text-sm opacity-70">Create expense. Auto-assigns EXP-NNNN number. Body: description, vendor, category, amount, expenseDate, billable?.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/finance/expenses/:id</td><td class="text-sm opacity-70">Update expense fields or status.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/finance/expenses/:id</td><td class="text-sm opacity-70">Delete expense.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Reports <code class="font-mono text-sm">/finance/reports</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/finance/reports</td><td class="text-sm opacity-70">P&L report. Query: from, to, groupBy (month|quarter|year). Returns period rows with revenue, expenses, and net. Requires <code class="bg-base-300 px-1 rounded text-xs">finance_reports.read</code>.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Contracts -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Contracts — <code class="text-base font-mono">/contracts</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">contracts.read/create/update/delete</code>. Public signing endpoints require no auth — only a valid token.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/contracts</td><td class="text-sm opacity-70">List contracts. Query: status, companyId, type. Customers scoped to contracts where they are a signer.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/contracts</td><td class="text-sm opacity-70">Create contract. Body: title, type, content (HTML), companyId?, contactIds?, dealId?, estimateId?, value?, currency?, effectiveDate?, expiryDate?.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/contracts/:id</td><td class="text-sm opacity-70">Contract detail with embedded signers array.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/contracts/:id</td><td class="text-sm opacity-70">Update contract fields while in draft status.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/contracts/:id</td><td class="text-sm opacity-70">Delete contract.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/contracts/:id/send</td><td class="text-sm opacity-70">Create signer records with 30-day tokens and send email links. Transitions to pending_signature.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/contracts/:id/void</td><td class="text-sm opacity-70">Void a pending or active contract. Requires contracts.update.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/contracts/sign/:token</td><td class="text-sm opacity-70">Public. Returns contract HTML and signer state for the signing page.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/contracts/sign/:token</td><td class="text-sm opacity-70">Public. Submit signature. Body: signatureData (PNG data URL), consent (boolean). Records IP + user agent.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/contracts/sign/:token/decline</td><td class="text-sm opacity-70">Public. Signer declines. Body: reason? (optional).</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-4">Templates <code class="font-mono text-sm">/contracts/templates</code></h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/contracts/templates</td><td class="text-sm opacity-70">List contract templates.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/contracts/templates</td><td class="text-sm opacity-70">Create template. Body: name, type, content (HTML with <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123;variable&#125;&#125;</code> placeholders).</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/contracts/templates/:id</td><td class="text-sm opacity-70">Update template.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/contracts/templates/:id</td><td class="text-sm opacity-70">Delete template.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Notifications -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Notifications — <code class="text-base font-mono">/notifications</code></h2>
    <p class="text-sm opacity-60">All endpoints require authentication.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/notifications</td><td class="text-sm opacity-70">Paginated list for the current user. Query: filter (all|unread), page, limit.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PUT</span></td><td class="font-mono text-xs">/notifications/:id/read</td><td class="text-sm opacity-70">Mark a single notification as read.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PUT</span></td><td class="font-mono text-xs">/notifications/read-all</td><td class="text-sm opacity-70">Mark all notifications for the current user as read.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/notifications/preferences</td><td class="text-sm opacity-70">Get current user's notification preferences (channels, muted types, quiet hours).</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PUT</span></td><td class="font-mono text-xs">/notifications/preferences</td><td class="text-sm opacity-70">Update notification preferences.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/notifications/ws</td><td class="text-sm opacity-70">WebSocket endpoint. Sends real-time push on connect (unread count) and on new notification. Supports mark-read, mark-all-read, and sync messages.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Teams -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Teams — <code class="text-base font-mono">/teams</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">teams.read/create/update/delete</code>.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/teams</td><td class="text-sm opacity-70">List teams with member count. Query: search, skip, limit.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/teams/mine</td><td class="text-sm opacity-70">Teams the current user belongs to (auth only, no permission gate).</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/teams</td><td class="text-sm opacity-70">Create team. Body: name, description?.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/teams/:id</td><td class="text-sm opacity-70">Team detail with full member list.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/teams/:id</td><td class="text-sm opacity-70">Update team name or description.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/teams/:id</td><td class="text-sm opacity-70">Delete team.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/teams/:id/members</td><td class="text-sm opacity-70">Add user to team. Body: userId.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/teams/:id/members/:userId</td><td class="text-sm opacity-70">Remove user from team.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Workspaces -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Workspaces — <code class="text-base font-mono">/workspaces</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">workspaces.read/create/update/delete</code>.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/workspaces</td><td class="text-sm opacity-70">List workspaces the current user belongs to with their role in each.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/workspaces</td><td class="text-sm opacity-70">Create workspace. Caller becomes owner.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/workspaces/:id</td><td class="text-sm opacity-70">Workspace detail including caller's role.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/workspaces/:id</td><td class="text-sm opacity-70">Update name, slug, or description.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/workspaces/:id</td><td class="text-sm opacity-70">Delete workspace and all memberships. Owner only.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/workspaces/:id/members</td><td class="text-sm opacity-70">List members with user details and roles.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/workspaces/:id/members</td><td class="text-sm opacity-70">Add existing user by email with a specified role.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/workspaces/:id/members/:userId</td><td class="text-sm opacity-70">Change member's role.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/workspaces/:id/members/:userId</td><td class="text-sm opacity-70">Remove member from workspace.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/workspaces/:id/switch</td><td class="text-sm opacity-70">Set as the active workspace for the current session.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Audit -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Audit Log — <code class="text-base font-mono">/audit</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">audit.read</code>.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/audit</td><td class="text-sm opacity-70">Paginated audit log. Query: q (text search), action (category filter), sort, sortDir, page, limit.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Support Tickets -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Support Tickets — <code class="text-base font-mono">/tickets</code></h2>
    <p class="text-sm opacity-60">Requires <code class="bg-base-300 px-1 rounded text-xs">support_tickets.read/create/update</code>. Customer users see their own tickets only.</p>
    <p class="text-sm opacity-70 leading-relaxed">Tickets are stored as agile jobs in the reserved "Support" sprint. A support sprint is auto-created when the first ticket is submitted.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/tickets</td><td class="text-sm opacity-70">List support tickets with task completion percentage rollup. Customers see own only.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/tickets</td><td class="text-sm opacity-70">Submit a ticket. Body: title, description?, priority?. Attachments via multipart.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/tickets/:id</td><td class="text-sm opacity-70">Ticket detail.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/tickets/:id</td><td class="text-sm opacity-70">Update ticket (staff only for status changes).</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Search -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Global Search — <code class="text-base font-mono">/search</code></h2>
    <p class="text-sm opacity-60">Requires authentication.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/search?q=term</td><td class="text-sm opacity-70">Cross-module search returning up to 5 results each from milestones, sprints, jobs (supports JOB-NNN syntax), tasks, contacts, companies, and deals.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Public Events -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Public Events — <code class="text-base font-mono">/events</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      A lightweight event bulletin board distinct from the team calendar. Publicly accessible at <code class="bg-base-300 px-1 rounded text-xs">/upcoming-events</code>.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Auth</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/events/public</td><td>Public</td><td class="text-sm opacity-70">Next 12 months of events, sorted by startDate. No auth required.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/events</td><td>Required</td><td class="text-sm opacity-70">All events. Query: title.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/events</td><td>events.create</td><td class="text-sm opacity-70">Create event. Body: title, content?, startDate, endDate?, singleDay?.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/events/:id</td><td>events.update</td><td class="text-sm opacity-70">Update event.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/events/:id</td><td>events.delete</td><td class="text-sm opacity-70">Delete event.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Health -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Health Check</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/health</td><td class="text-sm opacity-70">Public. Returns <code class="bg-base-300 px-1 rounded">200 OK</code> when the API is reachable. Used by Docker healthcheck.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
