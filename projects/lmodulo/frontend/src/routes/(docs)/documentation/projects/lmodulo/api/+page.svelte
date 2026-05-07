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
