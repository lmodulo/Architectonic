<svelte:head>
  <title>API Reference — Documentation</title>
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

  <div class="alert alert-info text-sm">
    Module endpoints (Agile, Nexus CRM, Folio, Contracts, Calendar, Commerce, Vault…) are documented at the end of each module's page in the sidebar. Only installed modules appear there.
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
